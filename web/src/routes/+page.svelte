<script lang="ts">
    import { base64ToBlob } from "$lib/utils/audio";
    import Player from "$lib/components/Player.svelte";
    import {
        QueueController,
        type CompletedItem,
        type QueueItem,
    } from "../controllers/queue.svelte";
    import Icon from "$lib/components/Icon.svelte";

    const queueController = new QueueController();

    // Download audio
    function downloadAudio(songItem: CompletedItem) {
        if (!songItem.audio) return;

        const blob = base64ToBlob(
            songItem.audio.base64,
            songItem.audio.mimeType,
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

        <section class="setting-group">
            <h3>Generation Control</h3>
            <div class="row">
                <label>
                    Inference steps:
                    <input
                        type="number"
                        bind:value={
                            queueController.musicTrackSettings.inference_steps
                        }
                        min="1"
                        max="20"
                    />
                </label>

                <label>
                    Time signature:
                    <select
                        bind:value={
                            queueController.musicTrackSettings.time_signature
                        }
                    >
                        <option value="">Auto</option>
                        <option value="2">2/4</option>
                        <option value="3">3/4</option>
                        <option value="4">4/4</option>
                        <option value="6">6/8</option>
                    </select>
                </label>

                <label>
                    Audio format:
                    <select
                        bind:value={
                            queueController.musicTrackSettings.audio_format
                        }
                    >
                        <option value="">Auto</option>
                        <option value="mp3">MP3</option>
                        <option value="wav">WAV</option>
                        <option value="flac">FLAC</option>
                    </select>
                </label>
            </div>

            <div class="checkbox-row">
                <label class="checkbox-label">
                    <input
                        type="checkbox"
                        bind:checked={
                            queueController.musicTrackSettings.thinking
                        }
                    />
                    <span>Thinking mode (LM generates audio codes)</span>
                </label>

                <label class="checkbox-label">
                    <input
                        type="checkbox"
                        bind:checked={
                            queueController.musicTrackSettings.use_format
                        }
                    />
                    <span>Use format (LM enhances caption/lyrics)</span>
                </label>
            </div>

            <div class="row">
                <label>
                    LM temperature:
                    <input
                        type="number"
                        bind:value={
                            queueController.musicTrackSettings.lm_temperature
                        }
                        min="0.1"
                        max="2.0"
                        step="0.05"
                    />
                </label>

                <label>
                    LM CFG scale:
                    <input
                        type="number"
                        bind:value={
                            queueController.musicTrackSettings.lm_cfg_scale
                        }
                        min="1.0"
                        max="10.0"
                        step="0.5"
                    />
                </label>
            </div>
        </section>
    </div>

    <!-- Right: Queue -->
    <div class="panel queue">
        <Player controller={queueController} />

        <!-- Queue Controls Card -->
        <section class="queue-controls-card">
            <div class="queue-status-header">
                <h3>Queue Status</h3>
                <div
                    class="status-badge"
                    class:status-active={queueController.autoAdderEnabled}
                >
                    {queueController.autoAdderEnabled
                        ? "Auto-adding"
                        : "Manual"}
                </div>
            </div>

            <!-- Progress Bar -->
            <div class="queue-progress">
                <div class="progress-labels">
                    <span class="progress-text">Queue Progress</span>
                    <span class="progress-count"
                        >{queueController.queueSize} / {queueController.targetSize}</span
                    >
                </div>
                <div class="progress-bar-track">
                    <div
                        class="progress-bar-fill"
                        style="width: {(queueController.queueSize /
                            queueController.targetSize) *
                            100}%"
                    ></div>
                </div>
                <p class="queue-details">
                    {queueController.completedCount} ready to play · {queueController.addedCount}
                    generating
                </p>
            </div>

            <!-- Controls -->
            <div class="queue-controls-row">
                <div class="control-item">
                    <label for="targetSize" class="control-label"
                        >Target Size</label
                    >
                    <div class="size-control">
                        <button
                            class="size-btn"
                            onclick={() => {
                                if (queueController.targetSize > 1)
                                    queueController.targetSize--;
                            }}
                            disabled={queueController.targetSize <= 1}
                        >
                            −
                        </button>
                        <input
                            id="targetSize"
                            type="number"
                            bind:value={queueController.targetSize}
                            min="1"
                            max="20"
                            class="size-input"
                        />
                        <button
                            class="size-btn"
                            onclick={() => {
                                if (queueController.targetSize < 20)
                                    queueController.targetSize++;
                            }}
                            disabled={queueController.targetSize >= 20}
                        >
                            +
                        </button>
                    </div>
                </div>

                <div class="control-item">
                    <label class="control-label">Auto-adder</label>
                    <button
                        class="toggle-btn"
                        class:toggle-active={queueController.autoAdderEnabled}
                        onclick={() =>
                            (queueController.autoAdderEnabled =
                                !queueController.autoAdderEnabled)}
                    >
                        <span class="toggle-slider"></span>
                        <span class="toggle-label">
                            {queueController.autoAdderEnabled ? "On" : "Off"}
                        </span>
                    </button>
                </div>
            </div>
        </section>

        {#if queueController.queue.length === 0}
            <p class="empty">Queue is empty. Add some songs!</p>
        {:else}
            <div class="queue-list">
                {#each queueController.queue as item (item.id)}
                    <div
                        class="queue-item"
                        class:status-completed={item.type === "completed"}
                        class:status-generating={item.type === "pending"}
                    >
                        <div class="item-info">
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
                            {#if item.type === "pending" && item.progress}
                                <span class="item-progress"
                                    >{item.progress}</span
                                >
                            {/if}
                            {#if item.type === "completed" && item.error}
                                <span class="item-error">{item.error}</span>
                            {/if}
                        </div>
                        <div class="item-actions">
                            {#if item.type === "completed"}
                                <button
                                    onclick={() => downloadAudio(item)}
                                    class="btn-download"
                                    title="Download"
                                >
                                    <Icon name="download" color="black" />
                                </button>
                            {/if}
                            <button
                                onclick={() =>
                                    queueController.removeItem(item.id)}
                                class="btn-remove"
                                title="Remove"
                            >
                                <Icon name="delete" color="black" />
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
        box-sizing: border-box;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        padding: 2rem;
    }

    @media (max-width: 768px) {
        .container {
            grid-template-columns: 1fr;
        }
    }

    .panel {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    h3 {
        margin: 0 0 0.875rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: #1f2937;
        letter-spacing: 0.01em;
    }

    .setting-group {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1.25rem;
        background: white;
        border-radius: 16px;
        border: 1px solid #e5e7eb;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    label {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
    }

    .hint {
        font-size: 0.75rem;
        color: #6b7280;
        margin: 0;
    }

    .row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 0.875rem;
    }

    .checkbox-row {
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
    }

    .checkbox-label {
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        gap: 0.75rem;
        font-weight: 400;
        padding: 0.75rem;
        background: #f9fafb;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .checkbox-label:hover {
        background: #f3f4f6;
        border-color: #d1d5db;
    }

    .checkbox-label input[type="checkbox"] {
        flex-shrink: 0;
        width: 1.125rem;
        height: 1.125rem;
        margin-top: 0.125rem;
        accent-color: #4f46e5;
        cursor: pointer;
    }

    .checkbox-label span {
        font-size: 0.875rem;
        color: #374151;
        line-height: 1.4;
    }

    textarea,
    input[type="text"],
    input[type="number"],
    select {
        padding: 0.625rem 0.875rem;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-family: inherit;
        font-size: 0.875rem;
        background: white;
        color: #1f2937;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    textarea:focus,
    input[type="text"]:focus,
    input[type="number"]:focus,
    select:focus {
        outline: none;
        border-color: #4f46e5;
        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }

    textarea::placeholder,
    input[type="text"]::placeholder {
        color: #9ca3af;
    }

    textarea {
        resize: vertical;
        min-height: 70px;
        line-height: 1.5;
    }

    select {
        cursor: pointer;
        appearance: none;
        -webkit-appearance: none;
        -moz-appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 0.625rem center;
        background-size: 1rem;
        padding-right: 2.25rem;
    }

    /* Queue styles */
    .queue-list {
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
        background: white;
        padding: 1rem;
        border-radius: 16px;
        border: 1px solid #e5e7eb;
    }

    .queue-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.875rem;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        gap: 1rem;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .queue-item:hover {
        background: #f3f4f6;
    }

    .queue-item.status-completed {
        background: #f0fdf4;
        border-color: #86efac;
    }

    .queue-item.status-completed:hover {
        background: #ecfdf5;
    }

    .queue-item.status-generating {
        background: #fffbeb;
        border-color: #fcd34d;
    }

    .queue-item.status-generating:hover {
        background: #fef3c7;
    }

    .item-info {
        flex: 1;
        min-width: 0;
    }

    .item-caption {
        display: block;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 0.25rem;
    }

    .item-details {
        font-size: 0.75rem;
        color: #6b7280;
    }

    .item-progress {
        display: block;
        font-size: 0.7rem;
        color: #b45309;
        margin-top: 0.375rem;
        font-family: monospace;
    }

    .item-error {
        display: block;
        font-size: 0.75rem;
        color: #dc2626;
        margin-top: 0.375rem;
    }

    .item-actions {
        display: flex;
        gap: 0.375rem;
        flex-shrink: 0;
    }

    .item-actions button {
        border: none;
        border-radius: 8px;
        cursor: pointer;
        background: white;
        padding: 0.625rem;
        box-sizing: border-box;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid #e5e7eb;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .item-actions button:hover {
        background: #f3f4f6;
        border-color: #d1d5db;
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .item-actions button:active {
        transform: translateY(0);
        box-shadow: none;
    }

    :global(.item-actions button svg) {
        width: 18px;
        height: 18px;
        display: block;
    }

    .empty {
        text-align: center;
        color: #9ca3af;
        padding: 2rem;
        font-style: italic;
        background: #f9fafb;
        border-radius: 12px;
        border: 1px dashed #e5e7eb;
    }

    /* Queue Controls Card */
    .queue-controls-card {
        background: #f3f4f6;
        border-radius: 16px;
        padding: 1.25rem;
        border: 1px solid #e5e7eb;
    }

    .queue-status-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .queue-status-header h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: #1f2937;
    }

    .status-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
        background: #e5e7eb;
        color: #6b7280;
        transition: all 0.2s;
    }

    .status-badge.status-active {
        background: #d1fae5;
        color: #059669;
    }

    .queue-progress {
        background: white;
        border-radius: 12px;
        padding: 1rem;
        margin-bottom: 1rem;
        border: 1px solid #e5e7eb;
    }

    .progress-labels {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    .progress-text {
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
    }

    .progress-count {
        font-size: 0.875rem;
        font-weight: 600;
        color: #1f2937;
    }

    .progress-bar-track {
        height: 8px;
        background: #e5e7eb;
        border-radius: 9999px;
        overflow: hidden;
        margin-bottom: 0.75rem;
    }

    .progress-bar-fill {
        height: 100%;
        background: #4f46e5;
        border-radius: 9999px;
        transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .queue-details {
        margin: 0;
        font-size: 0.75rem;
        color: #6b7280;
        text-align: center;
    }

    .queue-controls-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }

    @media (max-width: 480px) {
        .queue-controls-row {
            grid-template-columns: 1fr;
        }
    }

    .control-item {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .control-label {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #6b7280;
        margin: 0;
    }

    .size-control {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: white;
        border-radius: 12px;
        padding: 0.375rem;
        border: 1px solid #e5e7eb;
    }

    .size-btn {
        width: 2rem;
        height: 2rem;
        border: none;
        background: #f3f4f6;
        color: #374151;
        border-radius: 8px;
        cursor: pointer;
        font-size: 1.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .size-btn:hover:not(:disabled) {
        background: #e5e7eb;
        transform: translateY(-1px);
    }

    .size-btn:active:not(:disabled) {
        transform: translateY(0);
    }

    .size-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }

    .size-input {
        flex: 1;
        width: 3rem;
        text-align: center;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 0.5rem;
        color: #1f2937;
        font-size: 1rem;
        font-weight: 600;
    }

    .size-input:focus {
        outline: none;
        border-color: #4f46e5;
        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }

    /* Hide number input spinners */
    .size-input::-webkit-inner-spin-button,
    .size-input::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    .size-input::-moz-number-spin-box {
        appearance: textfield;
    }

    .toggle-btn {
        position: relative;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.625rem 0.875rem;
        background: white;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .toggle-btn:hover {
        border-color: #d1d5db;
        background: #f9fafb;
    }

    .toggle-btn.toggle-active {
        border-color: #4f46e5;
        background: #eef2ff;
    }

    .toggle-slider {
        width: 2.5rem;
        height: 1.25rem;
        background: #e5e7eb;
        border-radius: 9999px;
        position: relative;
        transition: background 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .toggle-slider::before {
        content: "";
        position: absolute;
        top: 0.125rem;
        left: 0.125rem;
        width: 1rem;
        height: 1rem;
        background: white;
        border-radius: 50%;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .toggle-btn.toggle-active .toggle-slider {
        background: #4f46e5;
    }

    .toggle-btn.toggle-active .toggle-slider::before {
        transform: translateX(1.25rem);
    }

    .toggle-label {
        font-size: 0.875rem;
        font-weight: 600;
        flex: 1;
        text-align: left;
        color: #374151;
    }

    .toggle-btn.toggle-active .toggle-label {
        color: #4f46e5;
    }
</style>
