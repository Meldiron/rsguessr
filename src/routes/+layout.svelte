<script lang="ts">
	import '../app.css';
	import { goto, invalidateAll } from '$app/navigation';
	import type { LayoutData } from './$types';
	import { account } from '$lib/appwrite';

	export let data: LayoutData;

	let menuOpen = false;

	function toggleNavigation() {
		menuOpen = !menuOpen;
	}

	async function logOut() {
		try {
			await account.deleteSession('current');
			await invalidateAll();
			goto('/');
		} catch (error: any) {
			alert('Failed to log out:' + error.message);
		}
	}
</script>

<!-- ========== HEADER ========== -->
<header class="flex flex-wrap md:justify-start md:flex-nowrap z-50 w-full text-sm">
	<nav
		class="mt-6 relative max-w-[85rem] w-full border rounded-[36px] mx-2 py-3 px-4 md:flex md:items-center md:justify-between md:py-0 md:px-6 lg:px-8 xl:mx-auto dark:border-brand-600"
		aria-label="Global"
	>
		<div class="flex items-center justify-between">
			<a class="group flex-none text-xl font-semibold dark:text-white flex items-center space-x-2" href="/" aria-label="Brand"
				>
				<img src="/favicon.png" width="20" height="20" alt="Logo">
				<span class="group-hover:underline">RSGuessr</span></a
			>
			<div class="md:hidden">
				<button
				on:click={toggleNavigation}
					type="button"
					class="hs-collapse-toggle w-8 h-8 flex justify-center items-center text-sm font-semibold rounded-full border border-brand-200 text-brand-800 hover:bg-brand-100 disabled:opacity-50 disabled:pointer-events-none dark:text-white dark:border-brand-700 dark:hover:bg-brand-700 dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-brand-600"
					aria-label="Toggle navigation"
				>
				{#if !menuOpen}
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
						stroke-linejoin="round"
						><line x1="3" x2="21" y1="6" y2="6" /><line x1="3" x2="21" y1="12" y2="12" /><line
							x1="3"
							x2="21"
							y1="18"
							y2="18"
						/></svg
					>
					{:else}
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
					{/if}
				</button>
			</div>
		</div>
		<div
			class={`transition-all duration-300 basis-full grow md:block ${menuOpen ? 'block' : 'hidden'}`}
		>
			<div
				class="flex flex-col gap-y-4 gap-x-0 mt-5 md:flex-row md:items-center md:justify-end md:gap-y-0 md:gap-x-7 md:mt-0 md:ps-7"
			>
				<a
					class="font-medium text-brand-500 hover:text-brand-400 md:py-6 dark:text-brand-400 dark:hover:text-brand-300"
					href={!data.user ? '/auth/login' : '/me/game'}
					>Play Game</a
				>

				{#if data.user}
					<a
						class="font-medium text-brand-500 hover:text-brand-400 md:py-6 dark:text-brand-400 dark:hover:text-brand-300"
						href="/me/packs">My Packs</a
					>
				{/if}

				{#if !data.user}
					<a
						href="/auth/login"
						class="flex items-center gap-x-2 font-medium text-brand-500 hover:text-blue-600 md:border-s md:border-brand-300 md:my-6 md:ps-6 dark:border-brand-700 dark:text-brand-400 dark:hover:text-blue-500"
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
							stroke-linejoin="round"
							><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle
								cx="12"
								cy="7"
								r="4"
							/></svg
						>
						Log in
					</a>
				{:else}
					<button
						on:click={logOut}
						class="flex items-center gap-x-2 font-medium text-brand-500 hover:text-blue-600 md:border-s md:border-brand-300 md:my-6 md:ps-6 dark:border-brand-700 dark:text-brand-400 dark:hover:text-blue-500"
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
							stroke-linejoin="round"
							><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle
								cx="12"
								cy="7"
								r="4"
							/></svg
						>
						Log out
					</button>
				{/if}
			</div>
		</div>
	</nav>
</header>
<!-- ========== END HEADER ========== -->

<slot />

<footer class="w-full max-w-[85rem] py-10 px-4 sm:px-6 lg:px-8 mx-auto">
	<!-- Grid -->
	<div class="text-center">
		<div>
			<a
				class="flex-none text-xl font-semibold text-black dark:text-white dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-brand-600"
				href="/"
				aria-label="Brand">RSGuessr</a
			>
		</div>
		<!-- End Col -->

		<div class="mt-3">
			<p class="text-brand-500">© RSGuessr 2026, screenshots from RuneScape.</p>
		</div>

		<!-- Social Brands -->
		<div class="mt-3 space-x-2">
			<a
				class="inline-flex justify-center items-center w-10 h-10 text-center text-brand-500 hover:bg-brand-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-white transition dark:text-brand-500 dark:hover:text-brand-200 dark:hover:bg-brand-800"
				href="https://appwrite.io/"
				target="_blank"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="112"
					height="98"
					fill="currentColor"
					class="flex-shrink-0 w-3.5 h-3.5"
					viewBox="0 0 112 98"
					><path
						fill="currentColor"
						d="M111.1 73.473v24.49H48.87c-18.13 0-33.96-9.849-42.429-24.49A48.683 48.683 0 0 1 0 52.293V45.67a48.52 48.52 0 0 1 1.732-10.048C7.545 15.064 26.448 0 48.871 0c22.422 0 41.323 15.064 47.136 35.623H69.398C65.03 28.922 57.47 24.491 48.872 24.491c-8.599 0-16.16 4.43-20.528 11.132a24.262 24.262 0 0 0-3.042 6.68 24.488 24.488 0 0 0-.921 6.679c0 7.02 2.952 13.348 7.685 17.811a24.39 24.39 0 0 0 16.806 6.68H111.1"
					/><path
						fill="currentColor"
						d="M111.1 42.303v24.49H65.676a24.406 24.406 0 0 0 7.686-17.81c0-2.316-.321-4.556-.922-6.68h38.66"
					/></svg
				>
			</a>
			<a
				class="inline-flex justify-center items-center w-10 h-10 text-center text-brand-500 hover:bg-brand-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-white transition dark:text-brand-500 dark:hover:text-brand-200 dark:hover:bg-brand-800"
				href="https://github.com/meldiron/rsguessr"
				target="_blank"
			>
				<svg
					class="flex-shrink-0 w-3.5 h-3.5"
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					fill="currentColor"
					viewBox="0 0 16 16"
				>
					<path
						d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"
					/>
				</svg>
			</a>
		</div>
		<!-- End Social Brands -->
	</div>
	<!-- End Grid -->
</footer>
