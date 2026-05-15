import {
  WORKFLOW_DESERIALIZE,
  WORKFLOW_SERIALIZE,
} from '@ai-sdk/provider-utils';
import { describe, expect, it } from 'vitest';
import { createOpenAI } from './openai-provider';

function roundTrip<T>(model: T): T {
  const cls = (model as { constructor: unknown }).constructor as {
    [WORKFLOW_SERIALIZE]: (m: T) => { modelId: string; config: unknown };
    [WORKFLOW_DESERIALIZE]: (o: { modelId: string; config: unknown }) => T;
  };
  const serialized = cls[WORKFLOW_SERIALIZE](model);
  const json = JSON.parse(JSON.stringify(serialized));
  return cls[WORKFLOW_DESERIALIZE](json);
}

type ModelWithConfig = {
  modelId: string;
  config: {
    baseURL?: string;
    url: (o: { modelId: string; path: string }) => string;
  };
};

describe('OpenAI workflow round-trip', () => {
  const openai = createOpenAI({ apiKey: 'sk-test-key' });

  it('responses model rebuilds working url closure', () => {
    const original = openai.responses('gpt-4o-mini');
    const rehydrated = roundTrip(original) as unknown as ModelWithConfig;
    expect(rehydrated.modelId).toBe('gpt-4o-mini');
    expect(typeof rehydrated.config.url).toBe('function');
    expect(
      rehydrated.config.url({ modelId: 'gpt-4o-mini', path: '/responses' }),
    ).toBe('https://api.openai.com/v1/responses');
  });

  it('chat model rebuilds working url closure', () => {
    const rehydrated = roundTrip(
      openai.chat('gpt-4o-mini'),
    ) as unknown as ModelWithConfig;
    expect(
      rehydrated.config.url({
        modelId: 'gpt-4o-mini',
        path: '/chat/completions',
      }),
    ).toBe('https://api.openai.com/v1/chat/completions');
  });

  it('completion model rebuilds working url closure', () => {
    const rehydrated = roundTrip(
      openai.completion('gpt-3.5-turbo-instruct'),
    ) as unknown as ModelWithConfig;
    expect(
      rehydrated.config.url({
        modelId: 'gpt-3.5-turbo-instruct',
        path: '/completions',
      }),
    ).toBe('https://api.openai.com/v1/completions');
  });

  it('embedding model rebuilds working url closure', () => {
    const rehydrated = roundTrip(
      openai.embedding('text-embedding-3-small'),
    ) as unknown as ModelWithConfig;
    expect(
      rehydrated.config.url({
        modelId: 'text-embedding-3-small',
        path: '/embeddings',
      }),
    ).toBe('https://api.openai.com/v1/embeddings');
  });

  it('image model rebuilds working url closure', () => {
    const rehydrated = roundTrip(
      openai.image('gpt-image-1'),
    ) as unknown as ModelWithConfig;
    expect(
      rehydrated.config.url({
        modelId: 'gpt-image-1',
        path: '/images/generations',
      }),
    ).toBe('https://api.openai.com/v1/images/generations');
  });

  it('transcription model rebuilds working url closure', () => {
    const rehydrated = roundTrip(
      openai.transcription('whisper-1'),
    ) as unknown as ModelWithConfig;
    expect(
      rehydrated.config.url({
        modelId: 'whisper-1',
        path: '/audio/transcriptions',
      }),
    ).toBe('https://api.openai.com/v1/audio/transcriptions');
  });

  it('speech model rebuilds working url closure', () => {
    const rehydrated = roundTrip(
      openai.speech('tts-1'),
    ) as unknown as ModelWithConfig;
    expect(
      rehydrated.config.url({ modelId: 'tts-1', path: '/audio/speech' }),
    ).toBe('https://api.openai.com/v1/audio/speech');
  });

  it('respects custom baseURL across serde', () => {
    const custom = createOpenAI({
      apiKey: 'sk-test-key',
      baseURL: 'https://my-proxy.example.com/v1',
    });
    const rehydrated = roundTrip(
      custom.responses('gpt-4o-mini'),
    ) as unknown as ModelWithConfig;
    expect(
      rehydrated.config.url({ modelId: 'gpt-4o-mini', path: '/responses' }),
    ).toBe('https://my-proxy.example.com/v1/responses');
  });

  it('serialized payload includes baseURL but omits url closure', () => {
    const original = openai.responses('gpt-4o-mini');
    const cls = (original as unknown as { constructor: unknown })
      .constructor as { [WORKFLOW_SERIALIZE]: (m: unknown) => unknown };
    const serialized = cls[WORKFLOW_SERIALIZE](original) as {
      config: Record<string, unknown>;
    };
    expect(serialized.config.baseURL).toBe('https://api.openai.com/v1');
    expect(serialized.config.url).toBeUndefined();
  });
});
