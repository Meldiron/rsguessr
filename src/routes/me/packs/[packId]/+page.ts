import type { PageLoad } from './$types';
import { databases } from '$lib/appwrite';
import { Query } from 'appwrite';
import { redirect } from '@sveltejs/kit';
import { ownsPack } from '$lib/packs';
import { callApi } from '$lib/api';

export const load: PageLoad = async ({ params, parent }) => {
	const data = await parent();
	const me = data?.user?.$id ?? '';

	const pack = await databases.getDocument('main', 'packs', params.packId);

	// Only the owner may manage a pack.
	if (!ownsPack(pack, me)) {
		throw redirect(302, '/me/packs');
	}

	const locationsRes = await databases.listDocuments('main', 'locations', [
		Query.equal('packId', pack.$id),
		Query.orderAsc('$createdAt'),
		Query.limit(100)
	]);

	// Coordinates are the answers, so they're not client-readable. The api
	// function returns them after verifying we own the pack.
	let coords: Record<string, { $id: string; lat: number; lng: number }> = {};
	try {
		const res = await callApi<{ coords: typeof coords }>('getCoordinates', { packId: pack.$id });
		coords = res.coords ?? {};
	} catch {
		coords = {};
	}

	return {
		pack,
		locations: locationsRes.documents,
		coords
	};
};
