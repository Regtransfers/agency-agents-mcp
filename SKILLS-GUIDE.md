# Skills Guide

## What Are Skills?

Skills are specialized instruction sets that teach AI assistants how to handle specific tasks. While **agents** represent personas (e.g., "Backend Architect", "Security Engineer"), **skills** represent methodologies and workflows (e.g., "Brainstorming", "Test-Driven Development", "Security Audit").

Think of it this way:
- **Agents** = WHO you are (a specialist role with personality and expertise)
- **Skills** = HOW you work (a methodology or workflow to follow)

## Key Differences: Agents vs Skills

| Feature | Agents | Skills |
|---------|--------|--------|
| **Purpose** | Adopt a specialist persona | Follow a specific methodology |
| **Personality** | Strong personality and voice | Neutral, process-focused |
| **Duration** | Entire conversation | Specific task or workflow |
| **Example** | "Backend Architect", "UX Designer" | "Brainstorming", "TDD", "API Security Testing" |
| **When to use** | Long-term expert guidance | Specific task methodology |

## Available Skills

With **1,400+ skills** across 50+ categories, you have access to:

### Development & Engineering
- **test-driven-development** - TDD workflow and best practices
- **systematic-debugging** - Debug methodically, not randomly
- **code-review-excellence** - Conduct thorough code reviews
- **refactoring** - Clean code refactoring patterns
- **api-design-principles** - REST and GraphQL API design

### AI & Machine Learning
- **prompt-engineering** - Craft effective prompts
- **rag-implementation** - Build RAG systems
- **agent-orchestration** - Multi-agent coordination
- **llm-evaluation** - Evaluate LLM outputs

### Security
- **security-audit** - Comprehensive security audits
- **penetration-testing** - Ethical hacking workflows
- **threat-modeling** - STRIDE and PASTA analysis
- **api-security-testing** - API vulnerability testing

### Planning & Workflow
- **brainstorming** - Structured ideation before coding
- **writing-plans** - Detailed implementation plans
- **executing-plans** - Execute with checkpoints
- **verification-before-completion** - Verify work before claiming done

### Testing
- **webapp-testing** - Playwright-based testing
- **e2e-testing** - End-to-end test workflows
- **performance-testing** - Load and performance testing

### DevOps & Infrastructure
- **kubernetes-deployment** - K8s best practices
- **terraform-infrastructure** - IaC patterns
- **ci-cd-automation** - Pipeline workflows

### Design & UX
- **ui-ux-designer** - User interface and experience design
- **design-systems** - Component library design
- **accessibility-audit** - WCAG compliance checking

### Marketing & Growth
- **seo-specialist** - Search engine optimization
- **content-strategy** - Content planning and creation
- **growth-hacking** - Growth strategy patterns

## How to Use Skills

### Basic Usage

1. **List available skills:**
   ```
   List available skills
   ```

2. **Activate a specific skill:**
   ```
   Activate the brainstorming skill
   ```

3. **Search for skills:**
   ```
   Search for skills about testing
   ```

4. **Browse by category:**
   ```
   Show me all skill categories
   List skills in the ai-ml category
   ```

### Combining Agents and Skills

You can use agents and skills together for powerful combinations:

```
Activate the backend architect agent, then use the api-design-principles skill
to help me design a REST API for user management
```

This gives you:
- The **expertise and personality** of a backend architect
- The **methodology and framework** of proven API design principles

### Example Workflows

**Planning a new feature:**
```
Use the brainstorming skill to help me design a user authentication system
```

**Writing tests first:**
```
Activate the test-driven-development skill and help me add payment processing
```

**Security review:**
```
Activate the security-audit skill and review this authentication code
```

**Debugging systematically:**
```
Use the systematic-debugging skill to help fix this race condition
```

## Skill Structure

Each skill is stored in its own directory with a `SKILL.md` file:

```
skills/
└── brainstorming/
    └── SKILL.md
```

The SKILL.md file contains:
- YAML frontmatter with metadata (name, description, category, risk level)
- Detailed instructions and methodology
- Examples and best practices
- When to use the skill
- Limitations and warnings

### Example SKILL.md Structure

```markdown
---
name: test-driven-development
description: "Write tests before implementation (TDD workflow)"
category: testing
risk: safe
source: community
date_added: "2026-02-27"
---

# Test-Driven Development

## Purpose
Follow the red-green-refactor cycle...

## When to Use
- Starting new features
- Refactoring existing code
- Learning a new API

## Workflow
1. Write a failing test (RED)
2. Write minimal code to pass (GREEN)
3. Refactor (REFACTOR)
4. Repeat

## Best Practices
...
```

## Skill Categories

The skills are organized into 50+ categories:

### Core Development
- `backend` - Backend development patterns
- `frontend` - Frontend best practices
- `mobile` - Mobile app development
- `web-development` - Web technologies

### Specialized
- `ai-ml` - AI and machine learning
- `data` - Data engineering and analytics
- `security` - Security and pentesting
- `testing` - Testing methodologies
- `devops` - DevOps and infrastructure
- `cloud` - Cloud platforms and services

### Business & Marketing
- `marketing` - Marketing strategies
- `sales` - Sales processes
- `product` - Product management
- `design` - Design and UX

### Workflow & Meta
- `workflow` - Workflow automation
- `automation` - Task automation
- `meta` - Meta-skills and orchestration

## Risk Levels

Skills are tagged with risk levels:

- **safe** - Safe to use in any context
- **unknown** - Unverified or community-contributed
- **offensive** - Security testing tools (use only with authorization)
- **critical** - Modifies external systems (API calls, file system)

Always check the risk level before activating a skill, especially `offensive` and `critical` ones.

## Creating Custom Skills

You can add your own skills to the `./skills/` directory:

1. Create a new directory: `./skills/my-custom-skill/`
2. Add a `SKILL.md` file with proper frontmatter
3. Restart the MCP server

### Custom Skill Template

```markdown
---
name: my-custom-skill
description: "Brief description of what this skill does"
category: workflow
risk: safe
source: custom
date_added: "2026-04-16"
---

# My Custom Skill

## Purpose
What this skill helps with...

## When to Use
- Situation 1
- Situation 2

## Instructions
Step-by-step methodology...

## Examples
Example usage...

## Limitations
What this skill cannot do...
```

## Environment Variables

Control skills loading with environment variables:

```bash
# Custom skills directory
export SKILLS_DIR=/path/to/custom/skills

# Then start the server
node server.mjs
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Skills not loading | Check that `./skills/` directory exists and contains SKILL.md files |
| Skill not found | Use `search_skills` to find the correct name |
| Too many results | Filter by category: `list_skills` with category parameter |
| Skills don't appear | Restart your IDE after adding new skills |

## Best Practices

1. **Start with built-in skills** - Explore what's available before creating custom ones
2. **Use search** - With 1,400+ skills, search is your friend
3. **Check risk levels** - Understand what a skill does before activating
4. **Combine thoughtfully** - Agents + Skills = powerful combinations
5. **Read the methodology** - Each skill has detailed instructions - follow them
6. **One skill at a time** - Don't activate multiple conflicting skills
7. **Reset when done** - Start a new chat to clear skill context

## Popular Skills to Try

### For Beginners
- `brainstorming` - Plan before coding
- `systematic-debugging` - Fix bugs methodically
- `git-pushing` - Commit with good messages

### For Developers
- `test-driven-development` - Write tests first
- `react-best-practices` - Modern React patterns
- `clean-code` - Code quality principles

### For Security
- `security-audit` - Security review workflow
- `owasp-top-10` - Common vulnerabilities
- `api-security-testing` - API security testing

### For DevOps
- `kubernetes-deployment` - K8s patterns
- `terraform-infrastructure` - Infrastructure as code
- `ci-cd-automation` - Pipeline automation

## Further Reading

- Skills are sourced from [antigravity-awesome-skills](https://github.com/sickn33/antigravity-awesome-skills)
- Check `skills_index.json` for the complete metadata catalog
- See `./skills/README.md` for the original documentation

## Support

If you encounter issues with skills:
1. Check the skill's SKILL.md file for documentation
2. Verify the skill exists: `search_skills <keyword>`
3. Check risk level and limitations
4. Report issues to the skills repository if it's a skill bug

