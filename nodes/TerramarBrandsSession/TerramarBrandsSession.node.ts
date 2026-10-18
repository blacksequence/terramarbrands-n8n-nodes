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
	loginConsultora: {
		method: 'POST',
		path: '/getConsultoriaLogin',
		query: {},
		headers: {
			seccion: ['seccion', true],
		},
		body: {
			usuario: ['usuario', true],
			claveAcceso: ['claveAcceso', true],
			origen: ['origen', true],
		},
		bodyJson: {},
		isPublic: true,
	},
	getSessionInfo: {
		method: 'GET',
		path: '/getLogin',
		query: {
			usuario: ['usuario', true],
			claveAcceso: ['claveAcceso', true],
			origen: ['origen', true],
			reabrirPedido: ['reabrirPedido', true],
		},
		headers: {},
		body: {},
		bodyJson: {},
		isPublic: false,
	},
	forgotPassword: {
		method: 'GET',
		path: '/getOlvidoSuPwd',
		query: {
			usuario: ['usuario', true],
			email: ['email', true],
		},
		headers: {},
		body: {},
		bodyJson: {},
		isPublic: true,
	},
};

export class TerramarBrandsSession implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Terramar Brands Session',
		name: 'terramarBrandsSession',
		icon: { light: 'file:TerramarBrandsSession.svg', dark: 'file:TerramarBrandsSession.dark.svg' },
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Session (Sesión) operations of the Terramar Brands API: consultant login, open-session restore and password reminder.',
		defaults: {
			name: 'Terramar Brands Session',
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
				default: 'loginConsultora',
				options: [
					{
						name: 'Autenticar Consultora Y Obtener Token',
						value: 'loginConsultora',
						description: 'POST /getConsultoriaLogin',
						action: 'Terramar brands session autenticar consultora y obtener token',
					},
					{
						name: 'Restaurar Sesión Y Datos Del Pedido Abierto',
						value: 'getSessionInfo',
						description: 'GET /getLogin',
						action: 'Terramar brands session restaurar sesi n y datos del pedido abierto',
					},
					{
						name: 'Solicitar Recordatorio De Contraseña',
						value: 'forgotPassword',
						description: 'GET /getOlvidoSuPwd',
						action: 'Terramar brands session solicitar recordatorio de contrase a',
					},
				],
			},
			{
				displayName: 'Seccion',
				name: 'seccion',
				type: 'string',
				required: true,
				description: 'Sección del portal; debe ser "CONSULTORIA"',
				displayOptions: {
					show: {
						operation: ['loginConsultora'],
					},
				},
				default: 'CONSULTORIA',
			},
			{
				displayName: 'Usuario',
				name: 'usuario',
				type: 'string',
				required: true,
				description: 'Usuario (patrón TE + 7 dígitos)',
				displayOptions: {
					show: {
						operation: ['loginConsultora'],
					},
				},
				default: '',
			},
			{
				displayName: 'Clave Acceso',
				name: 'claveAcceso',
				type: 'string',
				required: true,
				description: 'Contraseña',
				displayOptions: {
					show: {
						operation: ['loginConsultora'],
					},
				},
				default: '',
			},
			{
				displayName: 'Origen',
				name: 'origen',
				type: 'string',
				required: true,
				description: 'Origen fijo de la SPA de carrito',
				displayOptions: {
					show: {
						operation: ['loginConsultora'],
					},
				},
				default: '',
			},
			{
				displayName: 'Usuario',
				name: 'usuario',
				type: 'string',
				required: true,
				description: 'Vacío: la sesión se identifica por el token',
				displayOptions: {
					show: {
						operation: ['getSessionInfo'],
					},
				},
				default: '',
			},
			{
				displayName: 'Clave Acceso',
				name: 'claveAcceso',
				type: 'string',
				required: true,
				description: 'Vacío',
				displayOptions: {
					show: {
						operation: ['getSessionInfo'],
					},
				},
				default: '',
			},
			{
				displayName: 'Origen',
				name: 'origen',
				type: 'string',
				required: true,
				description: 'Origen fijo de la SPA',
				displayOptions: {
					show: {
						operation: ['getSessionInfo'],
					},
				},
				default: '',
			},
			{
				displayName: 'Reabrir Pedido',
				name: 'reabrirPedido',
				type: 'options',
				required: true,
				description: 'S reabre el pedido anterior; N lo cierra',
				displayOptions: {
					show: {
						operation: ['getSessionInfo'],
					},
				},
				default: 'S',
				options: [
					{
						name: 'N — cerrar el pedido anterior',
						value: 'N',
					},
					{
						name: 'S — reabrir el pedido anterior',
						value: 'S',
					},
				],
			},
			{
				displayName: 'Usuario',
				name: 'usuario',
				type: 'string',
				required: true,
				description: 'Usuario en mayúsculas',
				displayOptions: {
					show: {
						operation: ['forgotPassword'],
					},
				},
				default: '',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				required: true,
				description: 'Correo de la consultora',
				displayOptions: {
					show: {
						operation: ['forgotPassword'],
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
