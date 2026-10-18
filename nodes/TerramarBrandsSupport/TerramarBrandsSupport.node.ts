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
	listAtenciones: {
		method: 'GET',
		path: '/getMisAtenciones',
		query: {
			orderby: ['orderby', false],
			order: ['order', false],
		},
		headers: {},
		body: {},
		bodyJson: {},
		isPublic: false,
	},
	listAtencionComments: {
		method: 'GET',
		path: '/getMisAtencionesComentarios',
		query: {
			folio: ['folio', true],
		},
		headers: {},
		body: {},
		bodyJson: {},
		isPublic: false,
	},
	createAtencion: {
		method: 'POST',
		path: '/postAtencionesAlta',
		query: {},
		headers: {},
		body: {
			comentarios: ['comentarios', true],
			imagenBase64: ['imagenBase64', false],
			kitaten: ['kitaten', true],
			principal: ['principal', true],
			principalIndex: ['principalIndex', false],
			subDescri: ['subDescri', false],
			subIndex: ['subIndex', false],
		},
		bodyJson: {},
		isPublic: false,
	},
	addAtencionComment: {
		method: 'POST',
		path: '/postAtencionesAltaComentario',
		query: {},
		headers: {},
		body: {
			tipo: ['tipo', false],
			comentarios: ['comentarios', true],
			folio: ['folio', true],
			imagenBase64: ['imagenBase64', false],
		},
		bodyJson: {},
		isPublic: false,
	},
};

export class TerramarBrandsSupport implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Terramar Brands Support',
		name: 'terramarBrandsSupport',
		icon: { light: 'file:TerramarBrandsSupport.svg', dark: 'file:TerramarBrandsSupport.dark.svg' },
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Support tickets (Atenciones) on the Terramar Brands API: list tickets and comments, open a ticket or add a comment.',
		defaults: {
			name: 'Terramar Brands Support',
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
				default: 'createAtencion',
				options: [
					{
						name: 'Abrir Ticket De Atención',
						value: 'createAtencion',
						description: 'POST /postAtencionesAlta',
						action: 'Terramar brands support abrir ticket de atenci n',
					},
					{
						name: 'Comentar Un Ticket',
						value: 'addAtencionComment',
						description: 'POST /postAtencionesAltaComentario',
						action: 'Terramar brands support comentar un ticket',
					},
					{
						name: 'Comentarios De Un Ticket',
						value: 'listAtencionComments',
						description: 'GET /getMisAtencionesComentarios',
						action: 'Terramar brands support comentarios de un ticket',
					},
					{
						name: 'Tickets De Atención',
						value: 'listAtenciones',
						description: 'GET /getMisAtenciones',
						action: 'Terramar brands support tickets de atenci n',
					},
				],
			},
			{
				displayName: 'Orderby',
				name: 'orderby',
				type: 'string',
				description: 'Campo de orden ("folio")',
				displayOptions: {
					show: {
						operation: ['listAtenciones'],
					},
				},
				default: '',
			},
			{
				displayName: 'Order',
				name: 'order',
				type: 'string',
				description: 'Dirección ("desc"/"asc")',
				displayOptions: {
					show: {
						operation: ['listAtenciones'],
					},
				},
				default: '',
			},
			{
				displayName: 'Folio',
				name: 'folio',
				type: 'string',
				required: true,
				description: 'Folio del ticket',
				displayOptions: {
					show: {
						operation: ['listAtencionComments'],
					},
				},
				default: '',
			},
			{
				displayName: 'Comentarios',
				name: 'comentarios',
				type: 'string',
				required: true,
				description: 'Descripción del problema',
				displayOptions: {
					show: {
						operation: ['createAtencion'],
					},
				},
				default: '',
			},
			{
				displayName: 'Imagen Base64',
				name: 'imagenBase64',
				type: 'string',
				description: 'Imagen adjunta en base64 (data URL, segunda parte) o vacío',
				displayOptions: {
					show: {
						operation: ['createAtencion'],
					},
				},
				default: '',
			},
			{
				displayName: 'Kitaten',
				name: 'kitaten',
				type: 'string',
				required: true,
				description: 'Kit afectado',
				displayOptions: {
					show: {
						operation: ['createAtencion'],
					},
				},
				default: '',
			},
			{
				displayName: 'Principal',
				name: 'principal',
				type: 'string',
				required: true,
				description: 'Motivo principal',
				displayOptions: {
					show: {
						operation: ['createAtencion'],
					},
				},
				default: '',
			},
			{
				displayName: 'Principal Index',
				name: 'principalIndex',
				type: 'string',
				description: 'Índice del motivo principal',
				displayOptions: {
					show: {
						operation: ['createAtencion'],
					},
				},
				default: '',
			},
			{
				displayName: 'Sub Descri',
				name: 'subDescri',
				type: 'string',
				description: 'Submotivo',
				displayOptions: {
					show: {
						operation: ['createAtencion'],
					},
				},
				default: '',
			},
			{
				displayName: 'Sub Index',
				name: 'subIndex',
				type: 'string',
				description: 'Índice del submotivo',
				displayOptions: {
					show: {
						operation: ['createAtencion'],
					},
				},
				default: '',
			},
			{
				displayName: 'Tipo',
				name: 'tipo',
				type: 'string',
				description: 'Tipo de comentario ("0")',
				displayOptions: {
					show: {
						operation: ['addAtencionComment'],
					},
				},
				default: '',
			},
			{
				displayName: 'Comentarios',
				name: 'comentarios',
				type: 'string',
				required: true,
				description: 'Comentario',
				displayOptions: {
					show: {
						operation: ['addAtencionComment'],
					},
				},
				default: '',
			},
			{
				displayName: 'Folio',
				name: 'folio',
				type: 'string',
				required: true,
				description: 'Folio del ticket',
				displayOptions: {
					show: {
						operation: ['addAtencionComment'],
					},
				},
				default: '',
			},
			{
				displayName: 'Imagen Base64',
				name: 'imagenBase64',
				type: 'string',
				description: 'Imagen adjunta en base64 o vacío',
				displayOptions: {
					show: {
						operation: ['addAtencionComment'],
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
