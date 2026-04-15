# Clean Code Standards

These clean code standards apply to **all** work you produce, regardless of which agent persona is active. Follow them consistently alongside your specialist instructions.

---

## Naming

- Use **descriptive, intention-revealing names** for variables, functions, classes, and files.
- Avoid abbreviations, single-letter names (except loop counters `i`, `j`, `k`), and cryptic acronyms.
- Booleans should read as questions: `isActive`, `hasPermission`, `canEdit`.
- Functions should describe what they do: `calculateTotalPrice`, `fetchUserById`, `validateEmail`.
- Classes and types should be nouns: `InvoiceService`, `UserRepository`, `PaymentGateway`.
- Constants should be UPPER_SNAKE_CASE: `MAX_RETRIES`, `DEFAULT_TIMEOUT`.

## Functions & Methods

- **Do one thing.** Each function should have a single, clear responsibility.
- Keep functions **short** — aim for under 20 lines. If a function is long, extract sub-functions.
- Limit parameters to **3 or fewer**. Use an options/config object if you need more.
- Avoid **side effects** — a function named `getUser` should not also modify state.
- Prefer **pure functions** where possible (same input → same output, no mutation).
- **Return early** to avoid deep nesting. Guard clauses at the top simplify flow.

## Comments & Documentation

- Write code that **explains itself** — good naming reduces the need for comments.
- Use comments to explain **why**, not **what**. The code shows what; the comment shows intent.
- Delete commented-out code — version control exists for a reason.
- Keep doc-comments on public APIs up to date; stale docs are worse than none.

## Formatting & Structure

- Be **consistent** with the project's existing style (indentation, braces, quotes, semicolons).
- Group related code together; separate unrelated code with blank lines.
- Keep files focused — one primary class/module per file.
- Order members logically: public before private, lifecycle methods in order.
- Limit line length to the project convention (typically 80–120 characters).

## Error Handling

- **Never swallow exceptions silently.** At minimum, log them.
- Use specific exception/error types rather than generic ones.
- Validate inputs at boundaries (API endpoints, public methods, external data).
- Prefer **fail fast** — surface errors as early as possible.
- Distinguish between recoverable and unrecoverable errors; handle each appropriately.

## DRY, KISS, YAGNI

- **DRY** (Don't Repeat Yourself): Extract duplicated logic into shared functions or modules.
- **KISS** (Keep It Simple, Stupid): Choose the simplest solution that works correctly.
- **YAGNI** (You Aren't Gonna Need It): Don't build features or abstractions speculatively.

## SOLID Principles

- **Single Responsibility**: Each class/module has one reason to change.
- **Open/Closed**: Open for extension, closed for modification.
- **Liskov Substitution**: Subtypes must be substitutable for their base types.
- **Interface Segregation**: Prefer small, specific interfaces over large, general ones.
- **Dependency Inversion**: Depend on abstractions, not concretions.

## Testing

- Write tests for any non-trivial logic. Prefer unit tests; add integration tests for boundaries.
- Tests should be **independent**, **repeatable**, and **fast**.
- Follow **Arrange → Act → Assert** structure.
- Test names should describe the scenario and expected outcome.
- Keep test code to the **same quality standard** as production code.

## Code Smells to Avoid

- **Magic numbers/strings** — extract to named constants.
- **God classes/functions** — break them apart by responsibility.
- **Deep nesting** (more than 2–3 levels) — refactor with early returns or extraction.
- **Long parameter lists** — use objects or builder patterns.
- **Feature envy** — if a method mostly uses another class's data, it probably belongs there.
- **Dead code** — remove unused functions, variables, imports, and files.

## Version Control Hygiene

- Write **clear, descriptive commit messages** (e.g. "Add email validation to signup form").
- Keep commits **small and focused** — one logical change per commit.
- Never commit secrets, credentials, or environment-specific config.

## Performance & Security Awareness

- Don't optimise prematurely, but don't be wasteful — choose appropriate data structures.
- Sanitise and validate all user input.
- Never hardcode secrets; use environment variables or a secrets manager.
- Keep dependencies up to date and audit for known vulnerabilities.

---

*These standards are injected automatically by the Agency Agents MCP server and apply to every agent persona.*

