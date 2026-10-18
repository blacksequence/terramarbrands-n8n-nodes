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
	listWarehouses: {
		method: 'GET',
		path: '/getAlmacenes',
		query: {
			usuarioOK: ['usuarioOK', true],
			folioPedido: ['folioPedido', true],
			almacenSeleccionado: ['almacenSeleccionado', true],
			dominio: ['dominio', true],
			origen: ['origen', true],
		},
		headers: {},
		body: {},
		bodyJson: {},
		isPublic: false,
	},
	listCartCategories: {
		method: 'GET',
		path: '/getCategorias',
		query: {
			accion: ['accion', true],
			usuarioOK: ['usuarioOK', true],
			folioPedido: ['folioPedido', true],
			almacenSeleccionado: ['almacenSeleccionado', true],
			origen: ['origen', false],
			idioma: ['idioma', false],
		},
		headers: {
			dominio: ['dominio', false],
		},
		body: {},
		bodyJson: {},
		isPublic: false,
	},
	listCartProducts: {
		method: 'GET',
		path: '/getProductos',
		query: {
			accion: ['accion', true],
			usuarioOK: ['usuarioOK', true],
			folioPedido: ['folioPedido', true],
			almacen: ['almacen', true],
			categoria: ['categoria', true],
			idioma: ['idioma', false],
		},
		headers: {},
		body: {},
		bodyJson: {},
		isPublic: false,
	},
	addToCart: {
		method: 'POST',
		path: '/getAgregarAlCarrito',
		query: {},
		headers: {},
		body: {
			accion: ['accion', true],
			usuarioOK: ['usuarioOK', true],
			folioPedido: ['folioPedido', true],
			almacen: ['almacen', true],
			categoria: ['categoria', true],
			caller: ['caller', false],
			clave: ['clave', true],
			cantidad: ['cantidad', true],
			numeroLinea: ['numeroLinea', false],
			textoProdSeleccion: ['textoProdSeleccion', false],
			idioma: ['idioma', false],
			origen: ['origen', false],
		},
		bodyJson: {},
		isPublic: false,
	},
	recycleCart: {
		method: 'GET',
		path: '/getReciclar',
		query: {
			folioPedido: ['folioPedido', true],
			accion: ['accion', true],
			reciclar: ['reciclar', true],
			usuarioOk: ['usuarioOk', true],
		},
		headers: {},
		body: {},
		bodyJson: {},
		isPublic: false,
	},
	acceptOrder: {
		method: 'POST',
		path: '/postAceptarPedido',
		query: {},
		headers: {},
		body: {
			idPedidoAplicar: ['idPedidoAplicar', true],
			almacen: ['almacen', true],
			idioma: ['idioma', true],
		},
		bodyJson: {},
		isPublic: false,
	},
};

export class TerramarBrandsCart implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Terramar Brands Cart',
		name: 'terramarBrandsCart',
		icon: { light: 'file:TerramarBrandsCart.svg', dark: 'file:TerramarBrandsCart.dark.svg' },
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description: 'Consultant cart (Carrito) on the Terramar Brands API: warehouses, categories, products, add to cart, recycle and accept orders.',
		defaults: {
			name: 'Terramar Brands Cart',
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
				default: 'articulos',
				description: 'The area of the Terramar Brands API to work with',
				options: [
					{
						name: 'Artículos Del Carrito',
						value: 'articulos',
					},
					{
						name: 'Consulta',
						value: 'consulta',
					},
					{
						name: 'Pedido',
						value: 'pedido',
					},
				],
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				required: true,
				default: 'recycleCart',
				displayOptions: {
					show: {
						resource: ['articulos'],
					},
				},
				options: [
					{
						name: 'Acción De Reciclaje Del Carrito',
						value: 'recycleCart',
						description: 'GET /getReciclar',
						action: 'Terramar brands cart acci n de reciclaje del carrito',
					},
					{
						name: 'Agregar Producto Al Carrito',
						value: 'addToCart',
						description: 'POST /getAgregarAlCarrito',
						action: 'Terramar brands cart agregar producto al carrito',
					},
				],
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				required: true,
				default: 'listWarehouses',
				displayOptions: {
					show: {
						resource: ['consulta'],
					},
				},
				options: [
					{
						name: 'Almacenes Disponibles Del Pedido',
						value: 'listWarehouses',
						description: 'GET /getAlmacenes',
						action: 'Terramar brands cart almacenes disponibles del pedido',
					},
					{
						name: 'Árbol De categorías Del Carrito',
						value: 'listCartCategories',
						description: 'GET /getCategorias',
						action: 'Terramar brands cart rbol de categor as del carrito',
					},
					{
						name: 'Productos De Una subcategoría Del Carrito',
						value: 'listCartProducts',
						description: 'GET /getProductos',
						action: 'Terramar brands cart productos de una subcategor a del carrito',
					},
				],
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				required: true,
				default: 'acceptOrder',
				displayOptions: {
					show: {
						resource: ['pedido'],
					},
				},
				options: [
					{
						name: 'Aceptar / Aplicar Pedido',
						value: 'acceptOrder',
						description: 'POST /postAceptarPedido',
						action: 'Terramar brands cart aceptar aplicar pedido',
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
						resource: ['consulta'],
						operation: ['listWarehouses'],
					},
				},
				default: '',
			},
			{
				displayName: 'Folio Pedido',
				name: 'folioPedido',
				type: 'string',
				required: true,
				description: 'Folio del pedido abierto de la consultora (devuelto por /getLogin). Requerido por las operaciones de carrito.',
				displayOptions: {
					show: {
						resource: ['consulta'],
						operation: ['listWarehouses'],
					},
				},
				default: '',
			},
			{
				displayName: 'Almacen Seleccionado',
				name: 'almacenSeleccionado',
				type: 'string',
				required: true,
				description: 'Almacén seleccionado',
				displayOptions: {
					show: {
						resource: ['consulta'],
						operation: ['listWarehouses'],
					},
				},
				default: '',
			},
			{
				displayName: 'Dominio',
				name: 'dominio',
				type: 'string',
				required: true,
				description: 'Dominio del sitio (p. ej. carrito.terramarbrands.com.mx)',
				displayOptions: {
					show: {
						resource: ['consulta'],
						operation: ['listWarehouses'],
					},
				},
				default: 'carrito.terramarbrands.com.mx',
			},
			{
				displayName: 'Origen',
				name: 'origen',
				type: 'string',
				required: true,
				description: 'Origen fijo',
				displayOptions: {
					show: {
						resource: ['consulta'],
						operation: ['listWarehouses'],
					},
				},
				default: '',
			},
			{
				displayName: 'Accion',
				name: 'accion',
				type: 'string',
				required: true,
				description: 'Fijo "ALMAOK"',
				displayOptions: {
					show: {
						resource: ['consulta'],
						operation: ['listCartCategories'],
					},
				},
				default: 'ALMAOK',
			},
			{
				displayName: 'Usuario OK',
				name: 'usuarioOK',
				type: 'string',
				required: true,
				description: 'Kit de la consultora (usuario sin el prefijo "TE")',
				displayOptions: {
					show: {
						resource: ['consulta'],
						operation: ['listCartCategories'],
					},
				},
				default: '',
			},
			{
				displayName: 'Folio Pedido',
				name: 'folioPedido',
				type: 'string',
				required: true,
				description: 'Folio del pedido abierto de la consultora (devuelto por /getLogin). Requerido por las operaciones de carrito.',
				displayOptions: {
					show: {
						resource: ['consulta'],
						operation: ['listCartCategories'],
					},
				},
				default: '',
			},
			{
				displayName: 'Almacen Seleccionado',
				name: 'almacenSeleccionado',
				type: 'string',
				required: true,
				description: 'Almacén del pedido',
				displayOptions: {
					show: {
						resource: ['consulta'],
						operation: ['listCartCategories'],
					},
				},
				default: '',
			},
			{
				displayName: 'Origen',
				name: 'origen',
				type: 'string',
				description: 'Origen fijo',
				displayOptions: {
					show: {
						resource: ['consulta'],
						operation: ['listCartCategories'],
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
						resource: ['consulta'],
						operation: ['listCartCategories'],
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
				displayName: 'Dominio',
				name: 'dominio',
				type: 'string',
				description: 'Dominio del sitio (la SPA lo envía; los scrapers no)',
				displayOptions: {
					show: {
						resource: ['consulta'],
						operation: ['listCartCategories'],
					},
				},
				default: 'carrito.terramarbrands.com.mx',
			},
			{
				displayName: 'Accion',
				name: 'accion',
				type: 'string',
				required: true,
				description: 'Fijo "desplegar"',
				displayOptions: {
					show: {
						resource: ['consulta'],
						operation: ['listCartProducts'],
					},
				},
				default: 'desplegar',
			},
			{
				displayName: 'Usuario OK',
				name: 'usuarioOK',
				type: 'string',
				required: true,
				description: 'Kit de la consultora (usuario sin el prefijo "TE")',
				displayOptions: {
					show: {
						resource: ['consulta'],
						operation: ['listCartProducts'],
					},
				},
				default: '',
			},
			{
				displayName: 'Folio Pedido',
				name: 'folioPedido',
				type: 'string',
				required: true,
				description: 'Folio del pedido abierto de la consultora (devuelto por /getLogin). Requerido por las operaciones de carrito.',
				displayOptions: {
					show: {
						resource: ['consulta'],
						operation: ['listCartProducts'],
					},
				},
				default: '',
			},
			{
				displayName: 'Almacen',
				name: 'almacen',
				type: 'string',
				required: true,
				description: 'Almacén del pedido',
				displayOptions: {
					show: {
						resource: ['consulta'],
						operation: ['listCartProducts'],
					},
				},
				default: '',
			},
			{
				displayName: 'Categoria',
				name: 'categoria',
				type: 'string',
				required: true,
				description: 'Número de subcategoría',
				displayOptions: {
					show: {
						resource: ['consulta'],
						operation: ['listCartProducts'],
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
						resource: ['consulta'],
						operation: ['listCartProducts'],
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
				displayName: 'Accion',
				name: 'accion',
				type: 'string',
				required: true,
				description: 'Fijo "ORDENAR"',
				displayOptions: {
					show: {
						resource: ['articulos'],
						operation: ['addToCart'],
					},
				},
				default: '',
			},
			{
				displayName: 'Usuario OK',
				name: 'usuarioOK',
				type: 'string',
				required: true,
				description: 'Kit de la consultora',
				displayOptions: {
					show: {
						resource: ['articulos'],
						operation: ['addToCart'],
					},
				},
				default: '',
			},
			{
				displayName: 'Folio Pedido',
				name: 'folioPedido',
				type: 'string',
				required: true,
				description: 'Folio del pedido',
				displayOptions: {
					show: {
						resource: ['articulos'],
						operation: ['addToCart'],
					},
				},
				default: '',
			},
			{
				displayName: 'Almacen',
				name: 'almacen',
				type: 'string',
				required: true,
				description: 'Almacén',
				displayOptions: {
					show: {
						resource: ['articulos'],
						operation: ['addToCart'],
					},
				},
				default: '',
			},
			{
				displayName: 'Categoria',
				name: 'categoria',
				type: 'string',
				required: true,
				description: 'Subcategoría',
				displayOptions: {
					show: {
						resource: ['articulos'],
						operation: ['addToCart'],
					},
				},
				default: '',
			},
			{
				displayName: 'Caller',
				name: 'caller',
				type: 'string',
				description: 'Pantalla que llama ("consultarCart")',
				displayOptions: {
					show: {
						resource: ['articulos'],
						operation: ['addToCart'],
					},
				},
				default: '',
			},
			{
				displayName: 'Clave',
				name: 'clave',
				type: 'string',
				required: true,
				description: 'SKU del producto',
				displayOptions: {
					show: {
						resource: ['articulos'],
						operation: ['addToCart'],
					},
				},
				default: '',
			},
			{
				displayName: 'Cantidad',
				name: 'cantidad',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['articulos'],
						operation: ['addToCart'],
					},
				},
				default: '',
			},
			{
				displayName: 'Numero Linea',
				name: 'numeroLinea',
				type: 'string',
				description: 'Renglón del carrito (vacío para nuevo)',
				displayOptions: {
					show: {
						resource: ['articulos'],
						operation: ['addToCart'],
					},
				},
				default: '',
			},
			{
				displayName: 'Texto Prod Seleccion',
				name: 'textoProdSeleccion',
				type: 'string',
				description: 'Texto del producto seleccionado',
				displayOptions: {
					show: {
						resource: ['articulos'],
						operation: ['addToCart'],
					},
				},
				default: '',
			},
			{
				displayName: 'Idioma',
				name: 'idioma',
				type: 'string',
				description: '0 español / 1 inglés',
				displayOptions: {
					show: {
						resource: ['articulos'],
						operation: ['addToCart'],
					},
				},
				default: '',
			},
			{
				displayName: 'Origen',
				name: 'origen',
				type: 'string',
				description: 'Fijo "CARRITONUE"',
				displayOptions: {
					show: {
						resource: ['articulos'],
						operation: ['addToCart'],
					},
				},
				default: '',
			},
			{
				displayName: 'Folio Pedido',
				name: 'folioPedido',
				type: 'string',
				required: true,
				description: 'Folio del pedido',
				displayOptions: {
					show: {
						resource: ['articulos'],
						operation: ['recycleCart'],
					},
				},
				default: '',
			},
			{
				displayName: 'Accion',
				name: 'accion',
				type: 'string',
				required: true,
				description: 'Acción de reciclaje',
				displayOptions: {
					show: {
						resource: ['articulos'],
						operation: ['recycleCart'],
					},
				},
				default: '',
			},
			{
				displayName: 'Reciclar',
				name: 'reciclar',
				type: 'string',
				required: true,
				description: 'Bandera de reciclaje',
				displayOptions: {
					show: {
						resource: ['articulos'],
						operation: ['recycleCart'],
					},
				},
				default: '',
			},
			{
				displayName: 'Usuario OK',
				name: 'usuarioOk',
				type: 'string',
				required: true,
				description: 'Kit de la consultora',
				displayOptions: {
					show: {
						resource: ['articulos'],
						operation: ['recycleCart'],
					},
				},
				default: '',
			},
			{
				displayName: 'ID Pedido Aplicar',
				name: 'idPedidoAplicar',
				type: 'string',
				required: true,
				description: 'Pedido a aplicar',
				displayOptions: {
					show: {
						resource: ['pedido'],
						operation: ['acceptOrder'],
					},
				},
				default: '',
			},
			{
				displayName: 'Almacen',
				name: 'almacen',
				type: 'string',
				required: true,
				description: 'Almacén',
				displayOptions: {
					show: {
						resource: ['pedido'],
						operation: ['acceptOrder'],
					},
				},
				default: '',
			},
			{
				displayName: 'Idioma',
				name: 'idioma',
				type: 'string',
				required: true,
				description: '0 español / 1 inglés',
				displayOptions: {
					show: {
						resource: ['pedido'],
						operation: ['acceptOrder'],
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
