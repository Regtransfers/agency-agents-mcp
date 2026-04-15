# Clean Code Standards

These clean code standards apply to **all** work you produce, regardless of which agent persona is active. Follow them consistently alongside your specialist instructions.

---

## Naming & Type Safety

- Use **descriptive, intention-revealing names** for variables, functions, classes, and files.
- Avoid abbreviations, single-letter names (except loop counters `i`, `j`, `k`), and cryptic acronyms.
- Booleans should read as questions: `isActive`, `hasPermission`, `canEdit`.
- Functions should describe what they do: `calculateTotalPrice`, `fetchUserById`, `validateEmail`.
- Classes and types should be nouns: `InvoiceService`, `UserRepository`, `PaymentGateway`.
- Constants should be UPPER_SNAKE_CASE: `MAX_RETRIES`, `DEFAULT_TIMEOUT`.
- **Ubiquitous language**: Use terms from the business domain. If the product manager calls it a "Subscription," don't call it `RecurringPayment` in code.
- **Leverage the type system**: Make invalid states unrepresentable — use enums or discriminated unions instead of multiple booleans.
- **Avoid "ghost" types**: Don't pass raw `string` where a branded type or value object like `EmailAddress` or `UserId` would prevent misuse.
- **Contextual clarity**: Don't repeat the class name in properties — `user.userName` → `user.name`.

## Functions: Composition over Complexity

- **Do one thing.** Each function should have a single, clear responsibility.
- Keep functions **short** — aim for under 20 lines. If a function is long, extract sub-functions.
- Limit parameters to **3 or fewer**. Use an options/config object if you need more.
- Avoid **side effects** — a function named `getUser` should not also modify state.
- Prefer **pure functions** and **immutability** — default to `const`, avoid mutating inputs. A function should transform data, not change the world around it.
- **Return early** to avoid deep nesting. Guard clauses at the top simplify flow.
- **Composition over inheritance**: Build complex behaviour by combining small, focused functions rather than deep class hierarchies.
- **Total functions**: Aim for functions that return a value for every possible input. Use `Option`/`Maybe`/`Result` patterns to handle null cases explicitly.
- **Async/Await clarity**: Always handle both the happy path and the unhappy path in asynchronous flows. Avoid "Promise hell" by flattening logic.

## Locality of Behaviour (LoB)

- **Keep logic close**: The more a developer needs to jump between files to understand a single feature, the higher the cognitive load.
- **Colocation**: Keep tests, styles, and logic for a component or module in the same folder where practical.
- **Declarative over imperative**: Tell the code *what* you want (`.filter().map()`) rather than *how* to loop through an array.

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
- **Errors as values** (modern): For expected failures (e.g. "User Not Found"), prefer returning a `Result`/`Either` type over throwing exceptions. Reserve `throw` for truly exceptional, unrecoverable situations.

## DRY, KISS, YAGNI

- **DRY** (Don't Repeat Yourself): Extract duplicated logic into shared functions or modules.
- **KISS** (Keep It Simple, Stupid): Choose the simplest solution that works correctly. If a junior developer can't understand your abstraction in 60 seconds, it's too clever.
- **YAGNI** (You Aren't Gonna Need It): Don't build features or abstractions speculatively.

## SOLID Principles (Modernised)

- **Single Responsibility**: Each class/module has one reason to change.
- **Single Source of Truth (SSOT)**: Don't duplicate data across state — derive what you can.
- **Open/Closed**: Design modules to be extended via dependency injection or plugins rather than modifying core logic.
- **Liskov Substitution**: Subtypes must be substitutable for their base types.
- **Interface Segregation**: Prefer small, specific interfaces over large, general ones.
- **Dependency Inversion**: Depend on abstractions, not concretions.

## State & Immutability

- Default to **immutable data**. Use `const`, `readonly`, `Object.freeze`, or language-equivalent constructs.
- Manage state changes through **explicit transformations**, not in-place mutation.
- When mutable state is necessary, **isolate it** — keep the mutation surface as small as possible.

## Testing (The Testing Trophy)

- Write tests for any non-trivial logic.
- **Integration tests** give the most confidence — verify that your modules work together correctly.
- **Unit tests** are ideal for pure logic, algorithms, and edge cases.
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
- **Primitive obsession** — don't use raw `string`/`int` for complex domain concepts (postcodes, IDs). Use value objects or branded types.
- **Boolean couplets** — two booleans that depend on each other (`isLoading` + `isError`) should be a single status enum or discriminated union.
- **Deep distant state** — passing data through 5+ layers (prop drilling). Use context, state management, or dependency injection.

## AI-Collaborative Code

- **Self-documenting context**: Well-named variables, clear type signatures, and small functions act as anchors for LLM reasoning and AI-assisted development.
- **Explicit contracts**: Use interfaces and types clearly — they serve as API documentation for both humans and AI tools.
- **Predictable structure**: Consistent file and folder patterns help AI tools navigate and understand your codebase.

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


