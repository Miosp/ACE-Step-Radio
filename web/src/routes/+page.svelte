<script lang="ts">
    import { QueueController, type QueueItem } from "$lib/stores/queue.svelte";

    const queueController = new QueueController();

    function togglePlay() {
        if (!queueController.audioPlayer) return;

        if (queueController.audioPlayer.paused) {
            queueController.audioPlayer.play();
        } else {
            queueController.audioPlayer.pause();
        }
    }

    // Download audio
    function downloadAudio(songItem: QueueItem) {
        const blob = new Blob(
            [
                songItem.audio?.base64
                    ? Uint8Array.from(atob(songItem.audio.base64), (c) =>
                          c.charCodeAt(0),
                      )
                    : new Uint8Array(),
            ],
            { type: songItem.audio?.mimeType },
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `song_${songItem.id.substring(0, 8)}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
</script>

<div class="container">
    <!-- Left: Settings -->
    <div class="panel settings">
        <h2>⚙️ Settings</h2>

        <section class="setting-group">
            <h3>Queue Settings</h3>
            <label>
                Target queue size:
                <input
                    type="number"
                    bind:value={queueController.targetSize}
                    min="1"
                    max="20"
                />
            </label>
            <p class="hint">
                Current: {queueController.queueCount} / {queueController.targetSize}
                ({queueController.completedCount} completed, {queueController.pendingCount}
                pending)
            </p>
        </section>

        <section class="setting-group">
            <h3>Song Parameters</h3>
            <label>
                Description:
                <textarea
                    bind:value={queueController.musicTrackSettings.caption}
                    rows="2"
                >
                </textarea>
            </label>

            <label>
                Lyrics (optional):
                <textarea
                    bind:value={queueController.musicTrackSettings.lyrics}
                    rows="2"
                >
                </textarea>
            </label>

            <div class="row">
                <label>
                    Duration (sec):
                    <input
                        type="number"
                        bind:value={queueController.musicTrackSettings.duration}
                        min="10"
                        max="300"
                    />
                </label>

                <label>
                    BPM:
                    <input
                        type="number"
                        bind:value={queueController.musicTrackSettings.bpm}
                        min="60"
                        max="200"
                    />
                </label>

                <label>
                    Temperature:
                    <input
                        type="number"
                        bind:value={
                            queueController.musicTrackSettings.temperature
                        }
                        min="0.1"
                        max="2.0"
                        step="0.1"
                    />
                </label>

                <label>
                    Seed (-1 for random):
                    <input
                        type="number"
                        bind:value={queueController.musicTrackSettings.seed}
                        min="-1"
                    />
                </label>
            </div>

            <div class="row">
                <label>
                    Key:
                    <select bind:value={queueController.musicTrackSettings.key}>
                        <option value="">Auto</option>
                        <option value="C major">C major</option>
                        <option value="C minor">C minor</option>
                        <option value="D major">D major</option>
                        <option value="D minor">D minor</option>
                        <option value="E major">E major</option>
                        <option value="E minor">E minor</option>
                        <option value="F major">F major</option>
                        <option value="F minor">F minor</option>
                        <option value="G major">G major</option>
                        <option value="G minor">G minor</option>
                        <option value="A major">A major</option>
                        <option value="A minor">A minor</option>
                        <option value="B major">B major</option>
                        <option value="B minor">B minor</option>
                    </select>
                </label>

                <label>
                    Genre:
                    <input
                        type="text"
                        bind:value={queueController.musicTrackSettings.genre}
                        placeholder="e.g. Jazz, Rock"
                    />
                </label>
            </div>
        </section>

        <section class="player">
            <h3>Now Playing</h3>
            {#if queueController.nowPlaying}
                <div class="audio-controls">
                    <button onclick={togglePlay} class="play-btn">
                        {queueController.isPlaying ? "⏸️" : "▶️"}
                    </button>
                    <span class="playing-status">
                        {queueController.isPlaying ? "Playing" : "Paused"}
                    </span>
                </div>
            {:else}
                <p class="no-audio">No audio loaded</p>
            {/if}
        </section>
        <section>
            <p>Auto-adder:</p>
            <input
                type="checkbox"
                name="AutoAdder"
                id="AutoAdder"
                bind:checked={queueController.autoAdderEnabled}
            />
        </section>
    </div>

    <!-- Right: Queue -->
    <div class="panel queue">
        <h2>🎵 Queue</h2>

        {#if queueController.queue.length === 0}
            <p class="empty">Queue is empty. Add some songs!</p>
        {:else}
            <div class="queue-list">
                {#each queueController.queue as item (item.id)}
                    <div class="queue-item">
                        <div class="item-info">
                            <span class="item-status">
                                {item.status === "completed" && "✅"}
                                {item.status === "generating" && "⏳"}
                                {item.status === "failed" && "❌"}
                                {item.status === "pending" && "⏸️"}
                            </span>
                            <span class="item-caption">{item.caption}</span>
                            <span class="item-details">
                                {item.duration}s
                                {#if item.bpm}
                                    · {item.bpm} BPM{/if}
                                {#if item.key}
                                    · {item.key}{/if}
                                {#if item.genre}
                                    · {item.genre}{/if}
                            </span>
                            {#if item.progress && item.status === "generating"}
                                <span class="item-progress"
                                    >{item.progress}</span
                                >
                            {/if}
                            {#if item.error && item.status === "failed"}
                                <span class="item-error">{item.error}</span>
                            {/if}
                        </div>
                        <div class="item-actions">
                            {#if item.status === "completed"}
                                <button
                                    onclick={() => downloadAudio(item)}
                                    class="btn-download"
                                    title="Download"
                                >
                                    📥
                                </button>
                            {/if}
                            <button
                                onclick={() =>
                                    queueController.removeItem(item.id)}
                                class="btn-remove"
                                title="Remove"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>

<style>
    .container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        padding: 2rem;
        min-height: 100vh;
    }

    @media (max-width: 768px) {
        .container {
            grid-template-columns: 1fr;
        }
    }

    .panel {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    h2 {
        margin: 0;
        font-size: 1.25rem;
        border-bottom: 2px solid #6366f1;
        padding-bottom: 0.5rem;
    }

    h3 {
        margin: 0 0 0.75rem 0;
        font-size: 1rem;
        color: #666;
    }

    .setting-group {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 1rem;
        background: #f9fafb;
        border-radius: 8px;
    }

    label {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        font-size: 0.875rem;
        font-weight: 500;
    }

    .hint {
        font-size: 0.75rem;
        color: #666;
        margin: 0;
    }

    .row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 0.75rem;
    }

    textarea,
    input,
    select {
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-family: inherit;
        font-size: 0.875rem;
    }

    textarea {
        resize: vertical;
        min-height: 60px;
    }

    .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .actions button {
        flex: 1;
        padding: 0.75rem 1rem;
        border: none;
        border-radius: 4px;
        font-weight: 600;
        cursor: pointer;
        background: #6366f1;
        color: white;
        transition: opacity 0.2s;
    }

    .actions button:hover {
        opacity: 0.9;
    }

    .player {
        padding: 1rem;
        background: #f0fdf4;
        border-radius: 8px;
        border: 2px solid #10b981;
    }

    .no-audio {
        color: #666;
        margin: 0;
    }

    .audio-controls {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .play-btn {
        font-size: 1.5rem;
        padding: 0.5rem 1rem;
        background: #10b981;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    .playing-status {
        font-weight: 600;
        color: #10b981;
    }

    /* Queue styles */
    .queue-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .queue-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        gap: 1rem;
    }

    .queue-item.status-completed {
        background: #f0fdf4;
        border-color: #10b981;
    }

    .queue-item.status-generating {
        background: #fff7ed;
        border-color: #f59e0b;
    }

    .queue-item.status-failed {
        background: #fef2f2;
        border-color: #ef4444;
    }

    .item-info {
        flex: 1;
        min-width: 0;
    }

    .item-status {
        font-size: 1.25rem;
        margin-right: 0.5rem;
    }

    .item-caption {
        display: block;
        font-weight: 600;
    }

    .item-details {
        font-size: 0.75rem;
        color: #666;
    }

    .item-progress {
        display: block;
        font-size: 0.7rem;
        color: #b45309;
        margin-top: 0.25rem;
        font-family: monospace;
    }

    .item-error {
        display: block;
        font-size: 0.75rem;
        color: #dc2626;
        margin-top: 0.25rem;
    }

    .item-actions {
        display: flex;
        gap: 0.25rem;
        flex-shrink: 0;
    }

    .item-actions button {
        padding: 0.25rem 0.5rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        background: #f3f4f6;
        font-size: 1rem;
    }

    .item-actions button:hover {
        background: #e5e7eb;
    }

    .btn-play {
        background: #10b981;
        color: white;
    }

    .btn-download {
        background: #3b82f6;
        color: white;
    }

    .btn-remove {
        background: #ef4444;
        color: white;
    }

    .empty {
        text-align: center;
        color: #999;
        padding: 2rem;
        font-style: italic;
    }
</style>
