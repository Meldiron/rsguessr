import type { PageLoad } from './$types';
import { databases } from '$lib/appwrite';
import { Query } from 'appwrite';
import { ownsPack } from '$lib/packs';

const PAGE_SIZE = 12;
// Appwrite can't query "documents I can edit", so we fetch the readable packs
// and filter to the ones owned by the caller (encoded in $permissions). For a
// hobby-sized catalogue this single page is plenty; revisit if it grows large.
const FETCH_LIMIT = 100;

export const load: PageLoad = async ({ parent, url }) => {
	const data = await parent();
	const userId = data?.user?.$id ?? '';

	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);

	const all = await databases.listDocuments('main', 'packs', [
		Query.orderDesc('$createdAt'),
		Query.limit(FETCH_LIMIT)
	]);

	const owned = all.documents.filter((pack) => ownsPack(pack, userId));

	const total = owned.length;
	const offset = (page - 1) * PAGE_SIZE;
	const packs = owned.slice(offset, offset + PAGE_SIZE);

	// How many locations each pack on this page has (for the card subtitle).
	const counts: Record<string, number> = {};
	const packIds = packs.map((pack) => pack.$id);
	if (packIds.length > 0) {
		const locations = await databases.listDocuments('main', 'locations', [
			Query.equal('packId', packIds),
			Query.select(['packId']),
			Query.limit(5000)
		]);
		for (const location of locations.documents) {
			counts[location.packId] = (counts[location.packId] ?? 0) + 1;
		}
	}

	return {
		packs,
		total,
		page,
		pageSize: PAGE_SIZE,
		counts
	};
};
