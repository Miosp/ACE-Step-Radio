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
	model: v.optional(v.string())
});

export type RequestSongResponse = {
	code: number;
	error: string | null;
	timestamp: number;
	extra: any | null;
	data: {
		task_id: string;
		status: string;
		queue_position: number;
	}
}

export const requestSong = command(requestSongSchema, async (params) => {
	const api_url = getServerUrl();

	// Build request body with only provided params
	const body: Record<string, any> = {
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

	// Create task
	const createRes = await fetch(`${api_url}/release_task`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});

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
	extra: any | null;
	data: TaskResultAPI[];
}

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
	extra: any | null;
	data: TaskResult[];
}

type TaskResult = {
	task_id: string;
	result: TaskOutcome[];
	status: number; // 0=processing, 1=success, 2=error
	progress_text: string;
}


// "[{\"file\": \"\", \"wave\": \"\", \"status\": 0, \"create_time\": 1770494902, \"env\": \"development\", \"prompt\": \"\", \"lyrics\": \"\", \"metas\": {}, \"error\": null}]",
// "[{\"file\": \"/v1/audio?path=%2Fapp%2FACE-Step-1.5%2F.cache%2Facestep%2Ftmp%2Fapi_audio%2F07a529bd-189c-2ba3-ea0b-471790da75ab.mp3\", \"wave\": \"\", \"status\": 1, \"create_time\": 1770494902, \"env\": \"development\", \"prompt\": \"ds\", \"lyrics\": \"\", \"metas\": {\"bpm\": \"N/A\", \"duration\": 30.0, \"genres\": \"N/A\", \"keyscale\": \"N/A\", \"timesignature\": \"N/A\", \"prompt\": \"ds\", \"lyrics\": \"\"}, \"generation_info\": \"**🎯 Average Time per Track: 0.77s** (2 track(s))\\n\\n\\n**🎵 DiT Time:**\\n  - Encoder: 0.08s\\n  - VAE Decode: 0.77s\\n  - Offload: 1.57s\\n  - Total: 1.55s\\n\\n**🎵 Generation Complete**\\n  - **Seeds:** 4026912971,3129129321\\n  - **Steps:** 8\\n  - **Audio Count:** 2 audio(s)\\n\\n**⏱️ Total Time: 1.55s**\", \"seed_value\": \"4026912971,3129129321\", \"lm_model\": \"acestep-5Hz-lm-0.6B\", \"dit_model\": \"acestep-v15-turbo\"}, {\"file\": \"/v1/audio?path=%2Fapp%2FACE-Step-1.5%2F.cache%2Facestep%2Ftmp%2Fapi_audio%2F886ed5e0-5141-8631-2262-f259f84f3355.mp3\", \"wave\": \"\", \"status\": 1, \"create_time\": 1770494902, \"env\": \"development\", \"prompt\": \"ds\", \"lyrics\": \"\", \"metas\": {\"bpm\": \"N/A\", \"duration\": 30.0, \"genres\": \"N/A\", \"keyscale\": \"N/A\", \"timesignature\": \"N/A\", \"prompt\": \"ds\", \"lyrics\": \"\"}, \"generation_info\": \"**🎯 Average Time per Track: 0.77s** (2 track(s))\\n\\n\\n**🎵 DiT Time:**\\n  - Encoder: 0.08s\\n  - VAE Decode: 0.77s\\n  - Offload: 1.57s\\n  - Total: 1.55s\\n\\n**🎵 Generation Complete**\\n  - **Seeds:** 4026912971,3129129321\\n  - **Steps:** 8\\n  - **Audio Count:** 2 audio(s)\\n\\n**⏱️ Total Time: 1.55s**\", \"seed_value\": \"4026912971,3129129321\", \"lm_model\": \"acestep-5Hz-lm-0.6B\", \"dit_model\": \"acestep-v15-turbo\"}]",
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
	const base64 = Buffer.from(buffer).toString('base64');
	return { mimeType: res.headers.get('content-type') || 'audio/mpeg', base64 };
});
