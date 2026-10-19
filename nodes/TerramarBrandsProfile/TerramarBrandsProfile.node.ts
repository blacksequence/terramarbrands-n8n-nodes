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
	readConsultantProfile: {
		method: 'POST',
		path: '/postContratoActualiza',
		query: {},
		headers: {
			dominio: ['Dominio', true],
		},
		body: {
			accion: ['accion', true],
			usuarioOK: ['usuarioOK', true],
		},
		bodyJson: {},
		isPublic: false,
	},
	updateConsultantProfile: {
		method: 'POST',
		path: '/postContratoActualiza',
		query: {},
		headers: {
			dominio: ['Dominio', true],
		},
		body: {
			accion: ['accion', true],
			usuarioOK: ['usuarioOK', true],
		},
		bodyJson: {},
		isPublic: false,
	},
	signContract: {
		method: 'POST',
		path: '/postContrato',
		query: {},
		headers: {},
		body: {
			accion: ['accion', true],
			usuarioOK: ['usuarioOK', true],
			kitPatrocinadora: ['kitPatrocinadora', false],
			pais: ['pais', false],
			nombres: ['nombres', false],
			apellido1: ['apellido1', false],
			apellido2: ['apellido2', false],
			fechaNacAnio: ['fechaNacAnio', false],
			fechaNacMes: ['fechaNacMes', false],
			fechaNacDia: ['fechaNacDia', false],
			genero: ['genero', false],
			direccion1: ['direccion1', false],
			direccion2: ['direccion2', false],
			yCalle: ['yCalle', false],
			ciudad: ['ciudad', false],
			estado: ['estado', false],
			CP: ['CP', false],
			celular: ['celular', false],
			email: ['email', false],
			colonia: ['colonia', false],
			acepto: ['acepto', true],
			idioma: ['idioma', false],
			idPreCont: ['idPreCont', false],
		},
		bodyJson: {},
		isPublic: false,
	},
	getShippingAddress: {
		method: 'GET',
		path: '/getAddress',
		query: {
			kitCode: ['kitCode', true],
		},
		headers: {
			dominio: ['dominio', false],
		},
		body: {},
		bodyJson: {},
		isPublic: false,
	},
	updateShippingAddress: {
		method: 'POST',
		path: '/postActualizarDomicilio',
		query: {},
		headers: {
			dominio: ['dominio', true],
		},
		body: {
			soloPaqueteria: ['soloPaqueteria', false],
			usuarioOK: ['usuarioOK', true],
			folioPedido: ['folioPedido', true],
			estado: ['estado', false],
			calle: ['calle', true],
			colonia: ['colonia', true],
			municipio: ['municipio', true],
			cp: ['cp', true],
			ocurre: ['ocurre', false],
			paqueteria: ['paqueteria', false],
			entreCalle: ['entreCalle', false],
			yCalle: ['yCalle', false],
			domicilioClienteFinalSN: ['domicilioClienteFinalSN', false],
			domicilioClienteFinalNombre: ['domicilioClienteFinalNombre', false],
			domicilioClienteFinalTelefono: ['domicilioClienteFinalTelefono', false],
			numeroExterior: ['numeroExterior', false],
		},
		bodyJson: {},
		isPublic: false,
	},
	changePassword: {
		method: 'POST',
		path: '/postCambiarContrasenia',
		query: {},
		headers: {},
		body: {
			accion: ['accion', true],
			usuarioOK: ['usuarioOK', true],
			contrasenia: ['contrasenia', true],
			contraseniaNueva: ['contraseniaNueva', true],
			contraseniaNueva2: ['contraseniaNueva2', true],
		},
		bodyJson: {},
		isPublic: false,
	},
	validateEmailToken: {
		method: 'POST',
		path: '/PostValidarMail',
		query: {},
		headers: {},
		body: {
			idioma: ['idioma', true],
			token: ['token', true],
		},
		bodyJson: {},
		isPublic: false,
	},
};

export class TerramarBrandsProfile implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Terramar Brands Profile',
		name: 'terramarBrandsProfile',
		icon: { light: 'file:TerramarBrandsProfile.svg', dark: 'file:TerramarBrandsProfile.dark.svg' },
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description: 'Consultant profile (Perfil de consultora) on the Terramar Brands API: contract, shipping addresses, password change and e-mail validation.',
		defaults: {
			name: 'Terramar Brands Profile',
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
				default: 'contrato',
				description: 'The area of the Terramar Brands API to work with',
				options: [
					{
						name: 'Contrato',
						value: 'contrato',
					},
					{
						name: 'Cuenta',
						value: 'cuenta',
					},
					{
						name: 'Domicilio De Envío',
						value: 'domicilio',
					},
				],
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				required: true,
				default: 'updateConsultantProfile',
				displayOptions: {
					show: {
						resource: ['contrato'],
					},
				},
				options: [
					{
						name: 'Actualizar Datos De La Consultora',
						value: 'updateConsultantProfile',
						description: 'POST /postContratoActualiza',
						action: 'Actualizar datos de la consultora',
					},
					{
						name: 'Firmar / Validar Contrato De Alta (MX)',
						value: 'signContract',
						description: 'POST /postContrato',
						action: 'Firmar / validar contrato de alta (MX)',
					},
					{
						name: 'Leer Datos De La Consultora',
						value: 'readConsultantProfile',
						description: 'POST /postContratoActualiza',
						action: 'Leer datos de la consultora',
					},
				],
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				required: true,
				default: 'changePassword',
				displayOptions: {
					show: {
						resource: ['cuenta'],
					},
				},
				options: [
					{
						name: 'Cambiar Contraseña',
						value: 'changePassword',
						description: 'POST /postCambiarContrasenia',
						action: 'Cambiar contrase a',
					},
					{
						name: 'Validar Token De Correo',
						value: 'validateEmailToken',
						description: 'POST /PostValidarMail',
						action: 'Validar token de correo',
					},
				],
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				required: true,
				default: 'updateShippingAddress',
				displayOptions: {
					show: {
						resource: ['domicilio'],
					},
				},
				options: [
					{
						name: 'Actualizar Domicilio De Envío',
						value: 'updateShippingAddress',
						description: 'POST /postActualizarDomicilio',
						action: 'Actualizar domicilio de env o',
					},
					{
						name: 'Domicilios De Envío Del Kit',
						value: 'getShippingAddress',
						description: 'GET /getAddress',
						action: 'Domicilios de env o del kit',
					},
				],
			},
			{
				displayName: 'Dominio',
				name: 'dominio',
				type: 'string',
				required: true,
				description: 'Dominio del sitio (p. ej. carrito.terramarbrands.com.mx)',
				displayOptions: {
					show: {
						resource: ['contrato'],
						operation: ['readConsultantProfile'],
					},
				},
				default: 'carrito.terramarbrands.com.mx',
			},
			{
				displayName: 'Accion',
				name: 'accion',
				type: 'options',
				description:
					'Acción de la solicitud — vacío lee la ficha; CONTINUAR/TERMINAR avanzan o cierran el contrato',
				displayOptions: {
					show: {
						resource: ['contrato'],
						operation: ['readConsultantProfile'],
					},
				},
				default: '',
				options: [
					{
						name: 'CONTINUAR',
						value: 'CONTINUAR',
					},
					{
						name: 'Leer (Vacío)',
						value: '',
					},
					{
						name: 'TERMINAR',
						value: 'TERMINAR',
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
						resource: ['contrato'],
						operation: ['readConsultantProfile'],
					},
				},
				default: '1234567',
			},
			{
				displayName: 'Dominio',
				name: 'dominio',
				type: 'string',
				required: true,
				description: 'Dominio del sitio (p. ej. carrito.terramarbrands.com.mx)',
				displayOptions: {
					show: {
						resource: ['contrato'],
						operation: ['updateConsultantProfile'],
					},
				},
				default: 'carrito.terramarbrands.com.mx',
			},
			{
				displayName: 'Accion',
				name: 'accion',
				type: 'options',
				required: true,
				description:
					'Acción de la solicitud — CONTINUAR sigue el flujo del contrato; TERMINAR lo cierra',
				displayOptions: {
					show: {
						resource: ['contrato'],
						operation: ['updateConsultantProfile'],
					},
				},
				default: 'TERMINAR',
				options: [
					{
						name: 'CONTINUAR',
						value: 'CONTINUAR',
					},
					{
						name: 'TERMINAR',
						value: 'TERMINAR',
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
						resource: ['contrato'],
						operation: ['updateConsultantProfile'],
					},
				},
				default: '1234567',
			},
			{
				displayName: 'Accion',
				name: 'accion',
				type: 'string',
				required: true,
				description: 'Etapa del flujo ("TERMINAR" al firmar)',
				displayOptions: {
					show: {
						resource: ['contrato'],
						operation: ['signContract'],
					},
				},
				default: '',
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
						resource: ['contrato'],
						operation: ['signContract'],
					},
				},
				default: '1234567',
			},
			{
				displayName: 'Kit Patrocinadora',
				name: 'kitPatrocinadora',
				type: 'string',
				description: 'Kit de la patrocinadora',
				displayOptions: {
					show: {
						resource: ['contrato'],
						operation: ['signContract'],
					},
				},
				default: '',
			},
			{
				displayName: 'Pais',
				name: 'pais',
				type: 'string',
				description: 'País',
				displayOptions: {
					show: {
						resource: ['contrato'],
						operation: ['signContract'],
					},
				},
				default: '',
			},
			{
				displayName: 'Nombres',
				name: 'nombres',
				type: 'string',
				description: 'Nombre(s)',
				displayOptions: {
					show: {
						resource: ['contrato'],
						operation: ['signContract'],
					},
				},
				default: '',
			},
			{
				displayName: 'Apellido1',
				name: 'apellido1',
				type: 'string',
				description: 'Apellido paterno',
				displayOptions: {
					show: {
						resource: ['contrato'],
						operation: ['signContract'],
					},
				},
				default: '',
			},
			{
				displayName: 'Apellido2',
				name: 'apellido2',
				type: 'string',
				description: 'Apellido materno',
				displayOptions: {
					show: {
						resource: ['contrato'],
						operation: ['signContract'],
					},
				},
				default: '',
			},
			{
				displayName: 'Fecha Nac Anio',
				name: 'fechaNacAnio',
				type: 'string',
				description: 'Año de nacimiento',
				displayOptions: {
					show: {
						resource: ['contrato'],
						operation: ['signContract'],
					},
				},
				default: '',
			},
			{
				displayName: 'Fecha Nac Mes',
				name: 'fechaNacMes',
				type: 'string',
				description: 'Mes de nacimiento',
				displayOptions: {
					show: {
						resource: ['contrato'],
						operation: ['signContract'],
					},
				},
				default: '',
			},
			{
				displayName: 'Fecha Nac Dia',
				name: 'fechaNacDia',
				type: 'string',
				description: 'Día de nacimiento',
				displayOptions: {
					show: {
						resource: ['contrato'],
						operation: ['signContract'],
					},
				},
				default: '',
			},
			{
				displayName: 'Genero',
				name: 'genero',
				type: 'string',
				description: 'Género',
				displayOptions: {
					show: {
						resource: ['contrato'],
						operation: ['signContract'],
					},
				},
				default: '',
			},
			{
				displayName: 'Direccion1',
				name: 'direccion1',
				type: 'string',
				description: 'Calle',
				displayOptions: {
					show: {
						resource: ['contrato'],
						operation: ['signContract'],
					},
				},
				default: '',
			},
			{
				displayName: 'Direccion2',
				name: 'direccion2',
				type: 'string',
				description: 'Entre calles',
				displayOptions: {
					show: {
						resource: ['contrato'],
						operation: ['signContract'],
					},
				},
				default: '',
			},
			{
				displayName: 'Y Calle',
				name: 'yCalle',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['contrato'],
						operation: ['signContract'],
					},
				},
				default: '',
			},
			{
				displayName: 'Ciudad',
				name: 'ciudad',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['contrato'],
						operation: ['signContract'],
					},
				},
				default: '',
			},
			{
				displayName: 'Estado',
				name: 'estado',
				type: 'string',
				description: 'Entidad federativa',
				displayOptions: {
					show: {
						resource: ['contrato'],
						operation: ['signContract'],
					},
				},
				default: '',
			},
			{
				displayName: 'CP',
				name: 'CP',
				type: 'string',
				description: 'Código postal',
				displayOptions: {
					show: {
						resource: ['contrato'],
						operation: ['signContract'],
					},
				},
				default: '',
			},
			{
				displayName: 'Celular',
				name: 'celular',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['contrato'],
						operation: ['signContract'],
					},
				},
				default: '',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				description: 'Correo',
				displayOptions: {
					show: {
						resource: ['contrato'],
						operation: ['signContract'],
					},
				},
				default: '',
			},
			{
				displayName: 'Colonia',
				name: 'colonia',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['contrato'],
						operation: ['signContract'],
					},
				},
				default: '',
			},
			{
				displayName: 'Acepto',
				name: 'acepto',
				type: 'string',
				required: true,
				description: '"S" si acepta los términos, "N" si no',
				displayOptions: {
					show: {
						resource: ['contrato'],
						operation: ['signContract'],
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
						resource: ['contrato'],
						operation: ['signContract'],
					},
				},
				default: '',
			},
			{
				displayName: 'ID Pre Cont',
				name: 'idPreCont',
				type: 'string',
				description: 'Precontrato previo',
				displayOptions: {
					show: {
						resource: ['contrato'],
						operation: ['signContract'],
					},
				},
				default: '',
			},
			{
				displayName: 'Kit Code',
				name: 'kitCode',
				type: 'string',
				required: true,
				description: 'Kit de la consultora',
				displayOptions: {
					show: {
						resource: ['domicilio'],
						operation: ['getShippingAddress'],
					},
				},
				default: '',
			},
			{
				displayName: 'Dominio',
				name: 'dominio',
				type: 'string',
				description: 'Dominio del sitio',
				displayOptions: {
					show: {
						resource: ['domicilio'],
						operation: ['getShippingAddress'],
					},
				},
				default: 'carrito.terramarbrands.com.mx',
			},
			{
				displayName: 'Dominio',
				name: 'dominio',
				type: 'string',
				required: true,
				description: 'Dominio del sitio',
				displayOptions: {
					show: {
						resource: ['domicilio'],
						operation: ['updateShippingAddress'],
					},
				},
				default: 'carrito.terramarbrands.com.mx',
			},
			{
				displayName: 'Solo Paqueteria',
				name: 'soloPaqueteria',
				type: 'string',
				description: '1 si solo cambia paquetería',
				displayOptions: {
					show: {
						resource: ['domicilio'],
						operation: ['updateShippingAddress'],
					},
				},
				default: '',
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
						resource: ['domicilio'],
						operation: ['updateShippingAddress'],
					},
				},
				default: '1234567',
			},
			{
				displayName: 'Folio Pedido',
				name: 'folioPedido',
				type: 'string',
				required: true,
				description: 'Folio del pedido',
				displayOptions: {
					show: {
						resource: ['domicilio'],
						operation: ['updateShippingAddress'],
					},
				},
				default: '',
			},
			{
				displayName: 'Estado',
				name: 'estado',
				type: 'string',
				description: 'Entidad federativa',
				displayOptions: {
					show: {
						resource: ['domicilio'],
						operation: ['updateShippingAddress'],
					},
				},
				default: '',
			},
			{
				displayName: 'Calle',
				name: 'calle',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['domicilio'],
						operation: ['updateShippingAddress'],
					},
				},
				default: '',
			},
			{
				displayName: 'Colonia',
				name: 'colonia',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['domicilio'],
						operation: ['updateShippingAddress'],
					},
				},
				default: '',
			},
			{
				displayName: 'Municipio',
				name: 'municipio',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['domicilio'],
						operation: ['updateShippingAddress'],
					},
				},
				default: '',
			},
			{
				displayName: 'Cp',
				name: 'cp',
				type: 'string',
				required: true,
				description: 'Código postal',
				displayOptions: {
					show: {
						resource: ['domicilio'],
						operation: ['updateShippingAddress'],
					},
				},
				default: '',
			},
			{
				displayName: 'Ocurre',
				name: 'ocurre',
				type: 'string',
				description: 'Sucursal Ocurre',
				displayOptions: {
					show: {
						resource: ['domicilio'],
						operation: ['updateShippingAddress'],
					},
				},
				default: '',
			},
			{
				displayName: 'Paqueteria',
				name: 'paqueteria',
				type: 'string',
				description: 'Paquetería',
				displayOptions: {
					show: {
						resource: ['domicilio'],
						operation: ['updateShippingAddress'],
					},
				},
				default: '',
			},
			{
				displayName: 'Entre Calle',
				name: 'entreCalle',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['domicilio'],
						operation: ['updateShippingAddress'],
					},
				},
				default: '',
			},
			{
				displayName: 'Y Calle',
				name: 'yCalle',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['domicilio'],
						operation: ['updateShippingAddress'],
					},
				},
				default: '',
			},
			{
				displayName: 'Domicilio Cliente Final SN',
				name: 'domicilioClienteFinalSN',
				type: 'string',
				description: '"S"/"N" envío a cliente final',
				displayOptions: {
					show: {
						resource: ['domicilio'],
						operation: ['updateShippingAddress'],
					},
				},
				default: '',
			},
			{
				displayName: 'Domicilio Cliente Final Nombre',
				name: 'domicilioClienteFinalNombre',
				type: 'string',
				description: 'Nombre del cliente final',
				displayOptions: {
					show: {
						resource: ['domicilio'],
						operation: ['updateShippingAddress'],
					},
				},
				default: '',
			},
			{
				displayName: 'Domicilio Cliente Final Telefono',
				name: 'domicilioClienteFinalTelefono',
				type: 'string',
				description: 'Teléfono del cliente final',
				displayOptions: {
					show: {
						resource: ['domicilio'],
						operation: ['updateShippingAddress'],
					},
				},
				default: '',
			},
			{
				displayName: 'Numero Exterior',
				name: 'numeroExterior',
				type: 'string',
				description: 'Número exterior',
				displayOptions: {
					show: {
						resource: ['domicilio'],
						operation: ['updateShippingAddress'],
					},
				},
				default: '',
			},
			{
				displayName: 'Accion',
				name: 'accion',
				type: 'string',
				required: true,
				description: 'Fijo "CONTINUAR"',
				displayOptions: {
					show: {
						resource: ['cuenta'],
						operation: ['changePassword'],
					},
				},
				default: '',
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
						resource: ['cuenta'],
						operation: ['changePassword'],
					},
				},
				default: '1234567',
			},
			{
				displayName: 'Contrasenia',
				name: 'contrasenia',
				type: 'string',
				required: true,
				description: 'Contraseña actual',
				displayOptions: {
					show: {
						resource: ['cuenta'],
						operation: ['changePassword'],
					},
				},
				default: '',
			},
			{
				displayName: 'Contrasenia Nueva',
				name: 'contraseniaNueva',
				type: 'string',
				required: true,
				description: 'Contraseña nueva',
				displayOptions: {
					show: {
						resource: ['cuenta'],
						operation: ['changePassword'],
					},
				},
				default: '',
			},
			{
				displayName: 'Contrasenia Nueva2',
				name: 'contraseniaNueva2',
				type: 'string',
				required: true,
				description: 'Confirmación de la nueva',
				displayOptions: {
					show: {
						resource: ['cuenta'],
						operation: ['changePassword'],
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
						resource: ['cuenta'],
						operation: ['validateEmailToken'],
					},
				},
				default: '',
			},
			{
				displayName: 'Token',
				name: 'token',
				type: 'string',
				typeOptions: { password: true },
				required: true,
				description: 'Token recibido por correo',
				displayOptions: {
					show: {
						resource: ['cuenta'],
						operation: ['validateEmailToken'],
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
