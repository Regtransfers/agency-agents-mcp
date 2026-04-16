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

loadSharedInstructions();
loadAgents();

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

// Tool 5: health check endpoint for Kubernetes probes
server.tool(
  "healthz",
  "Health check endpoint for Kubernetes liveness/readiness probes. Returns server status and agent catalogue information.",
  {},
  async () => {
    const agentCount = catalogue.size;
    const hasSharedInstructions = sharedInstructions.length > 0;
    const isHealthy = agentCount > 0;
    
    const status = {
      status: isHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      agents: {
        total: agentCount,
        directory: AGENTS_DIR,
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

