# n8n-nodes-terramarbrands

n8n community nodes for the **Terramar Brands API** (`wsTerramarV2`) — the consultant
platform behind Terramar Brands México: public catalog, consultant cart, orders and
invoicing, consultant profile, awards and bonuses, lineage, support tickets, travel,
certificates, product datasheets and hosted payments.

The package is generated from the Terramar Brands OpenAPI specification: **one node per
API category — 12 nodes covering all 40 operations** — with bearer-token authentication
and a configurable endpoint.

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

| Node                         | OpenAPI category      | Operations                                                                                                                                                         |
| ---------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Terramar Brands Session      | Sesión                | Login, Session info, Password reminder                                                                                                                             |
| Terramar Brands Catalog      | Catálogo público      | Departments, Product descriptions                                                                                                                                  |
| Terramar Brands Cart         | Carrito               | _Consulta_: Warehouses, Cart categories, Cart products · _Artículos del carrito_: Add to cart, Recycle cart · _Pedido_: Accept order                               |
| Terramar Brands Profile      | Perfil de consultora  | _Contrato_: Consultant profile, Sign contract · _Domicilio de envío_: Shipping address, Update shipping address · _Cuenta_: Change password, Validate e-mail token |
| Terramar Brands Awards       | Premios y bonos       | Awards, Select award, Stage-one bonuses, Stage-two bonuses, SiVale card                                                                                            |
| Terramar Brands Orders       | Pedidos y facturación | Invoices, Shipments, Account status, Catalog orders, Catalog order detail                                                                                          |
| Terramar Brands Lineage      | Linaje                | Branch status, Lineage kits, Request branch (active), Request branch (inactive)                                                                                    |
| Terramar Brands Support      | Atenciones            | List tickets, Ticket comments, Open ticket, Comment on ticket                                                                                                      |
| Terramar Brands Travel       | Viaje                 | Travel info (national / international)                                                                                                                             |
| Terramar Brands Certificates | Certificados          | Consultant certificates                                                                                                                                            |
| Terramar Brands Payments     | Pagos                 | Payment token (ProPay), Complete payment                                                                                                                           |
| Terramar Brands Product      | Producto              | Product datasheet                                                                                                                                                  |

Every operation maps 1:1 to an OpenAPI `operationId` — the spec is the authoritative
reference for request and response shapes.

## Usage

A minimal catalog flow:

1. **Terramar Brands Session → Login** (no credential needed) with user and password —
   store the returned token in a **Terramar Brands API** credential.
2. **Terramar Brands Catalog → Departments** (public) to list departments.
3. **Terramar Brands Catalog → Product descriptions** with a department to fetch full
   product sheets.

A checkout flow: **Cart → Warehouses → Cart categories → Cart products → Add to cart →
Accept order**, then **Payments → Payment token** / **Complete payment**.

## Regenerating from the OpenAPI spec

The nodes are generated code — extend the generator rather than hand-editing:

```bash
node tools/generate-nodes.mjs --spec /path/to/openapi.json
npm run lint && npm run build
node tools/check-coverage.mjs --spec /path/to/openapi.json   # PASS = build matches the spec
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
