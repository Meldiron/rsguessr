<script lang="ts">
	import type { PageData } from './$types';
	import { callApi } from '$lib/api';
	import { goto } from '$app/navigation';

	export let data: PageData;

	$: totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

	let showCreate = false;
	let name = '';
	let slug = '';
	let slugTouched = false;
	let creating = false;
	let error = '';

	// Turn a name into an Appwrite-safe document id (used as the shareable slug).
	function slugify(value: string) {
		return value
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^[-._]+/, '')
			.replace(/-+$/, '')
			.slice(0, 36);
	}

	// Keep the slug in sync with the name until the user edits the slug directly.
	$: if (showCreate && !slugTouched) {
		slug = slugify(name);
	}

	function openCreate() {
		name = '';
		slug = '';
		slugTouched = false;
		error = '';
		showCreate = true;
	}

	async function createPack() {
		if (creating) return;
		error = '';

		const id = slug.trim();
		if (!name.trim()) {
			error = 'Please enter a pack name.';
			return;
		}
		if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,35}$/.test(id)) {
			error =
				'Slug must be 1-36 characters, start with a letter or number, and use only letters, numbers, dot, dash or underscore.';
			return;
		}

		creating = true;
		try {
			await callApi('createPack', { name: name.trim(), slug: id });
			await goto(`/me/packs/${id}`);
		} catch (err: any) {
			error = /already exists|409/i.test(err.message)
				? 'That slug is already taken. Please choose another.'
				: `Could not create pack: ${err.message}`;
			creating = false;
		}
	}
</script>

<div class="max-w-[85rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14 mx-auto">
	<div class="flex flex-wrap gap-4 items-end justify-between mb-10">
		<div>
			<h1 class="text-4xl sm:text-5xl font-bold text-brand-50">My Packs</h1>
			<p class="mt-2 text-brand-400">Create and share your own RSGuessr location packs.</p>
		</div>
		{#if data.packs.length > 0}
			<button
				type="button"
				on:click={openCreate}
				class="inline-flex items-center gap-x-2 py-3 px-4 text-sm font-medium rounded-md bg-white text-brand-950 hover:bg-brand-100"
			>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
				</svg>
				New Pack
			</button>
		{/if}
	</div>

	{#if data.packs.length === 0}
		<!-- Empty state -->
		<div class="flex flex-col items-center text-center border border-dashed border-brand-700 rounded-2xl py-20 px-6">
			<div class="flex items-center justify-center w-14 h-14 rounded-full bg-brand-900 border border-brand-700 mb-5">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-7 h-7 text-brand-300">
					<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776" />
				</svg>
			</div>
			<h2 class="text-2xl font-bold text-brand-50">No packs yet</h2>
			<p class="mt-2 max-w-md text-brand-400">
				A pack is a collection of locations players have to find on the map. Create your first one to
				get started.
			</p>
			<button
				type="button"
				on:click={openCreate}
				class="mt-6 inline-flex items-center gap-x-2 py-3 px-5 text-sm font-medium rounded-md bg-white text-brand-950 hover:bg-brand-100"
			>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
				</svg>
				Create your first pack
			</button>
		</div>
	{:else}
		<!-- Grid -->
		<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each data.packs as pack (pack.$id)}
				<a
					href={`/me/packs/${pack.$id}`}
					class="group flex flex-col justify-between border border-brand-800 rounded-2xl p-6 h-44 bg-brand-950 hover:border-brand-500 transition"
				>
					<div>
						<h3 class="text-xl font-bold text-brand-50 group-hover:text-white break-words">
							{pack.name}
						</h3>
						<p class="mt-1 text-sm text-brand-500 font-mono break-all">{pack.$id}</p>
					</div>
					<div class="flex items-center gap-x-2 text-sm text-brand-300">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 text-brand-400">
							<path fill-rule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clip-rule="evenodd" />
						</svg>
						{data.counts[pack.$id] ?? 0}
						{(data.counts[pack.$id] ?? 0) === 1 ? 'location' : 'locations'}
					</div>
				</a>
			{/each}
		</div>

		<!-- Pagination -->
		{#if totalPages > 1}
			<div class="mt-10 flex items-center justify-center gap-x-2">
				<a
					href={`?page=${data.page - 1}`}
					class={`py-2 px-3 text-sm rounded-md border border-brand-700 text-white ${
						data.page <= 1 ? 'pointer-events-none opacity-40' : 'hover:border-brand-400'
					}`}
					aria-disabled={data.page <= 1}
				>
					Previous
				</a>
				<span class="text-sm text-brand-400 px-2">Page {data.page} of {totalPages}</span>
				<a
					href={`?page=${data.page + 1}`}
					class={`py-2 px-3 text-sm rounded-md border border-brand-700 text-white ${
						data.page >= totalPages ? 'pointer-events-none opacity-40' : 'hover:border-brand-400'
					}`}
					aria-disabled={data.page >= totalPages}
				>
					Next
				</a>
			</div>
		{/if}
	{/if}
</div>

{#if showCreate}
	<div class="bg-black bg-opacity-80 w-full h-full fixed top-0 start-0 z-[500] overflow-x-hidden overflow-y-auto">
		<div class="mt-7 sm:max-w-lg sm:w-full m-3 sm:mx-auto min-h-[calc(100%-3.5rem)] flex items-center">
			<div class="w-full flex flex-col bg-brand-950 border border-brand-700 shadow-sm rounded-xl">
				<div class="flex justify-between items-center py-3 px-4 border-b border-brand-700">
					<h3 class="font-bold text-white">Create a pack</h3>
					<button
						on:click={() => (showCreate = false)}
						type="button"
						class="flex justify-center items-center w-7 h-7 text-sm rounded-full text-white hover:bg-brand-700"
					>
						<span class="sr-only">Close</span>
						<svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
					</button>
				</div>
				<form on:submit|preventDefault={createPack} class="p-4 flex flex-col gap-y-4">
					<div>
						<label for="pack-name" class="block text-sm font-medium text-brand-300 mb-1">Name</label>
						<input
							id="pack-name"
							bind:value={name}
							placeholder="My RuneScape adventure"
							class="py-3 px-4 bg-brand-900 block w-full border border-brand-700 placeholder-brand-500 rounded-lg text-sm text-white focus:border-brand-400 focus:outline-none"
						/>
					</div>
					<div>
						<label for="pack-slug" class="block text-sm font-medium text-brand-300 mb-1">
							Slug <span class="text-brand-500">(used in the share URL, cannot be changed later)</span>
						</label>
						<input
							id="pack-slug"
							bind:value={slug}
							on:input={() => (slugTouched = true)}
							placeholder="my-runescape-adventure"
							class="py-3 px-4 bg-brand-900 block w-full border border-brand-700 placeholder-brand-500 rounded-lg text-sm text-white font-mono focus:border-brand-400 focus:outline-none"
						/>
					</div>

					{#if error}
						<p class="text-sm text-red-400">{error}</p>
					{/if}

					<div class="flex justify-end gap-x-2 pt-2">
						<button
							type="button"
							on:click={() => (showCreate = false)}
							class="py-2 px-3 text-sm font-medium rounded-lg border border-brand-700 text-white hover:bg-brand-800"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={creating}
							class="py-2 px-3 text-sm font-semibold rounded-lg bg-white text-brand-950 hover:bg-brand-100 disabled:opacity-50"
						>
							{creating ? 'Creating…' : 'Create pack'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
