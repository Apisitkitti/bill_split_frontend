# billsplit-web

React LIFF frontend for a LINE bill-splitting app. The API is a separate repo
(`../backend`) and is called over CORS.

React 19 · Vite · Tailwind 4 · daisyUI 5 · axios · @line/liff

This runs inside LINE's in-app browser on a phone. Design for a 375px screen,
a thumb, and mobile data — not for desktop Chrome.

## The team loop

Work moves through five roles, defined in `.claude/agents/`:

```
po  →  ux-designer  →  junior-react  →  senior-react  →  (changes? back to junior-react)
                                                      →  PASS  →  security + qa-adversarial
                                                             →  findings? back to junior-react
                                                             →  clean  →  po signs off
```

`ux-designer` sits between the PO and the junior: the PO says which problem to
solve, the designer says what the screen should look and feel like, and only
then does anyone write JSX. Skipping it is how a correct feature ends up
unpleasant to use.

`security` and `qa-adversarial` run together after PASS and look for different
things: QA hunts the input nobody imagined, security hunts the group member who
wants their own debt to shrink.

`seo-metadata` is not part of every loop. Pull it in when a change alters what
the product looks like from outside itself: the link preview when the LIFF URL
is pasted into a chat, the `altText` a pushed message shows on a lock screen, or
any public page. It is not search-ranking work — a LIFF app behind login cannot
be indexed.

- `po` opens the change: who the user is, what hurts today, and acceptance
  criteria written as behaviour a person would notice. Nothing starts without
  this, because a task with no stated user produces screens nobody needed.
- `junior-react` writes the code and runs `make check`.
- `senior-react` reviews and returns `PASS` or `CHANGES REQUESTED` with a
  numbered list. It does not write the fix.
- The loop repeats until `PASS`. Three round trips on one change means the task
  was underspecified — stop, and send it back to `po` rather than looping a
  fourth time.
- `qa-adversarial` runs only after `PASS`. Its findings re-enter at the junior.
- `po` closes the change: `SHIPS` or `NEEDS WORK`, judged against the
  acceptance criteria and against how it actually feels on a phone.

A change is done when `senior-react` says PASS, `qa-adversarial` has nothing
CRITICAL or HIGH, and `po` says SHIPS. Correct code that does not help the user
is not done.

## Branching and pull requests

Nothing lands on a branch by being written. It lands by passing the loop and
then a pull request.

```
feature branch  →  PR into develop  →  develop  →  PR into main
```

- Every change starts on its own branch off `develop`. Never commit to
  `develop` or `main` directly.
- **One branch, one feature.** A branch carries a single change with a single
  reason to exist. Two unrelated fixes on one branch cannot be reviewed
  separately, cannot be reverted separately, and force a reviewer to hold both
  in their head at once — which is how the second one gets waved through.
- Branch names say what the change is: `feat/settlement-cap`,
  `fix/delete-bill-guard`, `chore/split-repo-tests`.
- Open the PR into `develop`. The PR body states what the change does, which
  loop roles have signed off, and what is deliberately left out.
- A PR merges into `develop` only when the loop has cleared it: the senior says
  PASS, `qa-adversarial` has nothing CRITICAL or HIGH, `security` has nothing
  CRITICAL or HIGH, and the PO says SHIPS.
- `develop` reaches `main` by its own PR, once everything on it has been
  exercised together. `main` is the branch that is supposed to work; a change
  that has only ever been tested alone has not earned it.

The gate is the same one the loop already applies — the PR is where it becomes
visible to someone reading the repo six months from now, rather than living in
a conversation nobody kept.

Commit messages follow the same rule as comments: say why, not what. `git diff`
already shows what changed.

## Rules this codebase holds itself to

### Money

Amounts are integer satang (1/100 baht) as plain `number`. `src/lib/money.ts`
is the only place that converts:

- `parseBaht(input)` — user text to satang, `null` if malformed
- `formatBaht(satang)` — satang to `"1,234.56"` for display
- `toBahtString(satang)` — satang to the string the API expects in a body

No `parseFloat`. No arithmetic on a `toFixed` result. Amounts are sent to the
API as **strings**, because a JSON number is an IEEE 754 double and `1234.55`
would arrive as `1234.5499999999999`.

`money.ts` mirrors `money.go` in the backend repo. They are separate repos, so
nothing enforces that they agree — if one changes, change the other in the same
pull request.

### API

Everything goes through `src/lib/api.ts`. No bare `fetch`, no second axios
instance: the shared client is what attaches the LIFF ID token per request and
normalises failures into `ApiError`.

The token is read per request, not captured at startup — LIFF refreshes it, and
a stale copy fails in exactly the long sessions where a user would notice.

Show the server's message. `ApiError.message` already carries the API's text;
replacing it with a generic string throws away the only useful part.

### LIFF

`useLiff` initialises once and reports what the environment allows. Behaviour
differs by where the app was opened from:

| Opened from | `lineGroupId` | Push summary to chat |
|---|---|---|
| group chat | set | yes |
| room | set | yes |
| 1-to-1 chat | none | no |
| external browser | none | no |

Anything gated on a chat must check `group.lineGroupId` before it renders.

`liff.getProfile()` is display only. Identity the server will act on comes from
`/api/me`.

### React

- Every effect that sets state uses the `cancelled` guard the existing effects
  use, with correct dependencies. StrictMode double-invokes effects in
  development; an effect that breaks under that is broken in production too.
- Every async action has a pending state that disables its control. A double
  tap on "จ่ายแล้ว" must not record two settlements.
- No `any`, no unexplained type assertions.

### Forms

Forms use `react-hook-form` with a `zod` schema, and live in their own folder:

```
src/components/form/AddBillForm.tsx   the component
src/components/form/schema.ts         the zod schema + its inferred type
```

The schema owns the rules and the type. Export the schema and
`export type X = z.infer<typeof schema>` from `schema.ts`; never declare the
value type by hand beside it, or the fields and their type drift apart.

Inputs stay uncontrolled through `register`, and the component passes
`resolver: zodResolver(schema)`. No `if` checks in the submit handler — a rule
that lives in one place is a rule the error message can be derived from.

Use `superRefine` where several rules apply to one field. Chained `.refine`
calls do not short-circuit, so a malformed amount reports both "not a number"
and "must be greater than 0", the second derived from a parse that already
failed.

Money fields validate through `parseBaht` from `src/lib/money.ts`; never a
second regex written in the schema, or the form and the API will disagree about
what a valid amount is. Amounts stay strings through validation — coercing to a
number is the bug the string was there to prevent.

### Style

daisyUI components (`btn`, `card`, `alert`, `badge`, `tabs`) and semantic
tokens (`text-error`, `bg-base-200`, `text-success`). Raw Tailwind only where no
component fits; never a raw colour where a token exists.

The theme is pinned to `emerald` in `src/index.css`. LINE's browser follows the
phone's dark mode, and a bill list that flips colours mid-session reads as a
bug.

### Comments

Explain the non-obvious decision, not the statement.

## Layout

```
src/lib/money.ts     satang arithmetic, mirrors the backend
src/lib/api.ts       axios client, ID token interceptor, error normalisation
src/lib/useLiff.ts   liff.init and chat context
src/components/      AddBillForm, BalancePanel
src/App.tsx          group resolution, tabs, data loading
```

## Node

Pinned to 24 in `.nvmrc`. Run `nvm use` before anything else; Vite 8 needs
`^20.19.0 || >=22.12.0` and fails with an unhelpful error below that.

## Commands

```bash
make dev       # :5173
make proxy     # Caddy on :8443 — app and API on one origin
make tunnel    # public HTTPS, pointed at the proxy
make check     # lint + typecheck + build — the review gate
```

`VITE_API_URL` must be reachable **from the phone**: `localhost` inside LINE's
in-app browser means the phone, not your Mac.

Run `make proxy` and point the tunnel at it rather than at Vite directly. Caddy
serves the app and proxies `/api/*` to the Go server on :8080, so the app and
the API share one origin. That removes CORS from the picture entirely and means
one tunnel instead of two — with `VITE_API_URL` and the LIFF Endpoint URL both
set to the same tunnel URL.

Caddy's `tls internal` block on :8444 is for desktop Chrome only. Its
certificate comes from Caddy's own CA, which a phone does not trust, so it is
not a route to testing in LINE.

## Not built yet

- `weight` and `exact` split modes. The API supports both and has tests; the
  form only sends `equal`.
- `liff.shareTargetPicker` for sharing a summary without a bot push.
- Editing or deleting a bill.
- Any test suite. There is no vitest here yet.
