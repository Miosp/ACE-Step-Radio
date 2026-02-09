<script lang="ts">
	import { createAudioUrl } from "$lib/utils/audio";
	import type { QueueController } from "../../controllers/queue.svelte";
	import Icon from "./Icon.svelte";

	interface Props {
		controller: QueueController;
	}

	let { controller }: Props = $props();
	let audioElement: HTMLAudioElement;
	let time = $state(0);
	let duration = $state(0);
	let isPaused = $state(true);
	let audioUrl = $state<string | null>(null);
	let currentTrackId: string | null = null;
	let progressPercent = $derived.by(() => {
		if (!controller.nowPlaying || duration === 0) return 0;
		return (time / duration) * 100;
	});

	// Update audio URL only when track actually changes
	$effect(() => {
		const track = controller.nowPlaying;
		const trackId = track?.id ?? null;

		if (trackId !== currentTrackId) {
			currentTrackId = trackId;
			// Revoke old URL if exists
			if (audioUrl) {
				URL.revokeObjectURL(audioUrl);
			}
			// Create new URL if track has audio
			if (track?.audio) {
				audioUrl = createAudioUrl(track.audio.base64, track.audio.mimeType);
				// Auto-play new track
				setTimeout(() => {
					if (audioElement) {
						audioElement.play().catch(() => {
							// Ignore autoplay errors
						});
					}
				}, 50);
			} else {
				audioUrl = null;
			}
		}
	});

	// Format time as MM:SS
	function formatTime(seconds: number): string {
		if (!seconds || !isFinite(seconds)) return "0:00";
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	}

	function trackMeta() {
		const meta = [];
		if (controller.nowPlaying?.bpm) {
			meta.push(`${controller.nowPlaying.bpm} BPM`);
		}
		if (controller.nowPlaying?.key) {
			meta.push(controller.nowPlaying.key);
		}
		return meta.length > 0 ? meta.join(" · ") : null;
	}
</script>

<div class="player-container">
	<div class="player-info">
		{#if controller.nowPlaying}
			<div class="track-info">
				<span class="track-title">{controller.nowPlaying.caption}</span>
				<span class="track-meta">
					{trackMeta()}
				</span>
			</div>
		{:else}
			<span class="no-track">No track playing</span>
		{/if}
	</div>

	<div class="player-controls">
		<div class="control-buttons">
			<button
				class="control-btn"
				style="padding: 10px;"
				disabled={controller.nowPlaying === null}
				onclick={() => (isPaused = !isPaused)}
				title={isPaused ? "Play" : "Pause"}
			>
				{#if !isPaused}
					<Icon name="pause" />
				{:else}
					<Icon name="play" />
				{/if}
			</button>

			<button
				class="control-btn"
				disabled={!controller.hasCompleted}
				onclick={() => {
					controller.skip();
					isPaused = false;
				}}
				title="Skip to next"
			>
				<Icon name="skip" />
			</button>
		</div>

		<audio
			bind:this={audioElement}
			src={audioUrl}
			bind:paused={isPaused}
			bind:currentTime={time}
			bind:duration
			onended={controller.skip}
		></audio>

		<div class="progress-container">
			<span class="time">{formatTime(time)}</span>
			<div class="progress-bar">
				<div class="progress-fill" style="width: {progressPercent}%"></div>
				<input
					type="range"
					min="0"
					max={duration || 0}
					step="0.1"
					bind:value={time}
					disabled={!controller.nowPlaying}
					class="progress-slider"
				/>
			</div>
			<span class="time">{formatTime(duration)}</span>
		</div>
	</div>
</div>

<style>
	.player-container {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.25rem;
		background: #f3f4f6;
		border-radius: 16px;
		border: 1px solid #e5e7eb;
	}

	.player-info {
		display: flex;
		align-items: center;
		min-height: 3rem;
	}

	.track-info {
		display: flex;
		width: 100%;
		flex-direction: column;
		gap: 0.25rem;
	}

	.track-title {
		font-weight: 600;
		font-size: 1.1rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		text-align: center;
		color: #1f2937;
	}

	.track-meta {
		font-size: 0.75rem;
		color: #6b7280;
	}

	.no-track {
		font-style: italic;
		color: #9ca3af;
	}

	.player-controls {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.control-buttons {
		display: flex;
		gap: 0.75rem;
		justify-content: center;
	}

	.control-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 3.5rem;
		height: 3.5rem;
		background: #e0e7ff;
		border: none;
		border-radius: 12px;
		color: #4f46e5;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.control-btn:hover:not(:disabled) {
		background: #c7d2fe;
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.control-btn:active:not(:disabled) {
		transform: translateY(0);
		box-shadow: none;
	}

	.control-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
		background: #f3f4f6;
	}

	.progress-container {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.time {
		font-size: 0.75rem;
		font-family: monospace;
		min-width: 2.5rem;
		text-align: center;
		color: #6b7280;
		font-weight: 500;
	}

	.progress-bar {
		flex: 1;
		position: relative;
		display: flex;
		align-items: center;
		height: 6px;
		background: #e5e7eb;
		border-radius: 3px;
		cursor: pointer;
	}

	.progress-fill {
		position: absolute;
		left: 0;
		top: 0;
		height: 100%;
		background: #4f46e5;
		border-radius: 3px;
		pointer-events: none;
		transition: width 0.1s linear;
	}

	.progress-slider {
		position: absolute;
		width: 100%;
		height: 100%;
		-webkit-appearance: none;
		appearance: none;
		background: transparent;
		cursor: pointer;
		z-index: 1;
	}

	.progress-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 14px;
		height: 14px;
		background: white;
		border: 2px solid #4f46e5;
		border-radius: 50%;
		cursor: grab;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}

	.progress-slider::-webkit-slider-thumb:hover {
		transform: scale(1.15);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}

	.progress-slider::-webkit-slider-thumb:active {
		cursor: grabbing;
		transform: scale(1.05);
	}

	.progress-slider::-moz-range-thumb {
		width: 14px;
		height: 14px;
		background: white;
		border: 2px solid #4f46e5;
		border-radius: 50%;
		cursor: grab;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}

	.progress-slider::-moz-range-thumb:hover {
		transform: scale(1.15);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}

	.progress-slider::-moz-range-thumb:active {
		cursor: grabbing;
		transform: scale(1.05);
	}

	.progress-slider:disabled {
		cursor: not-allowed;
	}

	.progress-slider:disabled::-webkit-slider-thumb {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.progress-slider:disabled::-moz-range-thumb {
		cursor: not-allowed;
		opacity: 0.5;
	}
</style>
