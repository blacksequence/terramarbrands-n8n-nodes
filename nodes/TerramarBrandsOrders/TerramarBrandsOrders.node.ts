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
	listInvoices: {
		method: 'GET',
		path: '/getFacturas',
		query: {
			usuarioOK: ['usuarioOK', true],
		},
		headers: {},
		body: {},
		bodyJson: {},
		isPublic: false,
	},
	getInvoices: {
		method: 'GET',
		path: '/GetInvoices',
		query: {
			axo: ['Axo', true],
			mes: ['Mes', true],
			idioma: ['Idioma', true],
		},
		headers: {},
		body: {},
		bodyJson: {},
		isPublic: false,
	},
	listShipments: {
		method: 'GET',
		path: '/getEmbarques',
		query: {
			usuarioOK: ['usuarioOK', true],
			dominio: ['dominio', true],
			idioma: ['idioma', false],
		},
		headers: {},
		body: {},
		bodyJson: {},
		isPublic: false,
	},
	getAccountStatus: {
		method: 'GET',
		path: '/getEstadoCuenta',
		query: {
			usuarioOK: ['usuarioOK', true],
			dominio: ['dominio', true],
		},
		headers: {},
		body: {},
		bodyJson: {},
		isPublic: false,
	},
	listCatalogOrders: {
		method: 'GET',
		path: '/getPedidosCatalogo',
		query: {
			idioma: ['idioma', false],
			axo: ['axo', true],
			mes: ['mes', true],
		},
		headers: {},
		body: {},
		bodyJson: {},
		isPublic: false,
	},
	getCatalogOrderDetail: {
		method: 'GET',
		path: '/getDetallePedidoCatalogo',
		query: {
			idPedido: ['idPedido', true],
			idioma: ['idioma', false],
		},
		headers: {},
		body: {},
		bodyJson: {},
		isPublic: false,
	},
};

export class TerramarBrandsOrders implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Terramar Brands Orders',
		name: 'terramarBrandsOrders',
		icon: { light: 'file:TerramarBrandsOrders.svg', dark: 'file:TerramarBrandsOrders.dark.svg' },
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description: 'Orders and invoicing (Pedidos y facturación) on the Terramar Brands API: invoices, shipments, account status and catalog orders.',
		defaults: {
			name: 'Terramar Brands Orders',
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
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				required: true,
				default: 'envios',
				description: 'The area of the Terramar Brands API to work with',
				options: [
					{
						name: 'Envío',
						value: 'envios',
					},
					{
						name: 'Facturación',
						value: 'facturacion',
					},
					{
						name: 'Pedidos De Catálogo',
						value: 'pedidosCatalogo',
					},
				],
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				required: true,
				default: 'listShipments',
				displayOptions: {
					show: {
						resource: ['envios'],
					},
				},
				options: [
					{
						name: 'Embarques Del Periodo Actual',
						value: 'listShipments',
						description: 'GET /getEmbarques',
						action: 'Embarques del periodo actual',
					},
				],
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				required: true,
				default: 'getAccountStatus',
				displayOptions: {
					show: {
						resource: ['facturacion'],
					},
				},
				options: [
					{
						name: 'Estado De Cuenta (3 Meses)',
						value: 'getAccountStatus',
						description: 'GET /getEstadoCuenta',
						action: 'Estado de cuenta 3 meses',
					},
					{
						name: 'Facturas De La Consultora',
						value: 'listInvoices',
						description: 'GET /getFacturas',
						action: 'Facturas de la consultora',
					},
					{
						name: 'Facturas Por Mes (GetInvoices)',
						value: 'getInvoices',
						description: 'GET /GetInvoices',
						action: 'Facturas por mes get invoices',
					},
				],
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				required: true,
				default: 'getCatalogOrderDetail',
				displayOptions: {
					show: {
						resource: ['pedidosCatalogo'],
					},
				},
				options: [
					{
						name: 'Detalle De Un Pedido De Catálogo Digital',
						value: 'getCatalogOrderDetail',
						description: 'GET /getDetallePedidoCatalogo',
						action: 'Detalle de un pedido de cat logo digital',
					},
					{
						name: 'Pedidos De Catálogo Digital Por Periodo',
						value: 'listCatalogOrders',
						description: 'GET /getPedidosCatalogo',
						action: 'Pedidos de cat logo digital por periodo',
					},
				],
			},
			{
				displayName: 'Usuario OK',
				name: 'usuarioOK',
				type: 'string',
				required: true,
				description:
					'Kit de la consultora (usuarioOK) — solo los dígitos, SIN el prefijo TE (p. ej. 1234567)',
				displayOptions: {
					show: {
						resource: ['facturacion'],
						operation: ['listInvoices'],
					},
				},
				default: '1234567',
			},
			{
				displayName: 'Axo',
				name: 'axo',
				type: 'string',
				required: true,
				description: 'Año (4 dígitos)',
				displayOptions: {
					show: {
						resource: ['facturacion'],
						operation: ['getInvoices'],
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
						resource: ['facturacion'],
						operation: ['getInvoices'],
					},
				},
				default: '',
			},
			{
				displayName: 'Idioma',
				name: 'idioma',
				type: 'options',
				required: true,
				description: 'Idioma de los mensajes: 0 = español, 1 = inglés',
				displayOptions: {
					show: {
						resource: ['facturacion'],
						operation: ['getInvoices'],
					},
				},
				default: '0',
				options: [
					{
						name: '0',
						value: '0',
					},
					{
						name: '1',
						value: '1',
					},
				],
			},
			{
				displayName: 'Usuario OK',
				name: 'usuarioOK',
				type: 'string',
				required: true,
				description:
					'Kit de la consultora (usuarioOK) — solo los dígitos, SIN el prefijo TE (p. ej. 1234567)',
				displayOptions: {
					show: {
						resource: ['envios'],
						operation: ['listShipments'],
					},
				},
				default: '1234567',
			},
			{
				displayName: 'Dominio',
				name: 'dominio',
				type: 'string',
				required: true,
				description: 'Dominio del sitio',
				displayOptions: {
					show: {
						resource: ['envios'],
						operation: ['listShipments'],
					},
				},
				default: 'carrito.terramarbrands.com.mx',
			},
			{
				displayName: 'Idioma',
				name: 'idioma',
				type: 'options',
				description: 'Idioma: 0 = español, 1 = inglés',
				displayOptions: {
					show: {
						resource: ['envios'],
						operation: ['listShipments'],
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
				displayName: 'Usuario OK',
				name: 'usuarioOK',
				type: 'string',
				required: true,
				description:
					'Kit de la consultora (usuarioOK) — solo los dígitos, SIN el prefijo TE (p. ej. 1234567)',
				displayOptions: {
					show: {
						resource: ['facturacion'],
						operation: ['getAccountStatus'],
					},
				},
				default: '1234567',
			},
			{
				displayName: 'Dominio',
				name: 'dominio',
				type: 'string',
				required: true,
				description: 'Dominio del sitio',
				displayOptions: {
					show: {
						resource: ['facturacion'],
						operation: ['getAccountStatus'],
					},
				},
				default: 'carrito.terramarbrands.com.mx',
			},
			{
				displayName: 'Idioma',
				name: 'idioma',
				type: 'options',
				description: 'Idioma: 0 = español, 1 = inglés',
				displayOptions: {
					show: {
						resource: ['pedidosCatalogo'],
						operation: ['listCatalogOrders'],
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
				displayName: 'Axo',
				name: 'axo',
				type: 'string',
				required: true,
				description: 'Año (4 dígitos)',
				displayOptions: {
					show: {
						resource: ['pedidosCatalogo'],
						operation: ['listCatalogOrders'],
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
						resource: ['pedidosCatalogo'],
						operation: ['listCatalogOrders'],
					},
				},
				default: '',
			},
			{
				displayName: 'ID Pedido',
				name: 'idPedido',
				type: 'string',
				required: true,
				description: 'ID del pedido (de /getPedidosCatalogo)',
				displayOptions: {
					show: {
						resource: ['pedidosCatalogo'],
						operation: ['getCatalogOrderDetail'],
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
						resource: ['pedidosCatalogo'],
						operation: ['getCatalogOrderDetail'],
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
