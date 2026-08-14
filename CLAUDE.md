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
- **A branch is named `<type>/<issue>-<what>`**, where the issue is its Linear
  identifier: `fix/my-5-delete-bill-guard`, `feat/my-24-tanstack-router`,
  `chore/my-16-register-driven-test-app`. The identifier is what lets anyone
  holding a branch, a commit or a PR find the reasoning behind it without asking.

- **A commit subject is `<type>: <why>`, and its body names the issue.** The
  type is one of:

  | type | for |
  |---|---|
  | `feat` | behaviour a user can notice that did not exist before |
  | `fix` | behaviour that was wrong |
  | `refactor` | the same behaviour, arranged differently |
  | `chore` | tooling, config, dependencies, docs, tests-only |

  `git diff` already shows what changed, so the subject says why it changed:
  `fix: key the group lock on the group, not on how the URL spelled it`, not
  `fix: add uuid.Parse to groupIDParam`. Put the identifier in the body on its
  own line, so Linear links the commit to the issue.

- **A branch is deleted once its PR is merged**, locally and on the remote. A
  merged branch left lying around is one someone will later mistake for work in
  progress. Never delete an unmerged branch — its commits go with it.
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

Everything goes through `src/service/`, one file per feature, each importing
the one shared `client` from `src/lib/axios.ts`:

```
src/lib/axios.ts           the axios instance, both interceptors, ApiError
src/service/user.ts        me
src/service/group.ts       listGroups, createGroup, getGroup, joinGroup
src/service/bill.ts        listBills, createBill
src/service/settlement.ts  listSettlements, createSettlement
src/service/balance.ts     balances, pushSummary
```

The client lives in `lib/` because it is plumbing, not a feature: it knows about
tokens, timeouts and error shapes, and nothing about bills or groups. `ApiError`
lives beside it rather than in `service/` because both interceptors construct
it — putting it in `service/` would make the client import from the layer that
imports the client.

A path is written once, in the file that owns the feature. A fixed path is a
constant (`const ME_PATH = '/me'`); one that needs an id is a small function
that builds it (`const groupBillsPath = (groupId: string) => ...`). Six
hand-written copies of `/groups/${groupId}/bills` is five chances at a typo
nobody sees until that one endpoint is called.

Service functions are `async` and end in `return response.data`, not
`.then((r) => r.data)`. A stack trace through a `.then` chain loses the call
site; `await` keeps it.

A type lives in the file that owns it — `Group` in `group.ts`, `Bill` in
`bill.ts` — so a screen that reads one feature imports one file. There is no
barrel here on purpose: `index.ts` would re-export every feature into every
importer and undo the split.

No bare `fetch`, no second axios instance: the shared client is what attaches
the LIFF ID token per request and normalises failures into `ApiError`.

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

Login is automatic: arriving logged out redirects to LINE, and so does a 401
from any API call, since either means there is no identity to render a screen
with. The **automatic** redirect goes through `redirectToLoginOnce` in
`src/lib/autoLogin.ts` and nowhere else — the bare `liff.login()` that `useLiff`
hands to the login button is a different thing, and needs no ration because a
person pressing a button is not a loop. It is rationed — once per page load, once per tab session
across a return from LINE, renewed only by an API response that came back — and
that ration is the whole reason it is safe: an unconditional `liff.login()` on
a logged-out session is an infinite bounce through the LINE login page, which
this app has already shipped once. `LoginPageUI` is the fallback when the
ration is spent, not dead code.

### React

- Every effect that sets state uses the `cancelled` guard the existing effects
  use, with correct dependencies. StrictMode double-invokes effects in
  development; an effect that breaks under that is broken in production too.
- Every async action has a pending state that disables its control. A double
  tap on "จ่ายแล้ว" must not record two settlements.
- No `any`, no unexplained type assertions.

### Forms

Forms use `react-hook-form` with a `zod` schema, and live beside the screen
that renders them — a form used by one screen is part of that screen:

```
src/components/groups/$groupId/bills/new/AddBillForm.tsx   the component
src/components/groups/$groupId/bills/new/schema.ts         the zod schema + its type
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

### Routes and screens

A route file owns routing and nothing else: the `Route` definition, params,
search, redirects, and whatever it needs to decide *which* screen shows. The
screen is a component under `src/components/`, in a folder named after the
route's path and carrying a `UI` suffix — `src/routes/login.tsx` renders
`src/components/login/LoginPageUI.tsx`, and a layout route renders a
`*LayoutUI.tsx`. The components tree mirrors the routes tree, `$groupId`
segment and all.

They change for different reasons and are read by different people: a redirect
rule and a button's contrast ratio have nothing to say to each other, and a file
holding both gets edited by everyone. A route file should read as a short answer
to "where does this go".

A route that only redirects has no screen of its own and gets no component file
— `src/routes/index.tsx` is the one. Falling back to `Screen.tsx` while it
resolves is not a screen worth a file.

### Style

daisyUI components (`btn`, `card`, `alert`, `badge`, `tabs`) and semantic
tokens (`text-error`, `bg-base-200`, `text-success`). Raw Tailwind only where no
component fits; never a raw colour where a token exists.

The theme is pinned to `emerald` in `src/index.css`. LINE's browser follows the
phone's dark mode, and a bill list that flips colours mid-session reads as a
bug.

### Naming

- **Constants are `CAPITAL_SNAKE_CASE`** — a module-level value fixed at
  authoring time: `MAX_SATANG`, `SATANG_PER_BAHT`, `LIFF_ID`, `ME_PATH`. This is
  not a rule about `const`, which this codebase uses for almost everything;
  a computed local (`const satang = parseBaht(...)`), a component, a React
  context, a zod schema and a function are named for what they are.
- **`interface` names are `PascalCase`** — `Group`, `BalanceEntry`, `Props`.
- **`enum` names are `PascalCase`, their members `CAPITAL_SNAKE_CASE`.** There
  are no enums here yet; a union of string literals (`SplitMode`) has covered
  every case so far and erases at compile time. The rule is written down for
  whoever adds the first one.

### Comments

Explain the non-obvious decision, not the statement.

## Layout

```
src/lib/                  what is genuinely a library: no screen, no feature
  axios.ts                the shared client, both interceptors, ApiError
  money.ts                satang arithmetic, mirrors the backend
  useLiff.ts              liff.init and chat context
  autoLogin.ts            the rationed liff.login() redirect
  liffContext.ts          the one useLiff result, shared down the tree
  groupContext.ts         the loaded group the $groupId layout holds

src/service/              one file per API feature — see "API" above
  user.ts group.ts bill.ts settlement.ts balance.ts

src/routes/               one file per URL — routing only

src/components/
  ui/                     generic primitives, no domain knowledge, one
                          component per file, re-exported through index.ts
  common/                 shared but domain-aware or app-wired pieces —
                          RouteFallbacks, which knows the router
  __root/                 what __root.tsx shows: RootPageUI
  login/                  LoginPageUI
  groups/                 GroupsPageUI
  groups/$groupId/        GroupLayoutUI, BalancesPageUI, BalancePanel
  groups/$groupId/bills/       BillsPageUI
  groups/$groupId/bills/new/   NewBillPageUI, AddBillForm, schema.ts
```

Three questions decide where a component goes, in order. Could it belong to any
app — does it know nothing about bills, groups, LIFF or routes? Then it is `ui/`
and goes in the barrel. Is it shared by more than one screen but tied to this
app? Then `common/`. Otherwise it belongs to exactly one screen, and lives in
that screen's folder — which is why `BalancePanel` sits beside `BalancesPageUI`
rather than in a components pile everyone edits.

`ui/` holds one component per file: a screen that needs `Centered` should not
have to read the crash treatment to find it. The barrel is what keeps that from
reaching call sites — every import stays `'…/ui'`.

`ui/` is the only barrel. `common/` has none: it holds app-wired pieces that
each have one importer, and a barrel there would re-export the router into
whoever wanted the next thing added to it. `src/service/` deliberately has none
either.

## Deploying

The built SPA goes to Netlify; the Go API lives elsewhere and is reached through
a **proxy**, not a redirect (`netlify.toml`, `status = 200`).

That is what keeps `VITE_API_URL` empty. The browser only ever sees one origin,
so CORS never enters the picture and a backend move is one line of config rather
than an env edit, a rebuild and a LIFF console change. A 301/302 there would leak
the backend origin to the browser and bring both problems back.

Two ordering rules in that file are load-bearing and neither is obvious:

- the `/api/*` proxy must come **before** the SPA catch-all, or `/api/me` is
  answered with `index.html` — a 200 full of HTML that the axios client tries to
  parse as JSON
- the SPA catch-all must exist at all, because every screen is a real URL now and
  those URLs are pasted into chats; without it a shared group link 404s at
  Netlify's file server before the router loads

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
