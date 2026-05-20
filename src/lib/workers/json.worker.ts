import type { WorkerRequest, WorkerResponse, ParseError } from '../types';
import { extractPosition, cleanErrorMessage, generateSuggestions } from '../utils/validator';

self.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
	const { id, type, payload, indent = 2 } = event.data;

	try {
		let result: string;

		if (type === 'format') {
			result = JSON.stringify(JSON.parse(payload), null, indent);
		} else if (type === 'compact') {
			result = JSON.stringify(JSON.parse(payload));
		} else {
			JSON.parse(payload);
			result = 'valid';
		}

		self.postMessage({ id, type, success: true, result } as WorkerResponse);
	} catch (err) {
		const error = err as SyntaxError;
		const position = extractPosition(error, payload);
		const errorDetails: ParseError = {
			message: cleanErrorMessage(error.message),
			position: position ?? undefined,
			line: position?.line,
			column: position?.col,
		};

		self.postMessage({
			id,
			type,
			success: false,
			error: errorDetails.message,
			errorDetails,
			suggestions: generateSuggestions(error, payload),
		} as WorkerResponse);
	}
});
