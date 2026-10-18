#!/usr/bin/env node
/**
 * Cross-checks the BUILT package (dist/) against the Terramar Brands
 * OpenAPI spec:
 *
 *   - package.json community-node standards (n8n-nodes- name,
 *     n8n-community-node-package keyword, n8n attribute wiring, built files)
 *   - one node per OpenAPI category, description.name as expected
 *   - spec operations present as operation options — including the deliberate
 *     split of combined read+update endpoints (SPLIT) — with no extras
 *   - every node references the termarBrandsApi credential
 *   - every node has an `endpoint` param defaulting to the spec server URL
 *   - fixed-value defaults ship pre-filled (seccion CONSULTORIA, cart
 *     accion ALMAOK/desplegar, opcion PREBRANCH, dominio
 *     carrito.terramarbrands.com.mx, split accion CONTINUAR/TERMINAR)
 *   - every parameter field stays expression-editable (no noDataExpression
 *     outside operation/resource)
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
	'Sesión': { className: 'TerramarBrandsSession', name: 'terramarBrandsSession' },
	'Catálogo público': { className: 'TerramarBrandsCatalog', name: 'terramarBrandsCatalog' },
	'Carrito': { className: 'TerramarBrandsCart', name: 'terramarBrandsCart' },
	'Perfil de consultora': { className: 'TerramarBrandsProfile', name: 'terramarBrandsProfile' },
	'Premios y bonos': { className: 'TerramarBrandsAwards', name: 'terramarBrandsAwards' },
	'Pedidos y facturación': { className: 'TerramarBrandsOrders', name: 'terramarBrandsOrders' },
	'Linaje': { className: 'TerramarBrandsLineage', name: 'terramarBrandsLineage' },
	'Atenciones': { className: 'TerramarBrandsSupport', name: 'terramarBrandsSupport' },
	'Viaje': { className: 'TerramarBrandsTravel', name: 'terramarBrandsTravel' },
	'Certificados': { className: 'TerramarBrandsCertificates', name: 'terramarBrandsCertificates' },
	'Pagos': { className: 'TerramarBrandsPayments', name: 'terramarBrandsPayments' },
	'Producto': { className: 'TerramarBrandsProduct', name: 'terramarBrandsProduct' },
};

// Spec operations deliberately split into dedicated read/update node operations.
const SPLIT = {
	getConsultantProfile: ['readConsultantProfile', 'updateConsultantProfile'],
};

// Fixed-value defaults that must ship pre-filled on the generated fields.
const FIXED_DEFAULTS = {
	'loginConsultora.seccion': 'CONSULTORIA',
	'listCartCategories.accion': 'ALMAOK',
	'listCartProducts.accion': 'desplegar',
	'getBranchStatus.opcion': 'PREBRANCH',
	dominio: 'carrito.terramarbrands.com.mx',
	origen: 'CARRITONUE',
};
const SPLIT_ACCION_DEFAULTS = {
	readConsultantProfile: 'CONTINUAR',
	updateConsultantProfile: 'TERMINAR',
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
const nodeOpUniverse = new Set([...allOps, ...Object.values(SPLIT).flat()]);
const expectedOptionCount =
	allOps.size + Object.values(SPLIT).reduce((acc, splits) => acc + splits.length - 1, 0);

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

// ---- every built node against the spec + default/expression rules ----
const require = createRequire(path.join(ROOT, 'package.json'));

// ---- credential: two modes (user/password auto-login via preAuthentication, or token) ----
const credDist = path.join(ROOT, 'dist', 'credentials', 'TerramarBrandsApi.credentials.js');
ok(existsSync(credDist), 'credential build missing: dist/credentials/TerramarBrandsApi.credentials.js');
if (existsSync(credDist)) {
	const credMod = require(credDist);
	const credClass = credMod.TerramarBrandsApi ?? credMod.default?.TerramarBrandsApi;
	ok(typeof credClass === 'function', 'TerramarBrandsApi: not exported from the build');
	if (typeof credClass === 'function') {
		const cred = new credClass();
		ok(
			cred.name === 'terramarBrandsApi',
			`credential name "${cred.name}" !== "terramarBrandsApi"`,
		);
		ok(
			typeof cred.preAuthentication === 'function',
			'credential: preAuthentication (automatic login) missing',
		);
		ok(!!cred.authenticate, 'credential: authenticate missing');
		ok(!!cred.test?.request, 'credential: connection test missing');
		const credFields = Object.fromEntries((cred.properties ?? []).map((p) => [p.name, p]));
		for (const expected of ['usuario', 'claveAcceso', 'origen', 'token']) {
			ok(!!credFields[expected], `credential: field ${expected} missing`);
		}
		if (credFields.origen) {
			ok(
				credFields.origen.default === FIXED_DEFAULTS.origen,
				`credential.origen default "${credFields.origen.default}" !== "${FIXED_DEFAULTS.origen}"`,
			);
		}
	}
}

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
		`${className}: credential teramarBrandsApi not referenced`,
	);
	const endpoint = (desc.properties ?? []).find((p) => p.name === 'endpoint');
	ok(!!endpoint, `${className}: no endpoint param`);
	ok(
		endpoint?.default === SERVER_URL,
		`${className}: endpoint default "${endpoint?.default}" !== "${SERVER_URL}"`,
	);
	const operationFields = (desc.properties ?? []).filter((p) => p.name === 'operation');
	const values = new Set(
		operationFields.flatMap((f) => (f.options ?? []).map((o) => o.value)),
	);
	const expected = opsByTag[tag] ?? new Set();
	for (const opId of expected) {
		if (SPLIT[opId]) {
			for (const splitOp of SPLIT[opId]) {
				ok(values.has(splitOp), `${className}: split operation ${splitOp} missing`);
			}
		} else {
			ok(values.has(opId), `${className}: operation ${opId} missing`);
		}
	}
	for (const v of values) ok(nodeOpUniverse.has(v), `${className}: unknown operation "${v}"`);
	coveredOps += values.size;

	// fields by operation (displayOptions.show.operation)
	const fieldsByOp = {};
	for (const p of desc.properties ?? []) {
		if (!p.displayOptions?.show?.operation) continue;
		for (const opv of p.displayOptions.show.operation) {
			(fieldsByOp[opv] ??= []).push(p);
		}
	}

	const checkDefault = (opId, fieldName, want) => {
		const f = (fieldsByOp[opId] ?? []).find((x) => x.name === fieldName);
		ok(!!f, `${className}.${opId}: field ${fieldName} missing`);
		if (f) {
			ok(
				f.default === want,
				`${className}.${opId}.${fieldName} default "${f.default}" !== "${want}"`,
			);
		}
	};

	for (const [opId, fs] of Object.entries(fieldsByOp)) {
		for (const f of fs) {
			if (f.name === 'dominio') {
				checkDefault(opId, 'dominio', FIXED_DEFAULTS.dominio);
			}
			if (f.name === 'origen') {
				checkDefault(opId, 'origen', FIXED_DEFAULTS.origen);
			}
			if (!['operation', 'resource'].includes(f.name)) {
				ok(
					!f.noDataExpression,
					`${className}.${opId}.${f.name}: noDataExpression set — expressions must stay available`,
				);
			}
		}
	}

	if (tag === 'Sesión') {
		checkDefault('loginConsultora', 'seccion', FIXED_DEFAULTS['loginConsultora.seccion']);
	}
	if (tag === 'Carrito') {
		checkDefault('listCartCategories', 'accion', FIXED_DEFAULTS['listCartCategories.accion']);
		checkDefault('listCartProducts', 'accion', FIXED_DEFAULTS['listCartProducts.accion']);
	}
	if (tag === 'Linaje') {
		checkDefault('getBranchStatus', 'opcion', FIXED_DEFAULTS['getBranchStatus.opcion']);
	}
	if (tag === 'Perfil de consultora') {
		for (const [opId, accionDefault] of Object.entries(SPLIT_ACCION_DEFAULTS)) {
			ok((fieldsByOp[opId] ?? []).length > 0, `${className}: split op ${opId} has no fields`);
			const accion = (fieldsByOp[opId] ?? []).find((x) => x.name === 'accion');
			ok(!!accion, `${className}.${opId}: accion field missing`);
			if (accion) {
				ok(
					accion.default === accionDefault,
					`${className}.${opId}.accion default "${accion.default}" !== "${accionDefault}"`,
				);
				const optValues = (accion.options ?? []).map((o) => o.value);
				ok(
					optValues.includes('CONTINUAR') && optValues.includes('TERMINAR'),
					`${className}.${opId}.accion options must offer CONTINUAR/TERMINAR`,
				);
				ok(
					!accion.noDataExpression,
					`${className}.${opId}.accion: expressions must stay available`,
				);
			}
		}
	}
}

const summary = `nodes ${expectedNodes}/${expectedNodes}, node operations ${coveredOps}/${expectedOptionCount} (spec ${allOps.size} + ${Object.values(SPLIT).flat().length} splits)`;
if (failures.length > 0 || coveredOps !== expectedOptionCount) {
	console.error(`FAIL — ${summary}`);
	for (const f of failures) console.error(` - ${f}`);
	process.exit(1);
}
console.log(
	`PASS — ${summary}; fixed defaults verified (seccion=CONSULTORIA, accion=ALMAOK/desplegar, opcion=PREBRANCH, dominio=${FIXED_DEFAULTS.dominio}, split accion CONTINUAR/TERMINAR); every parameter field expression-editable`,
);
