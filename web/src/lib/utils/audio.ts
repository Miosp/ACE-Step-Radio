/**
 * Converts base64-encoded audio data to a Blob
 */
export function base64ToBlob(base64: string, mimeType: string): Blob {
	const bytes = base64
		? Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
		: new Uint8Array();
	return new Blob([bytes], { type: mimeType });
}

/**
 * Creates an object URL from base64 audio data
 * @returns The object URL that should be revoked when no longer needed
 */
export function createAudioUrl(base64: string, mimeType: string): string {
	const blob = base64ToBlob(base64, mimeType);
	return URL.createObjectURL(blob);
}
