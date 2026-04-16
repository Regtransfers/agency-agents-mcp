# Changelog

All notable changes to the Agency Agents MCP Server will be documented in this file.

## [2.0.0] - 2026-04-16

### 🎉 Major Release: Skills Support Added

This release adds comprehensive skills support to the MCP server, bringing **1,400+ specialized AI skills** alongside the existing 160+ agent personas.

### Added

#### Skills System
- **1,412 specialized skills** from [antigravity-awesome-skills](https://github.com/sickn33/antigravity-awesome-skills)
- **49 skill categories** including:
  - AI & Machine Learning
  - Backend & Frontend Development
  - Security & Testing
  - DevOps & Infrastructure
  - Design & UX
  - Marketing & Growth
  - And many more!

#### New MCP Tools
- `list_skills` - List all available skills with optional category filtering
- `activate_skill` - Load a skill to adopt its methodology
- `search_skills` - Full-text search across all skills
- `get_skill_categories` - Browse skills by category with counts

#### Documentation
- **SKILLS-GUIDE.md** - Comprehensive 300+ line guide covering:
  - What skills are and how they differ from agents
  - How to use skills effectively
  - Popular skills to try
  - Combining agents and skills
  - Creating custom skills
  - Best practices and troubleshooting
- Updated README.md with skills documentation
- New test script (`npm test`) to verify server setup

#### Infrastructure
- Automatic recursive scanning of skills directories
- Support for nested skill organization
- Skills metadata parsing (category, risk level, source)
- Environment variable support: `SKILLS_DIR`

### Changed
- Updated `healthz` tool to include skills count
- Enhanced server startup to load both agents and skills
- Improved directory structure documentation

### Technical Details
- Skills are loaded from `./skills/` directory
- Each skill is in its own folder with a `SKILL.md` file
- YAML frontmatter parsing for metadata
- Memory-efficient catalog system
- Zero runtime dependencies (loads at startup)

### Statistics
- **Total Agents:** 144
- **Total Skills:** 1,412
- **Skill Categories:** 49
- **Total MCP Tools:** 10 (4 for agents + 5 for skills + 1 system)

### Migration Guide
No breaking changes. The server remains fully backward compatible:
- Existing agent functionality unchanged
- Same configuration files and paths
- Skills are an additive feature
- All existing MCP tool names preserved

To start using skills:
1. Pull the latest code: `git pull origin main`
2. Restart your IDE
3. Try: "List available skills" in Copilot Chat

## [1.0.0] - 2026-03-XX

### Initial Release

#### Features
- MCP server implementation for agent personas
- 160+ specialist AI agent personas
- 5 MCP tools for agent management
- Shared instructions system
- Docker deployment support
- Azure DevOps CI/CD pipeline
- Support for JetBrains Rider, IntelliJ, and VS Code
- Cross-platform: Linux, macOS, Windows

#### Agent Categories
- Engineering (20+ agents)
- Design (8+ agents)
- Marketing (14+ agents)
- Testing (7+ agents)
- Sales (7+ agents)
- Product (4+ agents)
- Game Development (12+ agents)
- Project Management (4+ agents)
- And more...

#### Infrastructure
- stdio-based MCP protocol
- Health check endpoint for Kubernetes
- HTTP wrapper for containerized deployments
- Azure Container Registry integration

---

## Version History

- **2.0.0** (2026-04-16) - Added 1,400+ skills support
- **1.0.0** (2026-03-XX) - Initial release with 160+ agents

---

## Upcoming Features

Future releases may include:
- Skill recommendations based on task context
- Custom skill templates and generators
- Skill combination workflows
- Agent + Skill preset bundles
- Performance optimizations for large catalogs
- Advanced search and filtering
- Skill usage analytics

---

## Contributing

To contribute agents or skills:
1. Fork the repository
2. Add your agent to `./agents/` or skill to `./skills/`
3. Follow the existing file format
4. Test locally with `npm test`
5. Submit a pull request

For skills contributions, consider contributing directly to [antigravity-awesome-skills](https://github.com/sickn33/antigravity-awesome-skills).

---

## License

MIT License - See LICENSE file for details

