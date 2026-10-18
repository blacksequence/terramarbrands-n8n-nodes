import type { IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';

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
 * Brands API credential (Authorization: Bearer, defined on the credential).
 */
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
	return this.helpers.httpRequestWithAuthentication.call(this, 'terramarBrandsApi', options);
}
