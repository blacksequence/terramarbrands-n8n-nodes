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
	listAwards: {
		method: 'GET',
		path: '/getPremios',
		query: {
			kit: ['Kit', true],
		},
		headers: {},
		body: {},
		bodyJson: {},
		isPublic: false,
	},
	selectAward: {
		method: 'POST',
		path: '/postPremios',
		query: {},
		headers: {},
		body: {
			kit: ['kit', false],
		},
		bodyJson: {
			premioarr1: ['premioarr1', true],
		},
		isPublic: false,
	},
	getBonosEtapaUno: {
		method: 'GET',
		path: '/GetBonosEtapaUno',
		query: {},
		headers: {},
		body: {},
		bodyJson: {},
		isPublic: false,
	},
	getBonosEtapaDos: {
		method: 'GET',
		path: '/GetBonosEtapaDos',
		query: {},
		headers: {},
		body: {},
		bodyJson: {},
		isPublic: false,
	},
	getSiValeCard: {
		method: 'GET',
		path: '/GetSiVale',
		query: {},
		headers: {},
		body: {},
		bodyJson: {},
		isPublic: false,
	},
};

export class TerramarBrandsAwards implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Terramar Brands Awards',
		name: 'terramarBrandsAwards',
		icon: { light: 'file:TerramarBrandsAwards.svg', dark: 'file:TerramarBrandsAwards.dark.svg' },
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Awards and bonuses (Premios y bonos) on the Terramar Brands API: period awards, stage-one and stage-two bonuses and SiVale card status.',
		defaults: {
			name: 'Terramar Brands Awards',
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
				default: 'getBonosEtapaDos',
				options: [
					{
						name: 'Bonos Etapa Dos',
						value: 'getBonosEtapaDos',
						description: 'GET /GetBonosEtapaDos',
						action: 'Terramar brands awards bonos etapa dos',
					},
					{
						name: 'Bonos Etapa Uno',
						value: 'getBonosEtapaUno',
						description: 'GET /GetBonosEtapaUno',
						action: 'Terramar brands awards bonos etapa uno',
					},
					{
						name: 'Elegir Premio Del Periodo',
						value: 'selectAward',
						description: 'POST /postPremios',
						action: 'Terramar brands awards elegir premio del periodo',
					},
					{
						name: 'Estado De La Tarjeta SiVale',
						value: 'getSiValeCard',
						description: 'GET /GetSiVale',
						action: 'Terramar brands awards estado de la tarjeta si vale',
					},
					{
						name: 'Premios Del Periodo Del Kit',
						value: 'listAwards',
						description: 'GET /getPremios',
						action: 'Terramar brands awards premios del periodo del kit',
					},
				],
			},
			{
				displayName: 'Kit',
				name: 'kit',
				type: 'string',
				required: true,
				description: 'Kit de la consultora (usuarioOK)',
				displayOptions: {
					show: {
						operation: ['listAwards'],
					},
				},
				default: '',
			},
			{
				displayName: 'Kit',
				name: 'kit',
				type: 'string',
				description: 'Kit (vacío en la SPA)',
				displayOptions: {
					show: {
						operation: ['selectAward'],
					},
				},
				default: '',
			},
			{
				displayName: 'Premioarr1',
				name: 'premioarr1',
				type: 'json',
				required: true,
				description: 'Renglones premio/elegido',
				displayOptions: {
					show: {
						operation: ['selectAward'],
					},
				},
				default: '[]',
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
