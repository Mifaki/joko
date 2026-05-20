import type { ValidationResult, ParseError, ErrorPosition } from '$lib/types';

export function validateJson(input: string): ValidationResult {
	if (!input.trim()) return { valid: true };

	try {
		JSON.parse(input);
		return { valid: true };
	} catch (err) {
		const error = err as SyntaxError;
		const position = extractPosition(error, input);
		const parseError: ParseError = {
			message: cleanErrorMessage(error.message),
			position: position ?? undefined,
			line: position?.line,
			column: position?.col,
		};
		return { valid: false, error: parseError, suggestions: generateSuggestions(error, input) };
	}
}

export function cleanErrorMessage(message: string): string {
	return message
		.replace(/^SyntaxError:\s*/i, '')
		.replace(/\s+in JSON\s+at\s+position\s+\d+/gi, '')
		.replace(/\s+at\s+position\s+\d+/gi, '')
		.trim();
}

export function extractPosition(error: SyntaxError, input: string): ErrorPosition | null {
	// V8: "Unexpected token '}' at position 42"
	const posMatch = error.message.match(/\bat\s+position\s+(\d+)/i);
	if (posMatch) {
		const offset = Math.min(parseInt(posMatch[1], 10), Math.max(0, input.length - 1));
		const { line, col } = offsetToLineCol(input, offset);
		return { from: offset, to: Math.min(offset + 1, input.length), line, col };
	}

	// Firefox: "at line N column M"
	const lineColMatch = error.message.match(/at\s+line\s+(\d+)\s+column\s+(\d+)/i);
	if (lineColMatch) {
		const line = parseInt(lineColMatch[1], 10);
		const col = parseInt(lineColMatch[2], 10);
		const offset = lineColToOffset(input, line, col);
		return { from: offset, to: Math.min(offset + 1, input.length), line, col };
	}

	return null;
}

export function offsetToLineCol(str: string, offset: number): { line: number; col: number } {
	let line = 1;
	let col = 1;
	for (let i = 0; i < offset && i < str.length; i++) {
		if (str[i] === '\n') { line++; col = 1; }
		else { col++; }
	}
	return { line, col };
}

function lineColToOffset(str: string, targetLine: number, targetCol: number): number {
	const lines = str.split('\n');
	let offset = 0;
	for (let i = 0; i < targetLine - 1 && i < lines.length; i++) {
		offset += lines[i].length + 1;
	}
	return offset + (targetCol - 1);
}

export function generateSuggestions(error: SyntaxError, input: string): string[] {
	const suggestions: string[] = [];
	const msg = error.message.toLowerCase();

	if (input.includes("'"))
		suggestions.push("JSON keys and strings must use double quotes (\") not single quotes (')");

	if (/,\s*[}\]]/.test(input))
		suggestions.push('Remove trailing commas — JSON does not allow commas before } or ]');

	if (/\/\/|\/\*/.test(input))
		suggestions.push('JSON does not support comments — remove // and /* */ style comments');

	if (/:\s*undefined/.test(input))
		suggestions.push('`undefined` is not valid in JSON — use `null` instead');

	if (msg.includes('unexpected end') || msg.includes('unterminated'))
		suggestions.push('The JSON looks incomplete — check for missing closing } or ]');
	
	if ((msg.includes('unexpected token') || msg.includes('unexpected non-whitespace')) && suggestions.length === 0)
		suggestions.push('Check the highlighted position for a syntax issue');

	return [...new Set(suggestions)].slice(0, 3);
}
