import { functions } from '$lib/appwrite';

/**
 * Calls the `api` function synchronously (async = false) so we get the response
 * body back, and unwraps the `{ ok, ... }` envelope into a result or an error.
 */
export async function callApi<T = any>(
	action: string,
	payload: Record<string, unknown> = {}
): Promise<T> {
	const execution = await functions.createExecution(
		'api',
		JSON.stringify({ action, ...payload }),
		false, // synchronous — we need the responseBody
		undefined,
		undefined,
		{ 'content-type': 'application/json' }
	);

	if (execution.status !== 'completed') {
		throw new Error(execution.responseBody || 'Request failed.');
	}

	const body = JSON.parse(execution.responseBody || '{}');
	if (!body.ok) {
		throw new Error(body.message || 'Request failed.');
	}

	return body as T;
}
