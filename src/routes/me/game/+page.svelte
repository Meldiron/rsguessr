<script lang="ts">
	import type { PageData } from './$types';
	import PackCard from '$lib/PackCard.svelte';

	export let data: PageData;

	function toCard(pack: any) {
		return {
			id: pack.$id,
			name: pack.name,
			completed: data.finishes.filter((finish: any) => finish.packId === pack.$id).length,
			completedHardmode: data.finishes.filter(
				(finish: any) => finish.packId === pack.$id && finish.hardMode
			).length,
			total: data.locations.filter((location: any) => location.packId === pack.$id).length
		};
	}

	$: recommended = data.recommended.map(toCard);
	$: community = data.community.map(toCard);

	$: recTotalPages = Math.max(1, Math.ceil(data.recTotal / data.pageSize));
	$: comTotalPages = Math.max(1, Math.ceil(data.comTotal / data.pageSize));

	// Build a query string that updates one section's page while keeping the other.
	function pageHref(section: 'rec' | 'com', value: number) {
		const params = new URLSearchParams();
		params.set('rec', String(section === 'rec' ? value : data.recPage));
		params.set('com', String(section === 'com' ? value : data.comPage));
		return `?${params.toString()}`;
	}
</script>

<!-- Card Blog -->
<div class="max-w-[85rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14 mx-auto flex flex-col space-y-16">
	<!-- Recommended packs -->
	<section class="flex flex-col space-y-8">
		<h1 class="mb-0 text-4xl sm:text-6xl font-bold text-brand-50">Recommended packs</h1>

		<div class="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
			{#if recommended.length === 0}
				<p class="col-span-full text-2xl font-bold text-brand-600">Nothing to show here.</p>
			{/if}
			{#each recommended as card (card.id)}
				<PackCard {card} />
			{/each}
		</div>

		{#if recTotalPages > 1}
			<div class="flex items-center justify-center gap-x-2">
				<a
					href={pageHref('rec', data.recPage - 1)}
					class={`py-2 px-3 text-sm rounded-md border border-brand-700 text-white ${
						data.recPage <= 1 ? 'pointer-events-none opacity-40' : 'hover:border-brand-400'
					}`}
					aria-disabled={data.recPage <= 1}>Previous</a
				>
				<span class="text-sm text-brand-400 px-2">Page {data.recPage} of {recTotalPages}</span>
				<a
					href={pageHref('rec', data.recPage + 1)}
					class={`py-2 px-3 text-sm rounded-md border border-brand-700 text-white ${
						data.recPage >= recTotalPages ? 'pointer-events-none opacity-40' : 'hover:border-brand-400'
					}`}
					aria-disabled={data.recPage >= recTotalPages}>Next</a
				>
			</div>
		{/if}
	</section>

	<!-- Community packs -->
	<section class="flex flex-col space-y-8">
		<h2 class="mb-0 text-4xl sm:text-6xl font-bold text-brand-50">Community packs</h2>

		<div class="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
			{#if community.length === 0}
				<p class="col-span-full text-2xl font-bold text-brand-600">Nothing to show here.</p>
			{/if}
			{#each community as card (card.id)}
				<PackCard {card} />
			{/each}
		</div>

		{#if comTotalPages > 1}
			<div class="flex items-center justify-center gap-x-2">
				<a
					href={pageHref('com', data.comPage - 1)}
					class={`py-2 px-3 text-sm rounded-md border border-brand-700 text-white ${
						data.comPage <= 1 ? 'pointer-events-none opacity-40' : 'hover:border-brand-400'
					}`}
					aria-disabled={data.comPage <= 1}>Previous</a
				>
				<span class="text-sm text-brand-400 px-2">Page {data.comPage} of {comTotalPages}</span>
				<a
					href={pageHref('com', data.comPage + 1)}
					class={`py-2 px-3 text-sm rounded-md border border-brand-700 text-white ${
						data.comPage >= comTotalPages ? 'pointer-events-none opacity-40' : 'hover:border-brand-400'
					}`}
					aria-disabled={data.comPage >= comTotalPages}>Next</a
				>
			</div>
		{/if}
	</section>
</div>
<!-- End Card Blog -->
