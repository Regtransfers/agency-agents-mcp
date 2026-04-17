#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join, basename, dirname } from "path";
import { fileURLToPath } from "url";

// Get the directory of the current module (ES module __dirname equivalent)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---------------------------------------------------------------------------
// Agent catalogue — loaded once at startup from ./agents/
// Override the directory with the AGENTS_DIR environment variable.
// ---------------------------------------------------------------------------
const AGENTS_DIR = process.env.AGENTS_DIR || join(__dirname, "agents");

// ---------------------------------------------------------------------------
// Skills catalogue — loaded once at startup from ./skills/
// Override the directory with the SKILLS_DIR environment variable.
// ---------------------------------------------------------------------------
const SKILLS_DIR = process.env.SKILLS_DIR || join(__dirname, "skills");

// ---------------------------------------------------------------------------
// Shared instructions — loaded once at startup.
// Every .md file in this directory is prepended to every agent activation so
// that all personas share the same baseline standards (e.g. clean code rules).
// Override the directory with the SHARED_INSTRUCTIONS_DIR environment variable.
// ---------------------------------------------------------------------------
const SHARED_INSTRUCTIONS_DIR =
  process.env.SHARED_INSTRUCTIONS_DIR ||
  join(__dirname, "shared-instructions");

/** @type {Map<string, {slug: string, name: string, description: string, body: string}>} */
const catalogue = new Map();

/** @type {Map<string, {id: string, name: string, description: string, category: string, path: string, body: string}>} */
const skillsCatalogue = new Map();

/** @type {string} Combined text of all shared instruction files */
let sharedInstructions = "";

function loadSharedInstructions() {
  if (!existsSync(SHARED_INSTRUCTIONS_DIR)) return;

  const files = readdirSync(SHARED_INSTRUCTIONS_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort();

  const parts = [];
  for (const file of files) {
    const content = readFileSync(join(SHARED_INSTRUCTIONS_DIR, file), "utf-8").trim();
    if (content) parts.push(content);
  }

  sharedInstructions = parts.join("\n\n---\n\n");
}

function loadAgents() {
  if (!existsSync(AGENTS_DIR)) return;

  for (const file of readdirSync(AGENTS_DIR)) {
    if (!file.endsWith(".md")) continue;

    const slug = basename(file, ".md");
    const raw = readFileSync(join(AGENTS_DIR, file), "utf-8");

    // Parse YAML frontmatter
    let name = slug;
    let description = "";
    let body = raw;

    const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (fmMatch) {
      const frontmatter = fmMatch[1];
      body = fmMatch[2];

      const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
      if (nameMatch) name = nameMatch[1].trim();

      const descMatch = frontmatter.match(/^description:\s*(.+)$/m);
      if (descMatch) description = descMatch[1].trim();
    }

    catalogue.set(slug, { slug, name, description, body });
  }
}

function loadSkills() {
  if (!existsSync(SKILLS_DIR)) return;

  // Recursively load all .md files from skills directory
  function loadSkillsRecursive(dir, category = "") {
    if (!existsSync(dir)) return;

    for (const file of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, file.name);
      
      if (file.isDirectory()) {
        // Recursively load subdirectories
        const subCategory = category ? `${category}/${file.name}` : file.name;
        loadSkillsRecursive(fullPath, subCategory);
      } else if (file.name.endsWith(".md") && file.name !== "README.md") {
        const id = basename(file.name, ".md");
        const raw = readFileSync(fullPath, "utf-8");

        // Parse YAML frontmatter
        let name = id;
        let description = "";
        let skillCategory = category || "uncategorized";
        let body = raw;

        const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
        if (fmMatch) {
          const frontmatter = fmMatch[1];
          body = fmMatch[2];

          const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
          if (nameMatch) name = nameMatch[1].trim();

          const descMatch = frontmatter.match(/^description:\s*(.+)$/m);
          if (descMatch) description = descMatch[1].trim();

          const catMatch = frontmatter.match(/^category:\s*(.+)$/m);
          if (catMatch) skillCategory = catMatch[1].trim();
        }

        const relativePath = fullPath.replace(SKILLS_DIR + "/", "");
        skillsCatalogue.set(id, { 
          id, 
          name, 
          description, 
          category: skillCategory, 
          path: relativePath,
          body 
        });
      }
    }
  }

  loadSkillsRecursive(SKILLS_DIR);
}

loadSharedInstructions();
loadAgents();
loadSkills();

// ---------------------------------------------------------------------------
// MCP Server
// ---------------------------------------------------------------------------
const server = new McpServer({
  name: "agency-agents",
  version: "1.0.0",
});

// Tool 1: list available agents with optional category filter
server.tool(
  "list_agents",
  "List all available AI agent personas. Optionally filter by category (e.g. engineering, design, marketing, testing, sales, product, academic, support, game-development, specialized, project-management, paid-media, spatial-computing).",
  {
    category: z
      .string()
      .optional()
      .describe(
        "Filter agents by category prefix, e.g. 'engineering', 'design', 'marketing'"
      ),
  },
  async ({ category }) => {
    let agents = [...catalogue.values()];

    if (category) {
      const prefix = category.toLowerCase().replace(/\s+/g, "-");
      agents = agents.filter((a) => a.slug.startsWith(prefix));
    }

    if (agents.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: category
              ? `No agents found matching category "${category}". Use list_agents without a filter to see all.`
              : "No agents installed. Run the install script first.",
          },
        ],
      };
    }

    const lines = agents.map(
      (a) => `- **${a.name}** (\`${a.slug}\`): ${a.description || "(no description)"}`
    );

    return {
      content: [
        {
          type: "text",
          text: `## Available Agents (${agents.length})\n\n${lines.join("\n")}`,
        },
      ],
    };
  }
);

// Tool 2: activate an agent — returns the full persona for the LLM to adopt
server.tool(
  "activate_agent",
  "Activate an AI agent persona by name or slug. Returns the full agent instructions and personality for you to adopt. Use this when the user asks you to become or act as a specific specialist (e.g. 'be a backend architect', 'activate the security engineer').",
  {
    query: z
      .string()
      .describe(
        "The agent name or slug to activate, e.g. 'backend architect', 'engineering-security-engineer', 'code reviewer'"
      ),
  },
  async ({ query }) => {
    const normalised = query.toLowerCase().replace(/\s+/g, "-");

    // Try exact slug match first
    let agent = catalogue.get(normalised);

    // Try with common category prefixes
    if (!agent) {
      for (const prefix of [
        "engineering",
        "design",
        "marketing",
        "testing",
        "sales",
        "product",
        "academic",
        "support",
        "game-development",
        "specialized",
        "project-management",
        "paid-media",
        "spatial-computing",
      ]) {
        agent = catalogue.get(`${prefix}-${normalised}`);
        if (agent) break;
      }
    }

    // Fuzzy: find any agent whose slug or name contains the query
    if (!agent) {
      const candidates = [...catalogue.values()].filter(
        (a) =>
          a.slug.includes(normalised) ||
          a.name.toLowerCase().includes(normalised.replace(/-/g, " "))
      );
      if (candidates.length === 1) {
        agent = candidates[0];
      } else if (candidates.length > 1) {
        const list = candidates
          .slice(0, 10)
          .map((a) => `- ${a.name} (\`${a.slug}\`)`)
          .join("\n");
        return {
          content: [
            {
              type: "text",
              text: `Multiple agents match "${query}". Please be more specific:\n\n${list}`,
            },
          ],
        };
      }
    }

    if (!agent) {
      return {
        content: [
          {
            type: "text",
            text: `No agent found matching "${query}". Use the list_agents tool to see what's available.`,
          },
        ],
      };
    }

    // Build the activation text: shared instructions (if any) + agent persona
    const sections = [];
    if (sharedInstructions) {
      sections.push(
        `## Shared Standards\n\nThe following standards apply to ALL work you produce, regardless of your persona:\n\n${sharedInstructions}`
      );
    }
    sections.push(
      `## Agent Persona: ${agent.name}\n\n${agent.body}`
    );

    return {
      content: [
        {
          type: "text",
          text: `# Activating Agent: ${agent.name}\n\nYou are now adopting the following persona and instructions. Follow them for the rest of this conversation unless told otherwise.\n\n---\n\n${sections.join("\n\n---\n\n")}`,
        },
      ],
    };
  }
);

// Tool 3: search agents by keyword
server.tool(
  "search_agents",
  "Search agent personas by keyword. Searches agent names, descriptions, and content.",
  {
    keyword: z.string().describe("Keyword to search for across all agents"),
    limit: z
      .number()
      .optional()
      .default(10)
      .describe("Maximum number of results to return (default 10)"),
  },
  async ({ keyword, limit }) => {
    const term = keyword.toLowerCase();
    const matches = [...catalogue.values()]
      .filter(
        (a) =>
          a.slug.includes(term) ||
          a.name.toLowerCase().includes(term) ||
          a.description.toLowerCase().includes(term) ||
          a.body.toLowerCase().includes(term)
      )
      .slice(0, limit || 10);

    if (matches.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No agents found matching "${keyword}".`,
          },
        ],
      };
    }

    const lines = matches.map(
      (a) => `- **${a.name}** (\`${a.slug}\`): ${a.description || "(no description)"}`
    );

    return {
      content: [
        {
          type: "text",
          text: `## Search Results for "${keyword}" (${matches.length} match${matches.length === 1 ? "" : "es"})\n\n${lines.join("\n")}`,
        },
      ],
    };
  }
);

// Tool 4: view shared instructions that apply to all agents
server.tool(
  "get_shared_instructions",
  "View the shared instructions (e.g. clean code standards) that are automatically applied to every agent activation. Useful to see what baseline rules all agents follow.",
  {},
  async () => {
    if (!sharedInstructions) {
      return {
        content: [
          {
            type: "text",
            text: "No shared instructions are configured. To add them, place .md files in the shared instructions directory and restart the server.",
          },
        ],
      };
    }

    // Count the files
    const fileCount = existsSync(SHARED_INSTRUCTIONS_DIR)
      ? readdirSync(SHARED_INSTRUCTIONS_DIR).filter((f) => f.endsWith(".md")).length
      : 0;

    return {
      content: [
        {
          type: "text",
          text: `## Shared Instructions (${fileCount} file${fileCount === 1 ? "" : "s"})\n\nThese are automatically prepended to every agent activation:\n\n---\n\n${sharedInstructions}`,
        },
      ],
    };
  }
);

// Tool 5: list available skills with optional category filter
server.tool(
  "list_skills",
  "List all available skills. Optionally filter by category (e.g. ai-ml, backend, frontend, security, devops, automation).",
  {
    category: z
      .string()
      .optional()
      .describe(
        "Filter skills by category, e.g. 'ai-ml', 'backend', 'frontend', 'security'"
      ),
  },
  async ({ category }) => {
    let skills = [...skillsCatalogue.values()];

    if (category) {
      const filterCat = category.toLowerCase();
      skills = skills.filter((s) => s.category.toLowerCase() === filterCat);
    }

    if (skills.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: category
              ? `No skills found in category "${category}". Use list_skills without a filter to see all, or use get_skill_categories to see available categories.`
              : "No skills installed.",
          },
        ],
      };
    }

    const lines = skills.map(
      (s) => `- **${s.name}** (\`${s.id}\`) [${s.category}]: ${s.description || "(no description)"}`
    );

    return {
      content: [
        {
          type: "text",
          text: `## Available Skills (${skills.length})\n\n${lines.join("\n")}`,
        },
      ],
    };
  }
);

// Tool 6: activate a skill — returns the full skill instructions
server.tool(
  "activate_skill",
  "Activate a skill by ID or name. Returns the full skill instructions for you to follow. Use this when the user asks for a specific capability (e.g. 'use React patterns', 'apply API design best practices').",
  {
    query: z
      .string()
      .describe(
        "The skill ID or name to activate, e.g. 'react-patterns', 'api-design-principles'"
      ),
  },
  async ({ query }) => {
    const normalised = query.toLowerCase().replace(/\s+/g, "-");

    // Try exact ID match first
    let skill = skillsCatalogue.get(normalised);

    // Fuzzy: find any skill whose ID or name contains the query
    if (!skill) {
      const candidates = [...skillsCatalogue.values()].filter(
        (s) =>
          s.id.includes(normalised) ||
          s.name.toLowerCase().includes(normalised.replace(/-/g, " "))
      );
      if (candidates.length === 1) {
        skill = candidates[0];
      } else if (candidates.length > 1) {
        const list = candidates
          .slice(0, 10)
          .map((s) => `- ${s.name} (\`${s.id}\`) [${s.category}]`)
          .join("\n");
        return {
          content: [
            {
              type: "text",
              text: `Multiple skills match "${query}". Please be more specific:\n\n${list}`,
            },
          ],
        };
      }
    }

    if (!skill) {
      return {
        content: [
          {
            type: "text",
            text: `No skill found matching "${query}". Use the list_skills or search_skills tool to see what's available.`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `# Activating Skill: ${skill.name}\n\n**Category:** ${skill.category}\n\n---\n\n${skill.body}`,
        },
      ],
    };
  }
);

// Tool 7: search skills by keyword
server.tool(
  "search_skills",
  "Search skills by keyword. Searches skill names, descriptions, categories, and content.",
  {
    keyword: z.string().describe("Keyword to search for across all skills"),
    limit: z
      .number()
      .optional()
      .default(10)
      .describe("Maximum number of results to return (default 10)"),
  },
  async ({ keyword, limit }) => {
    const term = keyword.toLowerCase();
    const matches = [...skillsCatalogue.values()]
      .filter(
        (s) =>
          s.id.includes(term) ||
          s.name.toLowerCase().includes(term) ||
          s.description.toLowerCase().includes(term) ||
          s.category.toLowerCase().includes(term) ||
          s.body.toLowerCase().includes(term)
      )
      .slice(0, limit || 10);

    if (matches.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No skills found matching "${keyword}".`,
          },
        ],
      };
    }

    const lines = matches.map(
      (s) => `- **${s.name}** (\`${s.id}\`) [${s.category}]: ${s.description || "(no description)"}`
    );

    return {
      content: [
        {
          type: "text",
          text: `## Search Results for "${keyword}" (${matches.length} match${matches.length === 1 ? "" : "es"})\n\n${lines.join("\n")}`,
        },
      ],
    };
  }
);

// Tool 8: get skill categories
server.tool(
  "get_skill_categories",
  "Get all available skill categories with counts. Useful to explore what types of skills are available.",
  {},
  async () => {
    const skills = [...skillsCatalogue.values()];
    
    if (skills.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "No skills installed.",
          },
        ],
      };
    }

    // Group by category and count
    const categoryCounts = new Map();
    for (const skill of skills) {
      const cat = skill.category || "uncategorized";
      categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
    }

    // Sort by count descending
    const sorted = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1]);
    const lines = sorted.map(([cat, count]) => `- **${cat}**: ${count} skill${count === 1 ? "" : "s"}`);

    return {
      content: [
        {
          type: "text",
          text: `## Skill Categories (${sorted.length})\n\n${lines.join("\n")}\n\n---\n\n**Total Skills:** ${skills.length}`,
        },
      ],
    };
  }
);

// Tool 9: health check endpoint for Kubernetes probes
server.tool(
  "healthz",
  "Health check endpoint for Kubernetes liveness/readiness probes. Returns server status and agent catalogue information.",
  {},
  async () => {
    const agentCount = catalogue.size;
    const skillCount = skillsCatalogue.size;
    const hasSharedInstructions = sharedInstructions.length > 0;
    const isHealthy = agentCount > 0 || skillCount > 0;
    
    const status = {
      status: isHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      agents: {
        total: agentCount,
        directory: AGENTS_DIR,
      },
      skills: {
        total: skillCount,
        directory: SKILLS_DIR,
      },
      sharedInstructions: {
        loaded: hasSharedInstructions,
        directory: SHARED_INSTRUCTIONS_DIR,
      },
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(status, null, 2),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// Start — stdio transport for Copilot/Rider integration
// ---------------------------------------------------------------------------
const transport = new StdioServerTransport();
await server.connect(transport);

