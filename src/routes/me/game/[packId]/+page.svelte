<script lang="ts">
	import { storage } from '$lib/appwrite';
	import type { PageData } from './$types';
	import BlurImage from '$lib/BlurImage.svelte';

	export let data: PageData;

	const packName = data.pack.name;
	const packId = data.pack.$id;

	const locations = data.locations.map((location) => {
		return {
			id: location.$id,
			imageUrl: storage.getFileView('locationImages', location.imageId).toString(),
			blurhash: data.blurhashes?.[location.imageId] ?? null,
			completedHardmode: (data.finishes.filter((finish) => finish.locationId === location.$id)[0] ?? {}).hardMode ? true : false,
			completed: data.finishes.filter((finish) => finish.locationId === location.$id).length > 0
		};
	});
</script>

<!-- Card Blog -->
<div class="max-w-[85rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14 mx-auto flex flex-col space-y-12">
	<div class="flex flex-col space-y-2">
		<a href="/me/game" class="text-brand-500 font-bold text-lg flex space-x-2 hover:text-brand-300 w-[fit-content] items-center">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
			  </svg>
			  
			  <p>Go Back</p></a>
		<h1 class="mb-8 text-4xl sm:text-6xl font-bold text-brand-50">{packName}</h1>
	</div>
	<!-- Grid -->
	<div class="grid sm:grid-cols-2 lg:grid-cols-6 gap-6">
		{#if locations.length === 0}
				<h1 class="col-span-12 text-2xl sm:text-4xl font-bold text-brand-600 w-full">
					Nothing to show here.
				</h1>
			{/if}
		{#each locations as location}
		<a class={`border group h-[300px] relative flex flex-col w-full min-h-[15rem] overflow-hidden rounded-xl hover:shadow-lg transition dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600 border-brand-900`} href={`/me/game/${data.pack.$id}/${location.id}`}>
			<BlurImage src={location.imageUrl} blurhash={location.blurhash} alt="" class="absolute inset-0 w-full h-full" />
			<div class="relative z-10 flex-auto p-4">
				{#if location.completed}
				<span class="py-1 px-2 inline-flex items-center gap-x-1 text-xs font-medium rounded-full bg-green-900 text-green-400">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3 h-3">
						<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
					  </svg>
					  
					Completed
				  </span>
				  {:else}
				  <span class="py-1 px-2 inline-flex items-center gap-x-1 text-xs font-medium rounded-full bg-brand-900 text-brand-400">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3 h-3">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
					  </svg>
					Not Completed
				  </span>
				{/if}
				

				{#if location.completedHardmode}
				<span class="mt-2 py-1 px-2 inline-flex items-center gap-x-1 text-xs font-medium rounded-full bg-purple-950 text-purple-400">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3">
						<path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clip-rule="evenodd" />
					  </svg>
					  
					  
					With Hardmode
				  </span>
				  {:else}
				  <span class="mt-2 py-1 px-2 inline-flex items-center gap-x-1 text-xs font-medium rounded-full bg-brand-900 text-brand-400">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3 h-3">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
					  </svg>
					Without Hardmode
				  </span>
				{/if}

			</div>
			<div class="relative z-10 p-4 pt-5 flex justify-center w-full rounded-xl rounded-t-none" style="backdrop-filter: brightness(80%) blur(2px);">
			  <div class="inline-flex items-center gap-2 text-sm font-medium text-white group-hover:text-white/[.7]">
				Visit Location
				<svg class="flex-shrink-0 w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"></path></svg>
			  </div>
			</div>
		  </a>
		{/each}
	</div>
	<!-- End Grid -->
</div>
<!-- End Card Blog -->
