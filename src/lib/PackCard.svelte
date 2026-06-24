<script lang="ts">
	export let card: {
		id: string;
		name: string;
		completed: number;
		completedHardmode: number;
		total: number;
	};

	$: isCompleted = card.completed === (card.total || 1);
	$: hasStarted = card.completed > 0;
	$: isHardmodeCompleted = card.completedHardmode === (card.total || 1);
	$: hasHardmodeStarted = card.completedHardmode > 0;
</script>

<a
	href={`/me/game/${card.id}`}
	class={`flex flex-col border shadow-sm rounded-xl bg-brand-900 shadow-brand-700/[.7] ${
		isCompleted && isHardmodeCompleted
			? 'border-purple-900'
			: isCompleted
			? 'border-green-600'
			: 'border-brand-800'
	}`}
>
	<div class="p-4 md:p-5">
		<!-- Circular Progress -->
		<div class="flex justify-start items-center gap-2">
			<div class="relative w-[fit-content]">
				<svg width="52" height="52" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
					<circle cx="18" cy="18" r="16" fill="none" class="stroke-current text-brand-700" stroke-width="1" />
					<g class="origin-center -rotate-90 transform">
						<circle
							cx="18"
							cy="18"
							r="16"
							fill="none"
							class="stroke-current text-green-600"
							stroke-width={isCompleted ? 1 : 3}
							stroke-dasharray={isCompleted ? 110 : 100}
							stroke-dashoffset={!hasStarted
								? 99
								: 100 - Math.round((card.completed / (card.total || 1)) * 100)}
						/>
					</g>
				</svg>

				<div class="absolute inset-0 flex justify-center items-center text-green-600 text-sm">
					{#if hasStarted && isCompleted}
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 text-green-600">
							<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
						</svg>
					{:else}
						<span>{Math.round((card.completed / (card.total || 1)) * 100)}</span>
						<span class="text-[10px] text-green-700 transform translate-y-[-2px]">%</span>
					{/if}
				</div>
			</div>
			<div class="relative w-[fit-content]">
				<svg width="52" height="52" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
					<circle cx="18" cy="18" r="16" fill="none" class="stroke-current text-brand-700" stroke-width="1" />
					<g class="origin-center -rotate-90 transform">
						<circle
							cx="18"
							cy="18"
							r="16"
							fill="none"
							class="stroke-current text-purple-600"
							stroke-width={isHardmodeCompleted ? 1 : 3}
							stroke-dasharray={isHardmodeCompleted ? 110 : 100}
							stroke-dashoffset={!hasHardmodeStarted
								? 99
								: 100 - Math.round((card.completedHardmode / (card.total || 1)) * 100)}
						/>
					</g>
				</svg>

				<div class="absolute inset-0 flex justify-center items-center text-purple-600 text-sm">
					{#if hasHardmodeStarted && isHardmodeCompleted}
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-purple-600">
							<path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clip-rule="evenodd" />
						</svg>
					{:else}
						<span>{Math.round((card.completedHardmode / (card.total || 1)) * 100)}</span>
						<span class="text-[10px] text-purple-700 transform translate-y-[-2px]">%</span>
					{/if}
				</div>
			</div>
		</div>
		<!-- End Circular Progress -->

		<h3 class="mt-4 text-2xl font-bold text-brand-800 dark:text-white">
			{card.name}
		</h3>
		<p class="mt-0 text-brand-500 dark:text-brand-400">
			{card.total}
			{card.total === 1 ? 'location' : 'locations'}
		</p>

		<span
			class="mt-3 inline-flex items-center gap-x-1 text-md font-semibold rounded-lg border border-transparent text-brand-600 dark:text-blue-600"
		>
			Play
			<svg class="flex-shrink-0 w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg>
		</span>
	</div>
</a>
