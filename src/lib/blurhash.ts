import { decode } from 'blurhash';

// A fully black blurhash, used as the fallback when an image has no stored hash.
export const BLACK_BLURHASH = 'L00000fQfQfQfQfQfQfQfQfQfQfQ';

/**
 * Decodes a blurhash into a small data-URL that can be used as an image/background
 * placeholder. Falls back to the black blurhash if the hash is missing or invalid.
 *
 * Browser-only (uses a <canvas>); returns an empty string during SSR.
 */
export function blurhashToDataURL(hash: string | null | undefined, width = 32, height = 32): string {
	if (typeof document === 'undefined') return '';

	const render = (h: string) => {
		const pixels = decode(h, width, height);
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext('2d');
		if (!ctx) return '';
		const imageData = ctx.createImageData(width, height);
		imageData.data.set(pixels);
		ctx.putImageData(imageData, 0, 0);
		return canvas.toDataURL();
	};

	try {
		return render(hash || BLACK_BLURHASH);
	} catch {
		try {
			return render(BLACK_BLURHASH);
		} catch {
			return '';
		}
	}
}
