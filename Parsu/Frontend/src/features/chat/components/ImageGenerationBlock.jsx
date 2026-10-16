import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { RiImageAddLine, RiSparklingLine, RiAlertLine } from '@remixicon/react';

export default function ImageGenerationBlock({ prompt }) {
  const [status, setStatus] = useState('loading');
  const [image, setImage] = useState('');
  const [message, setMessage] = useState('Checking your connected image models…');

  useEffect(() => {
    let cancelled = false;
    const create = async () => {
      try {
        const modelResponse = await axios.get('/api/media/image-models', { withCredentials: true });
        const model = modelResponse.data?.models?.[0];
        if (!model) {
          if (!cancelled) {
            setStatus('unavailable');
            setMessage(modelResponse.data?.reason || 'No free image-generation model is available for your connected API key.');
          }
          return;
        }
        if (!cancelled) setMessage(`Creating with ${model.name}…`);
        const result = await axios.post('/api/media/generate-image', { prompt, model: model.id }, { withCredentials: true });
        if (!cancelled && result.data?.image) {
          setImage(`data:${result.data.mimeType || 'image/png'};base64,${result.data.image}`);
          setStatus('done');
        }
      } catch (error) {
        if (!cancelled) {
          setStatus('unavailable');
          setMessage(error.response?.data?.message || 'Could not create this image. Check your API key and try again.');
        }
      }
    };
    create();
    return () => { cancelled = true; };
  }, [prompt]);

  return (
    <section className="not-prose my-5 overflow-hidden rounded-2xl border border-zinc-200/70 bg-white dark:border-white/10 dark:bg-zinc-900/50">
      <div className="flex items-center gap-2 border-b border-zinc-200/70 px-4 py-3 text-sm font-semibold text-zinc-800 dark:border-white/5 dark:text-zinc-100">
        <RiImageAddLine size={17} className="text-[var(--accent-cyan)]" />
        <span>Image creation</span>
        {status === 'loading' && <RiSparklingLine size={14} className="ml-auto animate-pulse text-[var(--accent-cyan)]" />}
      </div>
      {status === 'loading' ? (
        <div className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1.3fr)_minmax(180px,1fr)]">
          <div className="aspect-[4/3] animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="space-y-3 py-1">
            <div className="h-3 w-4/5 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <p className="pt-2 text-xs text-zinc-500">{message}</p>
          </div>
        </div>
      ) : status === 'done' ? (
        <figure className="m-0">
          <img src={image} alt={prompt} className="max-h-[640px] w-full bg-zinc-100 object-contain dark:bg-zinc-950" />
          <figcaption className="px-4 py-3 text-xs text-zinc-500">{prompt}</figcaption>
        </figure>
      ) : (
        <div className="flex items-start gap-2.5 p-4 text-sm text-zinc-600 dark:text-zinc-400">
          <RiAlertLine size={17} className="mt-0.5 shrink-0 text-amber-500" />
          <p className="m-0">{message}</p>
        </div>
      )}
    </section>
  );
}
