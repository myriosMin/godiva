import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";
import Anthropic from "@anthropic-ai/sdk";
import { config } from "dotenv";
config({ path: new URL("../.env.local", import.meta.url).pathname });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = path.join(__dirname, "../skills");
const SKILLS_CONFIG_PATH = path.join(__dirname, "../godiva-skills.json");

type SkillEntry = {
  skillId: string;
  latestVersion: string | null;
  displayTitle: string;
};

type SkillsConfig = Record<string, SkillEntry>;

function loadConfig(): SkillsConfig {
  if (fs.existsSync(SKILLS_CONFIG_PATH)) {
    return JSON.parse(fs.readFileSync(SKILLS_CONFIG_PATH, "utf-8"));
  }
  return {};
}

function saveConfig(config: SkillsConfig) {
  fs.writeFileSync(SKILLS_CONFIG_PATH, JSON.stringify(config, null, 2) + "\n");
}

function makeFile(filePath: string, skillName: string): File {
  const content = fs.readFileSync(filePath);
  // API requires SKILL.md to be under a top-level directory: "<skill-name>/SKILL.md"
  return new File([content], `${skillName}/SKILL.md`, { type: "text/markdown" });
}

// Build a raw multipart/form-data body as a Buffer.
// Used for versions.create because the SDK strips the directory from filenames by default,
// which breaks the required "<skill-name>/SKILL.md" path the API expects.
function buildMultipartBody(
  fieldName: string,
  file: File,
  boundary: string,
): Buffer {
  const CRLF = "\r\n";
  const header = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="${fieldName}"; filename="${file.name}"`,
    `Content-Type: ${file.type}`,
    "",
    "",
  ].join(CRLF);
  const footer = `${CRLF}--${boundary}--${CRLF}`;
  return Buffer.concat([
    Buffer.from(header, "utf8"),
    Buffer.from(file.stream() as unknown as ArrayBuffer),
    Buffer.from(footer, "utf8"),
  ]);
}

// Read file content synchronously so we can build the buffer without streaming.
function buildMultipartBodySync(
  fieldName: string,
  filePath: string,
  fileName: string,
  boundary: string,
): Buffer {
  const CRLF = "\r\n";
  const content = fs.readFileSync(filePath);
  const header = Buffer.from(
    [
      `--${boundary}`,
      `Content-Disposition: form-data; name="${fieldName}"; filename="${fileName}"`,
      `Content-Type: text/markdown`,
      "",
      "",
    ].join(CRLF),
    "utf8",
  );
  const footer = Buffer.from(`${CRLF}--${boundary}--${CRLF}`, "utf8");
  return Buffer.concat([header, content, footer]);
}

function httpsPost(
  apiKey: string,
  urlPath: string,
  body: Buffer,
  contentType: string,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "api.anthropic.com",
        path: urlPath,
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-beta": "skills-2025-10-02",
          "Content-Type": contentType,
          "Content-Length": body.length,
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          let parsed: unknown;
          try {
            parsed = JSON.parse(text);
          } catch {
            parsed = text;
          }
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`${res.statusCode}: ${text}`));
          } else {
            resolve(parsed);
          }
        });
      },
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// The SDK's versions.create strips filenames by default (stripFilenames=true), removing the
// required directory prefix. We bypass it with a raw https request so the filename is sent as
// "<skill-name>/SKILL.md" exactly as the API requires.
async function createSkillVersion(
  apiKey: string,
  skillId: string,
  skillMdPath: string,
  skillName: string,
): Promise<{ version: string }> {
  const boundary = `----FormBoundary${Date.now().toString(16)}`;
  // versions.create requires "files[]" (not "files") as the multipart field name
  const body = buildMultipartBodySync(
    "files[]",
    skillMdPath,
    `${skillName}/SKILL.md`,
    boundary,
  );
  return httpsPost(
    apiKey,
    `/v1/skills/${skillId}/versions?beta=true`,
    body,
    `multipart/form-data; boundary=${boundary}`,
  ) as Promise<{ version: string }>;
}

async function syncSkill(
  client: Anthropic,
  apiKey: string,
  name: string,
  config: SkillsConfig,
) {
  const skillDir = path.join(SKILLS_DIR, name);
  const skillMdPath = path.join(skillDir, "SKILL.md");

  if (!fs.existsSync(skillMdPath)) {
    console.error(`  [skip] No SKILL.md found in ${skillDir}`);
    return;
  }

  const displayTitle = name;

  if (config[name]) {
    const result = await createSkillVersion(apiKey, config[name].skillId, skillMdPath, name);
    config[name].latestVersion = result.version;
    console.log(
      `  [updated] ${name} → version ${result.version} (skill: ${config[name].skillId})`,
    );
  } else {
    const file = makeFile(skillMdPath, name);
    const skill = await client.beta.skills.create({
      display_title: displayTitle,
      files: [file],
    });
    config[name] = {
      skillId: skill.id,
      latestVersion: skill.latest_version,
      displayTitle,
    };
    console.log(`  [created] ${name} → ${skill.id}`);
  }
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY is not set");
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });
  const config = loadConfig();

  const skillDirs = fs
    .readdirSync(SKILLS_DIR)
    .filter((d) => fs.statSync(path.join(SKILLS_DIR, d)).isDirectory());

  if (skillDirs.length === 0) {
    console.log("No skill directories found in", SKILLS_DIR);
    return;
  }

  console.log(`Syncing ${skillDirs.length} skill(s)...\n`);

  for (const name of skillDirs) {
    console.log(`${name}`);
    await syncSkill(client, apiKey, name, config);
  }

  saveConfig(config);

  console.log("\nSaved skill IDs to godiva-skills.json");
  console.log("\nSkill IDs to attach to your Anthropic agent:");
  for (const [name, entry] of Object.entries(config)) {
    console.log(`  ${name}: ${entry.skillId}`);
  }
  console.log(
    "\nAttach via Anthropic console: Agents > [your agent] > Skills > Add custom skill",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
