import {
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

const OPS: Record<string, TerramarBrandsOpSpec> = {
	getBranchStatus: {
		method: 'GET',
		path: '/getBranch',
		query: {
			usuarioOK: ['usuarioOK', true],
			opcion: ['opcion', true],
			anio: ['anio', true],
			mes: ['mes', true],
			dominio: ['dominio', true],
		},
		headers: {},
		body: {},
		bodyJson: {},
		isPublic: false,
	},
	listLineageKits: {
		method: 'GET',
		path: '/getEstadoCuenta_Linaje',
		query: {
			usuarioOK: ['usuarioOK', true],
			pageno: ['pageno', true],
		},
		headers: {},
		body: {},
		bodyJson: {},
		isPublic: false,
	},
	requestBranchActive: {
		method: 'GET',
		path: '/getBranchSolicitar',
		query: {
			accion: ['accion', true],
			usuarioOK: ['usuarioOK', true],
			idioma: ['idioma', false],
			anioMes: ['anioMes', true],
		},
		headers: {},
		body: {},
		bodyJson: {},
		isPublic: false,
	},
	requestBranchInactive: {
		method: 'GET',
		path: '/getBranchSolicitar2',
		query: {
			accion: ['accion', true],
			usuarioOK: ['usuarioOK', true],
			idioma: ['idioma', false],
			anioMes: ['anioMes', true],
		},
		headers: {},
		body: {},
		bodyJson: {},
		isPublic: false,
	},
};

export class TerramarBrandsLineage implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Terramar Brands Lineage',
		name: 'terramarBrandsLineage',
		icon: { light: 'file:TerramarBrandsLineage.svg', dark: 'file:TerramarBrandsLineage.dark.svg' },
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Lineage (Linaje) operations on the Terramar Brands API: branch status, lineage kits and branch requests.',
		defaults: {
			name: 'Terramar Brands Lineage',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'terramarBrandsApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Endpoint',
				name: 'endpoint',
				type: 'string',
				required: true,
				default: 'https://terramarbrands.mx/wsTerramarV2/Service1.svc',
				placeholder: 'https://terramarbrands.mx/wsTerramarV2/Service1.svc',
				description: 'Base URL of the Terramar Brands API (wsTerramarV2 Service1.svc). Change it to point the node at another environment.',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				required: true,
				default: 'getBranchStatus',
				options: [
					{
						name: 'Estado De Rama Por Año/mes',
						value: 'getBranchStatus',
						description: 'GET /getBranch',
						action: 'Terramar brands lineage estado de rama por a o mes',
					},
					{
						name: 'Kits Del Linaje (Paginado)',
						value: 'listLineageKits',
						description: 'GET /getEstadoCuenta_Linaje',
						action: 'Terramar brands lineage kits del linaje paginado',
					},
					{
						name: 'Solicitar Linaje (Rama Activa)',
						value: 'requestBranchActive',
						description: 'GET /getBranchSolicitar',
						action: 'Terramar brands lineage solicitar linaje rama activa',
					},
					{
						name: 'Solicitar Linaje (Rama Inactiva)',
						value: 'requestBranchInactive',
						description: 'GET /getBranchSolicitar2',
						action: 'Terramar brands lineage solicitar linaje rama inactiva',
					},
				],
			},
			{
				displayName: 'Usuario OK',
				name: 'usuarioOK',
				type: 'string',
				required: true,
				description: 'Kit de la consultora (usuario sin el prefijo "TE")',
				displayOptions: {
					show: {
						operation: ['getBranchStatus'],
					},
				},
				default: '',
			},
			{
				displayName: 'Opcion',
				name: 'opcion',
				type: 'string',
				required: true,
				description: 'Fijo "PREBRANCH"',
				displayOptions: {
					show: {
						operation: ['getBranchStatus'],
					},
				},
				default: 'PREBRANCH',
			},
			{
				displayName: 'Anio',
				name: 'anio',
				type: 'string',
				required: true,
				description: 'Año (4 dígitos)',
				displayOptions: {
					show: {
						operation: ['getBranchStatus'],
					},
				},
				default: '',
			},
			{
				displayName: 'Mes',
				name: 'mes',
				type: 'string',
				required: true,
				description: 'Mes (1–12)',
				displayOptions: {
					show: {
						operation: ['getBranchStatus'],
					},
				},
				default: '',
			},
			{
				displayName: 'Dominio',
				name: 'dominio',
				type: 'string',
				required: true,
				description: 'Dominio del sitio',
				displayOptions: {
					show: {
						operation: ['getBranchStatus'],
					},
				},
				default: 'carrito.terramarbrands.com.mx',
			},
			{
				displayName: 'Usuario OK',
				name: 'usuarioOK',
				type: 'string',
				required: true,
				description: 'Kit de la consultora (usuario sin el prefijo "TE")',
				displayOptions: {
					show: {
						operation: ['listLineageKits'],
					},
				},
				default: '',
			},
			{
				displayName: 'Pageno',
				name: 'pageno',
				type: 'string',
				required: true,
				description: 'Página (1-based)',
				displayOptions: {
					show: {
						operation: ['listLineageKits'],
					},
				},
				default: '',
			},
			{
				displayName: 'Accion',
				name: 'accion',
				type: 'string',
				required: true,
				description: 'Acción de la solicitud',
				displayOptions: {
					show: {
						operation: ['requestBranchActive'],
					},
				},
				default: '',
			},
			{
				displayName: 'Usuario OK',
				name: 'usuarioOK',
				type: 'string',
				required: true,
				description: 'Kit de la consultora (usuario sin el prefijo "TE")',
				displayOptions: {
					show: {
						operation: ['requestBranchActive'],
					},
				},
				default: '',
			},
			{
				displayName: 'Idioma',
				name: 'idioma',
				type: 'options',
				description: 'Idioma: 0 = español, 1 = inglés',
				displayOptions: {
					show: {
						operation: ['requestBranchActive'],
					},
				},
				default: '0',
				options: [
					{
						name: 'Español',
						value: '0',
					},
					{
						name: 'Inglés',
						value: '1',
					},
				],
			},
			{
				displayName: 'Anio Mes',
				name: 'anioMes',
				type: 'string',
				required: true,
				description: 'Periodo (aaaamm)',
				displayOptions: {
					show: {
						operation: ['requestBranchActive'],
					},
				},
				default: '',
			},
			{
				displayName: 'Accion',
				name: 'accion',
				type: 'string',
				required: true,
				description: 'Acción de la solicitud',
				displayOptions: {
					show: {
						operation: ['requestBranchInactive'],
					},
				},
				default: '',
			},
			{
				displayName: 'Usuario OK',
				name: 'usuarioOK',
				type: 'string',
				required: true,
				description: 'Kit de la consultora (usuario sin el prefijo "TE")',
				displayOptions: {
					show: {
						operation: ['requestBranchInactive'],
					},
				},
				default: '',
			},
			{
				displayName: 'Idioma',
				name: 'idioma',
				type: 'options',
				description: 'Idioma: 0 = español, 1 = inglés',
				displayOptions: {
					show: {
						operation: ['requestBranchInactive'],
					},
				},
				default: '0',
				options: [
					{
						name: 'Español',
						value: '0',
					},
					{
						name: 'Inglés',
						value: '1',
					},
				],
			},
			{
				displayName: 'Anio Mes',
				name: 'anioMes',
				type: 'string',
				required: true,
				description: 'Periodo (aaaamm)',
				displayOptions: {
					show: {
						operation: ['requestBranchInactive'],
					},
				},
				default: '',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const operation = this.getNodeParameter('operation', i) as string;
			const opSpec = OPS[operation];
			if (!opSpec) {
				throw new NodeOperationError(this.getNode(), `Unknown operation "${operation}"`, {
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
