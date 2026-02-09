import { getSongFromUrl, queryResult, requestSong } from "$lib/acestep.remote";

export type QueueItem = AddedItem | PendingItem | CompletedItem;

type ItemBase = {
    id: string;
    caption: string;
    duration: number;
    lyrics?: string;
    bpm?: number;
    key?: string;
    genre?: string;
    temperature?: number;
    seed?: number;
    batch_size?: number;
    inference_steps?: number;
	thinking?: boolean;
	use_format?: boolean;
	audio_format?: string;
	time_signature?: string;
	use_random_seed?: boolean;
	// LM parameters
	lm_temperature?: number;
	lm_cfg_scale?: number;
}

export type AddedItem = ItemBase & { type: 'added'; };

export type PendingItem = ItemBase & { 
    type: 'pending';
    status?: string;
    progress?: string;
    error?: string;
};

export type CompletedItem = {
    id: string;
    type: 'completed';
    caption: string;
    bpm?: number;
    key?: string;
    genre?: string;
    duration: number;
    audio: {
        base64: string;
        mimeType: string;
    };
    error?: string;
}

// Generate a UUID v4 with fallbacks for environments where
// `crypto.randomUUID` is not available.
function generateUUID(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto && typeof (crypto as any).randomUUID === 'function') {
        return (crypto as any).randomUUID();
    }

    if (typeof crypto !== 'undefined' && typeof (crypto as any).getRandomValues === 'function') {
        const bytes = new Uint8Array(16);
        (crypto as any).getRandomValues(bytes);
        bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
        bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant
        const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
        return hex.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
    }

    // Last-resort fallback using Math.random
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}


export class QueueController {
    musicTrackSettings = $state({
		caption: "A jazz fusion piece with saxophone",
		duration: 30,
		lyrics: "",
		bpm: undefined,
		key: "",
		genre: "",
		temperature: undefined,
		seed: undefined,
		// Generation control
		batch_size: 1, // Default to 1 instead of 2
		inference_steps: undefined,
		thinking: false,
		use_format: false,
		audio_format: undefined,
		time_signature: "",
		use_random_seed: undefined,
		// LM parameters
		lm_temperature: undefined,
		lm_cfg_scale: undefined,
	});

    autoAdderEnabled = $state(false);
	targetSize = $state(3);
    addedQueue: AddedItem[] = $state([]);
    pending: PendingItem | null = $state(null);
    private completedQueue: CompletedItem[] = $state([]);
    private isProcessing = $state(false);

    queue: (AddedItem | PendingItem | CompletedItem)[] = $derived.by(() => {
        const pendingItem = this.pending ? [this.pending] : [];
        return [...this.completedQueue, ...pendingItem, ...this.addedQueue];
    });
    nowPlaying: CompletedItem | null = $derived(this.completedQueue[0] || null);
    queueSize = $derived(this.addedQueue.length + (this.pending ? 1 : 0) + this.completedQueue.length);
    addedCount = $derived(this.addedQueue.length);
    completedCount = $derived(this.completedQueue.length);
    hasCompleted = $derived(this.completedQueue.length > 0);
    isFull = $derived(this.queueSize >= this.targetSize);


    addingLoopId: ReturnType<typeof setInterval> | null = null;

    constructor() {
        // Auto-adder loop
        $effect(() => {
            if (this.autoAdderEnabled) {
                this.addingLoopId = setInterval(() => {
                    if (!this.isFull) {
                        this.addSong();
                    }
                }, 2000);
            } else {
                if (this.addingLoopId) {
                    clearInterval(this.addingLoopId);
                    this.addingLoopId = null;
                }
            }

            // Cleanup function
            return () => {
                if (this.addingLoopId) {
                    clearInterval(this.addingLoopId);
                    this.addingLoopId = null;
                }
            };
        });

        // Move items from addedQueue to pending
        $effect(() => {
            if (this.pending || this.isProcessing || this.addedQueue.length === 0) {
                return;
            }

            const next = this.addedQueue[0];
            this.pending = {
                ...next,
                type: 'pending'
            };
            this.addedQueue = this.addedQueue.slice(1);
        });

        // Process pending item
        $effect(() => {
            if (!this.pending || this.isProcessing) {
                return;
            }

            this.fetchNext(this.pending);
        });
    }

    removeItem = (id: string) => {
        this.addedQueue = this.addedQueue.filter((item) => item.id !== id);
        this.completedQueue = this.completedQueue.filter((item) => item.id !== id);
        if (this.pending?.id === id) {
            this.pending = null;
        }
    }

    skip = () => {
        this.completedQueue = this.completedQueue.slice(1);
    }
    
    addSong = () => {
        const song: AddedItem = {
                        id: generateUUID(),
                        type: 'added',
                        caption: this.musicTrackSettings.caption,
                        duration: this.musicTrackSettings.duration,
                        lyrics: this.musicTrackSettings.lyrics,
                        bpm: this.musicTrackSettings.bpm,
                        key: this.musicTrackSettings.key,
                        genre: this.musicTrackSettings.genre,
                        temperature: this.musicTrackSettings.temperature,
                        seed: this.musicTrackSettings.seed,
                        batch_size: this.musicTrackSettings.batch_size,
                        inference_steps: this.musicTrackSettings.inference_steps,
                        thinking: this.musicTrackSettings.thinking,
                        use_format: this.musicTrackSettings.use_format,
                        audio_format: this.musicTrackSettings.audio_format,
                        time_signature: this.musicTrackSettings.time_signature,
                        use_random_seed: this.musicTrackSettings.use_random_seed,
                        lm_temperature: this.musicTrackSettings.lm_temperature,
                        lm_cfg_scale: this.musicTrackSettings.lm_cfg_scale
                    };
        this.addedQueue.push(song);
        return song;
    }

    private fetchNext = async (pending: PendingItem) => {
        this.isProcessing = true;

		try {
			// Create task
			const request = await requestSong({
				caption: pending.caption,
				duration: pending.duration,
				...(pending.lyrics && { lyrics: pending.lyrics }),
				...(pending.bpm !== undefined && { bpm: pending.bpm }),
				...(pending.key && { key: pending.key }),
				...(pending.genre && { genre: pending.genre }),
				...(pending.temperature !== undefined && { temperature: pending.temperature }),
				...(pending.seed !== undefined && { seed: pending.seed }),
				...(pending.batch_size !== undefined && { batch_size: pending.batch_size }),
				...(pending.inference_steps !== undefined && { inference_steps: pending.inference_steps }),
				...(pending.thinking !== undefined && { thinking: pending.thinking }),
				...(pending.use_format !== undefined && { use_format: pending.use_format }),
				...(pending.audio_format && { audio_format: pending.audio_format }),
				...(pending.time_signature && { time_signature: pending.time_signature }),
				...(pending.use_random_seed !== undefined && { use_random_seed: pending.use_random_seed }),
				...(pending.lm_temperature !== undefined && { lm_temperature: pending.lm_temperature }),
				...(pending.lm_cfg_scale !== undefined && { lm_cfg_scale: pending.lm_cfg_scale }),
			});

			const taskId = request.data.task_id;
			const startTime = Date.now();
			const MAX_GENERATION_TIME_MS = 300000; // 5 minutes

			// Poll for completion with timeout
			while (Date.now() - startTime < MAX_GENERATION_TIME_MS) {
				const poll = await queryResult({ task_id_list: [taskId] });
				const result = poll.data[0];

				pending.progress = result.progress_text || 'Generating...';

				if (result.status === 1) {
					const songUrl = result.result[0]?.file;
					if (songUrl) {
                        this.completedQueue.push({
                            id: pending.id,
                            type: 'completed',
                            caption: pending.caption,
                            duration: pending.duration,
                            bpm: pending.bpm,
                            key: pending.key,
                            genre: pending.genre,
                            audio: await getSongFromUrl({ url: songUrl }),
                        });
					} else {
						pending.error = 'No audio URL returned';
					}
					return;
				}

				if (result.status === 2) {
					pending.error = 'Generation failed';
					return;
				}

				await new Promise((resolve) => setTimeout(resolve, 2000));
			}

			// Timeout reached
			pending.error = 'Generation timeout';
		} catch (error) {
			pending.error = error instanceof Error ? error.message : 'Unknown error';
		} finally {
            this.isProcessing = false;
            this.pending = null;
        }
	}
}
