export type CielEndingId =
  | 'bad_void'
  | 'good_celestial'
  | 'secret_chained'
  | 'secret_epilogue';

export type CielMilestoneEvent =
  | 'ORB_COLLECTED'
  | 'MALAKOR_DEFEATED'
  | 'ALTER_EGO_DEFEATED';

export interface CielHostInitPayload {
  nonce: string;
  playerName?: string;
  storageNamespace?: string;
  muted?: boolean;
  volume?: number;
  embedMode?: boolean;
}

export interface CielHostAudioPayload {
  nonce: string;
  muted?: boolean;
  volume?: number;
}

export interface CielHostHandlers {
  onInit?: (payload: CielHostInitPayload) => void;
  onAudio?: (payload: CielHostAudioPayload) => void;
  onShutdown?: () => void;
}

export interface CielEndingPayload {
  elapsedSec: number;
  totalPlayTimeSec: number;
  orbsCollected: number;
}

export const IS_CIEL_EMBED_BUILD = import.meta.env.VITE_CIEL_EMBED === 'true';

let sessionNonce: string | null = null;
let runtimeEmbedMode = IS_CIEL_EMBED_BUILD;
let allowedOrigin: string | null =
  typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null'
    ? window.location.origin
    : null;

function hasParentHost(): boolean {
  return typeof window !== 'undefined' && Boolean(window.parent) && window.parent !== window;
}

function getTargetOrigin(): string {
  if (allowedOrigin) return allowedOrigin;
  if (typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null') {
    return window.location.origin;
  }
  return '*';
}

function postToHost(message: Record<string, unknown>): void {
  if (!hasParentHost()) return;
  try {
    window.parent.postMessage(
      {
        ...message,
        nonce: sessionNonce ?? '',
      },
      getTargetOrigin()
    );
  } catch {}
}

export function isEmbedModeActive(): boolean {
  return IS_CIEL_EMBED_BUILD || runtimeEmbedMode;
}

export const cielBridge = {
  registerHostHandlers(handlers: CielHostHandlers): () => void {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const onMessage = (event: MessageEvent) => {
      if (!hasParentHost()) return;
      if (event.source !== window.parent) return;
      if (allowedOrigin && event.origin !== allowedOrigin) return;

      const data = event.data;
      if (!data || typeof data !== 'object') return;
      const msg = data as Record<string, unknown>;
      const type = msg.type;
      const nonce = typeof msg.nonce === 'string' ? msg.nonce : '';

      if (!nonce) return;

      if (type === 'CIEL_HOST_INIT') {
        sessionNonce = nonce;
        if (!allowedOrigin && event.origin && event.origin !== 'null') {
          allowedOrigin = event.origin;
        }
        if (msg.embedMode === true) {
          runtimeEmbedMode = true;
        }
        handlers.onInit?.({
          nonce,
          playerName: typeof msg.playerName === 'string' ? msg.playerName : undefined,
          storageNamespace:
            typeof msg.storageNamespace === 'string' ? msg.storageNamespace : undefined,
          muted: typeof msg.muted === 'boolean' ? msg.muted : undefined,
          volume: typeof msg.volume === 'number' ? msg.volume : undefined,
          embedMode: typeof msg.embedMode === 'boolean' ? msg.embedMode : undefined,
        });
        return;
      }

      if (!sessionNonce || nonce !== sessionNonce) return;

      if (type === 'CIEL_HOST_AUDIO') {
        handlers.onAudio?.({
          nonce,
          muted: typeof msg.muted === 'boolean' ? msg.muted : undefined,
          volume: typeof msg.volume === 'number' ? msg.volume : undefined,
        });
      } else if (type === 'CIEL_HOST_SHUTDOWN') {
        handlers.onShutdown?.();
      }
    };

    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
    };
  },

  emitReady(): void {
    postToHost({ type: 'AETHERIA_READY' });
  },

  emitMilestone(event: CielMilestoneEvent, count: number, elapsedSec: number): void {
    postToHost({
      type: 'AETHERIA_MILESTONE',
      event,
      count,
      elapsedSec: Math.max(0, Math.round(elapsedSec)),
    });
  },

  emitEndingUnlocked(endingId: CielEndingId, payload: CielEndingPayload): void {
    postToHost({
      type: 'AETHERIA_ENDING_UNLOCKED',
      endingId,
      elapsedSec: Math.max(0, Math.round(payload.elapsedSec)),
      totalPlayTimeSec: Math.max(0, Math.round(payload.totalPlayTimeSec)),
      orbsCollected: Math.max(0, Math.floor(payload.orbsCollected)),
    });
  },

  emitRequestExit(): void {
    postToHost({ type: 'AETHERIA_REQUEST_EXIT' });
  },
};
