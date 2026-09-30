/** Messages between the assistant service and the embedding worker (public/assistant/embedder.worker.js). */
export type EmbedderRequest = { id: number; texts: string[] };

export type EmbedderResponse =
  | { type: 'progress'; progress: number }
  | { type: 'result'; id: number; dims: number; data: Float32Array }
  | { type: 'error'; id: number; message: string };
