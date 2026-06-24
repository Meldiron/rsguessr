<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { account } from '$lib/appwrite';
	import { ID } from 'appwrite';
	import { fade } from 'svelte/transition';

	let type: 'error' | 'success' | null = null;
	let msg: string = '';
	let loading: boolean = false;
	let guestLoading: boolean = false;

	let email: string = '';

	async function createGuestUser() {
		if (loading || guestLoading) {
			return;
		}

		type = null;
		msg = '';
		guestLoading = true;
		try {
			await account.createAnonymousSession();
			await invalidateAll();
			await goto('/me/game');
		} catch (error: any) {
			type = 'error';
			msg = `Unexpected error! ${error.message}`;
		} finally {
			guestLoading = false;
		}
	}

	async function createMagicURLSession() {
		if (loading) {
			return;
		}

		type = null;
		msg = '';
		loading = true;
		try {
			await account.createMagicURLSession(
				ID.unique(),
				email,
				`${window.location.origin}/auth/login-finish`
			);
			type = 'success';
			msg = 'Please check your e-mail to finish signing in.';
		} catch (error: any) {
			type = 'error';
			msg = `Unexpected error! ${error.message}`;
		} finally {
			loading = false;
		}
	}
</script>

<main class="w-full max-w-md mx-auto p-6">
	<div class="mt-7 border border-brand-200 rounded-xl shadow-sm dark:border-brand-700">
		<div class="p-4 sm:p-7">
			<div class="text-center">
				<h1 class="block text-2xl font-bold text-brand-800 dark:text-white">
					Log in to your Account
				</h1>
			</div>

			<div class="mt-5">
				<!-- Form -->
				<form on:submit={createMagicURLSession}>
					<div class="grid gap-y-4">
						<!-- Form Group -->
						<div>
							<div class="relative">
								<input
									bind:value={email}
									placeholder="Email address"
									type="email"
									id="email"
									name="email"
									class="py-3 px-4 border bg-brand-950 block w-full border-brand-700 placeholder-brand-400 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:border-brand-700 text-white dark:focus:ring-brand-600"
									required
									aria-describedby="email-error"
								/>
								<div
									class="hidden absolute inset-y-0 end-0 flex items-center pointer-events-none pe-3"
								>
									<svg
										class="h-5 w-5 text-red-500"
										width="16"
										height="16"
										fill="currentColor"
										viewBox="0 0 16 16"
										aria-hidden="true"
									>
										<path
											d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"
										/>
									</svg>
								</div>
							</div>
						</div>
						<!-- End Form Group -->

						<button
							type="submit"
							class="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-brand-600"
							disabled={loading || guestLoading}
						>
							{loading ? 'Loading...' : 'Continue with Email'}
						</button>
					</div>
				</form>
				<!-- End Form -->

				<div
					class="py-3 flex items-center text-xs text-brand-400 uppercase before:flex-1 before:border-t before:border-brand-700 before:me-6 after:flex-1 after:border-t after:border-brand-700 after:ms-6"
				>
					Or
				</div>

				<button
					type="button"
					class="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm rounded-lg border border-brand-700 bg-transparent text-white hover:border-brand-400 disabled:opacity-50 disabled:pointer-events-none dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-brand-600"
					on:click={createGuestUser}
					disabled={loading || guestLoading}
				>
					{guestLoading ? 'Loading...' : 'Play as Guest'}
				</button>
			</div>
		</div>
	</div>

	{#if type == 'error'}
		<div
			transition:fade={{ duration: 200 }}
			class="flex items-center space-x-3 mt-5 border border-red-950 rounded-xl shadow-sm bg-red-800 p-3"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="white"
				class="w-6 h-6"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
				/>
			</svg>
			<p class="block text-sm text-center font-bold text-brand-800 dark:text-white">
				{msg}
			</p>
		</div>
	{/if}

	{#if type == 'success'}
		<div
			transition:fade={{ duration: 200 }}
			class="flex items-center space-x-3 mt-7 border border-green-950 rounded-xl shadow-sm bg-green-800 p-3"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="white"
				class="w-6 h-6"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
			</svg>
			<p class="block text-sm text-center font-bold text-brand-800 dark:text-white">
				{msg}
			</p>
		</div>
	{/if}
</main>
