// Copyright 2019 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Service for handling microphone data and mp3 audio processing.
 */

import {EventEmitter, Injectable} from '@angular/core';
import {LoggerService} from 'services/contextual/logger.service';

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

@Injectable({
  providedIn: 'root',
})
export class VoiceoverRecordingService {
  // These properties are initialized using init method and we need to do
  // non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  audioContextAvailable!: typeof AudioContext;
  definedAudioContext!: AudioContext; // Will be defined audio context.
  isAvailable!: boolean;
  isRecording: boolean = false;
  microphone!: MediaStreamAudioSourceNode;
  microphoneStream!: MediaStream;
  processor!: ScriptProcessorNode;
  mp3Worker: Worker | null = null;
  defer: EventEmitter<string> = new EventEmitter();

  constructor(private loggerService: LoggerService) {}

  _stopRecord(): void {
    if (this.microphone && this.processor && this.mp3Worker) {
      // Disconnect mic and processor and stop processing.
      this.microphone.disconnect();
      this.processor.disconnect();
      this.processor.onaudioprocess = null;
      // Issue command to retrieve converted audio.
      this.mp3Worker.postMessage({cmd: 'finish'});
      // Stop microphone stream.
      this.microphoneStream.getTracks().forEach(function (track) {
        track.stop();
      });

      this.isRecording = false;
    }
  }

  _closeRecorder(): void {
    this._stopWorker();
  }

  initRecorder(): void {
    this._initRecorder();
  }

  status(): {
    isAvailable: boolean;
    isRecording: boolean;
  } {
    return {
      isAvailable: this.isAvailable,
      isRecording: this.isRecording,
    };
  }

  async startRecordingAsync(): Promise<MediaStream | null> {
    // If worker is not available then do not start recording.
    if (this.mp3Worker === null) {
      return null;
    }

    let navigator = this._startMicrophoneAsync();

    navigator.then(
      stream => {
        this.isRecording = true;
        // Set microphone stream will be used for stopping track
        // stream in another function.
        this.microphoneStream = stream;
        this._processMicAudio(stream);
      },
      () => {
        this.loggerService.warn(
          'Microphone was not started because ofuser denied permission.'
        );
        this.isRecording = false;
      }
    );

    return navigator;
  }

  stopRecord(): void {
    if (this.mp3Worker !== null) {
      this._stopRecord();
    }
  }

  getMp3Data(): EventEmitter<string> {
    return this.defer;
  }

  closeRecorder(): void {
    this._closeRecorder();
  }

  _initWorker(): void {
    if (!Worker) {
      this.loggerService.warn('Worker API not supported in this browser.');
      return;
    }
    if (this.mp3Worker === null) {
      let lameWorkerFileUrl =
        '/third_party/static/lamejs-1.2.0/' +
        'worker-example/worker-realtime.js';
      // Config the mp3 encoding worker.
      let config = {sampleRate: 44100, bitRate: 128};
      this.mp3Worker = new Worker(lameWorkerFileUrl);
      this.mp3Worker.onmessage = e => {
        // Async data flow.
        this.defer.emit(e.data.buf);
        return;
      };

      this.mp3Worker.postMessage({cmd: 'init', config: config});
    }
  }

  // Convert directly from mic input to mp3.
  _onAudioProcess(event: {
    inputBuffer: {
      getChannelData: (value: number) => Transferable[];
    };
  }): void {
    let array = event.inputBuffer.getChannelData(0);
    this._postMessage(array);
  }

  async _startMicrophoneAsync(): Promise<MediaStream> {
    return navigator.mediaDevices.getUserMedia({audio: true, video: false});
  }

  _postMessage(buffer: Transferable[]): void {
    // Ensure the mp3Worker is available when this is run.
    if (this.mp3Worker) {
      this.mp3Worker.postMessage({cmd: 'encode', buf: buffer});
    }
  }

  _stopWorker(): void {
    if (this.mp3Worker) {
      this.mp3Worker.terminate();
      this.loggerService.log('Ending mp3 worker');
      this.mp3Worker = null;
    }
  }

  _initRecorder(): void {
    // Browser agnostic AudioContext API check.
    this.audioContextAvailable =
      window.AudioContext || (window as Window).webkitAudioContext;

    if (this.audioContextAvailable) {
      // Promise required because angular is async with worker.
      this.isAvailable = true;
      this._initWorker();
    } else {
      this.isAvailable = false;
    }
  }

  // Setup microphone inputs for mp3 audio processing.
  _processMicAudio(stream: MediaStream): void {
    this.definedAudioContext = new this.audioContextAvailable();
    // Settings a bufferSize of 0 instructs the browser
    // to choose the best bufferSize.
    this.processor = this.definedAudioContext.createScriptProcessor(0, 1, 1);
    // Process microphone to mp3 encoding.

    // This throws "Object is possibly undefined." The type undefined
    // comes here from audio context dependency. We need to suppress this
    // error because of strict type checking.
    // @ts-ignore
    this.processor.onaudioprocess = this._onAudioProcess.bind(this);

    this.microphone = this.definedAudioContext.createMediaStreamSource(stream);
    // Connect custom processor to microphone.
    this.microphone.connect(this.processor);
    // Connect to speakers as destination.
    this.processor.connect(this.definedAudioContext.destination);
  }
}
