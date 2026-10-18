#!/usr/bin/env node
/**
 * Codegen for the Terramar Brands n8n community node package
 * (n8n-nodes-terramarbrands).
 *
 * Reads the Terramar Brands OpenAPI spec and (re)generates:
 *   - credentials/TerramarBrandsApi.credentials.ts   (bearer-token credential)
 *   - credentials/terramarbrands(.dark).svg         (credential icons)
 *   - nodes/GenericFunctions.ts                       (shared apiRequest helper)
 *   - nodes/<Class>/<Class>.node.ts                   (one node per OpenAPI tag)
 *   - nodes/<Class>/<Class>.node.json                 (codex metadata)
 *   - per-node light/dark icons (copied from the scaffold example node)
 *   - package.json wiring (n8n.nodes, n8n.credentials, keywords, metadata)
 *   - removes the scaffold example node/credential (never its own output)
 *
 * Emitted TypeScript follows the project's prettier config (tabs, single
 * quotes, trailing commas) and the n8n community-node lint rules
 * (@n8n/eslint-plugin-community-nodes + eslint-plugin-n8n-nodes-base):
 * credential icon (themed)/test/authenticate required, no manual auth next
 * to helpers.httpRequest, resource+operation pattern for nodes with more
 * than 5 operations, alphabetized option lists, n8n-cased display names
 * and descriptions.
 *
 * The generator is deterministic and idempotent: running it twice produces
 * identical files. It throws on any spec shape it cannot map, so spec drift
 * can never silently produce broken nodes — extend it instead.
 *
 * Usage:
 *   node tools/generate-nodes.mjs [--spec /path/to/openapi.json]
 */

import {
	cpSync,
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

const specArgIndex = process.argv.indexOf('--spec');
const SPEC_PATH =
	specArgIndex > 0
		? process.argv[specArgIndex + 1]
		: '../terramarbrands-openapi/openapi.json';

const REPO_URL = 'https://github.com/yokharian/terramarbrands-n8n-nodes';
const CREDENTIAL_NAME = 'terramarBrandsApi';
const CREDENTIAL_CLASS = 'TerramarBrandsApi';
// Side-effect-free, parameter-free protected GET — used as the credential test.
const CREDENTIAL_TEST_URL = 'https://terramarbrands.mx/wsTerramarV2/Service1.svc/GetBonosEtapaUno';

const spec = JSON.parse(readFileSync(SPEC_PATH, 'utf8'));
const SERVER_URL = spec.servers?.[0]?.url;
if (!SERVER_URL) throw new Error('OpenAPI spec has no servers[0].url');

// ---------------------------------------------------------------------------
// tag -> node configuration (one n8n node per OpenAPI category)
// ---------------------------------------------------------------------------

const TAG_NODES = {
	Sesión: {
		className: 'TerramarBrandsSession',
		name: 'terramarBrandsSession',
		displayName: 'Terramar Brands Session',
		category: 'Sales',
		description:
			'Session (Sesión) operations of the Terramar Brands API: consultant login, open-session restore and password reminder.',
	},
	'Catálogo público': {
		className: 'TerramarBrandsCatalog',
		name: 'terramarBrandsCatalog',
		displayName: 'Terramar Brands Catalog',
		category: 'Sales',
		description:
			'Public catalog (Catálogo público) of the Terramar Brands API: departments and full product descriptions.',
	},
	Carrito: {
		className: 'TerramarBrandsCart',
		name: 'terramarBrandsCart',
		displayName: 'Terramar Brands Cart',
		category: 'Sales',
		description:
			'Consultant cart (Carrito) on the Terramar Brands API: warehouses, categories, products, add to cart, recycle and accept orders.',
	},
	'Perfil de consultora': {
		className: 'TerramarBrandsProfile',
		name: 'terramarBrandsProfile',
		displayName: 'Terramar Brands Profile',
		category: 'Sales',
		description:
			'Consultant profile (Perfil de consultora) on the Terramar Brands API: contract, shipping addresses, password change and e-mail validation.',
	},
	'Premios y bonos': {
		className: 'TerramarBrandsAwards',
		name: 'terramarBrandsAwards',
		displayName: 'Terramar Brands Awards',
		category: 'Sales',
		description:
			'Awards and bonuses (Premios y bonos) on the Terramar Brands API: period awards, stage-one and stage-two bonuses and SiVale card status.',
	},
	'Pedidos y facturación': {
		className: 'TerramarBrandsOrders',
		name: 'terramarBrandsOrders',
		displayName: 'Terramar Brands Orders',
		category: 'Sales',
		description:
			'Orders and invoicing (Pedidos y facturación) on the Terramar Brands API: invoices, shipments, account status and catalog orders.',
	},
	Linaje: {
		className: 'TerramarBrandsLineage',
		name: 'terramarBrandsLineage',
		displayName: 'Terramar Brands Lineage',
		category: 'Sales',
		description:
			'Lineage (Linaje) operations on the Terramar Brands API: branch status, lineage kits and branch requests.',
	},
	Atenciones: {
		className: 'TerramarBrandsSupport',
		name: 'terramarBrandsSupport',
		displayName: 'Terramar Brands Support',
		category: 'Communication',
		description:
			'Support tickets (Atenciones) on the Terramar Brands API: list tickets and comments, open a ticket or add a comment.',
	},
	Viaje: {
		className: 'TerramarBrandsTravel',
		name: 'terramarBrandsTravel',
		displayName: 'Terramar Brands Travel',
		category: 'Sales',
		description:
			'Travel (Viaje) information of the current period from the Terramar Brands API, national or international.',
	},
	Certificados: {
		className: 'TerramarBrandsCertificates',
		name: 'terramarBrandsCertificates',
		displayName: 'Terramar Brands Certificates',
		category: 'Sales',
		description: 'Certificates (Certificados) of the consultant from the Terramar Brands API.',
	},
	Pagos: {
		className: 'TerramarBrandsPayments',
		name: 'terramarBrandsPayments',
		displayName: 'Terramar Brands Payments',
		category: 'Finance & Accounting',
		description:
			'Hosted payments (Pagos, ProPay) on the Terramar Brands API: create a payment token and confirm a payment.',
	},
	Producto: {
		className: 'TerramarBrandsProduct',
		name: 'terramarBrandsProduct',
		displayName: 'Terramar Brands Product',
		category: 'Sales',
		description: 'Product datasheets (Producto) from the Terramar Brands API.',
	},
};

const MY_CLASSES = new Set(Object.values(TAG_NODES).map((c) => c.className));

// Resource layer for nodes with more than 5 operations (required by
// @n8n/community-nodes/resource-operation-pattern). Values must be unique
// per node; every operation of the node must be covered exactly once.
const NODE_RESOURCES = {
	TerramarBrandsCart: [
		{
			name: 'Consulta',
			value: 'consulta',
			ops: ['listWarehouses', 'listCartCategories', 'listCartProducts'],
		},
		{ name: 'Artículos del carrito', value: 'articulos', ops: ['addToCart', 'recycleCart'] },
		{ name: 'Pedido', value: 'pedido', ops: ['acceptOrder'] },
	],
	TerramarBrandsProfile: [
		{ name: 'Contrato', value: 'contrato', ops: ['getConsultantProfile', 'signContract'] },
		{
			name: 'Domicilio de envío',
			value: 'domicilio',
			ops: ['getShippingAddress', 'updateShippingAddress'],
		},
		{ name: 'Cuenta', value: 'cuenta', ops: ['changePassword', 'validateEmailToken'] },
	],
};

// Friendlier labels for the spec's enum params (taken from the spec's own
// parameter descriptions; fallback = the raw value).
const ENUM_LABELS = {
	idioma: { 0: 'Español', 1: 'Inglés' },
	reabrirPedido: {
		S: 'S — reabrir el pedido anterior',
		N: 'N — cerrar el pedido anterior',
	},
	viaje: { N: 'Nacional', I: 'Internacional' },
};

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

/** TypeScript string literal: single quotes, escaped. */
const ts = (value) => `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

/** Property name: camelCase (snake_case and leading capitals normalized). */
const toFieldName = (s) =>
	s
		.replace(/_([a-zA-Z0-9])/g, (_, c) => c.toUpperCase())
		.replace(/^([A-Z])(?=[a-z])/, (c) => c.toLowerCase());

/** Display name: humanized + n8n-cased acronyms. */
const humanize = (name) =>
	name
		.replace(/_/g, ' ')
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.replace(/^./, (c) => c.toUpperCase())
		.replace(/\s+/g, ' ')
		.trim()
		.replace(/\bId\b/g, 'ID')
		.replace(/\bUrl\b/g, 'URL')
		.replace(/\bApi\b/g, 'API')
		.replace(/\bOk\b/g, 'OK');

/** n8n lint style for param descriptions: trimmed, no trailing period, capitalized. */
const cleanDescription = (d) =>
	String(d ?? '')
		.replace(/\s+/g, ' ')
		.trim()
		.replace(/\.$/, '')
		.replace(/^([a-záéíóúñü])/i, (c) => c.toUpperCase());

/** Alphabetical by `name` (matches node-param-options-type-unsorted-items). */
const byName = (a, b) => a.name.localeCompare(b.name);

/** Serialize a plain JS value as a prettier-style TypeScript literal (tabs). */
const lit = (value, indent = 0) => {
	const pad = '\t'.repeat(indent);
	if (value === null) return 'null';
	if (typeof value === 'number' || typeof value === 'boolean') return String(value);
	if (typeof value === 'string') return ts(value);
	if (Array.isArray(value)) {
		if (value.length === 0) return '[]';
		if (value.every((x) => x === null || typeof x !== 'object')) {
			return `[${value.map((x) => lit(x, 0)).join(', ')}]`;
		}
		return `[\n${value
			.map((x) => `${'\t'.repeat(indent + 1)}${lit(x, indent + 1)}`)
			.join(',\n')},\n${pad}]`;
	}
	const entries = Object.entries(value);
	if (entries.length === 0) return '{}';
	const lines = entries.map(([k, x]) => {
		const inline = `${k}: ${typeof x === 'object' && x !== null ? lit(x, indent + 1) : lit(x, indent)}`;
		const entry = `${'\t'.repeat(indent + 1)}${inline}`;
		if (entry.length > 100 && typeof x === 'string') {
			return `${'\t'.repeat(indent + 1)}${k}:\n${'\t'.repeat(indent + 2)}${ts(x)}`;
		}
		return entry;
	});
	return `{\n${lines.join(',\n')},\n${pad}}`;
};

// ---------------------------------------------------------------------------
// collect operations from the spec
// ---------------------------------------------------------------------------

const resolveSchema = (schema) => {
	if (schema?.$ref) {
		const schemaName = schema.$ref.split('/').pop();
		return spec.components?.schemas?.[schemaName] ?? {};
	}
	return schema ?? {};
};

const collectOps = () => {
	const byTag = {};
	for (const [opPath, pathItem] of Object.entries(spec.paths ?? {})) {
		for (const [method, op] of Object.entries(pathItem)) {
			if (method === 'parameters' || typeof op !== 'object' || op === null) continue;
			if (!['get', 'post'].includes(method)) {
				throw new Error(`Unsupported method ${method} on ${opPath}`);
			}
			const opId = op.operationId;
			if (!opId) throw new Error(`Missing operationId on ${method} ${opPath}`);
			const tag = op.tags?.[0];
			if (!tag || !TAG_NODES[tag]) {
				throw new Error(`Operation ${opId} has unmapped tag ${JSON.stringify(tag)}`);
			}
			const entry = {
				opId,
				method: method.toUpperCase(),
				path: opPath,
				summary: op.summary ?? opId,
				isPublic: Array.isArray(op.security) && op.security.length === 0,
				resource: null,
				query: {},
				headers: {},
				body: {},
				bodyJson: {},
			};
			for (const param of op.parameters ?? []) {
				const paramType = param.schema?.type ?? 'string';
				if (paramType !== 'string') {
					throw new Error(`Param ${param.name} of ${opId} is ${paramType} — extend the generator`);
				}
				const target =
					param.in === 'query' ? entry.query : param.in === 'header' ? entry.headers : null;
				if (!target) throw new Error(`Unsupported param.in "${param.in}" on ${opId}`);
				const fieldName = toFieldName(param.name);
				if (fieldName in target || fieldName in entry.body || fieldName in entry.bodyJson) {
					throw new Error(`Field name collision "${fieldName}" on ${opId}`);
				}
				target[fieldName] = {
					name: param.name,
					required: !!param.required,
					description: cleanDescription(param.description),
					enumValues: param.schema?.enum ? param.schema.enum.map(String) : null,
				};
			}
			if (op.requestBody) {
				const content = op.requestBody.content ?? {};
				const media = content['application/json'] ?? Object.values(content)[0];
				if (!media) throw new Error(`No body content on ${opId}`);
				const schema = resolveSchema(media.schema);
				for (const [propName, prop] of Object.entries(schema.properties ?? {})) {
					const fieldName = toFieldName(propName);
					if (
						fieldName in entry.query ||
						fieldName in entry.headers ||
						fieldName in entry.body ||
						fieldName in entry.bodyJson
					) {
						throw new Error(`Field name collision "${fieldName}" on ${opId}`);
					}
					if (prop.type === 'array') {
						entry.bodyJson[fieldName] = {
							name: propName,
							required: (schema.required ?? []).includes(propName),
							description: cleanDescription(
								prop.description ?? 'JSON array value to send in the request body',
							),
						};
						continue;
					}
					if (prop.type === 'object' || prop.allOf || prop.$ref) {
						throw new Error(`Body prop ${propName} of ${opId} is nested — extend the generator`);
					}
					entry.body[fieldName] = {
						name: propName,
						required: (schema.required ?? []).includes(propName),
						description: cleanDescription(prop.description),
					};
				}
			}
			(byTag[tag] ??= []).push(entry);
		}
	}
	for (const [tag] of Object.entries(TAG_NODES)) {
		if (!byTag[tag] || byTag[tag].length === 0) {
			throw new Error(`Tag "${tag}" has no operations in the spec`);
		}
	}
	return byTag;
};

// ---------------------------------------------------------------------------
// templates
// ---------------------------------------------------------------------------

const CREDENTIAL_TS = `import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

export class ${CREDENTIAL_CLASS} implements ICredentialType {
	name = '${CREDENTIAL_NAME}';

	displayName = 'Terramar Brands API';

	documentationUrl = '${REPO_URL}#credentials';

	icon: Icon = {
		light: 'file:terramarbrands.svg',
		dark: 'file:terramarbrands.dark.svg',
	};

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.token}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			method: 'GET',
			url: '${CREDENTIAL_TEST_URL}',
		},
	};

	properties: INodeProperties[] = [
		{
			displayName: 'Token',
			name: 'token',
			required: true,
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description:
				'Terramar Brands API bearer token — obtain it with the Terramar Brands Session node → Login operation (POST /getConsultoriaLogin), or copy the TMBcartToken cookie from the Terramar Brands SPA. The connection test performs a read-only GET /GetBonosEtapaUno against the production endpoint.',
		},
	];
}
`;

const GENERIC_FUNCTIONS_TS = `import type { IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';

/**
 * Static per-operation request metadata generated from the OpenAPI spec.
 * Every map is: field name -> [spec param name, required].
 */
export interface TerramarBrandsOpSpec {
	method: 'GET' | 'POST';
	path: string;
	query: Record<string, [string, boolean]>;
	headers: Record<string, [string, boolean]>;
	body: Record<string, [string, boolean]>;
	bodyJson: Record<string, [string, boolean]>;
	isPublic: boolean;
}

/** One HTTP request against the Terramar Brands API. */
export interface TerramarBrandsRequest {
	method: 'GET' | 'POST';
	path: string;
	qs?: Record<string, string>;
	headers?: Record<string, string>;
	body?: Record<string, unknown>;
	isPublic?: boolean;
}

/**
 * Send one request to the Terramar Brands API using the node's \`endpoint\`
 * parameter as base URL. Operations the spec marks \`security: []\` are sent
 * plain; every other operation is authenticated by n8n with the Terramar
 * Brands API credential (Authorization: Bearer, defined on the credential).
 */
export async function apiRequest(
	this: IExecuteFunctions,
	request: TerramarBrandsRequest,
): Promise<unknown> {
	const endpoint = (this.getNodeParameter('endpoint', 0) as string).replace(/\\/+$/, '');
	const options: IHttpRequestOptions = {
		method: request.method,
		url: \`\${endpoint}\${request.path}\`,
		qs: request.qs,
		headers: {
			Accept: 'application/json',
			...request.headers,
		},
		json: true,
	};
	if (Object.keys(request.body ?? {}).length > 0) {
		options.body = request.body;
	}
	if (request.isPublic) {
		return this.helpers.httpRequest(options);
	}
	return this.helpers.httpRequestWithAuthentication.call(this, '${CREDENTIAL_NAME}', options);
}
`;

const nodeTsFile = (config, ops, icons) => {
	// resource layer for nodes with more than 5 operations
	const resources = NODE_RESOURCES[config.className] ?? null;
	if (ops.length > 5 && !resources) {
		throw new Error(
			`${config.className} has ${ops.length} operations — add a NODE_RESOURCES map (resource-operation-pattern rule)`,
		);
	}
	if (resources) {
		const covered = resources.flatMap((r) => r.ops);
		const opIds = ops.map((o) => o.opId);
		const missing = covered.filter((id) => !opIds.includes(id));
		const extra = opIds.filter((id) => !covered.includes(id));
		const dupes = covered.filter((id, i) => covered.indexOf(id) !== i);
		if (missing.length || extra.length || dupes.length) {
			throw new Error(
				`${config.className} resource map mismatch: missing=${missing} extra=${extra} dupes=${dupes}`,
			);
		}
		const sortedResources = resources.slice().sort(byName);
		for (const resource of sortedResources) {
			for (const op of ops) {
				if (resource.ops.includes(op.opId)) {
					op.resource = resource.value;
				}
			}
		}
	}

	const requiresCredential = !ops.every((op) => op.isPublic);

	const fieldFor = (op, fieldName, meta, type) => {
		const description =
			meta.description || `${humanize(fieldName)} parameter of the Terramar Brands API`;
		const show = op.resource
			? { resource: [op.resource], operation: [op.opId] }
			: { operation: [op.opId] };
		const field = {
			displayName: humanize(fieldName),
			name: fieldName,
			type,
			required: meta.required,
			description,
			displayOptions: { show },
		};
		if (meta.enumValues) {
			field.type = 'options';
			field.default = meta.enumValues[0];
			field.options = meta.enumValues
				.map((v) => ({ name: ENUM_LABELS[meta.name]?.[v] ?? v, value: v }))
				.sort(byName);
		} else if (type === 'json') {
			field.default = '[]';
		} else {
			field.default = '';
		}
		return field;
	};

	const fields = [];
	for (const op of ops) {
		for (const [fieldName, meta] of Object.entries(op.query)) {
			fields.push(fieldFor(op, fieldName, meta, 'string'));
		}
		for (const [fieldName, meta] of Object.entries(op.headers)) {
			fields.push(fieldFor(op, fieldName, meta, 'string'));
		}
		for (const [fieldName, meta] of Object.entries(op.body)) {
			fields.push(fieldFor(op, fieldName, meta, 'string'));
		}
		for (const [fieldName, meta] of Object.entries(op.bodyJson)) {
			fields.push(fieldFor(op, fieldName, meta, 'json'));
		}
	}

	const opToOption = (op) => ({
		name: op.summary,
		value: op.opId,
		description: `${op.method} ${op.path}`,
		action: `${config.displayName}: ${op.summary}`,
	});

	const properties = [
		{
			displayName: 'Endpoint',
			name: 'endpoint',
			type: 'string',
			required: true,
			default: SERVER_URL,
			placeholder: SERVER_URL,
			description:
				'Base URL of the Terramar Brands API (wsTerramarV2 Service1.svc). Change it to point the node at another environment',
		},
	];

	if (resources) {
		const sortedResources = resources.slice().sort(byName);
		properties.push({
			displayName: 'Resource',
			name: 'resource',
			type: 'options',
			noDataExpression: true,
			required: true,
			default: sortedResources[0].value,
			description: 'The area of the Terramar Brands API to work with',
			options: sortedResources.map((r) => ({ name: r.name, value: r.value })),
		});
		for (const resource of sortedResources) {
			const resourceOps = ops
				.filter((o) => o.resource === resource.value)
				.slice()
				.sort((a, b) => a.summary.localeCompare(b.summary));
			properties.push({
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				required: true,
				default: resourceOps[0].opId,
				description: 'The operation to perform',
				displayOptions: { show: { resource: [resource.value] } },
				options: resourceOps.map(opToOption),
			});
		}
	} else {
		const sortedOps = ops.slice().sort((a, b) => a.summary.localeCompare(b.summary));
		properties.push({
			displayName: 'Operation',
			name: 'operation',
			type: 'options',
			noDataExpression: true,
			required: true,
			default: sortedOps[0].opId,
			description: 'The operation to perform',
			options: sortedOps.map(opToOption),
		});
	}

	properties.push(...fields);

	const opsLiteral = {};
	for (const op of ops) {
		const toMeta = (record) => {
			const out = {};
			for (const [fieldName, meta] of Object.entries(record)) {
				out[fieldName] = [meta.name, meta.required];
			}
			return out;
		};
		opsLiteral[op.opId] = {
			method: op.method,
			path: op.path,
			query: toMeta(op.query),
			headers: toMeta(op.headers),
			body: toMeta(op.body),
			bodyJson: toMeta(op.bodyJson),
			isPublic: op.isPublic,
		};
	}

	const iconProp = icons?.dark
		? `{ light: ${ts(`file:${icons.light}`)}, dark: ${ts(`file:${icons.dark}`)} }`
		: ts(`file:${icons?.light}`);

	const subtitle = resources
		? '={{$parameter["resource"] + ": " + $parameter["operation"]}}'
		: '={{$parameter["operation"]}}';

	return `import {
	NodeApiError,
	NodeConnectionTypes,
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type JsonObject,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';

import { apiRequest, type TerramarBrandsOpSpec } from '../GenericFunctions';

const OPS: Record<string, TerramarBrandsOpSpec> = ${lit(opsLiteral, 0)};

export class ${config.className} implements INodeType {
	description: INodeTypeDescription = {
		displayName: ${ts(config.displayName)},
		name: ${ts(config.name)},
		icon: ${iconProp},
		group: ['input'],
		version: 1,
		subtitle: ${ts(subtitle)},
		description: ${ts(config.description)},
		defaults: {
			name: ${ts(config.displayName)},
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: '${CREDENTIAL_NAME}',
				required: ${requiresCredential},
			},
		],
		properties: ${lit(properties, 2)},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const operation = this.getNodeParameter('operation', i) as string;
			const opSpec = OPS[operation];
			if (!opSpec) {
				throw new NodeOperationError(this.getNode(), \`Unknown operation "\${operation}"\`, {
					itemIndex: i,
				});
			}

			try {
				const qs: Record<string, string> = {};
				for (const [field, [paramName, isRequired]] of Object.entries(opSpec.query)) {
					const value = this.getNodeParameter(field, i) as string;
					if (isRequired || value !== '') qs[paramName] = value;
				}

				const headers: Record<string, string> = {};
				for (const [field, [paramName, isRequired]] of Object.entries(opSpec.headers)) {
					const value = this.getNodeParameter(field, i) as string;
					if (isRequired || value !== '') headers[paramName] = value;
				}

				const body: Record<string, unknown> = {};
				for (const [field, [paramName, isRequired]] of Object.entries(opSpec.body)) {
					const value = this.getNodeParameter(field, i) as string;
					if (isRequired || value !== '') body[paramName] = value;
				}
				for (const [field, [paramName]] of Object.entries(opSpec.bodyJson)) {
					const value = this.getNodeParameter(field, i) as string;
					if (value && value.trim() !== '') body[paramName] = JSON.parse(value);
				}

				const response = await apiRequest.call(this, {
					method: opSpec.method,
					path: opSpec.path,
					qs,
					headers,
					body,
					isPublic: opSpec.isPublic,
				});

				if (Array.isArray(response)) {
					for (const element of response) {
						returnData.push({
							json: element as IDataObject,
							pairedItem: {
								item: i,
							},
						});
					}
				} else {
					returnData.push({
						json: response as IDataObject,
						pairedItem: {
							item: i,
						},
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: (error as Error).message,
						},
						pairedItem: {
							item: i,
						},
					});
					continue;
				}
				throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
`;
};

const nodeJsonFile = (config) =>
	`${JSON.stringify(
		{
			node: 'n8n-nodes-terramarbrands',
			nodeVersion: '1.0',
			codexVersion: '1.0',
			categories: [config.category],
			resources: {
				credentialDocumentation: [{ url: `${REPO_URL}#credentials` }],
				primaryDocumentation: [{ url: `${REPO_URL}#readme` }],
			},
		},
		null,
		'\t',
	)}\n`;

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

const byTag = collectOps();

const written = [];
const mkdirWrite = (relPath, content) => {
	const abs = path.join(ROOT, relPath);
	mkdirSync(path.dirname(abs), { recursive: true });
	writeFileSync(abs, content);
	written.push(relPath);
};

// --- discover the scaffold example node dir (icon source) — never a node we own ---
const pkgPath = path.join(ROOT, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const oldNodeDistPaths = pkg.n8n?.nodes ?? [];
const srcDirFor = (distPath) => path.join(ROOT, path.dirname(distPath.replace(/^dist\//, '')));

const findIconPair = (dir) => {
	if (!existsSync(dir) || !readdirSync(dir).length) return null;
	const imageFiles = readdirSync(dir).filter((f) => /\.(svg|png)$/i.test(f));
	const light = imageFiles.find((f) => !/\.dark\./.test(f));
	if (!light) return null;
	return { light, dark: imageFiles.find((f) => /\.dark\./.test(f)) ?? null };
};

let iconSourceDir = null;
let iconPair = null;
for (const distPath of oldNodeDistPaths) {
	const dir = srcDirFor(distPath);
	if (MY_CLASSES.has(path.basename(dir))) continue;
	iconPair = findIconPair(dir);
	if (iconPair) {
		iconSourceDir = dir;
		break;
	}
}
if (!iconPair) {
	// re-run: fall back to the first of our own node dirs (icons are identical clones)
	const firstDir = path.join(ROOT, 'nodes', TAG_NODES['Sesión'].className);
	iconPair = findIconPair(firstDir);
	if (iconPair) iconSourceDir = firstDir;
}
const iconExt = iconPair ? (iconPair.light.match(/\.([a-z]+)$/i)?.[1] ?? 'svg') : null;

/** cpSync that tolerates src === dest (re-runs use an existing node dir as source). */
const copyIcon = (src, dest) => {
	if (src === dest) return;
	cpSync(src, dest);
};

// --- credential (with its own themed icons) + shared helper ---
mkdirWrite(`credentials/${CREDENTIAL_CLASS}.credentials.ts`, CREDENTIAL_TS);
if (iconPair && iconSourceDir) {
	copyIcon(
		path.join(iconSourceDir, iconPair.light),
		path.join(ROOT, 'credentials', 'terramarbrands.svg'),
	);
	if (iconPair.dark) {
		copyIcon(
			path.join(iconSourceDir, iconPair.dark),
			path.join(ROOT, 'credentials', 'terramarbrands.dark.svg'),
		);
	}
}
mkdirWrite('nodes/GenericFunctions.ts', GENERIC_FUNCTIONS_TS);

// --- nodes (one per tag) ---
const nodeDistPaths = [];
const totals = {};
for (const [tag, config] of Object.entries(TAG_NODES)) {
	const ops = byTag[tag];
	totals[config.className] = ops.length;
	const nodeDir = path.join(ROOT, 'nodes', config.className);

	let icons = null;
	if (iconPair && iconSourceDir) {
		icons = {
			light: `${config.className}.${iconExt}`,
			dark: iconPair.dark ? `${config.className}.dark.${iconExt}` : null,
		};
		copyIcon(path.join(iconSourceDir, iconPair.light), path.join(nodeDir, icons.light));
		if (iconPair.dark)
			copyIcon(path.join(iconSourceDir, iconPair.dark), path.join(nodeDir, icons.dark));
	}

	mkdirWrite(
		`nodes/${config.className}/${config.className}.node.ts`,
		nodeTsFile(config, ops, icons),
	);
	mkdirWrite(`nodes/${config.className}/${config.className}.node.json`, nodeJsonFile(config));
	nodeDistPaths.push(`dist/nodes/${config.className}/${config.className}.node.js`);
}

// --- remove scaffold example node dirs + foreign credentials (never our own) ---
for (const distPath of oldNodeDistPaths) {
	const dir = srcDirFor(distPath);
	if (MY_CLASSES.has(path.basename(dir))) continue;
	if (dir.startsWith(path.join(ROOT, 'nodes')) && existsSync(dir)) {
		rmSync(dir, { recursive: true, force: true });
		console.log(`removed scaffold node: ${path.relative(ROOT, dir)}`);
	}
}
const credentialsDir = path.join(ROOT, 'credentials');
if (existsSync(credentialsDir)) {
	for (const file of readdirSync(credentialsDir)) {
		if (!file.endsWith('.credentials.ts') || file === `${CREDENTIAL_CLASS}.credentials.ts`)
			continue;
		rmSync(path.join(credentialsDir, file), { force: true });
		console.log(`removed scaffold credential: ${file}`);
	}
}

// --- wire package.json ---
pkg.description =
	'n8n community nodes for the Terramar Brands API (wsTerramarV2): catalog, cart, orders, profile, awards, lineage, payments and more.';
pkg.author = { name: 'yokharian', email: 'yokharian@users.noreply.github.com' };
pkg.homepage = `${REPO_URL}#readme`;
pkg.repository = { type: 'git', url: `${REPO_URL}.git` };
pkg.keywords = Array.from(
	new Set([
		...(pkg.keywords ?? []),
		'n8n-community-node-package',
		'n8n',
		'terramarbrands',
		'terramar-brands',
	]),
);
pkg.n8n.nodes = nodeDistPaths;
pkg.n8n.credentials = [`dist/credentials/${CREDENTIAL_CLASS}.credentials.js`];
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
console.log('wired package.json: n8n.nodes + n8n.credentials + metadata + keywords');

console.log('\nGenerated files:');
for (const f of written) console.log(`  ${f}`);
if (iconPair) {
	console.log(
		`  icons: ${iconExt} light${iconPair.dark ? ' + dark' : ''} copied to ${Object.keys(TAG_NODES).length} node dirs + credential`,
	);
}
console.log('\nOperations per node:');
for (const [k, v] of Object.entries(totals)) console.log(`  ${k}: ${v}`);
const totalOps = Object.values(totals).reduce((a, b) => a + b, 0);
console.log(
	`\nTOTAL: ${Object.keys(TAG_NODES).length} nodes, ${totalOps} operations (from ${SPEC_PATH})`,
);
