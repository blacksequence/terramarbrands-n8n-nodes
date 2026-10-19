import {
	NodeApiError,
	type IExecuteFunctions,
	type IHttpRequestOptions,
	type JsonObject,
} from 'n8n-workflow';

/**
 * Static per-operation request metadata generated from the OpenAPI spec.
 * Every map is: field name -> [spec param name, required].
 */
export interface TerramarBrandsOpSpec {
	method: 'GET' | 'POST';
	path: string;
	query: Record<string, [string, boolean]>;
	headers: Record<string, [string, boolean]>;
	body: Record<string, [string, boolean]>;
	bodyJson: Record<string, [string, boolean]>;
	isPublic: boolean;
}

/** One HTTP request against the Terramar Brands API. */
export interface TerramarBrandsRequest {
	method: 'GET' | 'POST';
	path: string;
	qs?: Record<string, string>;
	headers?: Record<string, string>;
	body?: Record<string, unknown>;
	isPublic?: boolean;
}

/**
 * Send one request to the Terramar Brands API using the node's `endpoint`
 * parameter as base URL. Operations the spec marks `security: []` are sent
 * plain; every other operation is authenticated by n8n with the Terramar
 * Brands API credential. When the API reports an expired session with its
 * app-level envelope (HTTP 200, tipoMensaje/typeMessage "error",
 * mensaje/message "499"), a fresh token is minted with the credential's
 * Usuario + Contraseña and the request is retried once.
 */

/** Session tokens minted after a 499, keyed by consultant user — one per process. */
const sessionTokens = new Map<string, string>();

interface TerramarBrandsSessionCredentials {
	usuario?: string;
	password?: string;
	origen?: string;
}

/** The API's app-level expired-session envelope (rides on HTTP 200). */
const isExpiredToken = (response: unknown): boolean => {
	if (typeof response !== 'object' || response === null) return false;
	const envelope = response as {
		tipoMensaje?: string;
		typeMessage?: string;
		mensaje?: string;
		message?: string;
	};
	return (
		(envelope.tipoMensaje === 'error' || envelope.typeMessage === 'error') &&
		String(envelope.mensaje ?? envelope.message ?? '') === '499'
	);
};

/**
 * Login once with explicit credentials. Kept free of getCredentials so the
 * community no-http-request-with-manual-auth rule stays satisfied.
 */
const mintSessionToken = async function (
	this: IExecuteFunctions,
	endpoint: string,
	usuario: string,
	password: string,
	origen?: string,
): Promise<string> {
	const response = (await this.helpers.httpRequest({
		method: 'POST',
		url: `${endpoint}/getConsultoriaLogin`,
		headers: { seccion: 'CONSULTORIA' },
		body: {
			usuario,
			claveAcceso: password,
			origen: origen ?? 'CARRITONUE',
		},
		json: true,
	})) as { tipoMensaje?: string; token?: string; mensaje?: string };
	if (response?.tipoMensaje !== 'exito' || !response.token) {
		throw new NodeApiError(
			this.getNode(),
			{
				message:
					'Terramar Brands login failed while refreshing the session token: ' +
					(response?.mensaje ?? response?.tipoMensaje ?? 'unknown error'),
			} as JsonObject,
		);
	}
	return response.token;
};

/** Read Usuario + Contraseña from the credential and cache the fresh token. */
const freshSessionToken = async function (
	this: IExecuteFunctions,
	endpoint: string,
): Promise<string> {
	const credentials = (await this.getCredentials('terramarBrandsApi')) as TerramarBrandsSessionCredentials;
	if (!credentials.usuario || !credentials.password) {
		throw new NodeApiError(
			this.getNode(),
			{
				message:
					'Terramar Brands session token expired (the API answered 499) and this credential has no Usuario + Contraseña to re-login automatically',
				description:
					'Switch the credential to Usuario + Contraseña mode, or paste a fresh Token',
			} as JsonObject,
		);
	}
	const cached = sessionTokens.get(credentials.usuario);
	if (cached) return cached;
	const token = await mintSessionToken.call(
		this,
		endpoint,
		credentials.usuario,
		credentials.password,
		credentials.origen,
	);
	sessionTokens.set(credentials.usuario, token);
	return token;
};

export async function apiRequest(
	this: IExecuteFunctions,
	request: TerramarBrandsRequest,
): Promise<unknown> {
	const endpoint = (this.getNodeParameter('endpoint', 0) as string).replace(/\/+$/, '');
	const options: IHttpRequestOptions = {
		method: request.method,
		url: `${endpoint}${request.path}`,
		qs: request.qs,
		headers: {
			Accept: 'application/json',
			...request.headers,
		},
		json: true,
	};
	if (Object.keys(request.body ?? {}).length > 0) {
		options.body = request.body;
	}
	if (request.isPublic) {
		return this.helpers.httpRequest(options);
	}
	const response = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'terramarBrandsApi',
		options,
	);
	if (!isExpiredToken(response)) {
		return response;
	}
	// The Terramar Brands API reports an expired session as HTTP 200 with its
	// app-level envelope — invisible to n8n's status-based pre-auth refresh.
	const freshToken = await freshSessionToken.call(this, endpoint);
	const retry = await this.helpers.httpRequest({
		...options,
		headers: { ...options.headers, Authorization: `Bearer ${freshToken}` },
	});
	if (isExpiredToken(retry)) {
		sessionTokens.clear();
		throw new NodeApiError(
			this.getNode(),
			{
				message:
					'Terramar Brands session token expired (the API answered 499) and re-logging in did not produce a working token',
				description: 'Re-save or re-test the credential to force a fresh login',
			} as JsonObject,
		);
	}
	return retry;
}
