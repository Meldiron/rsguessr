<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { account } from '$lib/appwrite';
	import type { LayoutData } from './$types';

	const faq = [
		{
			q: 'Can I play for free?',
			a: 'Yes, RSGuessr is 100% free and does not include any ads or trackers.'
		},
		{
			q: 'Why should I create an account?',
			a: "At the moment, there isn't anything special. In the future we plan to add leaderboards, profiles, achievements, and more. Registering an account shows your interest in the future of RSGuessr."
		},
		{
			q: 'Can I suggest a new location?',
			a: 'We would love new locations! Please leave your suggestions at contact@almostapps.eu'
		},
		{
			q: 'Does RSGuessr use cookies?',
			a: 'RSGuessr only uses cookies necessary for proper functionality.'
		},
		{
			q: 'Do you store my personal data?',
			a: 'All data provided is stored on Appwrite Cloud. For any requests regarding your data, please contact me at contact@almostapps.eu'
		},
		{
			q: 'Can we get in touch?',
			a: 'For general questions, message me on Discord: Meldiron. For any security, privacy, or administrative requests, you can reach me at contact@almostapps.eu'
		}
	];

	export let data: LayoutData;

	let loading: boolean = false;

	async function createGuestUser() {
		if (loading) {
			return;
		}

		loading = true;
		try {
			await account.createAnonymousSession();
			await invalidateAll();
			await goto('/me/game');
		} catch (error: any) {
			alert('Could not create guest user: ' + error.message);
		} finally {
			loading = false;
		}
	}
</script>

<!-- Hero -->
<div
	class="relative overflow-hidden before:absolute before:top-0 before:start-1/2 before:bg-no-repeat before:bg-top before:bg-cover before:w-full before:h-full before:-z-[1] before:transform before:-translate-x-1/2"
>
	<div class="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-10">
		<!--
		<div class="flex justify-center">
			<a
				href="https://www.osrsguessr.com/"
				target="_blank"
				class="hover:bg-brand-800 inline-flex items-center gap-x-2 text-sm p-1 ps-3 rounded-full transition hover:border-brand-300 bg-brand-900 text-brand-200 dark:focus:outline-none dark:ring-1 dark:ring-brand-600"
			>
				Old School alternative
				<span
					class="py-1.5 px-2.5 inline-flex justify-center items-center gap-x-2 rounded-full bg-brand-200 font-semibold text-sm text-brand-600 dark:bg-brand-700 dark:text-brand-400"
				>
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
						stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg
					>
				</span>
			</a>
		</div>
		End Announcement Banner -->

		<!-- Title -->
		<div class="mt-5 max-w-2xl text-center mx-auto">
			<h1
				class="block font-bold text-brand-800 text-4xl md:text-5xl lg:text-6xl dark:text-brand-200"
			>
				GeoGuessr but
				<span class="bg-clip-text bg-gradient-to-tl from-brand-600 to-white text-transparent"
					>RuneScape 3</span
				>
			</h1>
		</div>
		<!-- End Title -->

		<div class="mt-5 max-w-3xl text-center mx-auto">
			<p class="text-lg text-brand-400">Geography game situated in RuneScape 3 overworld.</p>
		</div>

		<!-- Buttons -->
		<div class="mt-8 gap-3 flex justify-center">
			{#if !data.user}
				<a
					href="/auth/login"
					class="inline-flex justify-center items-center gap-x-3 text-center bg border border-transparent bg-white text-brand-950 text-sm font-medium rounded-md focus:outline-none focus:ring-1 focus:ring-brand-200 py-3 px-4 hover:bg-brand-100"
				>
					Create Account
				</a>
				<button
					type="button"
					class="inline-flex justify-center items-center gap-x-3 text-center bg border border-brand-700 bg-transparent text-white text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-brand-200 py-3 px-4 hover:border-brand-400"
					on:click={createGuestUser}
					disabled={loading}
				>
					{loading ? 'Loading...' : 'Play as Guest'}
				</button>
			{/if}

			{#if data.user}
				<a
					class="inline-flex justify-center items-center gap-x-3 text-center bg border border-transparent bg-white text-brand-950 text-sm font-medium rounded-md focus:outline-none focus:ring-1 focus:ring-brand-200 py-3 px-4 hover:bg-brand-100"
					href="/me/game"
				>
					Play Game
				</a>
				<a
					class="inline-flex justify-center items-center gap-x-3 text-center bg border border-brand-700 bg-transparent text-white text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-brand-200 py-3 px-4 hover:border-brand-400"
					href="/me/packs"
				>
					My Packs
				</a>
			{/if}
		</div>
		<!-- End Buttons -->
	</div>
</div>
<!-- End Hero -->

<div class="max-w-[85rem] px-4 py-10 pt-6 sm:px-6 lg:px-8 lg:py-14 lg:pt-10 mx-auto">
	<div class="aspect-[16/7]">
		<img class="w-full h-full object-center rounded-xl" src="/hero.png" alt="Hero" />
	</div>
</div>

<!-- Icon Blocks -->
<div class="max-w-[85rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14 mx-auto">
	<!-- Grid -->
	<div class="grid md:grid-cols-2 gap-12">
		<div class="lg:w-3/4">
			<h2 class="text-3xl text-brand-800 font-bold lg:text-4xl dark:text-white">
				Guess screenshot locations on a RuneScape map
			</h2>
			<p class="mt-3 text-brand-400">
				Look at an amazing-looking game screenshot and guess where in the Gielinor the picture was
				taken.
			</p>
		</div>
		<!-- End Col -->

		<div class="space-y-6 lg:space-y-10">
			<!-- Icon Block -->
			<div class="flex">
				<!-- Icon -->
				<span
					class="flex-shrink-0 inline-flex justify-center items-center w-[46px] h-[46px] rounded-full border border-brand-200 bg-white text-brand-800 shadow-sm mx-auto dark:bg-brand-900 dark:border-brand-700 dark:text-brand-200"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="flex-shrink-0 w-5 h-5"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
						/>
					</svg>
				</span>
				<div class="ms-5 sm:ms-8">
					<h3 class="text-base sm:text-lg font-semibold text-brand-800 dark:text-brand-200">
						Playful way to explore
					</h3>
					<p class="mt-1 text-brand-600 dark:text-brand-400">
						RuneScape is an enormous game with a huge overworld. The beginning of your exploration
						may feel overwhelming! RSGuessr provides an additional gamified challenge when exploring
						specific areas.
					</p>
				</div>
			</div>
			<!-- End Icon Block -->

			<!-- Icon Block -->
			<div class="flex">
				<!-- Icon -->
				<span
					class="flex-shrink-0 inline-flex justify-center items-center w-[46px] h-[46px] rounded-full border border-brand-200 bg-white text-brand-800 shadow-sm mx-auto dark:bg-brand-900 dark:border-brand-700 dark:text-brand-200"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="flex-shrink-0 w-5 h-5"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0"
						/>
					</svg>
				</span>
				<div class="ms-5 sm:ms-8">
					<h3 class="text-base sm:text-lg font-semibold text-brand-800 dark:text-brand-200">
						A new way to play
					</h3>
					<p class="mt-1 text-brand-600 dark:text-brand-400">
						Burnout is real! When you feel like there is nothing left to enjoy in the game, try out
						a brand-new experience. A unique challenge provides a new (unofficial) achievement in
						your completionist book.
					</p>
				</div>
			</div>
			<!-- End Icon Block -->

			<!-- Icon Block -->
			<div class="flex">
				<!-- Icon -->
				<span
					class="flex-shrink-0 inline-flex justify-center items-center w-[46px] h-[46px] rounded-full border border-brand-200 bg-white text-brand-800 shadow-sm mx-auto dark:bg-brand-900 dark:border-brand-700 dark:text-brand-200"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="flex-shrink-0 w-5 h-5"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
					</svg>
				</span>
				<div class="ms-5 sm:ms-8">
					<h3 class="text-base sm:text-lg font-semibold text-brand-800 dark:text-brand-200">
						Grind we know and love
					</h3>
					<p class="mt-1 text-brand-600 dark:text-brand-400">
						If there is one thing bringing RuneScape community together, it's joy of progression. On
						RSGuessr everything is split into packs you can complete. Can you finish them all?
					</p>
				</div>
			</div>
			<!-- End Icon Block -->
		</div>
		<!-- End Col -->
	</div>
	<!-- End Grid -->
</div>
<!-- End Icon Blocks -->

<!-- Features -->
<div class="max-w-[85rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14 mx-auto">
	<!-- Title -->
	<div class="mx-auto max-w-2xl mb-8 lg:mb-14 text-center">
		<h2 class="text-3xl lg:text-6xl text-brand-800 font-bold dark:text-white">Explore the world</h2>
		<p class="mt-6 text-brand-400">Travel through Gielinor in a different way.</p>
	</div>
	<!-- End Title -->

	<!-- Grid -->
	<div class="mt-20 grid grid-cols-12 items-center gap-x-2 sm:gap-x-6 lg:gap-x-8">
		<div class="hidden md:block col-span-4 md:col-span-3">
			<div class="rounded-xl w-full h-[380px]">
				<img
					loading="lazy"
					decoding="async"
					class="rounded-xl w-full h-full object-center object-cover"
					src="/gallery4.jpeg"
					alt="Render"
				/>
			</div>
		</div>
		<!-- End Col -->

		<div class="col-span-4 md:col-span-3">
			<div class="rounded-xl w-full h-[450px]">
				<img
					loading="lazy"
					decoding="async"
					class="rounded-xl w-full h-full object-center object-cover"
					src="/gallery1.jpeg"
					alt="Render"
				/>
			</div>
		</div>
		<!-- End Col -->

		<div class="col-span-4 md:col-span-3">
			<div class="rounded-xl w-full h-[600px]">
				<img
					loading="lazy"
					decoding="async"
					class="rounded-xl w-full h-full object-center object-cover"
					src="/gallery2.jpeg"
					alt="Render"
				/>
			</div>
		</div>
		<!-- End Col -->

		<div class="col-span-4 md:col-span-3">
			<div class="rounded-xl w-full h-[350px]">
				<img
					loading="lazy"
					decoding="async"
					class="rounded-xl w-full h-full object-center object-cover"
					src="/gallery3.jpeg"
					alt="Render"
				/>
			</div>
		</div>
		<!-- End Col -->
	</div>
	<!-- End Grid -->
</div>
<!-- End Features -->

<!-- FAQ -->
<div class="max-w-[85rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14 mx-auto">
	<!-- Title -->
	<div class="max-w-2xl mx-auto mb-10 lg:mb-14">
		<h2 class="text-2xl font-bold md:text-4xl md:leading-tight dark:text-white">
			You might be wondering...
		</h2>
	</div>
	<!-- End Title -->

	<div class="max-w-2xl mx-auto divide-y divide-brand-200 dark:divide-brand-700">
		{#each faq as point}
			<div class="py-8 first:pt-0 last:pb-0">
				<div class="flex gap-x-5">
					<svg
						class="flex-shrink-0 mt-1 w-6 h-6 text-brand-500"
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path
							d="M12 17h.01"
						/></svg
					>

					<div>
						<h3 class="md:text-lg font-semibold text-brand-800 dark:text-brand-200">
							{point.q}
						</h3>
						<p class="mt-1 text-brand-500">
							{point.a}
						</p>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>
<!-- End FAQ -->

<div class="max-w-[85rem] px-4 py-12 sm:px-6 lg:px-8 lg:py-14 mx-auto">
	<div class="border border-brand-600 rounded-xl bg-brand-900 p-16">
		<h1 class="text-brand-50 font-extrabold text-4xl text-center">Interested? Give it a shot!</h1>

		<div class="flex justify-center mt-10">
			<a
			href="/me/game"
			class="inline-flex justify-center items-center gap-x-3 text-center bg border border-transparent bg-white text-brand-950 text-sm font-medium rounded-md focus:outline-none focus:ring-1 focus:ring-brand-200 py-3 px-4 hover:bg-brand-100"
		>
			Play Now
		</a>
		</div>
	</div>
</div>
