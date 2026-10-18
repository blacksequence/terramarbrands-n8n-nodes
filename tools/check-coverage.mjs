#!/usr/bin/env node
/**
 * Cross-checks the BUILT package (dist/) against the Terramar Brands
 * OpenAPI spec:
 *
 *   - package.json community-node standards (n8n-nodes- name,
 *     n8n-community-node-package keyword, n8n attribute wiring, built files)
 *   - one node per OpenAPI category, description.name as expected
 *   - every spec operationId appears as an operation option (and no extras)
 *   - every node references the termarBrandsApi credential
 *   - every node has an `endpoint` param defaulting to the spec server URL
 *
 * Usage: node tools/check-coverage.mjs [--spec /path/to/openapi.json]
 * Prints PASS and exits 0 when everything matches, FAIL + reasons otherwise.
 * This is the SC3 gate of the ultrawork build — keep it in sync with the
 * generator when the spec mapping changes.
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const ROOT = path.resolve(import.meta.dirname, '..');

const specArg = process.argv.indexOf('--spec');
const SPEC =
	specArg > 0
		? process.argv[specArg + 1]
		: path.join(ROOT, '..', 'terramarbrands-openapi', 'openapi.json');

const spec = JSON.parse(readFileSync(SPEC, 'utf8'));
const SERVER_URL = spec.servers?.[0]?.url;
if (!SERVER_URL) throw new Error('OpenAPI spec has no servers[0].url');

// tag -> expected node (kept deliberately independent from the generator)
const TAG_NODES = {
	Sesión: { className: 'TerramarBrandsSession', name: 'terramarBrandsSession' },
	'Catálogo público': { className: 'TerramarBrandsCatalog', name: 'terramarBrandsCatalog' },
	Carrito: { className: 'TerramarBrandsCart', name: 'terramarBrandsCart' },
	'Perfil de consultora': { className: 'TerramarBrandsProfile', name: 'terramarBrandsProfile' },
	'Premios y bonos': { className: 'TerramarBrandsAwards', name: 'terramarBrandsAwards' },
	'Pedidos y facturación': { className: 'TerramarBrandsOrders', name: 'terramarBrandsOrders' },
	Linaje: { className: 'TerramarBrandsLineage', name: 'terramarBrandsLineage' },
	Atenciones: { className: 'TerramarBrandsSupport', name: 'terramarBrandsSupport' },
	Viaje: { className: 'TerramarBrandsTravel', name: 'terramarBrandsTravel' },
	Certificados: { className: 'TerramarBrandsCertificates', name: 'terramarBrandsCertificates' },
	Pagos: { className: 'TerramarBrandsPayments', name: 'terramarBrandsPayments' },
	Producto: { className: 'TerramarBrandsProduct', name: 'terramarBrandsProduct' },
};

const failures = [];
const ok = (cond, msg) => {
	if (!cond) failures.push(msg);
};

// ---- operations by tag straight from the spec ----
const opsByTag = {};
for (const [opPath, pathItem] of Object.entries(spec.paths ?? {})) {
	for (const [method, op] of Object.entries(pathItem)) {
		if (typeof op !== 'object' || op === null) continue;
		if (!op.operationId) continue;
		const tag = op.tags?.[0];
		(opsByTag[tag] ??= new Set()).add(op.operationId);
	}
}
const allOps = new Set(Object.values(opsByTag).flatMap((s) => [...s]));

// ---- package.json standards ----
const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
ok(
	/^(n8n-nodes-|@[\w.-]+\/n8n-nodes-)/.test(pkg.name),
	`package name must start with n8n-nodes- (got "${pkg.name}")`,
);
ok(
	(pkg.keywords ?? []).includes('n8n-community-node-package'),
	'package.json keywords must include n8n-community-node-package',
);
const expectedNodes = Object.keys(TAG_NODES).length;
ok(
	(pkg.n8n?.nodes ?? []).length === expectedNodes,
	`n8n.nodes must list ${expectedNodes} files (got ${(pkg.n8n?.nodes ?? []).length})`,
);
ok(
	(pkg.n8n?.credentials ?? []).length === 1,
	`n8n.credentials must list exactly 1 file (got ${(pkg.n8n?.credentials ?? []).length})`,
);
for (const f of [...(pkg.n8n?.nodes ?? []), ...(pkg.n8n?.credentials ?? [])]) {
	ok(existsSync(path.join(ROOT, f)), `built file missing: ${f}`);
}

// ---- every built node against the spec ----
const require = createRequire(path.join(ROOT, 'package.json'));
let coveredOps = 0;
for (const [tag, { className, name }] of Object.entries(TAG_NODES)) {
	const distPath = path.join(ROOT, 'dist', 'nodes', className, `${className}.node.js`);
	if (!existsSync(distPath)) {
		ok(false, `dist node missing: ${path.relative(ROOT, distPath)}`);
		continue;
	}
	const mod = require(distPath);
	const Ctor = mod[className];
	if (typeof Ctor !== 'function') {
		ok(false, `${className}: not exported from the build`);
		continue;
	}
	const desc = new Ctor().description;
	ok(desc.name === name, `${className}: description.name "${desc.name}" !== "${name}"`);
	ok(
		(desc.credentials ?? []).some((c) => c.name === 'terramarBrandsApi'),
		`${className}: credential termarBrandsApi not referenced`,
	);
	const endpoint = (desc.properties ?? []).find((p) => p.name === 'endpoint');
	ok(!!endpoint, `${className}: no endpoint param`);
	ok(
		endpoint?.default === SERVER_URL,
		`${className}: endpoint default "${endpoint?.default}" !== "${SERVER_URL}"`,
	);
	const operationFields = (desc.properties ?? []).filter((p) => p.name === 'operation');
	const values = new Set(operationFields.flatMap((f) => (f.options ?? []).map((o) => o.value)));
	const expected = opsByTag[tag] ?? new Set();
	for (const opId of expected) ok(values.has(opId), `${className}: operation ${opId} missing`);
	for (const v of values) ok(allOps.has(v), `${className}: unknown operation "${v}"`);
	coveredOps += values.size;
}

const summary = `nodes ${expectedNodes}/${expectedNodes}, spec operations ${allOps.size}, covered options ${coveredOps}`;
if (failures.length > 0 || coveredOps !== allOps.size) {
	console.error(`FAIL — ${summary}`);
	for (const f of failures) console.error(` - ${f}`);
	process.exit(1);
}
console.log(
	`PASS — ${summary}; every node references the termarBrandsApi credential and has an endpoint param defaulting to ${SERVER_URL}`,
);
