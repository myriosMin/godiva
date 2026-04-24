import { defineHook, sleep, getWritable } from "workflow";
import { getAnthropic } from "@/lib/anthropic";
import { anthropicEventId } from "@/lib/managed-agent-events";
import { db } from "@/lib/db";
import { godivaIncident } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { setFeatureStatus } from "@/lib/feature-status";
import type {
  BetaManagedAgentsAgentCustomToolUseEvent,
  BetaManagedAgentsAgentToolUseEvent,
  BetaManagedAgentsSessionStatusIdleEvent,
} from "@anthropic-ai/sdk/resources/beta/sessions/events";

const MAX_POLLS_PER_TURN = 200;
const POLL_INTERVAL = "3s";

// Trace logging for the polling workflow. Noisy by design — every poll
// emits multiple lines — so gate on GODIVA_DEBUG=1.
const debug: (msg: string) => void =
  process.env.GODIVA_DEBUG === "1" ? (m) => console.log(m) : () => {};

export type SessionEvent = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  occurredAt: string;
};

export const messageHook = defineHook<{ text: string }>();

async function sendMessage(
  anthropicSessionId: string,
  text: string,
): Promise<void> {
  "use step";
  debug(`[sendMessage] session=${anthropicSessionId} text=${text.slice(0, 60)}`);
  const client = getAnthropic();
  await client.beta.sessions.events.send(anthropicSessionId, {
    events: [{ type: "user.message", content: [{ type: "text", text }] }],
  });
  debug(`[sendMessage] DONE`);
}

type SerializableToolCall = {
  id: string;
  name: string;
  input: Record<string, unknown>;
  eventType: "custom" | "builtin";
};

// Single durable step that executes all pending tool calls and sends results back.
// Keeping it as one step ensures DB writes + API calls are atomic from the workflow's perspective.
async function executeToolsAndRespond(input: {
  toolCalls: SerializableToolCall[];
  anthropicSessionId: string;
  internalSessionId: string;
}): Promise<void> {
  "use step";
  const client = getAnthropic();
  const writer = getWritable<SessionEvent>().getWriter();

  try {
    for (const tc of input.toolCalls) {
      // Built-in tool (web_search etc.) — just confirm/allow
      if (tc.eventType === "builtin") {
        await client.beta.sessions.events.send(input.anthropicSessionId, {
          events: [
            {
              type: "user.tool_confirmation",
              tool_use_id: tc.id,
              result: "allow",
            },
          ],
        });
        debug(`[executeToolsAndRespond] allowed builtin tool=${tc.name}`);
        continue;
      }

      // Custom tools
      let resultText = "";
      let isError = false;

      try {
        if (tc.name === "submit_recommendation") {
          // Upsert recommendation into godiva_incident row
          const existing = await db
            .select({ id: godivaIncident.id })
            .from(godivaIncident)
            .where(eq(godivaIncident.sessionId, input.internalSessionId))
            .limit(1);

          if (existing.length > 0) {
            await db
              .update(godivaIncident)
              .set({ recommendation: tc.input })
              .where(eq(godivaIncident.sessionId, input.internalSessionId));
          }

          // Emit godiva.recommendation event so the UI can react
          await writer.write({
            id: `godiva-rec-${input.internalSessionId}`,
            type: "godiva.recommendation",
            payload: tc.input,
            occurredAt: new Date().toISOString(),
          });

          resultText =
            "Recommendation submitted to the Godiva dashboard. Approvers have been notified. Stay available for operator follow-up questions.";
          debug(
            `[executeToolsAndRespond] submit_recommendation persisted for session=${input.internalSessionId}`,
          );
        } else if (tc.name === "check_vendor_status") {
          const url = tc.input.url as string;
          const vendor = tc.input.vendor as string;
          try {
            const res = await fetch(url, {
              headers: { "User-Agent": "Godiva-StatusCheck/1.0" },
              signal: AbortSignal.timeout(8000),
            });
            const html = await res.text();
            const snippet = html
              .replace(/<[^>]+>/g, " ")
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 2000);
            resultText = `${vendor} status page (HTTP ${res.status}):\n${snippet}`;
          } catch (fetchErr) {
            resultText = `Could not fetch ${vendor} status page: ${String(fetchErr)}`;
            isError = true;
          }
        } else if (tc.name === "set_feature_status") {
          const featureId = tc.input.feature_id as string;
          const up = tc.input.up as boolean;
          const ok = setFeatureStatus(featureId, up);
          if (ok) {
            resultText = `Feature "${featureId}" is now ${up ? "UP (operational)" : "DOWN (degraded)"}.`;
          } else {
            resultText = `Unknown feature ID: "${featureId}". Valid IDs: upportal, lumina, app-consumption, app-payments, app-recurring, app-bills, kiosk, oem-portal, ssp-portal, pcw, open-account, close-account, reschedule, mimo, emtr-payment, der-dashboard.`;
            isError = true;
          }
        } else {
          resultText = `Unknown custom tool: ${tc.name}`;
          isError = true;
        }
      } catch (err) {
        resultText = `Tool execution error for ${tc.name}: ${String(err)}`;
        isError = true;
      }

      await client.beta.sessions.events.send(input.anthropicSessionId, {
        events: [
          {
            type: "user.custom_tool_result",
            custom_tool_use_id: tc.id,
            content: [{ type: "text", text: resultText }],
            is_error: isError,
          },
        ],
      });
      debug(
        `[executeToolsAndRespond] sent result for ${tc.name} id=${tc.id} error=${isError}`,
      );
    }
  } finally {
    writer.releaseLock();
  }
}

type PollResult = {
  lastEventId: string | null;
  done: boolean;
  requiresAction: boolean;
  pendingToolCallIds: string[];
  newCustomToolCalls: SerializableToolCall[];
  newBuiltinToolCalls: SerializableToolCall[];
};

async function pollAndStream(input: {
  anthropicSessionId: string;
  internalSessionId: string;
  lastEventId: string | null;
}): Promise<PollResult> {
  "use step";
  debug(
    `[pollAndStream] START session=${input.anthropicSessionId} lastEventId=${input.lastEventId}`,
  );

  const client = getAnthropic();
  const writer = getWritable<SessionEvent>().getWriter();

  let done = false;
  let requiresAction = false;
  let pendingToolCallIds: string[] = [];
  let lastId = input.lastEventId;
  let written = 0;
  const newCustomToolCalls: SerializableToolCall[] = [];
  const newBuiltinToolCalls: SerializableToolCall[] = [];

  try {
    const page = await client.beta.sessions.events.list(
      input.anthropicSessionId,
      { limit: 100 },
    );

    debug(`[pollAndStream] fetched ${page.data.length} events`);

    let seenLast = input.lastEventId === null;
    for (const event of page.data) {
      const aid = anthropicEventId(event);
      if (!aid) continue;

      if (!seenLast) {
        if (aid === input.lastEventId) seenLast = true;
        continue;
      }

      const occurredAt =
        "processed_at" in event &&
        typeof (event as { processed_at?: string | null }).processed_at === "string"
          ? (event as { processed_at: string }).processed_at
          : new Date().toISOString();

      // Collect custom tool calls
      if (event.type === "agent.custom_tool_use") {
        const tc = event as BetaManagedAgentsAgentCustomToolUseEvent;
        newCustomToolCalls.push({
          id: tc.id,
          name: tc.name,
          input: tc.input,
          eventType: "custom",
        });
      }

      // Collect built-in tool calls (web_search, computer, etc.) for confirmation
      if (event.type === "agent.tool_use") {
        const tc = event as BetaManagedAgentsAgentToolUseEvent;
        newBuiltinToolCalls.push({
          id: tc.id,
          name: tc.name,
          input: tc.input,
          eventType: "builtin",
        });
      }

      await writer.write({
        id: aid,
        type: event.type,
        payload: event as unknown as Record<string, unknown>,
        occurredAt,
      });

      written++;
      lastId = aid;

      if (event.type === "session.status_idle") {
        const idleEvent = event as BetaManagedAgentsSessionStatusIdleEvent;
        const sr = idleEvent.stop_reason;
        if (sr.type === "end_turn" || sr.type === "retries_exhausted") {
          done = true;
        } else if (sr.type === "requires_action") {
          requiresAction = true;
          pendingToolCallIds = sr.event_ids;
        }
        break;
      }

      if (
        event.type === "session.status_terminated" ||
        event.type === "session.deleted"
      ) {
        done = true;
        break;
      }
    }
  } finally {
    writer.releaseLock();
  }

  debug(
    `[pollAndStream] DONE wrote=${written} lastId=${lastId} done=${done} requiresAction=${requiresAction} pendingIds=${pendingToolCallIds.length}`,
  );
  return {
    lastEventId: lastId,
    done,
    requiresAction,
    pendingToolCallIds,
    newCustomToolCalls,
    newBuiltinToolCalls,
  };
}

async function processTurn(
  anthropicSessionId: string,
  internalSessionId: string,
  text: string,
  lastEventId: string | null,
): Promise<string | null> {
  await sendMessage(anthropicSessionId, text);

  let currentLastEventId = lastEventId;
  // Accumulate tool calls across polls so we can match by ID when requires_action fires
  const customToolCallMap = new Map<string, SerializableToolCall>();
  const builtinToolCallMap = new Map<string, SerializableToolCall>();

  for (let i = 0; i < MAX_POLLS_PER_TURN; i++) {
    await sleep(POLL_INTERVAL);

    const result = await pollAndStream({
      anthropicSessionId,
      internalSessionId,
      lastEventId: currentLastEventId,
    });

    currentLastEventId = result.lastEventId;

    for (const tc of result.newCustomToolCalls) customToolCallMap.set(tc.id, tc);
    for (const tc of result.newBuiltinToolCalls) builtinToolCallMap.set(tc.id, tc);

    if (result.done) {
      debug(`[processTurn] turn complete after ${i + 1} polls`);
      break;
    }

    if (result.requiresAction && result.pendingToolCallIds.length > 0) {
      // Resolve pending tool calls — custom + built-in
      const toExecute: SerializableToolCall[] = [];
      for (const id of result.pendingToolCallIds) {
        const custom = customToolCallMap.get(id);
        if (custom) { toExecute.push(custom); customToolCallMap.delete(id); continue; }
        const builtin = builtinToolCallMap.get(id);
        if (builtin) { toExecute.push(builtin); builtinToolCallMap.delete(id); }
      }

      if (toExecute.length > 0) {
        await executeToolsAndRespond({
          toolCalls: toExecute,
          anthropicSessionId,
          internalSessionId,
        });
      }
      // Continue polling — session resumes after tool results
    }
  }
  return currentLastEventId;
}

export async function sessionWorkflow(input: {
  internalSessionId: string;
  anthropicSessionId: string;
  initialMessage: string;
}) {
  "use workflow";
  debug(
    `[sessionWorkflow] START internal=${input.internalSessionId} anthropic=${input.anthropicSessionId}`,
  );

  let lastEventId: string | null = null;

  lastEventId = await processTurn(
    input.anthropicSessionId,
    input.internalSessionId,
    input.initialMessage,
    lastEventId,
  );

  const hook = messageHook.create({
    token: `msg:${input.internalSessionId}`,
  });

  for await (const { text } of hook) {
    debug(`[sessionWorkflow] received message: ${text.slice(0, 60)}`);
    lastEventId = await processTurn(
      input.anthropicSessionId,
      input.internalSessionId,
      text,
      lastEventId,
    );
  }
}
