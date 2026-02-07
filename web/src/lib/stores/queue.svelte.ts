import { requestSong, queryResult, getSongFromUrl } from '$lib/acestep.remote';

export type QueueItem = {
	id: string;
	status: 'pending' | 'generating' | 'completed' | 'failed';
	caption: string;
	duration: number;
	lyrics?: string;
	bpm?: number;
	key?: string;
	genre?: string;
	temperature?: number;
	seed?: number;
	progress?: string;
	audio?: {
		base64: string;
		mimeType: string;
	};
	error?: string;
};

export class QueueController {
	musicTrackSettings = $state({
		caption: "A jazz fusion piece with saxophone",
		duration: 30,
		lyrics: "",
		bpm: 120,
		key: "C Major",
		genre: "Jazz",
		temperature: 0.7,
		seed: 42,
	});
	autoAdderEnabled = $state(false);
	targetSize: number = $state(3);
	queue: QueueItem[] = $state([]);
	isGenerating: boolean = $state(false);
	audioPlayer: HTMLAudioElement | null = $state(null);
	isPlaying: boolean = $state(false);

	// Derived values
	queueCount = $derived(this.queue.length);
	completedCount = $derived(this.queue.filter((item) => item.status === 'completed').length);
	pendingCount = $derived(this.queue.filter((item) => item.status === 'pending').length);
	canGenerate = $derived(!this.isGenerating && this.pendingCount > 0 && this.queueCount < this.targetSize);
	isFull = $derived(this.queueCount >= this.targetSize);
	nowPlaying = $derived(this.queue.find((item) => item.status === 'completed' && item.audio) || null);
	

	// Background loop to keep queue populated
	downloadingLoopId: ReturnType<typeof setInterval> | null = null;
	addingLoopId: ReturnType<typeof setInterval> | null = null;

	constructor() {
		$effect(() => {
			if (this.pendingCount > 0) {
				this.startDownloaderLoop();
			} else {
				this.stopDownloaderLoop();
			}
		});

		$effect(() => {
			if (this.autoAdderEnabled) {
				this.startAutoAdderLoop();
			} else {
				this.stopAutoAdderLoop();
			}
		});
		$effect(() => {
			if (!this.audioPlayer && this.nowPlaying?.audio) {
				this.audioPlayer = new Audio(
					URL.createObjectURL(
						new Blob(
							[
								this.nowPlaying.audio.base64
									? Uint8Array.from(
										atob(this.nowPlaying.audio.base64),
										(c) => c.charCodeAt(0),
									)
									: new Uint8Array(),
							],
							{ type: this.nowPlaying.audio.mimeType },
						),
					),
				);
				this.audioPlayer.play().then(() => {
					this.isPlaying = true;
				}).catch(() => {
					this.audioPlayer = null;
					this.isPlaying = false;
					this.removeItem(this.nowPlaying!.id);
				});
				this.audioPlayer.onended = () => {
					this.audioPlayer = null;
					this.isPlaying = false;
					this.removeItem(this.nowPlaying!.id);
				};

				this.audioPlayer.onpause = () => {
					this.isPlaying = false;
				};
			}
		});
	}

	startDownloaderLoop = () => {
		if (this.downloadingLoopId) return;

		this.downloadingLoopId = setInterval(async () => {
			if (!this.isGenerating && this.pendingCount > 0) {
				await this.fetchNext();
			}
		}, 1000);
	}

	stopDownloaderLoop = () => {
		if (this.downloadingLoopId) {
			clearInterval(this.downloadingLoopId);
			this.downloadingLoopId = null;
		}
	}

	startAutoAdderLoop = () => {
		if (this.addingLoopId) return;

		this.addingLoopId = setInterval(() => {
			if (!this.isFull) {
				this.addSong({
					id: crypto.randomUUID(),
					caption: this.musicTrackSettings.caption,
					duration: this.musicTrackSettings.duration,
					lyrics: this.musicTrackSettings.lyrics,
					bpm: this.musicTrackSettings.bpm,
					key: this.musicTrackSettings.key,
					genre: this.musicTrackSettings.genre,
					temperature: this.musicTrackSettings.temperature,
					seed: this.musicTrackSettings.seed,
					status: 'pending'
				});
			}
		}, 2000);
	}

	stopAutoAdderLoop = () => {
		if (this.addingLoopId) {
			clearInterval(this.addingLoopId);
			this.addingLoopId = null;
		}
	}

	private fetchNext = async () => {
		const pending = this.queue.find((item) => item.status === 'pending');
		if (!pending) return;

		this.isGenerating = true;

		try {
			pending.status = 'generating';

			// Create task
			const request = await requestSong({
				caption: pending.caption,
				duration: pending.duration,
				...(pending.lyrics && { lyrics: pending.lyrics }),
				...(pending.bpm !== undefined && { bpm: pending.bpm }),
				...(pending.key && { key: pending.key }),
				...(pending.genre && { genre: pending.genre }),
				...(pending.temperature !== undefined && { temperature: pending.temperature }),
				...(pending.seed !== undefined && { seed: pending.seed })
			});

			const taskId = request.data.task_id;

			// Poll for completion
			while (true) {
				const poll = await queryResult({ task_id_list: [taskId] });
				const result = poll.data[0];

				pending.progress = result.progress_text || 'Generating...';

				if (result.status === 1) {
					const songUrl = result.result[0]?.file;
					if (songUrl) {
						pending.audio = await getSongFromUrl({ url: songUrl });
						pending.status = 'completed';
					} else {
						pending.status = 'failed';
						pending.error = 'No audio URL returned';
					}
					break;
				}

				if (result.status === 2) {
					pending.status = 'failed';
					pending.error = 'Generation failed';
					break;
				}

				await new Promise((resolve) => setTimeout(resolve, 2000));
			}
		} catch (error) {
			pending.status = 'failed';
			pending.error = error instanceof Error ? error.message : 'Unknown error';
		} finally {
			this.isGenerating = false;
		}
	}

	addSong = (song: QueueItem) => {
		this.queue.push(song);
		return song;
	}

	addSongs = (songs: QueueItem[]) => {
		this.queue.push(...songs);
		return songs;
	}

	removeItem = (id: string) => {
		const index = this.queue.findIndex((item) => item.id === id);	
		if (index !== -1) {
			this.queue.splice(index, 1);
		}
	}

	clearCompleted = () => {
		const filtered = this.queue.filter((item) => item.status !== 'completed');
		this.queue.splice(0, this.queue.length, ...filtered);
	}

	clearAll = () => {
		this.queue.splice(0, this.queue.length);
	}
}