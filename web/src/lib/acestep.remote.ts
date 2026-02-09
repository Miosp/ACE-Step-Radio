import { command } from "$app/server";
import { getServerUrl } from "$lib/env.server";
import * as v from 'valibot';

// Note: getSong removed - use client-side polling instead to avoid HTTP timeouts
// See +page.svelte for example usage

const requestSongSchema = v.object({
	caption: v.string(),
	duration: v.optional(v.number()),
	lyrics: v.optional(v.string()),
	bpm: v.optional(v.number()),
	key: v.optional(v.string()),
	genre: v.optional(v.string()),
	top_k: v.optional(v.number()),
	top_p: v.optional(v.number()),
	temperature: v.optional(v.number()),
	cfg_scale: v.optional(v.number()),
	seed: v.optional(v.number()),
	model: v.optional(v.string()),
	// Additional generation control parameters
	batch_size: v.optional(v.number()),
	inference_steps: v.optional(v.number()),
	thinking: v.optional(v.boolean()),
	use_format: v.optional(v.boolean()),
	audio_format: v.optional(v.string()),
	time_signature: v.optional(v.string()),
	use_random_seed: v.optional(v.boolean()),
	// LM parameters
	lm_temperature: v.optional(v.number()),
	lm_cfg_scale: v.optional(v.number()),
});

export type RequestSongResponse = {
	code: number;
	error: string | null;
	timestamp: number;
	extra: unknown;
	data: {
		task_id: string;
		status: string;
		queue_position: number;
	};
};

export const requestSong = command(requestSongSchema, async (params) => {
	const api_url = getServerUrl();

	// Build request body with only provided params
	const body: Record<string, string | number | boolean> = {
		caption: params.caption,
		duration: params.duration ?? 30
	};

	if (params.lyrics) body.lyrics = params.lyrics;
	if (params.bpm !== undefined) body.bpm = params.bpm;
	if (params.key) body.key = params.key;
	if (params.genre) body.genre = params.genre;
	if (params.top_k !== undefined) body.top_k = params.top_k;
	if (params.top_p !== undefined) body.top_p = params.top_p;
	if (params.temperature !== undefined) body.temperature = params.temperature;
	if (params.cfg_scale !== undefined) body.cfg_scale = params.cfg_scale;
	if (params.seed !== undefined) body.seed = params.seed;
	if (params.model) body.model = params.model;
	if (params.batch_size !== undefined) body.batch_size = params.batch_size;
	if (params.inference_steps !== undefined) body.inference_steps = params.inference_steps;
	if (params.thinking !== undefined) body.thinking = params.thinking;
	if (params.use_format !== undefined) body.use_format = params.use_format;
	if (params.audio_format) body.audio_format = params.audio_format;
	if (params.time_signature) body.time_signature = params.time_signature;
	if (params.use_random_seed !== undefined) body.use_random_seed = params.use_random_seed;
	if (params.lm_temperature !== undefined) body.lm_temperature = params.lm_temperature;
	if (params.lm_cfg_scale !== undefined) body.lm_cfg_scale = params.lm_cfg_scale;

	// Create task
	const createRes = await fetch(`${api_url}/release_task`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});

	if (!createRes.ok) {
		const errorText = await createRes.text();
		console.error('Error creating task:', errorText);
	}

	const result = await createRes.json() as RequestSongResponse;

	return result;
});


const queryResultSchema = v.object({
	task_id_list: v.array(v.string())
});

export type QueryResultResponseAPI = {
	code: number;
	error: string | null;
	timestamp: number;
	extra: unknown;
	data: TaskResultAPI[];
};

type TaskResultAPI = {
	task_id: string;
	result: string;
	status: number; // 0=processing, 1=success, 2=error
	progress_text: string;
}

export type QueryResultResponse = {
	code: number;
	error: string | null;
	timestamp: number;
	extra: unknown;
	data: TaskResult[];
};

type TaskResult = {
	task_id: string;
	result: TaskOutcome[];
	status: number; // 0=processing, 1=success, 2=error
	progress_text: string;
}

type TaskOutcome = {
	file: string;
	wave: string;
	status: number; // 0=processing, 1=success, 2=error
	create_time: number;
	env: string;
	prompt: string;
	lyrics: string;
	metas: {
		bpm: string;
		duration: number;
		genres: string;
		keyscale: string;
		timesignature: string;
		prompt: string;
		lyrics: string;
	};
	generation_info?: string;
	seed_value?: string;
	lm_model?: string;
	dit_model?: string;
}

export const queryResult = command(queryResultSchema, async ({ task_id_list }) => {
	const api_url = getServerUrl();
	const queryRes = await fetch(`${api_url}/query_result`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ task_id_list })
	});
	const result = await queryRes.json() as QueryResultResponseAPI;

	const parsedOutcomes = result.data.map(r => {
		const resultStr = r.result;
		try {
			const parsed = JSON.parse(resultStr) as TaskOutcome[];
			return { ...r, result: parsed };
		} catch (e) {
			return { ...r, result: [] };
		}
	});

	return { ...result, data: parsedOutcomes } as QueryResultResponse;
});


const getAudioSchema = v.object({
	url: v.string()
});

export const getSongFromUrl = command(getAudioSchema, async ({ url }) => {
	const api_url = getServerUrl();

	const res = await fetch(`${api_url}${url}`);
	if (!res.ok) {
		throw new Error('Failed to fetch audio');
	}

	const buffer = await res.arrayBuffer();
	// Convert ArrayBuffer to base64 using Bun's Buffer (handles large files correctly)
	const base64 = Buffer.from(buffer).toString('base64');
	return { mimeType: res.headers.get('content-type') || 'audio/mpeg', base64 };
});
