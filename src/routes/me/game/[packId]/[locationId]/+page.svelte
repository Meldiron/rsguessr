<script lang="ts">
	import type { PageData } from './$types';
	import { browser } from '$app/environment';
	import { onMount, tick } from 'svelte';
	import { functions, storage } from '$lib/appwrite';
	import BlurImage from '$lib/BlurImage.svelte';
	import { createGameMap, gameMarkerIcon } from '$lib/gameMap';

	// @ts-ignore
	declare const L: any;

	export let data: PageData;

	const imageUrl = storage.getFileView('locationImages', data.location.imageId).toString();

	let showInfo = false;
	let showHint = false;
	let showResults = false;
	let results: any = {};
	let pickedLocation: any = null;

	// --- Corner map states --------------------------------------------------
	// `pinned`   keeps the mini-map big in the corner (otherwise it only grows on
	//            hover). `maximized` blows it up to the full size of the screenshot.
	let pinned = false;
	let maximized = false;
	let runescapeMap: any = null;

	onMount(() => {
		if (!browser) return;

		const icon = gameMarkerIcon(L);
		const markersGroup = L.layerGroup();

		const view = JSON.parse(data.location.view ?? '{}');

		runescapeMap = createGameMap(L, 'map', { mapId: view.map ?? -1 });

		runescapeMap.addLayer(markersGroup);

		runescapeMap.on('click', (e: any) => {
			markersGroup.clearLayers();
			L.marker(e.latlng, { icon }).addTo(markersGroup);
			pickedLocation = e.latlng;
		});

		refreshMap();
	});

	// The map container resizes via a CSS transition (pin / maximize / hover).
	// Instead of a few discrete invalidateSize() calls — which animate-pan and
	// "jump" — we follow the resize every frame while pinning the geographic
	// centre, so it stays put and grows smoothly.
	let resizeRaf = 0;
	async function refreshMap() {
		if (!browser || !runescapeMap) return;
		await tick();
		const map = runescapeMap;
		const center = map.getCenter();
		const zoom = map.getZoom();
		const start = performance.now();
		const duration = 360; // a touch longer than the 0.28s CSS transition

		if (resizeRaf) cancelAnimationFrame(resizeRaf);
		const step = (now: number) => {
			// pan:false keeps the top-left fixed; we then re-pin the centre.
			map.invalidateSize({ animate: false, pan: false });
			map.setView(center, zoom, { animate: false });
			resizeRaf = now - start < duration ? requestAnimationFrame(step) : 0;
		};
		resizeRaf = requestAnimationFrame(step);
	}

	// Re-flow the map whenever its size changes.
	$: pinned, maximized, runescapeMap && refreshMap();

	function toggleInfo() {
		showInfo = !showInfo;
	}

	function toggleHint() {
		showHint = !showHint;
	}

	function toggleResults() {
		showResults = !showResults;
	}

	let isSubmitting = false;
	async function submitLocation() {
		if (isSubmitting || !pickedLocation) {
			return;
		}

		isSubmitting = true;

		try {
			const response = await functions.createExecution(
				'guessLocation',
				JSON.stringify({
					locationId: data.location.$id,
					lat: pickedLocation.lat,
					lng: pickedLocation.lng
				}),
				undefined,
				undefined,
				undefined,
				{
					'content-type': 'application/json'
				}
			);

			if (response.status !== 'completed') {
				throw new Error(response.responseBody);
			}

			const body = JSON.parse(response.responseBody);
			if (!body.ok) {
				throw new Error(body.message);
			}

			if (body.correct) {
				results = {
					type: 'correct',
					hardMode: body.hardMode
				};
			} else {
				results = {
					type: 'wrong'
				};
			}
		} catch (err: any) {
			results = {
				type: 'error',
				message: err.message
			};
		} finally {
			isSubmitting = false;
			showResults = true;
		}
	}
</script>

<div class="max-w-[95rem] px-3 pt-6 sm:px-6 lg:px-8 mx-auto">
	<div class="game-root" data-pinned={pinned ? 'true' : null} data-maximized={maximized ? 'true' : null}>
		<!-- ================= IMAGE / PLACE ================= -->
		<div class="image-pane">
			<BlurImage
				src={imageUrl}
				blurhash={data.blurhash}
				alt="Location"
				fit="contain"
				class="w-full h-full"
			/>

			<!-- Floating controls over the image -->
			<div class="controls-top">
				<a href={`/me/game/${data.pack.$id}`} class="ctrl-btn" title="Back to pack" aria-label="Back">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
					</svg>
				</a>

				<div class="flex items-center gap-2">
					<button type="button" class="ctrl-btn" on:click={toggleHint} title="Show hint">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
						</svg>
						<span class="hidden sm:inline">Hint</span>
					</button>
					<button type="button" class="ctrl-btn" on:click={toggleInfo} title="How to play" aria-label="Info">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
							<path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
						</svg>
					</button>
				</div>
			</div>

		</div>

		<!-- ================= MAP / GUESS ================= -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="map-pane" on:mouseenter={refreshMap} on:mouseleave={refreshMap}>
			<div class="map-pane-header">
				<span class="map-pane-title">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 text-brand-300">
						<path fill-rule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clip-rule="evenodd" />
					</svg>
					Where is this?
				</span>

				<div class="flex items-center gap-1.5">
					<!-- Pin: keep the map big in the corner -->
					{#if !maximized}
						<button
							type="button"
							class="map-toggle"
							class:active={pinned}
							on:click={() => (pinned = !pinned)}
							title={pinned ? 'Unpin map' : 'Pin map big in the corner'}
							aria-label={pinned ? 'Unpin map' : 'Pin map big in the corner'}
						>
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
								<path d="M16 3a1 1 0 0 1 .117 1.993L16 5h-.382l1.724 6.03.02.083.553 1.382A1 1 0 0 1 17 13.93V14h-4v6a1 1 0 0 1-1.993.117L11 20v-6H7a1 1 0 0 1-.943-1.342l.05-.116.553-1.382L8.382 5H8a1 1 0 0 1-.117-1.993L8 3h8Z" />
							</svg>
						</button>
					{/if}

					<!-- Maximize: blow the map up to the full screenshot size -->
					<button
						type="button"
						class="map-toggle"
						class:active={maximized}
						on:click={() => (maximized = !maximized)}
						title={maximized ? 'Minimize map' : 'Maximize map'}
						aria-label={maximized ? 'Minimize map' : 'Maximize map'}
					>
						{#if maximized}
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
								<path stroke-linecap="round" stroke-linejoin="round" d="M9 9 4.5 4.5M9 9V4.5M9 9H4.5m10.5 0 4.5-4.5M15 9V4.5M15 9h4.5M9 15l-4.5 4.5M9 15v4.5M9 15H4.5m10.5 0 4.5 4.5M15 15v4.5m0-4.5h4.5" />
							</svg>
						{:else}
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
								<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
							</svg>
						{/if}
					</button>
				</div>
			</div>

			<div class="map-el-wrap">
				<div id="map" class="map-el" />
			</div>

			<div class="map-pane-footer">
				<button
					type="button"
					class="guess-btn"
					on:click={submitLocation}
					disabled={!pickedLocation || isSubmitting}
				>
					{#if isSubmitting}
						Submitting…
					{:else if pickedLocation}
						Submit Guess
					{:else}
						Click the map to drop a pin
					{/if}
				</button>
			</div>
		</div>
	</div>
</div>

{#if showHint}
	<div
		class="bg-black bg-opacity-80 w-full h-full fixed top-0 start-0 z-[500] overflow-x-hidden overflow-y-auto"
	>
		<div
			class="mt-7 opacity-100 duration-500 ease-out transition-all sm:max-w-lg sm:w-full m-3 sm:mx-auto min-h-[calc(100%-3.5rem)] flex items-center"
		>
			<div
				class="w-full flex flex-col bg-white border shadow-sm rounded-xl dark:bg-brand-950 dark:border-brand-700 dark:shadow-brand-700/[.7]"
			>
				<div class="flex justify-between items-center py-3 px-4 border-b dark:border-brand-700">
					<h3 class="font-bold text-brand-800 dark:text-white">Hint</h3>
					<button
						on:click={toggleHint}
						type="button"
						class="flex justify-center items-center w-7 h-7 text-sm font-semibold rounded-full border border-transparent text-brand-800 hover:bg-brand-100 disabled:opacity-50 disabled:pointer-events-none dark:text-white dark:hover:bg-brand-700 dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-brand-600"
					>
						<span class="sr-only">Close</span>
						<svg
							class="flex-shrink-0 w-4 h-4"
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
						>
					</button>
				</div>
				<div class="p-4 overflow-y-auto">
					<div
						class="bg-blue-100 border border-blue-200 text-brand-800 rounded-lg p-4 dark:bg-blue-800/25 dark:border-blue-900 dark:text-white"
						role="alert"
					>
						<div class="flex">
							<div class="flex-shrink-0">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke-width="1.5"
									stroke="currentColor"
									class="w-4 h-4 mt-1 text-blue-500"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
									/>
								</svg>
							</div>
							<div class="ms-3">
								<h3 class="font-semibold">{data.location.hint}</h3>
							</div>
						</div>
					</div>
				</div>
				<div class="flex justify-end items-center gap-x-2 py-3 px-4 border-t dark:border-brand-700">
					<button
						type="button"
						on:click={toggleHint}
						class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-brand-200 bg-white text-brand-800 shadow-sm hover:bg-brand-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-brand-900 dark:border-brand-700 dark:text-white dark:hover:bg-brand-800 dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-brand-600"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

{#if showResults}
	<div
		class="bg-black bg-opacity-80 w-full h-full fixed top-0 start-0 z-[500] overflow-x-hidden overflow-y-auto"
	>
		<div
			class="mt-7 opacity-100 duration-500 ease-out transition-all sm:max-w-lg sm:w-full m-3 sm:mx-auto min-h-[calc(100%-3.5rem)] flex items-center"
		>
			<div
				class="w-full flex flex-col bg-white border shadow-sm rounded-xl dark:bg-brand-950 dark:border-brand-700 dark:shadow-brand-700/[.7]"
			>
				<div class="flex justify-between items-center py-3 px-4 border-b dark:border-brand-700">
					<h3 class="font-bold text-brand-800 dark:text-white">Game Results</h3>
					<button
						on:click={toggleResults}
						type="button"
						class="flex justify-center items-center w-7 h-7 text-sm font-semibold rounded-full border border-transparent text-brand-800 hover:bg-brand-100 disabled:opacity-50 disabled:pointer-events-none dark:text-white dark:hover:bg-brand-700 dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-brand-600"
					>
						<span class="sr-only">Close</span>
						<svg
							class="flex-shrink-0 w-4 h-4"
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
						>
					</button>
				</div>
				{#if results.type === 'wrong'}
					<div class="p-4 overflow-y-auto">
						<div
							class="bg-red-100 border border-red-200 text-brand-800 rounded-lg p-4 dark:bg-red-800/25 dark:border-red-900 dark:text-white"
							role="alert"
						>
							<div class="flex">
								<div class="flex-shrink-0">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 24 24"
										fill="currentColor"
										class="w-4 h-4 mt-1 text-red-500"
									>
										<path
											fill-rule="evenodd"
											d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z"
											clip-rule="evenodd"
										/>
									</svg>
								</div>
								<div class="ms-3">
									<h3 class="font-semibold">Your guess was incorrect.</h3>
									<div class="mt-2 text-sm text-white opacity-90 leading-relaxed">
										Give it another try! If you feel stuck, you can check a hint.
									</div>
								</div>
							</div>
						</div>
					</div>
					<div class="flex justify-end items-center gap-x-2 py-3 px-4 border-t dark:border-brand-700">
						<a
							href={`/me/game/${data.pack.$id}`}
							class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-brand-200 bg-white text-brand-800 shadow-sm hover:bg-brand-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-brand-900 dark:border-brand-700 dark:text-white dark:hover:bg-brand-800 dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-brand-600"
						>
							Another Location
						</a>
						<button
							on:click={toggleResults}
							type="button"
							class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-brand-600"
						>
							Try Again
						</button>
					</div>
				{:else if results.type === 'correct'}
					<div class="p-4 overflow-y-auto">
						<div
							class={`border text-brand-800 rounded-lg p-4 dark:text-white ${
								results.hardMode
									? 'bg-purple-800/25 border-purple-900'
									: 'bg-green-800/25 border-green-900'
							}`}
							role="alert"
						>
							<div class="flex">
								<div class="flex-shrink-0">
									{#if results.hardMode}
										<svg
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 24 24"
											fill="currentColor"
											class="w-4 h-4 mt-1 text-purple-500"
										>
											<path
												fill-rule="evenodd"
												d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
												clip-rule="evenodd"
											/>
										</svg>
									{:else}
										<svg
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											stroke-width="1.5"
											stroke="currentColor"
											class={`mt-1 w-4 h-4 text-green-500`}
										>
											<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
										</svg>
									{/if}
								</div>
								<div class="ms-3">
									<h3 class="font-semibold">Your guess was correct.</h3>
									<div class="mt-2 text-sm text-white opacity-90 leading-relaxed">
										{#if results.hardMode}
											Amazing! Your guess was perfect and you completed hardmode.
										{:else}
											Great job! Your guess was good, but to complete hardmode, you must be spot on.
										{/if}
									</div>
								</div>
							</div>
						</div>
					</div>
					<div class="flex justify-end items-center gap-x-2 py-3 px-4 border-t dark:border-brand-700">
						{#if !results.hardMode}
							<button
								type="button"
								on:click={toggleResults}
								class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-brand-200 bg-white text-brand-800 shadow-sm hover:bg-brand-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-brand-900 dark:border-brand-700 dark:text-white dark:hover:bg-brand-800 dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-brand-600"
							>
								Try Again
							</button>
						{/if}
						<a
							href={`/me/game/${data.pack.$id}`}
							class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border text-black border-transparent bg-white hover:bg-brand-100 dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-brand-600"
						>
							Next Location
						</a>
					</div>
				{:else if results.type === 'error'}
					<div class="p-4 overflow-y-auto">
						<div
							class="bg-red-100 border border-red-200 text-brand-800 rounded-lg p-4 dark:bg-red-800/25 dark:border-red-900 dark:text-white"
							role="alert"
						>
							<div class="flex">
								<div class="flex-shrink-0">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 24 24"
										fill="currentColor"
										class="w-4 h-4 mt-1 text-red-500"
									>
										<path
											fill-rule="evenodd"
											d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z"
											clip-rule="evenodd"
										/>
									</svg>
								</div>
								<div class="ms-3">
									<h3 class="font-semibold">Something went wrong.</h3>
									<div class="mt-2 text-sm text-white opacity-90 leading-relaxed">
										{results.message}
									</div>
								</div>
							</div>
						</div>
					</div>
					<div class="flex justify-end items-center gap-x-2 py-3 px-4 border-t dark:border-brand-700">
						<button
							on:click={toggleResults}
							type="button"
							class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-brand-600"
						>
							Try Again
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

{#if showInfo}
	<div
		class="bg-black bg-opacity-80 w-full h-full fixed top-0 start-0 z-[500] overflow-x-hidden overflow-y-auto"
	>
		<div
			class="mt-7 opacity-100 duration-500 ease-out transition-all sm:max-w-lg sm:w-full m-3 sm:mx-auto min-h-[calc(100%-3.5rem)] flex items-center"
		>
			<div
				class="w-full flex flex-col bg-white border shadow-sm rounded-xl dark:bg-brand-950 dark:border-brand-700 dark:shadow-brand-700/[.7]"
			>
				<div class="flex justify-between items-center py-3 px-4 border-b dark:border-brand-700">
					<h3 class="font-bold text-brand-800 dark:text-white">Info</h3>
					<button
						on:click={toggleInfo}
						type="button"
						class="flex justify-center items-center w-7 h-7 text-sm font-semibold rounded-full border border-transparent text-brand-800 hover:bg-brand-100 disabled:opacity-50 disabled:pointer-events-none dark:text-white dark:hover:bg-brand-700 dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-brand-600"
					>
						<span class="sr-only">Close</span>
						<svg
							class="flex-shrink-0 w-4 h-4"
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
						>
					</button>
				</div>
				<div class="p-4 overflow-y-auto">
					<div
						class="bg-brand-100 border border-brand-200 text-brand-800 rounded-lg p-4 dark:bg-brand-800/25 dark:border-brand-900 dark:text-white"
						role="alert"
					>
						<div class="flex">
							<div class="flex-shrink-0">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke-width="1.5"
									stroke="currentColor"
									class="w-4 h-4 mt-1 text-brand-500"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
									/>
								</svg>
							</div>
							<div class="ms-3">
								<h3 class="font-semibold">
									When guessing the location, always guess the location of camera which took the
									screenshot. Your guess can be up to 15 meters off to make correct guess, but to
									make hardmode guess, you can only be up to 5 meters off.
								</h3>
							</div>
						</div>
					</div>
				</div>
				<div class="flex justify-end items-center gap-x-2 py-3 px-4 border-t dark:border-brand-700">
					<button
						type="button"
						on:click={toggleInfo}
						class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-brand-200 bg-white text-brand-800 shadow-sm hover:bg-brand-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-brand-900 dark:border-brand-700 dark:text-white dark:hover:bg-brand-800 dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-brand-600"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	/* ---------------------------------------------------------------------- */
	/* Shared pieces                                                          */
	/* ---------------------------------------------------------------------- */
	.game-root {
		position: relative;
		width: 100%;
	}

	.image-pane {
		position: relative;
		width: 100%;
		height: min(74vh, 780px);
		background: #000;
		border: 1px solid #3b3b3b;
		border-radius: 1rem;
		overflow: hidden;
	}

	.controls-top {
		position: absolute;
		top: 0.75rem;
		left: 0.75rem;
		right: 0.75rem;
		z-index: 20;
		display: flex;
		align-items: center;
		justify-content: space-between;
		pointer-events: none;
	}
	.controls-top :global(.ctrl-btn) {
		pointer-events: auto;
	}

	:global(.ctrl-btn) {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.5rem 0.7rem;
		font-size: 0.8rem;
		font-weight: 600;
		color: #fff;
		background: rgba(0, 0, 0, 0.55);
		border: 1px solid rgba(255, 255, 255, 0.14);
		border-radius: 0.6rem;
		backdrop-filter: blur(6px);
		transition: background 0.15s ease, border-color 0.15s ease;
	}
	:global(.ctrl-btn:hover) {
		background: rgba(0, 0, 0, 0.75);
		border-color: rgba(255, 255, 255, 0.35);
	}

	/* The map panel ------------------------------------------------------- */
	.map-pane {
		display: flex;
		flex-direction: column;
		background: #111111;
		border: 1px solid #3b3b3b;
		border-radius: 1rem;
		overflow: hidden;
		box-shadow: 0 18px 40px -12px rgba(0, 0, 0, 0.7);
	}
	.map-pane-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.45rem 0.7rem;
		border-bottom: 1px solid #303030;
		flex: none;
	}
	.map-pane-title {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.8rem;
		font-weight: 600;
		color: #d4d4d4;
	}
	.map-toggle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.85rem;
		height: 1.85rem;
		color: #bdbdbd;
		border-radius: 0.5rem;
		transition: background 0.15s ease, color 0.15s ease;
	}
	.map-toggle:hover {
		background: #303030;
		color: #fff;
	}
	.map-el-wrap {
		position: relative;
		flex: 1 1 auto;
		min-height: 0;
	}
	.map-el {
		width: 100%;
		height: 100%;
		background: #000;
	}
	.map-pane-footer {
		flex: none;
		padding: 0.6rem;
		border-top: 1px solid #303030;
	}
	.guess-btn {
		width: 100%;
		padding: 0.7rem 1rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: #000;
		background: #fff;
		border-radius: 0.6rem;
		transition: background 0.15s ease, opacity 0.15s ease;
	}
	.guess-btn:hover:not(:disabled) {
		background: #d4d4d4;
	}
	.guess-btn:disabled {
		background: #303030;
		color: #737373;
		cursor: not-allowed;
	}

	.map-toggle.active {
		background: #303030;
		color: #fff;
	}

	/* ---------------------------------------------------------------------- */
	/* Corner map: small mini-map that grows on hover or when pinned, and fills */
	/* the whole screenshot when maximized.                                    */
	/* ---------------------------------------------------------------------- */
	.map-pane {
		position: absolute;
		right: 1rem;
		bottom: 1rem;
		z-index: 30;
		width: 20rem;
		height: 15rem;
		transition: width 0.28s ease, height 0.28s ease, top 0.28s ease, left 0.28s ease,
			right 0.28s ease, bottom 0.28s ease;
	}
	/* Big in the corner (hover preview or pinned). */
	@media (hover: hover) and (min-width: 768px) {
		.game-root:not([data-maximized]) .map-pane:hover {
			width: 34rem;
			height: 30rem;
		}
	}
	.game-root[data-pinned]:not([data-maximized]) .map-pane {
		width: 34rem;
		height: 30rem;
	}
	/* Maximized: as big as the screenshot itself. */
	.game-root[data-maximized] .map-pane {
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		width: auto;
		height: auto;
	}

	/* ---------------------------------------------------------------------- */
	/* Mobile                                                                 */
	/* ---------------------------------------------------------------------- */
	@media (max-width: 767px) {
		.image-pane {
			height: 56vh;
		}
		.map-pane {
			width: 11rem;
			height: 9rem;
		}
		.game-root[data-pinned]:not([data-maximized]) .map-pane {
			width: calc(100vw - 1.5rem);
			height: 60vh;
			right: 0.75rem;
			bottom: 0.75rem;
		}
	}
</style>
