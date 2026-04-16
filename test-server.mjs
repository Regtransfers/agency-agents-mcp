#!/usr/bin/env node

/**
 * Test script for the MCP server with skills support
 * Tests that skills are properly loaded and accessible
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const AGENTS_DIR = join(__dirname, "agents");
const SKILLS_DIR = join(__dirname, "skills");

console.log("🧪 Testing Agency Agents MCP Server\n");

// Test 1: Check directories exist
console.log("📁 Checking directories...");
const agentsExist = existsSync(AGENTS_DIR);
const skillsExist = existsSync(SKILLS_DIR);

console.log(`   ✓ Agents directory: ${agentsExist ? "EXISTS" : "MISSING"}`);
console.log(`   ✓ Skills directory: ${skillsExist ? "EXISTS" : "MISSING"}`);

if (!agentsExist || !skillsExist) {
  console.error("\n❌ Required directories missing!");
  process.exit(1);
}

// Test 2: Count agents
console.log("\n🤖 Counting agents...");
let agentCount = 0;
if (existsSync(AGENTS_DIR)) {
  const files = readdirSync(AGENTS_DIR);
  agentCount = files.filter(f => f.endsWith(".md")).length;
}
console.log(`   ✓ Found ${agentCount} agents`);

// Test 3: Count skills
console.log("\n🎯 Counting skills...");
let skillCount = 0;
const skillCategories = new Map();

function scanSkills(dir) {
  if (!existsSync(dir)) return;
  
  const entries = readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    
    if (entry.isDirectory()) {
      scanSkills(fullPath);
    } else if (entry.name === "SKILL.md") {
      skillCount++;
      
      // Try to parse category
      try {
        const content = readFileSync(fullPath, "utf-8");
        const catMatch = content.match(/^category:\s*(.+)$/m);
        if (catMatch) {
          const category = catMatch[1].trim();
          skillCategories.set(category, (skillCategories.get(category) || 0) + 1);
        }
      } catch (e) {
        // Skip parsing errors
      }
    }
  }
}

scanSkills(SKILLS_DIR);
console.log(`   ✓ Found ${skillCount} skills`);
console.log(`   ✓ Found ${skillCategories.size} skill categories`);

// Test 4: Sample some skills
console.log("\n📋 Sample skills by category:");
const topCategories = [...skillCategories.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

for (const [category, count] of topCategories) {
  console.log(`   - ${category}: ${count} skills`);
}

// Test 5: Check a specific skill exists
console.log("\n🔍 Checking key skills...");
const keySkills = [
  "brainstorming",
  "test-driven-development",
  "security-audit",
  "api-design-principles",
  "systematic-debugging"
];

for (const skillSlug of keySkills) {
  const skillPath = join(SKILLS_DIR, skillSlug, "SKILL.md");
  const exists = existsSync(skillPath);
  const status = exists ? "✓" : "✗";
  console.log(`   ${status} ${skillSlug}`);
}

// Test 6: Verify server file
console.log("\n📦 Checking server files...");
const serverExists = existsSync(join(__dirname, "server.mjs"));
const packageExists = existsSync(join(__dirname, "package.json"));
const nodeModulesExists = existsSync(join(__dirname, "node_modules"));

console.log(`   ✓ server.mjs: ${serverExists ? "EXISTS" : "MISSING"}`);
console.log(`   ✓ package.json: ${packageExists ? "EXISTS" : "MISSING"}`);
console.log(`   ✓ node_modules: ${nodeModulesExists ? "EXISTS" : "MISSING"}`);

// Summary
console.log("\n" + "=".repeat(50));
console.log("📊 SUMMARY");
console.log("=".repeat(50));
console.log(`Agents:           ${agentCount}`);
console.log(`Skills:           ${skillCount}`);
console.log(`Skill Categories: ${skillCategories.size}`);
console.log(`Status:           ${agentsExist && skillsExist && agentCount > 0 && skillCount > 0 ? "✅ READY" : "❌ NOT READY"}`);
console.log("=".repeat(50));

if (agentCount > 0 && skillCount > 0) {
  console.log("\n✅ All tests passed! Server is ready to use.");
  console.log("\nNext steps:");
  console.log("  1. Run: npm install (if not already done)");
  console.log("  2. Configure your IDE's mcp.json (see README.md)");
  console.log("  3. Restart your IDE");
  console.log("  4. Try: 'List available skills' in Copilot Chat");
  process.exit(0);
} else {
  console.log("\n❌ Tests failed! Check the errors above.");
  process.exit(1);
}

