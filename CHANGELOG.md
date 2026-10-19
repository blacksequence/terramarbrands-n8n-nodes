# Changelog

## 0.3.2 (2026-10-19)

### Fixed

- **Leer datos de la consultora works again.** 0.3.1 dropped the `accion` key from the request when "Leer (vacío)" was selected, and the API answers `Accion inválida` whenever the key is missing (it accepts an empty value, never an absent one). The read request now always carries `accion: ""` — exactly the payload the cart SPA sends — while the empty option still executes without tripping n8n's required validation. The coverage checker gained a behavioral gate that executes the read/update operations against a stubbed helper and asserts the outgoing body, so this class of regression cannot ship silently again.

## 0.3.1 (2026-10-19)

### Fixed

- **The session token now really works in Usuario + Contraseña mode.** n8n never ran the credential's automatic login (it requires a hidden expirable token property), so executions sent an empty `Bearer` and the API answered `mensaje 499`. The credential now carries the hidden expirable auth token: the first execution logs in and n8n **stores and reuses the token across executions**, and when the API reports it expired — its app-level `499` answer, which rides on HTTP 200 — the nodes **re-login transparently, retry the request once and cache the fresh token per process** (verified live: one re-login served two stale-token executions). **Test connection** doubles as the manual refresh button.
- Selecting **Leer (vacío)** on the consultant profile read no longer trips n8n's `Parameter Accion is required` — the field ships without the required flag when the empty read value is the default.
- Operation actions no longer repeat the node-name prefix (`Terramar brands profile …`); the operations panel shows just the operation summary.

### Changed

- README credentials section rewritten for the two modes and the verified token lifecycle.

## 0.3.0 (2026-10-19)

### Added

- **Invoices by month (GetInvoices)** in Terramar Brands Orders — `GET /GetInvoices?Axo=<year>&Mes=<month>&Idioma=<0|1>` with the session token, exactly as the cart SPA calls it. Verified live: returns the invoice list with folio, order, total and PDF/XML URLs.

### Changed

- The package now registers **only Terramar Brands Profile and Terramar Brands Orders**; the other ten categories stay dormant in the generator until `tools/active-nodes.mjs` lists them again.
- Consultant profile read (Leer) defaults `accion` to the empty value — `postContratoActualiza` with `accion: ""` returns the full record (live-verified); `CONTINUAR` / `TERMINAR` remain available for the contract flow, and Actualizar keeps `TERMINAR` as its default.
- `usuarioOK` defaults to `1234567` and its description now states it must NOT carry the `TE` prefix (the kit is the login user minus `TE`).
- The OpenAPI spec is consumed through the `terramarbrands-openapi` git submodule; CI checks out submodules recursively.
- Credential: the internal password field is now `password` (display "Contraseña"; the login still sends `claveAcceso` to the API). Existing credentials need the password re-entered once.
- Internal: the co-author commit hook was removed from the public repo, and `.env` is gitignored and never tracked.

## 0.2.0 (2026-10-18)

### Added

- Brand icon family — light and dark SVG icons for every node and the credential.
- Two-mode credential: fill `Usuario` + `Contraseña` and the nodes obtain the session
  token themselves on every execution (the credential's pre-authentication runs
  `POST /getConsultoriaLogin` and rides every operation on the returned token), or paste
  a `Token` to skip the automatic login. Both modes authenticate as
  `Authorization: Bearer <token>`.

### Changed

- Consultant data operations split into Leer and Actualizar, with a default action set of
  `CONTINUAR` / `TERMINAR` (always editable with n8n expressions).
- Fixed-value defaults baked into every field with a known production value: `seccion` =
  `CONSULTORIA`, `dominio` = `carrito.terramarbrands.com.mx`, `origen` = `CARRITONUE`
  (the cart SPA's fixed channel identifier), `opcion` = `PREBRANCH` and the warehouse and
  catalog action defaults. All remain editable with n8n expressions.

## 0.1.0

- Initial public release: 12 nodes covering the wsTerramarV2 service — session, catalog,
  cart, consultant profile, awards, orders, lineage, support, travel, certificates,
  payments and product nodes — plus the bearer-token credential.
