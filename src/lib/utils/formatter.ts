/** Formats JSON with the given indentation. Throws SyntaxError on invalid input. */
export function formatJson(input: string, indent: number = 2): string {
	return JSON.stringify(JSON.parse(input), null, indent);
}

/** Minifies JSON by removing all whitespace. Throws SyntaxError on invalid input. */
export function compactJson(input: string): string {
	return JSON.stringify(JSON.parse(input));
}

/** Estimates UTF-8 byte size of a string. */
export function byteSize(str: string): number {
	return new Blob([str]).size;
}

/** Returns a human-readable file size string. */
export function formatBytes(bytes: number): string {
	if (bytes === 0) return '0 B';
	if (bytes < 1024) return bytes + ' B';
	if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
	return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}
