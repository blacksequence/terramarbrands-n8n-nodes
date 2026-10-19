# n8n-nodes-terramarbrands

n8n community nodes for the **Terramar Brands API** (`wsTerramarV2`) — the consultant
platform behind Terramar Brands México: public catalog, consultant cart, orders and
invoicing, consultant profile, awards and bonuses, lineage, support tickets, travel,
certificates, product datasheets and hosted payments.

The package is generated from the Terramar Brands OpenAPI specification (a git
submodule of this repo). It currently registers **two nodes — Terramar Brands Profile
and Terramar Brands Orders**; the other categories stay dormant in the generator until
`tools/active-nodes.mjs` lists them again. Bearer-token authentication, configurable
endpoint, and fixed production defaults on every field.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/)
workflow automation platform.

## Compatibility

- n8n ≥ 1.0 (n8nNodesApiVersion 1).
- No runtime dependencies — the package ships only the compiled nodes and credential.

## Installation

Install via the **Community Nodes** panel in n8n:

1. Open **Settings → Community Nodes**.
2. Enter `n8n-nodes-terramarbrands`.
3. Install.

Or install manually in your n8n custom directory (`~/.n8n/custom`):

```bash
npm install n8n-nodes-terramarbrands
```

## Credentials

Create a **Terramar Brands API** credential with the bearer token:

1. Get the token with the **Terramar Brands Session → Login** operation
   (`POST /getConsultoriaLogin`) using your consultant user and password — or copy the
   `TMBcartToken` cookie from the Terramar Brands SPA.
2. Paste it into the credential's **Token** field.

The credential's **Test** action performs a read-only
`GET https://terramarbrands.mx/wsTerramarV2/Service1.svc/GetBonosEtapaUno` — a
parameter-free, side-effect-free protected call — so a green test means the token works.

Public operations (login, password reminder, public catalog) run **without** a
credential; everything else sends `Authorization: Bearer <token>` automatically via
n8n's authenticated request helper.

## Endpoint parameter

Every node has an **Endpoint** parameter defaulting to the production service:

```
https://terramarbrands.mx/wsTerramarV2/Service1.svc
```

Change it per node (or with an expression) to point at another environment. The
endpoint is a node parameter by design — the credential holds only the token.

## Nodes and operations

| Node                    | OpenAPI category      | Operations                                                                                                                                                                                             |
| ----------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Terramar Brands Profile | Perfil de consultora  | _Contrato_: Consultant profile (read), Consultant profile (update), Sign contract · _Domicilio de envío_: Shipping address, Update shipping address · _Cuenta_: Change password, Validate e-mail token |
| Terramar Brands Orders  | Pedidos y facturación | _Facturación_: Invoices, Invoices by month (GetInvoices), Account status · _Envíos_: Shipments · _Pedidos de catálogo_: Catalog orders, Catalog order detail                                           |

Every operation maps 1:1 to an OpenAPI `operationId` — the spec (a git submodule at
`terramarbrands-openapi/`) is the authoritative reference for request and response
shapes. The remaining ten categories stay dormant until `tools/active-nodes.mjs`
lists their classes again.

## Usage

A one-node profile read: **Terramar Brands Profile → Consultant profile (read)** with
`Usuario OK` (the consultant kit — default `1234567`, digits only, **no `TE` prefix**).
The operation posts `accion: ""` to `postContratoActualiza` and returns the full
consultant record; `CONTINUAR`/`TERMINAR` stay available for the contract flow.

Monthly invoices: **Terramar Brands Orders → Invoices by month (GetInvoices)** with
`Axo` (year), `Mes` (month) and `Idioma` (`0` = español) — returns the invoice list
with folio, order, total and PDF/XML URLs.

## Regenerating from the OpenAPI spec

The nodes are generated code — extend the generator rather than hand-editing:

```bash
git submodule update --init        # terramarbrands-openapi/ holds openapi.json
node tools/generate-nodes.mjs      # reads terramarbrands-openapi/openapi.json (--spec overrides)
npm run lint:fix && npm run build
node tools/check-coverage.mjs       # PASS = build matches the spec
node tools/generate-icons.mjs       # regenerate the light/dark icon family (assets/icons)
```

The generator throws when the spec grows a shape it cannot map (non-string params,
nested bodies) so drift can never silently produce broken nodes.

## Development

```bash
npm run lint     # n8n-node lint (n8n community-node rules)
npm run build    # compile to dist/
npm run dev      # run n8n on http://localhost:5678 with this package linked
npm run release  # version bump + changelog + tag + push (triggers the publish workflow)
```

## Publishing to npm (CI/CD)

This repository publishes via GitHub Actions with an npm **provenance** statement
(required for n8n Creator Portal verification since May 2026). You never run
`npm publish` from a local machine — the `publish.yml` workflow runs on every version
tag, and `npm run release` creates that tag for you.

Two supported authentication paths for the workflow:

- **Option A — npm Trusted Publishers (recommended, no long-lived secrets):** on
  npmjs.com open the package → _Publish access → Trusted Publishers_ → add
  _GitHub Actions_ with your repository owner/name and workflow file `publish.yml`.
  Leave `NPM_TOKEN` unset in the repository.
- **Option B — npm Granular Access Token:** create the token on npmjs.com scoped to
  this package with _Read and write_ permission, then store it as a GitHub Actions
  secret:

```bash
gh secret set NPM_TOKEN
```

The CLI prompts for the token value; verify with `gh secret list`. With the secret in
place the workflow writes it to `.npmrc` before publishing — this is the placeholder
path wired into `publish.yml`.

`ci.yml` runs lint and build on every push to `main` and on every pull request.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/building-community-nodes)
- [n8n-nodes-terramarbrands on npm](https://www.npmjs.com/package/n8n-nodes-terramarbrands)

## License

[MIT](LICENSE)
