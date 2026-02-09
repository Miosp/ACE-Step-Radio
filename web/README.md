# ACE-Step Web App

SvelteKit 5 web application for the ACE-Step music generation API.

## Development

```bash
cd web
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

## API Client Usage

### Basic Usage

```typescript
import { acestepService } from '$lib/api/services/acestep';

// Check API health
const health = await acestepService.checkHealth();

// Create a task
const taskId = await acestepService.createTask({
  caption: 'A jazz song',
  duration: 30
});

// Query status
const result = await acestepService.queryResult(taskId);

// Wait for completion with progress updates
const audio = await acestepService.waitForCompletion(taskId, {
  checkInterval: 2000,
  onProgress: (status, progressText) => {
    console.log(`Status: ${status}, Progress: ${progressText}`);
  }
});

// Download audio
await acestepService.saveAudio(audio.audioUrl, 'my-song.mp3');
```

### Using the Store

```svelte
<script>
  import { taskStore } from '$lib/stores/acestep';

  async function generate() {
    await taskStore.generateMusic({
      caption: 'A rock song',
      duration: 30
    });
  }
</script>

{#if $taskStore.isGenerating}
  <p>{$taskStore.progress}</p>
{:else if $taskStore.currentTask?.status === 1}
  <audio src={$taskStore.currentTask.audioUrl} controls></audio>
{/if}
```

## API Client Structure

```
src/lib/api/
├── client.ts           # Base HTTP client with error handling
├── services/
│   └── acestep.ts      # ACE-Step specific API methods
├── types/
│   └── index.ts        # TypeScript type definitions
└── utils/
    └── index.ts        # Utility functions
```

## Available Methods

### `AceStepService`

| Method | Description |
|--------|-------------|
| `checkHealth()` | Check API health status |
| `listModels()` | List available models |
| `createTask(request)` | Create a new music generation task |
| `queryResult(taskId)` | Query status of a single task |
| `queryResults(taskIds)` | Query status of multiple tasks |
| `waitForCompletion(taskId, options)` | Wait for task completion with polling |
| `downloadAudio(audioUrl)` | Download audio as Blob |
| `saveAudio(audioUrl, filename)` | Trigger browser download |
| `generateMusic(request, options)` | Convenience: create + wait |
| `formatInput(text, taskType)` | Format text using LLM |
| `createRandomSample()` | Get random inspiration |

## Type Definitions

```typescript
// Request
interface CreateTaskRequest {
  caption: string;          // Required: Music description
  lyrics?: string;          // Optional: Lyrics
  duration?: number;        // Optional: Duration in seconds
  bpm?: number;             // Optional: BPM
  key?: string;             // Optional: Musical key
  genre?: string;           // Optional: Genre
  top_k?: number;           // Optional: Top-k sampling
  top_p?: number;           // Optional: Top-p sampling
  temperature?: number;     // Optional: Temperature
  cfg_scale?: number;       // Optional: CFG scale
  seed?: number;            // Optional: Random seed
  model?: string;           // Optional: Model name
}

// Response
interface GeneratedAudio {
  taskId: string;
  status: TaskStatus;       // 0=processing, 1=success, 2=error
  audioUrl?: string;        // Download URL
  duration?: number;
  metadata?: ParsedTaskResult;
  error?: string;
  progressText?: string;
}
```

## Demo Page

A demo page is available at `/demo` with a full UI for:
- Creating music generation tasks
- Monitoring progress
- Playing and downloading generated audio

## Environment Variables

Create `.env.local` to configure the API URL:

```env
VITE_API_URL=http://localhost:8001
```

## Building

```bash
npm run build
npm run preview
```

Built files will be in `.svelte-kit/output/`.
