// Loaded from the CDN at runtime (the model and its WebAssembly runtime come from CDNs too),
// so nothing here goes through the app's bundler. Pinned: cached vectors depend on the model.
import { env, pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.0/dist/transformers.min.js';

/**
 * Runs the sentence-embedding model off the main thread.
 *
 * all-MiniLM-L6-v2 (8-bit, ~23 MB) is downloaded from the Hugging Face hub on
 * first use and kept in the browser's Cache Storage afterwards, so returning
 * visitors load it instantly. Vectors come back mean-pooled and normalised, so
 * a dot product between two of them is their cosine similarity.
 *
 * Served as a static file from /public: a plain module worker keeps it out of
 * the app bundle entirely. Message shapes are documented in
 * src/app/lib/assistant/embedder.types.ts.
 */

// Keep in sync with INDEX_VERSION in assistant.service.ts (cached vectors depend on the model)
const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';

// Only the hub: a local /models/ lookup would hit the SPA fallback and get HTML back
env.allowLocalModels = false;

/** @param {object} message @param {Transferable[]} [transfer] */
const post = (message, transfer = []) => self.postMessage(message, { transfer });

let extractor = null;

const load = () =>
  (extractor ??= pipeline('feature-extraction', EMBEDDING_MODEL, {
    dtype: 'q8',
    progress_callback: (info) => {
      if (info.status === 'progress_total') post({ type: 'progress', progress: info.progress / 100 });
    },
  }));

self.addEventListener('message', async (event) => {
  const { id, texts } = event.data;
  try {
    const embed = await load();
    const output = await embed(texts, { pooling: 'mean', normalize: true });
    const data = output.data;
    const dims = output.dims[output.dims.length - 1];
    post({ type: 'result', id, dims, data }, [data.buffer]);
  } catch (error) {
    // A failed load (e.g. offline) can be retried on the next question
    extractor = null;
    post({ type: 'error', id, message: error instanceof Error ? error.message : String(error) });
  }
});
