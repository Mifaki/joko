export interface ErrorPosition {
	from: number;
	to: number;
	line: number;
	col: number;
}

export interface ParseError {
	message: string;
	position?: ErrorPosition;
	line?: number;
	column?: number;
}

export interface ValidationResult {
	valid: boolean;
	error?: ParseError;
	suggestions?: string[];
}

export type WorkerMessageType = 'format' | 'validate' | 'compact';

export interface WorkerRequest {
	id: string;
	type: WorkerMessageType;
	payload: string;
	indent?: number;
}

export interface WorkerResponse {
	id: string;
	type: WorkerMessageType;
	success: boolean;
	result?: string;
	error?: string;
	errorDetails?: ParseError;
	suggestions?: string[];
}

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
	id: string;
	type: ToastType;
	message: string;
}
