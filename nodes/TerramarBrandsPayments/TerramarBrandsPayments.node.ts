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
	getPaymentToken: {
		method: 'GET',
		path: '/GetTokenIrelandPay',
		query: {
			idioma: ['idioma', false],
			amount: ['amount', true],
			orderNumber: ['orderNumber', true],
		},
		headers: {},
		body: {},
		bodyJson: {},
		isPublic: false,
	},
	completePayment: {
		method: 'GET',
		path: '/GetPaymentIrelandPay',
		query: {
			orderToken: ['order_token', true],
			idioma: ['idioma', false],
		},
		headers: {},
		body: {},
		bodyJson: {},
		isPublic: false,
	},
};

export class TerramarBrandsPayments implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Terramar Brands Payments',
		name: 'terramarBrandsPayments',
		icon: { light: 'file:TerramarBrandsPayments.svg', dark: 'file:TerramarBrandsPayments.dark.svg' },
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Hosted payments (Pagos, ProPay) on the Terramar Brands API: create a payment token and confirm a payment.',
		defaults: {
			name: 'Terramar Brands Payments',
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
				default: 'completePayment',
				options: [
					{
						name: 'Confirmar Pago Y Generar Nuevo Pedido',
						value: 'completePayment',
						description: 'GET /GetPaymentIrelandPay',
						action: 'Terramar brands payments confirmar pago y generar nuevo pedido',
					},
					{
						name: 'Token De Pago Hospedado (ProPay)',
						value: 'getPaymentToken',
						description: 'GET /GetTokenIrelandPay',
						action: 'Terramar brands payments token de pago hospedado pro pay',
					},
				],
			},
			{
				displayName: 'Idioma',
				name: 'idioma',
				type: 'options',
				description: 'Idioma: 0 = español, 1 = inglés',
				displayOptions: {
					show: {
						operation: ['getPaymentToken'],
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
				displayName: 'Amount',
				name: 'amount',
				type: 'string',
				required: true,
				description: 'Monto a pagar',
				displayOptions: {
					show: {
						operation: ['getPaymentToken'],
					},
				},
				default: '',
			},
			{
				displayName: 'Order Number',
				name: 'orderNumber',
				type: 'string',
				required: true,
				description: 'Número de pedido a pagar',
				displayOptions: {
					show: {
						operation: ['getPaymentToken'],
					},
				},
				default: '',
			},
			{
				displayName: 'Order Token',
				name: 'orderToken',
				type: 'string',
				typeOptions: { password: true },
				required: true,
				description: 'Token de la orden de pago (iframe ProPay)',
				displayOptions: {
					show: {
						operation: ['completePayment'],
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
						operation: ['completePayment'],
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
