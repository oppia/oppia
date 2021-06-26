// Code - third_party/static/midi-js-c26ebb/build/MIDI.js

interface Base64Binary {
  _keyStr: string;
  decodeArrayBuffer: (input: string) => ArrayBuffer;
  decode: (input: string, arrayBuffer: ArrayBuffer) => Uint8Array;
}

interface MidiPlayer {
  BPM: number;
  currentTime: number;
  endTime: number;
  playing: boolean;
  startDelay: number;
  restart: number;
  timeWarp: number;

  addListener: (onsuccess: Function) => void;
  clearAnimation: () => void;
  getFileInstruments: () => string[];
  pause: () => void;
  loadFile: (
    file: File, onsuccess: Function, onprogress: Function,
    onerror: Function) => void;
  loadMidiFile: (
    onsuccess: Function, onprogress: Function, onerror: Function) => void;
  setAnimation: (callback: Function) => void;
  start: (onsuccess: Function) => void;
  stop: () => void;
  removeListener: () => void;
  resume: (onsuccess: Function) => void;
}

interface MidiAudioTag {
  api: string;
  audioBuffers: HTMLAudioElement[];

  connect: (opts: Object) => void;
  chordOff: (channel: number, notes: number[], delay: number) => void;
  chordOn: (
    channel: number, notes: number[], velocity: number, delay: number) => void;
  noteOff: (channel: number, note: number, delay: number) => void;
  noteOn: (
    channel: number, note: number, velocity: number, delay: number) => void;
  pitchBend: (channel: number, program: Object, delay: number) => void;
  programChange: (channel: number, program: Object) => void;
  send: (data: Object, delay: number) => void;
  setController: (
    channelId: number, type: Object, value: Object, delay: number) => void;
  setVolume: (channel: number, n: number) => void;
  stopAllNotes: () => void;
}

interface MidiWebAudio {
  api: string;
  audioBuffers: HTMLAudioElement[];

  connect: (opts: Object) => void;
  chordOn: (
    channel: number, notes: number[], velocity: number, delay: number) => void;
  chordOff: (channel: number, notes: number[], delay: number) => void;
  noteOn: (
    channel: number, note: number, velocity: number, delay: number) => void;
  noteOff: (channel: number, note: number, delay: number) => void;
  getContext: () => Object;
  setContext: (
    newCtx: Object, onload: Function, onprogress: Function,
    onerror: Function) => void;
  pitchBend: (channel: number, program: Object, delay: number) => void;
  setEffects: (list: Object[]) => void;
  stopAllNotes: () => void;
  programChange: (channel: number, program: Object) => void;
  send: (data: Object, delay: number) => void;
  setController: (
    channelId: number, type: Object, value: Object, delay: number) => void;
  setVolume: (channel: number, n: number) => void;
}

interface WebMidi {
  api: string;

  connect: (opts: Object) => void;
  chordOff: (channel: number, notes: number[], delay: number) => void;
  chordOn: (
    channel: number, notes: number[], velocity: number, delay: number) => void;
  noteOff: (channel: number, note: number, delay: number) => void;
  noteOn: (
    channel: number, note: number, velocity: number, delay: number) => void;
  pitchBend: (channel: number, program: Object, delay: number) => void;
  programChange: (channel: number, program: Object) => void;
  send: (data: Object, delay: number) => void;
  setController: (
    channelId: number, type: Object, value: Object, delay: number) => void;
  setVolume: (channel: number, n: number) => void;
  stopAllNotes: () => void;
}

interface MidiKeyToNote {
  [key: string]: number;
}

interface MidiNoteToKey {
  [note: number]: string;
}

interface MIDI {
  audioBuffers: Object;
  AudioTag: MidiAudioTag;
  channels: Object[];
  GM: Object;
  keyToNote: MidiKeyToNote;
  noteToKey: MidiNoteToKey;
  Player: MidiPlayer;
  supports: Object;
  util: Object;
  WebAudio: MidiWebAudio;
  WebMIDI: WebMidi;

  audioDetect: (onsuccess: Function) => Object;
  chordOff: (channel: number, notes: number[], delay: number) => void;
  chordOn: (
    channel: number, notes: number[], velocity: number, delay: number) => void;
  getContext: () => Object;
  getInstrument: (channelId: number) => Object;
  getMono: (channelId: number) => Object;
  getOmni: (channelId: number) => Object;
  getSolo: (channelId: number) => Object;
  loadPlugin: (opts: Object) => void;
  loadResource: (opts: Object) => void;
  noteOff: (channel: number, note: number, delay: number) => void;
  noteOn: (
    channel: number, note: number, velocity: number, delay: number) => void;
  pitchBend: (channel: number, program: Object, delay: number) => void;
  programChange: (channel: number, program: Object) => void;
  send: (data: Object, delay: number) => void;
  setContext: (
    newCtx: Object, onload: Function, onprogress: Function,
    onerror: Function) => void;
  setController: (
    channelId: number, type: Object, value: Object, delay: number) => void;
  setDefaultPlugin: (midi: Object) => void;
  setEffects: (list: Object[]) => void;
  setInstrument: (
    channelId: number, program: Object, dealy: number) => NodeJS.Timeout;
  setMono: (
    channelId: number, truthy: Object, delay: number) => NodeJS.Timeout;
  setOmni: (
    channelId: number, truthy: Object) => NodeJS.Timeout;
  setSolo: (
    channelId: number, truthy: Object) => NodeJS.Timeout;
    setVolume: (channel: number, n: number) => void;
  stopAllNotes: () => void;
}

declare var MIDI: MIDI;
