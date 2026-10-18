import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

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
				Authorization: '=Bearer {{$credentials.token}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			method: 'GET',
			url: 'https://terramarbrands.mx/wsTerramarV2/Service1.svc/GetBonosEtapaUno',
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
