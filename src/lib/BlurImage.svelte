<script lang="ts">
	import { blurhashToDataURL } from '$lib/blurhash';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	export let src: string;
	export let blurhash: string | null = null;
	export let alt = '';
	/** Classes for the wrapper element (controls size/aspect-ratio). */
	let klass = '';
	export { klass as class };
	/** Extra classes for the inner <img>. */
	export let imgClass = '';
	/** How the image fills its box. Screenshots use `contain` to avoid cropping clues. */
	export let fit: 'cover' | 'contain' = 'cover';

	let loaded = false;
	// The src we actually hand to the <img>. Empty until we're ready to load it,
	// which lets `?speed=slow` keep the blurhash placeholder visible for a while.
	let displaySrc = '';

	// Decode the (possibly missing) blurhash into a placeholder background.
	// During SSR this is '' and we fall back to a solid black background.
	$: placeholder = blurhashToDataURL(blurhash);

	onMount(() => {
		// `?speed=slow` adds a random artificial delay before loading the real
		// image, making the blurhash placeholder easy to see while developing.
		if ($page.url.searchParams.get('speed') === 'slow') {
			const delay = 800 + Math.random() * 4000;
			const timer = setTimeout(() => (displaySrc = src), delay);
			return () => clearTimeout(timer);
		}

		displaySrc = src;
	});
</script>

<div
	class={`relative overflow-hidden bg-black ${klass}`}
	style={placeholder
		? `background-image:url(${placeholder});background-size:cover;background-position:center;`
		: ''}
>
	{#if displaySrc}
		<img
			src={displaySrc}
			{alt}
			decoding="async"
			on:load={() => (loaded = true)}
			class={`w-full h-full ${fit === 'contain' ? 'object-contain' : 'object-cover'} transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'} ${imgClass}`}
		/>
	{/if}
</div>
