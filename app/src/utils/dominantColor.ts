const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

export const DEFAULT_BOOK_COLOUR_HEX = '#3b82f6';
export const DEFAULT_BOOK_COLOUR_SENTINEL = 'default';

export function isHexColour(colour: string | null | undefined): boolean {
	if (!colour) return false;
	return HEX_COLOR_REGEX.test(colour);
}

export function resolveBookDisplayColour(colour: string | null | undefined): string {
	if (!colour || colour === DEFAULT_BOOK_COLOUR_SENTINEL) {
		return DEFAULT_BOOK_COLOUR_HEX;
	}
	if (isHexColour(colour)) {
		return colour.toLowerCase();
	}
	return DEFAULT_BOOK_COLOUR_HEX;
}

function rgbToHex(red: number, green: number, blue: number): string {
	const toHex = (value: number) => value.toString(16).padStart(2, '0');
	return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

function getDominantHexFromImage(image: HTMLImageElement): string {
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('2d', { willReadFrequently: true });
	if (!context) {
		throw new Error('Canvas context unavailable');
	}

	const sampleSize = 24;
	const pixelStep = 32;
	canvas.width = sampleSize;
	canvas.height = sampleSize;

	context.drawImage(image, 0, 0, sampleSize, sampleSize);
	const pixels = context.getImageData(0, 0, sampleSize, sampleSize).data;

	let red = 0;
	let green = 0;
	let blue = 0;
	let count = 0;

	for (let index = 0; index < pixels.length; index += pixelStep) {
		const alpha = pixels[index + 3] || 0;
		if (alpha < 128) continue;

		red += pixels[index] || 0;
		green += pixels[index + 1] || 0;
		blue += pixels[index + 2] || 0;
		count++;
	}

	if (!count) {
		throw new Error('No valid pixels found');
	}

	return rgbToHex(
		Math.round(red / count),
		Math.round(green / count),
		Math.round(blue / count),
	);
}

export async function extractDominantHexFromImageUrl(imageUrl: string): Promise<string | null> {
	if (!imageUrl) return null;

	return new Promise((resolve) => {
		const image = new Image();
		image.crossOrigin = 'anonymous';
		image.onload = () => {
			try {
				const hex = getDominantHexFromImage(image);
				resolve(isHexColour(hex) ? hex.toLowerCase() : null);
			} catch {
				resolve(null);
			}
		};
		image.onerror = () => resolve(null);
		image.src = imageUrl;
	});
}
