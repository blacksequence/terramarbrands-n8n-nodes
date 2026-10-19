import type {
	IAuthenticateGeneric,
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	Icon,
	IDataObject,
	IHttpRequestHelper,
	INodeProperties,
} from 'n8n-workflow';

interface TerramarBrandsLoginResponse {
	usuario?: string;
	nivel?: string;
	nombre?: string;
	token?: string;
	tokenJWT?: string;
	tipoMensaje?: string;
	mensaje?: string;
}

export class TerramarBrandsApi implements ICredentialType {
	name = 'terramarBrandsApi';

	displayName = 'Terramar Brands API';

	documentationUrl = 'https://github.com/blacksequence/terramarbrands-n8n-nodes#credentials';

	icon: Icon = {
		light: 'file:terramarbrands.svg',
		dark: 'file:terramarbrands.dark.svg',
	};

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.authToken || $credentials.token}}',
			},
		},
	};

	/**
	 * User/password mode: run the consultant login (POST /getConsultoriaLogin,
	 * header seccion=CONSULTORIA, body origen=CARRITONUE) and merge the minted
	 * token into the hidden expirable authToken property — n8n persists it on
	 * the credential and reuses it across executions until the credential is
	 * tested or the nodes report it expired. Token mode (token filled) skips
	 * the login entirely.
	 */
	preAuthentication = async function (
		this: IHttpRequestHelper,
		credentials: ICredentialDataDecryptedObject,
	): Promise<IDataObject> {
		if (credentials.token) {
			return {};
		}
		const response = (await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://terramarbrands.mx/wsTerramarV2/Service1.svc/getConsultoriaLogin',
			headers: {
				seccion: 'CONSULTORIA',
			},
			body: {
				usuario: credentials.usuario,
				claveAcceso: credentials.password,
				origen: credentials.origen ?? 'CARRITONUE',
			},
			json: true,
		})) as TerramarBrandsLoginResponse;
		if (response?.tipoMensaje !== 'exito' || !response.token) {
			throw new Error(
				'Terramar Brands login failed: ' +
					(response?.mensaje ?? response?.tipoMensaje ?? 'unknown error'),
			);
		}
		return { authToken: response.token };
	};

	test: ICredentialTestRequest = {
		request: {
			method: 'GET',
			url: 'https://terramarbrands.mx/wsTerramarV2/Service1.svc/GetBonosEtapaUno',
		},
	};

	properties: INodeProperties[] = [
		{
			displayName: 'Usuario',
			name: 'usuario',
			required: false,
			type: 'string',
			default: '',
			placeholder: 'TE1234567',
			description:
				'Consultant user (TE + 7 digits) for the automatic login flow. Fill this and the password to let the nodes obtain the session token themselves on every execution.',
		},
		{
			displayName: 'Contraseña',
			name: 'password',
			required: false,
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'Consultant password (claveAcceso) for the automatic login flow.',
		},
		{
			displayName: 'Origen',
			name: 'origen',
			required: false,
			type: 'string',
			default: 'CARRITONUE',
			description:
				'Fixed origin identifier the cart SPA sends with the login (app channel). Keep CARRITONUE unless the backend requires another channel.',
		},
		{
			displayName: 'Token',
			name: 'token',
			required: false,
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description:
				'Session token for token mode — skips the automatic login. Obtain it with the Terramar Brands Session node → Login operation, or copy the TMBcartToken cookie from the SPA. Leave empty to use Usuario + Contraseña.',
		},
		{
			displayName: 'Auth token',
			name: 'authToken',
			type: 'hidden',
			default: '',
			typeOptions: {
				expirable: true, password: true,
			},
			description:
				'Session token minted by the automatic login. n8n stores it on the credential and reuses it across executions; the nodes re-login transparently when the API reports it expired (499).',
		},
	];
}
