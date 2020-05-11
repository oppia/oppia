// Code (Release 3.3.3) - https://raw.githubusercontent.com/katspaugh/wavesurfer.js/3.3.3/src/wavesurfer.js

class WaveSurfer {
  addPlugin: (plugin: Object) => WaveSurfer;
  cancelAjax: () => void;
  clearTmpEvents: () => void;
  createBackend: () => void;
  createDrawer: () => void;
  createPeakCache: () => void;
  decodeArrayBuffer: (arraybuffer: ArrayBuffer, callback: Function) => void;
  destroy: () => void;
  destroyAllPlugins: () => void;
  destroyPlugin: (name: string) => WaveSurfer;
  drawBuffer: () => void;
  empty: () => void;
  exportImage: (
    format: string, quality: number,
    type: string) => string | string[] | Promise<Object>;
  exportPCM: (
    length: number, accuracy: number, noWindow: boolean,
    start: number, end: number) => Promise<Object>;
  getArrayBuffer: (url: string, callback: Function) => Object;
  getBackgroundColor: () => string;
  getCurrentTime: () => number;
  getCursorColor: () => string;
  getDuration: () => number;
  getFilters: () => Array<Object>;
  getHeight: () => number;
  getMute: () => boolean;
  getPlaybackRate: () => number;
  getProgressColor: () => string;
  getVolume: () => number;
  getWaveColor: () => string;
  init: () => WaveSurfer;
  initPlugin: (plugin: string) => WaveSurfer;
  isPlaying: () => boolean;
  isReady: () => boolean;
  load: (
    url: string | HTMLMediaElement, peaks: number[],
    preload?: string, duration?: number) => void;
  loadArrayBuffer: (buffer: ArrayBuffer) => void;
  loadBlob: (blob: Blob | File) => void;
  loadBuffer: (url: string, peaks: number[], duration?: number) => void;
  loadDecodedBuffer: (buffer: AudioBuffer) => void;
  loadMediaElement: (
    urlOrElt: string | HTMLMediaElement, peaks: number[], preload?: boolean,
    duration?: number) => void;
  onProgress: (e: Event) => void;
  pause: () => Promise<Object>;
  play: (start?: number, end?: number) => Promise<Object>;
  playPause: () => Promise<Object>;
  registerPlugins: (plugins: Array<Object>) => WaveSurfer;
  seekAndCenter: (progress: number) => void;
  seekTo: (progress: number) => void;
  setBackgroundColor: (color: string) => void;
  setCurrentTime: (seconds: number) => void;
  setCursorColor: (color: string) => void;
  setHeight: (height: number) => void;
  setMute: (mute: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  setProgressColor: (color: string) => void;
  setSinkId: (device: string) => Promise<Object>;
  setVolume: (newVolume: number) => void;
  setWaveColor: (color: string) => void;
  skip: (offset: number) => void;
  skipBackward: (seconds?: number) => void;
  skipForward: (seconds?: number) => void;
  stop: () => void;
  toggleInteraction: () => void;
  toggleMute: () => void;
  toggleScroll: () => void;
  zoom: (pxPerSec?: number) => void;

  constructor(params: Object);
}

namespace WaveSurfer {
  export function create(params: Object): WaveSurfer;
  export let VERSION: string;
  export let util: Object;
}
