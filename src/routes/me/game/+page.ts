import type { PageLoad } from './$types';
import { databases } from '$lib/appwrite';
import { Query } from 'appwrite';

const PAGE_SIZE = 10;
const MAX_RECOMMENDATIONS = 100;
// Appwrite can't express "$id not in [...]" in a query, so we pull a window of
// the most recent packs and drop the recommended ones in code, then paginate
// that filtered list. Plenty for a hobby-sized catalogue.
const COMMUNITY_FETCH = 100;

export const load: PageLoad = async ({ parent, url }) => {
	const data = await parent();
	const userId = data?.user?.$id ?? '';

	const recPage = Math.max(1, parseInt(url.searchParams.get('rec') ?? '1', 10) || 1);
	const comPage = Math.max(1, parseInt(url.searchParams.get('com') ?? '1', 10) || 1);

	// --- Recommended: paginate the recommendations, then load those packs ---
	const recommendationsRes = await databases.listDocuments('main', 'packRecommendations', [
		Query.orderAsc('$createdAt'),
		Query.limit(PAGE_SIZE),
		Query.offset((recPage - 1) * PAGE_SIZE)
	]);
	const recPackIds = recommendationsRes.documents.map((doc) => doc.packId);

	let recommended: any[] = [];
	if (recPackIds.length > 0) {
		// Fetch the whole page of packs in one call via an $id array.
		const packsRes = await databases.listDocuments('main', 'packs', [
			Query.equal('$id', recPackIds),
			Query.limit(recPackIds.length)
		]);
		// Preserve the recommendation order; drop any that no longer exist.
		const byId = new Map(packsRes.documents.map((pack) => [pack.$id, pack]));
		recommended = recPackIds.map((id) => byId.get(id)).filter(Boolean);
	}

	// --- Community: everything that isn't recommended -----------------------
	const allRecommendationsRes = await databases.listDocuments('main', 'packRecommendations', [
		Query.limit(MAX_RECOMMENDATIONS)
	]);
	const excludedIds = new Set(allRecommendationsRes.documents.map((doc) => doc.packId));

	const communityRes = await databases.listDocuments('main', 'packs', [
		Query.orderDesc('$createdAt'),
		Query.limit(COMMUNITY_FETCH)
	]);
	const communityAll = communityRes.documents.filter((pack) => !excludedIds.has(pack.$id));
	const comTotal = communityAll.length;
	const community = communityAll.slice((comPage - 1) * PAGE_SIZE, comPage * PAGE_SIZE);

	// --- Progress data for every pack shown on this page --------------------
	const shownPackIds = [
		...recommended.map((pack) => pack.$id),
		...community.map((pack) => pack.$id)
	];

	let locations: any[] = [];
	let finishes: any[] = [];
	if (shownPackIds.length > 0) {
		const [locationsRes, finishesRes] = await Promise.all([
			databases.listDocuments('main', 'locations', [
				Query.equal('packId', shownPackIds),
				Query.select(['packId']),
				Query.limit(5000)
			]),
			databases.listDocuments('main', 'locationFinishes', [
				Query.equal('packId', shownPackIds),
				Query.equal('userId', userId),
				Query.limit(5000)
			])
		]);
		locations = locationsRes.documents;
		finishes = finishesRes.documents;
	}

	return {
		recommended,
		recTotal: recommendationsRes.total,
		recPage,
		community,
		comTotal,
		comPage,
		pageSize: PAGE_SIZE,
		locations,
		finishes
	};
};
