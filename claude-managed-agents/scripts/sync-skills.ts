import fs from "fs";
import path from "path";
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

async function syncSkill(
  client: Anthropic,
  name: string,
  config: SkillsConfig,
) {
  const skillDir = path.join(SKILLS_DIR, name);
  const skillMdPath = path.join(skillDir, "SKILL.md");

  if (!fs.existsSync(skillMdPath)) {
    console.error(`  [skip] No SKILL.md found in ${skillDir}`);
    return;
  }

  const file = makeFile(skillMdPath, name);
  const displayTitle = name;

  if (config[name]) {
    const version = await client.beta.skills.versions.create(
      config[name].skillId,
      { files: [file] },
    );
    config[name].latestVersion = version.version;
    console.log(
      `  [updated] ${name} → version ${version.version} (skill: ${config[name].skillId})`,
    );
  } else {
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
    await syncSkill(client, name, config);
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
