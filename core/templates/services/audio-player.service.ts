// Copyright 2017 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Service to operate the playback of audio.
 */

import {EventEmitter, Injectable, NgZone} from '@angular/core';
import {AudioFile} from 'domain/utilities/audio-file.model';
import {
  AudioTranslationManagerService,
  AudioTranslations,
} from 'pages/exploration-player-page/services/audio-translation-manager.service';
import {AssetsBackendApiService} from './assets-backend-api.service';
import {ContextService} from './context.service';
import {Howl} from 'howler';
import {interval, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

export interface AutoPlayAudioEvent {
  audioTranslations: AudioTranslations;
  html: string;
  componentName: string;
}

@Injectable({
  providedIn: 'root',
})
export class AudioPlayerService {
  // 'currentTrackFilename','currentTrack' and 'lastPauseOrSeekPos'
  // will be 'null' when the track is not selected or ended.
  private _currentTrackFilename: string | null = null;
  private _currentTrack: Howl | null = null;
  private _lastPauseOrSeekPos: number | null = null;
  private _updateViewEventEmitter = new EventEmitter<void>();
  private _autoplayAudioEventEmitter =
    new EventEmitter<void | AutoPlayAudioEvent>();

  private _stopIntervalSubject = new Subject<void>();
  constructor(
    private assetsBackendApiService: AssetsBackendApiService,
    private audioTranslationManagerService: AudioTranslationManagerService,
    private contextService: ContextService,
    private ngZone: NgZone
  ) {}

  private async _loadAsync(
    filename: string,
    successCallback: () => void,
    errorCallback: (reason?: string[]) => void
  ) {
    if (this._currentTrackFilename === filename) {
      return;
    }
    this.assetsBackendApiService
      .loadAudio(this.contextService.getExplorationId(), filename)
      .then(
        (loadedAudioFile: AudioFile) => {
          this._currentTrack = new Howl({
            src: [URL.createObjectURL(loadedAudioFile.data)],
            format: ['mp3'],
          });
          this._currentTrack.on('load', () => {
            this._stopIntervalSubject.next();
            this._currentTrackFilename = loadedAudioFile.filename;
            this._lastPauseOrSeekPos = 0;
            successCallback();
          });
          this._currentTrack.on('end', () => {
            this._stopIntervalSubject.next();
            this._currentTrack = null;
            this._currentTrackFilename = null;
            this._lastPauseOrSeekPos = null;
            this.audioTranslationManagerService.clearSecondaryAudioTranslations();
          });
        },
        e => errorCallback(e)
      );
  }

  async loadAsync(filename: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this._loadAsync(filename, resolve, reject);
    });
  }

  play(): void {
    if (this.isPlaying()) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      if (this._currentTrack !== null) {
        // 'lastPauseOrSeekPos' will not be null since currentTrack exists.
        // We can safely typecast it to 'number'.
        this._currentTrack.seek(this._lastPauseOrSeekPos as number);
      }
      interval(500)
        .pipe(takeUntil(this._stopIntervalSubject))
        .subscribe(() => {
          this.ngZone.run(() => {
            this._updateViewEventEmitter.emit();
          });
        });
      // 'currentTrack' is not null since the audio event has been emitted
      // and that is why we use '?'.
      this._currentTrack?.play();
    });
  }

  pause(): void {
    if (!this.isPlaying()) {
      return;
    }
    this._lastPauseOrSeekPos = Math.floor(this.getCurrentTimeInSecs());
    // 'currentTrack' is not null since the track is playing
    // and that is why we use '?'.
    this._currentTrack?.pause();
    this._stopIntervalSubject.next();
  }

  stop(): void {
    if (!this._currentTrack) {
      return;
    }
    this._currentTrack.stop();
    this._stopIntervalSubject.next();
    this._currentTrack = null;
    this._currentTrackFilename = null;
    this._lastPauseOrSeekPos = null;
    this.audioTranslationManagerService.clearSecondaryAudioTranslations();
  }

  rewind(seconds: number): void {
    if (!this._currentTrack) {
      return;
    }
    const currentSeconds = this._currentTrack.seek();
    if (typeof currentSeconds !== 'number') {
      return;
    }
    const rewindTo = currentSeconds - seconds;
    this._currentTrack.seek(rewindTo > 0 ? rewindTo : 0);
  }

  forward(seconds: number): void {
    if (!this._currentTrack) {
      return;
    }
    const currentSeconds = this._currentTrack.seek();
    if (typeof currentSeconds !== 'number') {
      return;
    }
    if (currentSeconds + seconds < this._currentTrack.duration()) {
      this._currentTrack.seek(currentSeconds + seconds);
    }
  }

  getCurrentTimeInSecs(): number {
    if (!this._currentTrack) {
      return 0;
    }
    const currentTime = this._currentTrack.seek();
    if (typeof currentTime !== 'number') {
      return 0;
    }
    return Math.floor(currentTime * 10) / 10;
  }

  setCurrentTime(val: number): void {
    if (!this._currentTrack) {
      return;
    }
    if (val < 0) {
      this._currentTrack.seek(0);
      return;
    }
    if (val > this._currentTrack.duration()) {
      this._currentTrack.seek(this._currentTrack.duration());
      return;
    }
    this._lastPauseOrSeekPos = val;
    this._currentTrack.seek(Math.floor(val));
  }

  getAudioDuration(): number {
    if (this._currentTrack) {
      return this._currentTrack.duration();
    } else {
      return 0;
    }
  }

  isPlaying(): boolean {
    return this._currentTrack !== null && this._currentTrack.playing();
  }

  isTrackLoaded(): boolean {
    return this._currentTrack !== null;
  }

  clear(): void {
    if (this.isPlaying()) {
      this.stop();
    }
    this._currentTrackFilename = null;
    this._currentTrack = null;
  }

  get viewUpdate(): EventEmitter<void> {
    return this._updateViewEventEmitter;
  }

  get onAutoplayAudio(): EventEmitter<void | AutoPlayAudioEvent> {
    return this._autoplayAudioEventEmitter;
  }

  get onAudioStop(): Subject<void> {
    return this._stopIntervalSubject;
  }
}
