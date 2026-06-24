import type { PageLoad } from './$types';
import { databases } from '$lib/appwrite';
import { Query } from 'appwrite';
import { redirect } from '@sveltejs/kit';

export const load: PageLoad = async ({ params, parent }) => {
    const { packId } = params;
	let locationId = params.locationId;

	const data = await parent();

	const pack = await databases.getDocument('main', 'packs', packId);

	if(locationId === 'random') {
		const allLocations = (await databases.listDocuments('main', 'locations', [ Query.select(['$id']), Query.limit(100) ])).documents;
		const randomLocation = allLocations[Math.floor(Math.random() * allLocations.length)];
		locationId = randomLocation.$id;

		throw redirect(302, `/me/game/${packId}/${locationId}`);
	}

	const location = await databases.getDocument('main', 'locations', locationId);
	const finish = await databases.listDocuments('main', 'locationFinishes', [
		Query.equal(
			'locationId',
			location.$id
		),
		Query.equal(
			'userId',
			data?.user?.$id ?? ''
		),
		Query.limit(1)
	]);

	// Blurhash is keyed by the storage file id; missing is fine (falls back to black).
	let blurhash: string | null = null;
	try {
		const doc = await databases.getDocument('main', 'blurhashes', location.imageId);
		blurhash = doc.blurhash ?? null;
	} catch {
		blurhash = null;
	}

	return {
		pack,
		location,
		blurhash,
		finish: finish.documents[0] ? finish.documents[0] : null
	};
};
