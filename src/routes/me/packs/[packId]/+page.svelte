<script lang="ts">
	import type { PageData } from './$types';
	import { browser } from '$app/environment';
	import { tick } from 'svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { storage } from '$lib/appwrite';
	import { ID, Permission, Role } from 'appwrite';
	import { callApi } from '$lib/api';
	import { createGameMap, gameMarkerIcon } from '$lib/gameMap';
	import { GAME_MAPS, getMapInfo, DEFAULT_MAP_ID } from '$lib/mapList';

	// @ts-ignore - global Leaflet from app.html
	declare const L: any;

	export let data: PageData;

	$: pack = data.pack;
	$: locations = data.locations;

	// --- Pack name editing --------------------------------------------------
	let name = data.pack.name;
	let savingName = false;
	// Reset the field only when we actually switch to a different pack (the
	// component is reused across [packId] navigations), preserving in-flight edits.
	let lastPackId = data.pack.$id;
	$: if (data.pack.$id !== lastPackId) {
		lastPackId = data.pack.$id;
		name = data.pack.name;
	}
	$: nameDirty = name.trim() !== pack.name && name.trim().length > 0;

	async function saveName() {
		if (!nameDirty || savingName) return;
		savingName = true;
		try {
			await callApi('updatePack', { packId: pack.$id, name: name.trim() });
			await invalidateAll();
		} catch (err: any) {
			alert(`Could not rename pack: ${err.message}`);
		} finally {
			savingName = false;
		}
	}

	let copied = false;
	function copySlug() {
		navigator.clipboard?.writeText(pack.$id);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}

	// --- Share --------------------------------------------------------------
	$: shareUrl = browser
		? `${window.location.origin}/me/game/${pack.$id}`
		: `/me/game/${pack.$id}`;
	let shareCopied = false;
	function copyShareLink() {
		navigator.clipboard?.writeText(shareUrl);
		shareCopied = true;
		setTimeout(() => (shareCopied = false), 1500);
	}

	// --- Delete pack --------------------------------------------------------
	let showDeleteConfirm = false;
	let deletingPack = false;
	let deleteError = '';

	async function deletePack() {
		deletingPack = true;
		deleteError = '';
		try {
			await callApi('deletePack', { packId: pack.$id });
			await goto('/me/packs');
		} catch (err: any) {
			deleteError = `Could not delete pack: ${err.message}`;
			deletingPack = false;
		}
	}

	// --- Location add / edit modal -----------------------------------------
	let showModal = false;
	let editing: any = null;
	let modalHint = '';
	let modalFile: File | null = null;
	let modalPreview = '';
	let localPreview = '';
	let picked: { lat: number; lng: number } | null = null;
	let modalBusy = false;
	let modalError = '';

	let pickMap: any = null;
	let pickMarker: any = null;
	let fileInput: HTMLInputElement;

	// --- Map-layer combobox -------------------------------------------------
	let mapId = DEFAULT_MAP_ID;
	let mapQuery = '';
	let mapDropdownOpen = false;
	$: filteredMaps = (
		mapQuery.trim()
			? GAME_MAPS.filter((m) => m.name.toLowerCase().includes(mapQuery.trim().toLowerCase()))
			: GAME_MAPS
	).slice(0, 60);

	function selectMap(id: number) {
		if (id !== mapId) {
			mapId = id;
			// The clicked answer lives in the chosen map's coordinate space, so a
			// pin from another layer is no longer meaningful.
			picked = null;
			rebuildPickMap();
		}
		mapQuery = getMapInfo(id).name;
		mapDropdownOpen = false;
	}

	function thumb(imageId: string) {
		return storage.getFileView('locationImages', imageId).toString();
	}

	async function openModal(location: any = null) {
		editing = location;
		modalError = '';
		modalBusy = false;
		modalFile = null;
		modalHint = location?.hint ?? '';
		const coord = location ? data.coords[location.$id] : null;
		picked = coord ? { lat: coord.lat, lng: coord.lng } : null;
		// Restore the saved map layer (view is stringified JSON with a `map` int).
		mapId = DEFAULT_MAP_ID;
		if (location?.view) {
			try {
				const parsed = JSON.parse(location.view);
				if (typeof parsed.map === 'number') mapId = parsed.map;
			} catch {
				/* ignore malformed view */
			}
		}
		mapQuery = getMapInfo(mapId).name;
		mapDropdownOpen = false;
		clearLocalPreview();
		modalPreview = location ? thumb(location.imageId) : '';
		showModal = true;
		await tick();
		initPickMap();
	}

	function initPickMap() {
		if (!browser || pickMap) return;
		pickMap = createGameMap(L, 'loc-pick-map', { mapId });
		const icon = gameMarkerIcon(L);
		if (picked) {
			pickMarker = L.marker([picked.lat, picked.lng], { icon }).addTo(pickMap);
			// Centre on the existing marker so the editor opens on the saved spot.
			pickMap.setView([picked.lat, picked.lng], pickMap.getZoom());
		}
		pickMap.on('click', (e: any) => {
			if (pickMarker) pickMarker.setLatLng(e.latlng);
			else pickMarker = L.marker(e.latlng, { icon }).addTo(pickMap);
			picked = { lat: e.latlng.lat, lng: e.latlng.lng };
		});
		for (const delay of [50, 300]) setTimeout(() => pickMap && pickMap.invalidateSize(), delay);
	}

	// Tear down and recreate the picker map after the layer changes.
	async function rebuildPickMap() {
		if (pickMap) {
			pickMap.remove();
			pickMap = null;
		}
		pickMarker = null;
		await tick();
		initPickMap();
	}

	function clearLocalPreview() {
		if (localPreview) {
			URL.revokeObjectURL(localPreview);
			localPreview = '';
		}
	}

	function closeModal() {
		showModal = false;
		if (pickMap) {
			pickMap.remove();
			pickMap = null;
		}
		pickMarker = null;
		clearLocalPreview();
	}

	function setFile(file: File | undefined | null) {
		if (!file) return;
		if (!/^image\/(png|jpe?g)$/.test(file.type)) {
			modalError = 'Please choose a PNG or JPG image.';
			return;
		}
		if (file.size > 10 * 1024 * 1024) {
			modalError = 'Image must be under 10 MB.';
			return;
		}
		modalError = '';
		modalFile = file;
		clearLocalPreview();
		localPreview = URL.createObjectURL(file);
		modalPreview = localPreview;
	}

	function onFileChange(e: Event) {
		setFile((e.target as HTMLInputElement).files?.[0]);
	}

	let dragging = false;
	function onDragOver(e: DragEvent) {
		e.preventDefault();
		dragging = true;
	}
	function onDragLeave() {
		dragging = false;
	}
	function onDrop(e: DragEvent) {
		e.preventDefault();
		dragging = false;
		setFile(e.dataTransfer?.files?.[0]);
	}

	async function saveLocation() {
		if (modalBusy) return;
		modalError = '';

		if (!modalHint.trim()) {
			modalError = 'Please enter a hint.';
			return;
		}
		if (!picked) {
			modalError = 'Click the map to mark the correct location.';
			return;
		}
		if (!editing && !modalFile) {
			modalError = 'Please choose an image.';
			return;
		}

		modalBusy = true;
		try {
			let imageId: string | undefined = editing?.imageId;

			if (modalFile) {
				const uploaded = await storage.createFile(
					'locationImages',
					ID.unique(),
					modalFile,
					// Players can view it; the api function (API key) manages deletion.
					[Permission.read(Role.users())]
				);
				imageId = uploaded.$id;
			}

			const view = JSON.stringify({ map: mapId });

			if (editing) {
				await callApi('updateLocation', {
					locationId: editing.$id,
					hint: modalHint.trim(),
					imageId,
					lat: picked.lat,
					lng: picked.lng,
					view
				});
			} else {
				await callApi('createLocation', {
					packId: pack.$id,
					imageId,
					hint: modalHint.trim(),
					lat: picked.lat,
					lng: picked.lng,
					view
				});
			}

			closeModal();
			await invalidateAll();
		} catch (err: any) {
			modalError = err.message;
			modalBusy = false;
		}
	}

	// --- Delete location confirmation --------------------------------------
	let locationToDelete: any = null;
	let deletingLocation = false;
	let deleteLocationError = '';

	function confirmDeleteLocation(location: any) {
		locationToDelete = location;
		deleteLocationError = '';
	}

	async function deleteLocation() {
		if (deletingLocation || !locationToDelete) return;
		deletingLocation = true;
		deleteLocationError = '';
		try {
			await callApi('deleteLocation', { locationId: locationToDelete.$id });
			locationToDelete = null;
			await invalidateAll();
		} catch (err: any) {
			deleteLocationError = `Could not delete location: ${err.message}`;
		} finally {
			deletingLocation = false;
		}
	}
</script>

<div class="max-w-[85rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14 mx-auto flex flex-col gap-y-10">
	<!-- Header -->
	<div class="flex flex-col gap-y-6">
		<a
			href="/me/packs"
			class="text-brand-400 hover:text-brand-200 text-sm font-medium inline-flex items-center gap-x-2 w-fit"
		>
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
			</svg>
			All packs
		</a>

		<div class="flex flex-wrap gap-4 items-end justify-between">
			<div class="flex-1 min-w-[260px]">
				<label for="pack-name" class="block text-sm font-medium text-brand-400 mb-1">Pack name</label>
				<div class="flex gap-x-2">
					<input
						id="pack-name"
						bind:value={name}
						class="py-3 px-4 bg-brand-900 block w-full border border-brand-700 rounded-lg text-lg font-semibold text-white focus:border-brand-400 focus:outline-none"
					/>
					<button
						type="button"
						on:click={saveName}
						disabled={!nameDirty || savingName}
						class="shrink-0 py-2 px-4 text-sm font-semibold rounded-lg bg-white text-brand-950 hover:bg-brand-100 disabled:opacity-40"
					>
						{savingName ? 'Saving…' : 'Save'}
					</button>
				</div>
				<button
					type="button"
					on:click={copySlug}
					title="Copy slug"
					class="mt-2 inline-flex items-center gap-x-2 text-sm text-brand-500 hover:text-brand-300 font-mono"
				>
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
						<path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
					</svg>
					{pack.$id}
					{#if copied}<span class="text-green-400">copied!</span>{/if}
				</button>
			</div>
		</div>
	</div>

	<!-- Locations -->
	<div class="flex flex-col gap-y-5">
		<div class="flex items-center justify-between">
			<h2 class="text-2xl font-bold text-brand-50">
				Locations <span class="text-brand-500 text-lg font-medium">({locations.length})</span>
			</h2>
			<button
				type="button"
				on:click={() => openModal()}
				class="inline-flex items-center gap-x-2 py-2.5 px-4 text-sm font-medium rounded-md bg-white text-brand-950 hover:bg-brand-100"
			>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
				</svg>
				Add location
			</button>
		</div>

		{#if locations.length === 0}
			<div class="border border-dashed border-brand-700 rounded-2xl py-16 text-center">
				<p class="text-brand-400">No locations yet. Add one to make this pack playable.</p>
			</div>
		{:else}
			<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each locations as location, i (location.$id)}
					<div
						class="group flex flex-col rounded-2xl overflow-hidden bg-brand-950 border border-brand-800 transition duration-200 hover:border-brand-600 hover:shadow-xl hover:shadow-black/40"
					>
						<div class="relative aspect-video overflow-hidden bg-black">
							<img
								src={thumb(location.imageId)}
								alt={`Location ${i + 1}`}
								class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
							/>
							<div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
							<span
								class="absolute top-3 left-3 inline-flex items-center justify-center min-w-[1.75rem] h-7 px-2 rounded-full bg-black/55 backdrop-blur-sm border border-white/10 text-xs font-semibold text-white"
							>
								#{i + 1}
							</span>
						</div>

						<div class="flex flex-col flex-1 p-4">
							<div class="flex items-start gap-x-2 flex-1">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 mt-0.5 shrink-0 text-brand-500">
									<path fill-rule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clip-rule="evenodd" />
								</svg>
								<p class="text-sm text-brand-200 line-clamp-3 leading-relaxed">{location.hint}</p>
							</div>

							<div class="flex items-center gap-x-2 mt-4 pt-3 border-t border-brand-800">
								<button
									type="button"
									on:click={() => openModal(location)}
									class="flex-1 inline-flex items-center justify-center gap-x-1.5 py-2 text-sm font-medium rounded-lg text-white bg-brand-900 hover:bg-brand-800 transition"
								>
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
										<path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
									</svg>
									Edit
								</button>
								<button
									type="button"
									on:click={() => confirmDeleteLocation(location)}
									title="Delete location"
									aria-label="Delete location"
									class="inline-flex items-center justify-center w-9 h-9 rounded-lg text-red-300 hover:bg-red-950/40 transition"
								>
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
										<path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
									</svg>
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Share -->
	<div class="border border-brand-800 rounded-2xl bg-brand-950 p-6 flex flex-col gap-y-4">
		<div class="flex items-start gap-x-3">
			<div class="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-brand-900 border border-brand-700">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-brand-200">
					<path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
				</svg>
			</div>
			<div>
				<h2 class="text-lg font-bold text-brand-50">Share this pack</h2>
				<p class="mt-1 text-sm text-brand-400 max-w-xl">
					Anyone with the link can play your pack. Share it with friends or the community!
				</p>
			</div>
		</div>

		<div class="flex flex-wrap gap-3 items-center">
			<input
				readonly
				value={shareUrl}
				on:focus={(e) => e.currentTarget.select()}
				class="flex-1 min-w-[220px] py-2.5 px-3 bg-brand-900 border border-brand-700 rounded-lg text-sm text-brand-200 font-mono"
			/>
			<button
				type="button"
				on:click={copyShareLink}
				class="shrink-0 py-2.5 px-4 text-sm font-semibold rounded-md bg-white text-brand-950 hover:bg-brand-100"
			>
				{shareCopied ? 'Copied!' : 'Copy link'}
			</button>
			{#if locations.length > 0}
				<a
					href={`/me/game/${pack.$id}`}
					class="shrink-0 py-2.5 px-4 text-sm font-medium rounded-md border border-brand-700 text-white hover:border-brand-400"
				>
					Open in game
				</a>
			{/if}
		</div>
	</div>

	<!-- Danger zone -->
	<div class="border border-red-900/60 rounded-2xl bg-red-950/20 p-6 flex flex-wrap gap-4 items-center justify-between">
		<div>
			<h2 class="text-lg font-bold text-red-300">Delete this pack</h2>
			<p class="mt-1 text-sm text-brand-400 max-w-xl">
				Permanently removes this pack and all of its locations, answers and images. This action
				cannot be undone.
			</p>
		</div>
		<button
			type="button"
			on:click={() => (showDeleteConfirm = true)}
			class="shrink-0 py-2.5 px-4 text-sm font-semibold rounded-md border border-red-800 text-red-200 hover:bg-red-900/40"
		>
			Delete pack
		</button>
	</div>
</div>

<!-- Delete confirmation -->
{#if showDeleteConfirm}
	<div class="bg-black bg-opacity-80 w-full h-full fixed top-0 start-0 z-[500] overflow-x-hidden overflow-y-auto">
		<div class="mt-7 sm:max-w-lg sm:w-full m-3 sm:mx-auto min-h-[calc(100%-3.5rem)] flex items-center">
			<div class="w-full flex flex-col bg-brand-950 border border-brand-700 shadow-sm rounded-xl">
				<div class="flex justify-between items-center py-3 px-4 border-b border-brand-700">
					<h3 class="font-bold text-white">Delete pack?</h3>
					<button
						on:click={() => (showDeleteConfirm = false)}
						disabled={deletingPack}
						type="button"
						class="flex justify-center items-center w-7 h-7 text-sm rounded-full text-white hover:bg-brand-700 disabled:opacity-50"
					>
						<span class="sr-only">Close</span>
						<svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
					</button>
				</div>
				<div class="p-4">
					<div class="bg-red-800/25 border border-red-900 text-white rounded-lg p-4" role="alert">
						<div class="flex">
							<div class="flex-shrink-0">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mt-0.5 text-red-400">
									<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
								</svg>
							</div>
							<div class="ms-3">
								<h3 class="font-semibold">This will delete “{pack.name}” for good.</h3>
								<div class="mt-2 text-sm text-white/90 leading-relaxed">
									{locations.length}
									{locations.length === 1 ? 'location' : 'locations'}, along with their answers and
									images, will be permanently removed. Players will no longer be able to play this pack.
								</div>
							</div>
						</div>
					</div>
					{#if deleteError}
						<p class="mt-3 text-sm text-red-400">{deleteError}</p>
					{/if}
				</div>
				<div class="flex justify-end items-center gap-x-2 py-3 px-4 border-t border-brand-700">
					<button
						type="button"
						on:click={() => (showDeleteConfirm = false)}
						disabled={deletingPack}
						class="py-2 px-3 text-sm font-medium rounded-lg border border-brand-700 text-white hover:bg-brand-800 disabled:opacity-50"
					>
						Cancel
					</button>
					<button
						type="button"
						on:click={deletePack}
						disabled={deletingPack}
						class="py-2 px-3 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
					>
						{deletingPack ? 'Deleting…' : 'Delete pack'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Delete location confirmation -->
{#if locationToDelete}
	<div class="bg-black bg-opacity-80 w-full h-full fixed top-0 start-0 z-[500] overflow-x-hidden overflow-y-auto">
		<div class="mt-7 sm:max-w-lg sm:w-full m-3 sm:mx-auto min-h-[calc(100%-3.5rem)] flex items-center">
			<div class="w-full flex flex-col bg-brand-950 border border-brand-700 shadow-sm rounded-xl">
				<div class="flex justify-between items-center py-3 px-4 border-b border-brand-700">
					<h3 class="font-bold text-white">Delete location?</h3>
					<button
						on:click={() => (locationToDelete = null)}
						disabled={deletingLocation}
						type="button"
						class="flex justify-center items-center w-7 h-7 text-sm rounded-full text-white hover:bg-brand-700 disabled:opacity-50"
					>
						<span class="sr-only">Close</span>
						<svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
					</button>
				</div>
				<div class="p-4">
					<div class="bg-red-800/25 border border-red-900 text-white rounded-lg p-4" role="alert">
						<div class="flex">
							<div class="flex-shrink-0">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mt-0.5 text-red-400">
									<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
								</svg>
							</div>
							<div class="ms-3">
								<h3 class="font-semibold">This location will be removed for good.</h3>
								<div class="mt-2 text-sm text-white/90 leading-relaxed">
									Its image and answer location will be permanently deleted from this pack.
								</div>
							</div>
						</div>
					</div>
					{#if deleteLocationError}
						<p class="mt-3 text-sm text-red-400">{deleteLocationError}</p>
					{/if}
				</div>
				<div class="flex justify-end items-center gap-x-2 py-3 px-4 border-t border-brand-700">
					<button
						type="button"
						on:click={() => (locationToDelete = null)}
						disabled={deletingLocation}
						class="py-2 px-3 text-sm font-medium rounded-lg border border-brand-700 text-white hover:bg-brand-800 disabled:opacity-50"
					>
						Cancel
					</button>
					<button
						type="button"
						on:click={deleteLocation}
						disabled={deletingLocation}
						class="py-2 px-3 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
					>
						{deletingLocation ? 'Deleting…' : 'Delete location'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Add / edit location modal -->
{#if showModal}
	<div class="bg-black bg-opacity-80 w-full h-full fixed top-0 start-0 z-[500] overflow-x-hidden overflow-y-auto">
		<div class="my-7 sm:max-w-3xl sm:w-full m-3 sm:mx-auto flex items-center">
			<div class="w-full flex flex-col bg-brand-950 border border-brand-700 shadow-sm rounded-xl">
				<div class="flex justify-between items-center py-3 px-4 border-b border-brand-700">
					<h3 class="font-bold text-white">{editing ? 'Edit location' : 'Add location'}</h3>
					<button
						on:click={closeModal}
						type="button"
						class="flex justify-center items-center w-7 h-7 text-sm rounded-full text-white hover:bg-brand-700"
					>
						<span class="sr-only">Close</span>
						<svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
					</button>
				</div>

				<div class="p-4 flex flex-col gap-y-5">
					<!-- Image -->
					<div>
						<span class="block text-sm font-medium text-brand-300 mb-1">Screenshot</span>
						<button
							type="button"
							on:click={() => fileInput.click()}
							on:dragover={onDragOver}
							on:dragleave={onDragLeave}
							on:drop={onDrop}
							class={`aspect-video w-full rounded-lg overflow-hidden bg-black border flex items-center justify-center transition-colors ${
								dragging ? 'border-brand-300 border-dashed bg-brand-900' : 'border-brand-700'
							}`}
						>
							{#if modalPreview}
								<img src={modalPreview} alt="Preview" class="w-full h-full object-contain pointer-events-none" />
							{:else}
								<div class="flex flex-col items-center gap-2 text-brand-500 text-sm pointer-events-none px-4 text-center">
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
										<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
									</svg>
									{dragging ? 'Drop image to upload' : 'Click to choose, or drag & drop an image'}
								</div>
							{/if}
						</button>
						<input
							bind:this={fileInput}
							type="file"
							accept="image/png,image/jpeg,image/jpg"
							on:change={onFileChange}
							class="hidden"
						/>
					</div>

					<!-- Map layer combobox -->
					<div class="relative">
						<label for="map-layer" class="block text-sm font-medium text-brand-300 mb-1">
							Map layer
						</label>
						<input
							id="map-layer"
							autocomplete="off"
							bind:value={mapQuery}
							on:focus={() => (mapDropdownOpen = true)}
							on:input={() => (mapDropdownOpen = true)}
							on:blur={() => setTimeout(() => (mapDropdownOpen = false), 150)}
							placeholder="Search a map…"
							class="py-3 px-4 bg-brand-900 block w-full border border-brand-700 placeholder-brand-500 rounded-lg text-sm text-white focus:border-brand-400 focus:outline-none"
						/>
						{#if mapDropdownOpen && filteredMaps.length > 0}
							<div
								class="absolute z-[1200] mt-1 w-full max-h-56 overflow-y-auto bg-brand-900 border border-brand-700 rounded-lg shadow-lg"
							>
								{#each filteredMaps as m (m.id)}
									<button
										type="button"
										on:click={() => selectMap(m.id)}
										class={`block w-full text-left px-4 py-2 text-sm hover:bg-brand-800 ${
											m.id === mapId ? 'text-white bg-brand-800' : 'text-brand-200'
										}`}
									>
										{m.name}
										<span class="text-brand-500 text-xs">#{m.id}</span>
									</button>
								{/each}
							</div>
						{/if}
					</div>

					<!-- Map picker -->
					<div>
						<div class="flex items-center justify-between mb-1">
							<span class="block text-sm font-medium text-brand-300">Correct location</span>
							<span class="text-xs text-brand-500">
								{picked ? `${Math.round(picked.lat)}, ${Math.round(picked.lng)}` : 'Click the map'}
							</span>
						</div>
						<div class="rounded-lg overflow-hidden border border-brand-700">
							<div id="loc-pick-map" style="height: 360px; background:#000;" />
						</div>
					</div>

					<!-- Hint -->
					<div>
						<label for="loc-hint" class="block text-sm font-medium text-brand-300 mb-1">Hint</label>
						<input
							id="loc-hint"
							bind:value={modalHint}
							maxlength="255"
							placeholder="A short clue for players"
							class="py-3 px-4 bg-brand-900 block w-full border border-brand-700 placeholder-brand-500 rounded-lg text-sm text-white focus:border-brand-400 focus:outline-none"
						/>
					</div>

					{#if modalError}
						<p class="text-sm text-red-400">{modalError}</p>
					{/if}
				</div>

				<div class="flex justify-end gap-x-2 py-3 px-4 border-t border-brand-700">
					<button
						type="button"
						on:click={closeModal}
						class="py-2 px-3 text-sm font-medium rounded-lg border border-brand-700 text-white hover:bg-brand-800"
					>
						Cancel
					</button>
					<button
						type="button"
						on:click={saveLocation}
						disabled={modalBusy}
						class="py-2 px-3 text-sm font-semibold rounded-lg bg-white text-brand-950 hover:bg-brand-100 disabled:opacity-50"
					>
						{modalBusy ? 'Saving…' : editing ? 'Save changes' : 'Add location'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
