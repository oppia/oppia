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

import { EventEmitter, Injectable, NgZone } from '@angular/core';
import { AudioFile } from 'domain/utilities/audio-file.model';
import { AudioTranslationManagerService } from 'pages/exploration-player-page/services/audio-translation-manager.service';
import { AssetsBackendApiService } from './assets-backend-api.service';
import { ContextService } from './context.service';
import { Howl } from 'howler';
import { downgradeInjectable } from '@angular/upgrade/static';
import { interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BindableVoiceovers } from 'domain/exploration/recorded-voiceovers.model';

export interface AudioParams {
  audioTranslations: BindableVoiceovers,
  html: string,
  componentName: string
}

@Injectable({
  providedIn: 'root'
})
export class AudioPlayerService {
  private _currentTrackFilename: string | null = null;
  private _currentTrack: Howl | null = null;
  private _lastPausePos: number | null = null;
  private loadingTrack = false;
  private _updateViewEventEmitter = new EventEmitter();
  private _autoplayAudioEventEmitter: EventEmitter<AudioParams> = (
    new EventEmitter());
  private _stopIntervalSubject = new Subject();
  constructor(
    private assetsBackendApiService: AssetsBackendApiService,
    private audioTranslationManagerService: AudioTranslationManagerService,
    private contextService: ContextService,
    private ngZone: NgZone
  ) {}

  private _load(filename: string, successCallback, errorCallback) {
    if (this.loadingTrack) {
      throw new Error('Already loading a track... Please try again!');
    }
    if (this._currentTrackFilename === filename) {
      return;
    }
    this.assetsBackendApiService.loadAudio(
      this.contextService.getExplorationId(),
      filename).then(
      (loadedAudioFile: AudioFile) => {
        this._currentTrack = new Howl({
          src: [URL.createObjectURL(loadedAudioFile.data)],
          format: ['mp3']
        });
        this._currentTrack.on('load', () => {
          this._currentTrackFilename = loadedAudioFile.filename;
          this.loadingTrack = false;
          this._lastPausePos = 0;
          this.play();
          successCallback();
        });
        this._currentTrack.on('end', () => {
          this._currentTrack = null;
          this._currentTrackFilename = null;
          this._lastPausePos = null;
          this.audioTranslationManagerService.clearSecondaryAudioTranslations();
        });
      }, (e) => errorCallback(e)
    );
  }

  private _play() {
    if (!this.isPlaying()) {
      if (this._currentTrack !== null) {
        this._currentTrack.seek(this._lastPausePos);
      }
      this.ngZone.runOutsideAngular(() => {
        interval(500).pipe(takeUntil(
          this._stopIntervalSubject)).subscribe(() => {
          this.ngZone.run(() => {
            this._updateViewEventEmitter.emit();
          });
        });
      });
      this._currentTrack.play();
    }
  }

  private _pause() {
    if (this.isPlaying()) {
      this._lastPausePos = this.getCurrentTime();
      this._currentTrack.pause();
      this._stopIntervalSubject.next();
    }
  }

  private _stop() {
    if (this._currentTrack) {
      this._lastPausePos = 0;
      this._currentTrack.stop();
      this._stopIntervalSubject.next();
      this._currentTrackFilename = null;
      this._currentTrack = null;
    }
  }

  private _rewind(seconds) {
    if (this._currentTrack) {
      const currentSeconds = (
        this._currentTrack.seek());
      if (typeof currentSeconds !== 'number') {
        return;
      }
      if (currentSeconds - seconds > 0) {
        this._currentTrack.seek(currentSeconds - seconds);
      } else {
        this._currentTrack.seek(0);
      }
    }
  }

  private _forward(seconds: number): void {
    if (this._currentTrack) {
      const currentSeconds = this._currentTrack.seek();
      if (typeof currentSeconds !== 'number') {
        return;
      }
      if (currentSeconds + seconds < this._currentTrack.duration()) {
        this._currentTrack.seek(currentSeconds + seconds);
      }
    }
  }

  load(filename: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this._load(filename, resolve, reject);
    });
  }

  play(): void {
    this._play();
  }

  pause(): void {
    this._pause();
  }

  stop(): void {
    this._stop();
  }

  rewind(seconds: number): void {
    this._rewind(seconds);
  }

  forward(seconds: number): void {
    this._forward(seconds);
  }

  getCurrentTime(): number {
    if (this._currentTrack) {
      const sec = this._currentTrack.seek();
      if (typeof sec !== 'number') {
        return 0;
      }
      return Math.floor(sec);
    } else {
      return 0;
    }
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
    this._lastPausePos = val;
    this._currentTrack.seek(Math.floor(val));
  }

  getAudioDuration(): number {
    if (this._currentTrack) {
      return this._currentTrack.duration();
    } else {
      return 0;
    }
  }

  getProgress(): number {
    if (!this._currentTrack) {
      return 0;
    }
    return (
      this._currentTrack.seek() as number) / this._currentTrack.duration();
  }

  setProgress(progress: number): void {
    if (progress < 0 || progress > 1) {
      return;
    }
    if (this._currentTrack) {
      this._currentTrack.seek(progress * this._currentTrack.duration());
    }
  }

  isPlaying(): boolean {
    return this._currentTrack && this._currentTrack.playing();
  }

  isTrackLoaded(): boolean {
    return this._currentTrack !== null;
  }

  clear(): void {
    if (this._currentTrack && this.isPlaying()) {
      this._currentTrack.stop();
    }
    this._currentTrack = null;
  }

  get currentTime(): number {
    return this.getCurrentTime();
  }

  get viewUpdate(): EventEmitter<void> {
    return this._updateViewEventEmitter;
  }

  get onAutoplayAudio(): EventEmitter<void> {
    return this._autoplayAudioEventEmitter;
  }
}

angular.module('oppia').factory('AudioPlayerService', downgradeInjectable(
  AudioPlayerService
));
