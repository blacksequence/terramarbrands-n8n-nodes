# Plan — n8n-nodes-terramarbrands: community node package + GitHub Action CI/CD to npm

Repo: terramarbrands-n8n-nodes (empty at start) · Spec: terramarbrands-openapi/openapi.json (git submodule) · CLI: @n8n/node-cli 0.52.5
Tier: HEAVY (new package/module, credential/auth code, npm publish integration). Worked directly — no fan-out: single interdependent scaffold (one package.json, shared lint/build), delegation would only collide.

## Deliverables

1. npm package `n8n-nodes-terramarbrands` (community node): 1 credential type (TerramarBrandsApi bearer token) + 12 nodes (one per OpenAPI category) covering all 40 operations; endpoint (base URL) settable via node params, default https://terramarbrands.mx/wsTerramarV2/Service1.svc.
2. `.github/workflows/publish.yml` — npm publish with provenance on tag push; NPM_TOKEN gh-secret placeholder documented (Option B in workflow comments + README `gh secret set NPM_TOKEN`). `.github/workflows/ci.yml` — lint+build on push/PR.
3. README — install, credential setup (token via Session node Login op), endpoint config, node/operation map, publishing secrets, release flow (`npm run release`).
4. Git repo (init -b main), atomic commits, clean tree.

## Node taxonomy (tag -> node)

| OpenAPI tag           | Class / name                                           | Display                      | Ops                                                                                                               |
| --------------------- | ------------------------------------------------------ | ---------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Sesión                | TerramarBrandsSession / teramarBrandsSession           | Terramar Brands Session      | loginConsultora, getSessionInfo, forgotPassword                                                                   |
| Catálogo público      | TerramarBrandsCatalog / teramarBrandsCatalog           | Terramar Brands Catalog      | listDepartments, listProductDescriptions                                                                          |
| Carrito               | TerramarBrandsCart / teramarBrandsCart                 | Terramar Brands Cart         | listWarehouses, listCartCategories, listCartProducts, addToCart, recycleCart, acceptOrder                         |
| Perfil de consultora  | TerramarBrandsProfile / teramarBrandsProfile           | Terramar Brands Profile      | getConsultantProfile, signContract, getShippingAddress, updateShippingAddress, changePassword, validateEmailToken |
| Premios y bonos       | TerramarBrandsAwards / teramarBrandsAwards             | Terramar Brands Awards       | listAwards, selectAward, getBonosEtapaUno, getBonosEtapaDos, getSiValeCard                                        |
| Pedidos y facturación | TerramarBrandsOrders / teramarBrandsOrders             | Terramar Brands Orders       | listInvoices, listShipments, getAccountStatus, listCatalogOrders, getCatalogOrderDetail                           |
| Linaje                | TerramarBrandsLineage / teramarBrandsLineage           | Terramar Brands Lineage      | getBranchStatus, listLineageKits, requestBranchActive, requestBranchInactive                                      |
| Atenciones            | TerramarBrandsSupport / teramarBrandsSupport           | Terramar Brands Support      | listAtenciones, listAtencionComments, createAtencion, addAtencionComment                                          |
| Viaje                 | TerramarBrandsTravel / teramarBrandsTravel             | Terramar Brands Travel       | getTravelInfo                                                                                                     |
| Certificados          | TerramarBrandsCertificates / teramarBrandsCertificates | Terramar Brands Certificates | listCertificates                                                                                                  |
| Pagos                 | TerramarBrandsPayments / teramarBrandsPayments         | Terramar Brands Payments     | getPaymentToken, completePayment                                                                                  |
| Producto              | TerramarBrandsProduct / teramarBrandsProduct           | Terramar Brands Product      | getProductDatasheet                                                                                               |

## Codegen rules (tools/generate-nodes.mjs, committed)

- query/header param -> string field (name = spec param name, display = humanized, required per spec, description = spec description).
- enum param -> options field; labels: idioma 0=Español/1=Inglés, reabrirPedido S=Reabrir pedido/N=Cerrar, viaje N=Nacional/I=Internacional.
- flat string body prop -> string field; collected into JSON body at execute. selectAward.premioarr1 -> json field, parsed array.
- endpoint param first (required, default = spec server URL); operation options value=operationId label=spec summary; per-op fields displayOptions { show: { operation: [opId] } }.
- Auth: Authorization: Bearer <token> from teramarBrandsApi credential when present; required:true on protected-only nodes, false on Session/Catalog.
- execute: switch on operation; build qs/headers/body from fields (skip empty optional strings); this.helpers.httpRequest (no run-time deps); array responses spread to items.
- package.json: n8n.nodes = 12 dist paths, n8n.credentials = 1 dist path, keywords += n8n-community-node-package.

## Steps (ordered)

1. Scaffold: n8n-node new n8n-nodes-terramarbrands --template programmatic/example (background), move package files into repo root, git init -b main, identity via gh auth, commit 1 = pristine scaffold.
2. Codegen: write tools/generate-nodes.mjs, run (bun), replace example node, wire package.json; npm run lint -> fix loop; npm run build; commit 2.
3. SC3 machine coverage: RUN_TMP/check-coverage.mjs -> 12/12 tags, 40/40 opIds, endpoint defaults, credential refs, package.json standards -> PASS.
4. SC4 real surface: n8n-node dev --custom-user-folder RUN_TMP/n8n-dev (background) -> healthz 200 + nodes/credential registered evidence; aux: curl public GET /getDeptos; teardown + receipts.
5. SC5: verify/keep publish.yml (provenance + NPM_TOKEN placeholder), add ci.yml, README (incl. literal `gh secret set NPM_TOKEN`); commits.
6. Final sweep: lint + build + coverage re-run; cleanup (dev server, RUN_TMP) with receipts; notepad final.

## Success criteria (binary)

SC1 `n8n-node build` exit 0, dist = 12 node .js + 1 credential .js.
SC2 `n8n-node lint` exit 0.
SC3 coverage script PASS (tags 12/12, opIds 40/40, endpoint default == server URL, credential ref, package.json name/keywords/n8n attribute).
SC4 dev n8n healthz 200 + TerramarBrands nodes + credential registered (captured HTTP evidence).
SC5 publish.yml YAML-valid, npm publish + provenance present; README contains literal `gh secret set NPM_TOKEN`; ci.yml present.
SC6 git repo, atomic commits, clean tree.

## Cleanup plan (all receipts into notepad)

- dev n8n: kill PTY session tree, confirm port 5678 free (ss/lsof), rm custom user folder under RUN_TMP.
- scaffold temp subdir removed after move.
- RUN_TMP removed at task end (owned caches only).
