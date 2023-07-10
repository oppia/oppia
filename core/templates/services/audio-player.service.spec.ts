// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests to operate the playback of audio.
 */

import { discardPeriodicTasks, fakeAsync, flushMicrotasks, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { AudioPlayerService } from './audio-player.service';
import { AssetsBackendApiService } from './assets-backend-api.service';
import { ContextService } from './context.service';
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import * as howler from 'howler';
import { AudioTranslationManagerService } from 'pages/exploration-player-page/services/audio-translation-manager.service';
import { Subject } from 'rxjs';
import { Howl } from 'howler';

describe('AudioPlayerService', () => {
  let audioPlayerService: AudioPlayerService;
  let contextService: ContextService;
  let assetsBackendApiService: AssetsBackendApiService;
  let audioTranslationManagerService: AudioTranslationManagerService;
  let successHandler: jasmine.Spy;
  let failHandler: jasmine.Spy;


  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AudioPlayerService,
        ContextService,
        AssetsBackendApiService,
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });
  }));

  beforeEach(() => {
    audioTranslationManagerService =
      TestBed.inject(AudioTranslationManagerService);
    audioPlayerService = TestBed.inject(AudioPlayerService);
    contextService = TestBed.inject(ContextService);
    assetsBackendApiService = TestBed.inject(AssetsBackendApiService);
    spyOn(contextService, 'getExplorationId').and.returnValue('1');
    successHandler = jasmine.createSpy('success');
    failHandler = jasmine.createSpy('fail');
  });

  describe('when audio loads successfully', () => {
    beforeEach(() => {
      spyOn(howler, 'Howl').and.returnValue({
        on: (evt: string, func: () => void) => {
          if (evt === 'load') {
            func();
          }
        },
        stop: () => {
          console.error('Howl.stop');
        },
        pause: () => {
          console.error('Howl.pause');
        },
        playing: () => {
          return false;
        },
        play: () => {
          console.error('Howl.play');
          return 2;
        },
        seek: (num?: number) => {
          if (typeof num !== 'undefined') {
            console.error('Howl.seek ', num);
            return num;
          }
          return 10;
        },
        duration: () => {
          return 30;
        }
      } as Howl);
      spyOn(assetsBackendApiService, 'loadAudio').and.returnValue(
        Promise.resolve({
          data: new Blob(),
          filename: 'test.mp3'
        }));
    });

    it('should load track when user plays audio', fakeAsync(async() => {
      audioPlayerService.loadAsync('test.mp3').then(
        successHandler, failHandler);
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }));

    it('should not load track when a track has already been loaded',
      fakeAsync(() => {
        audioPlayerService.loadAsync('test.mp3');
        flushMicrotasks();
        audioPlayerService.loadAsync('test.mp3');
        flushMicrotasks();

        expect(assetsBackendApiService.loadAudio).toHaveBeenCalledTimes(1);
      }));

    it('should play audio when user clicks the play button', fakeAsync(() => {
      spyOn(console, 'error');

      audioPlayerService.loadAsync('test.mp3');
      flushMicrotasks();

      audioPlayerService.play();
      tick(501);
      discardPeriodicTasks();

      // The play function of the Howl calss is called when the user clicks
      // the  play button. Since the Howl class is mocked, a cosole.error stmt
      // is placed inside the play function and is tested if the console.error
      // stmt inside it triggered.
      expect(console.error).toHaveBeenCalledWith('Howl.play');
    }));

    it('should not play audio again when audio is already being played',
      fakeAsync(() => {
        spyOn(console, 'error');
        spyOn(audioPlayerService, 'isPlaying').and.returnValue(true);

        audioPlayerService.loadAsync('test.mp3');
        flushMicrotasks();

        audioPlayerService.play();
        discardPeriodicTasks();

        // The play function of the Howl calss is called when the user clicks
        // the  play button. Since the Howl class is mocked, a cosole.error stmt
        // is placed inside the play function and is tested if the console.error
        // stmt inside it triggered.
        expect(console.error).not.toHaveBeenCalledWith('Howl.play');
      }));

    it('should not pause track when audio is not being played',
      fakeAsync(() => {
        spyOn(audioPlayerService, 'isPlaying').and.returnValue(false);
        spyOn(audioPlayerService, 'getCurrentTime');
        let subjectNext = spyOn(Subject.prototype, 'next');
        audioPlayerService.loadAsync('test.mp3');
        flushMicrotasks();

        audioPlayerService.pause();

        expect(audioPlayerService.getCurrentTime).not.toHaveBeenCalled();
        expect(subjectNext).toHaveBeenCalledTimes(1);
      }));

    it('should pause track when user clicks the \'Pause\' ' +
    'button', fakeAsync(() => {
      spyOn(audioPlayerService, 'isPlaying').and.returnValue(true);
      let subjectNext = spyOn(Subject.prototype, 'next');
      spyOn(audioPlayerService, 'getCurrentTime');
      audioPlayerService.loadAsync('test.mp3');
      flushMicrotasks();

      audioPlayerService.pause();

      expect(audioPlayerService.getCurrentTime).toHaveBeenCalled();
      expect(subjectNext).toHaveBeenCalled();
    }));

    it('should stop playing track when called',
      fakeAsync(() => {
        spyOn(audioPlayerService, 'setCurrentTime');
        spyOn(console, 'error');
        spyOn(
          audioTranslationManagerService,
          'clearSecondaryAudioTranslations');
        let subjectNext = spyOn(Subject.prototype, 'next');
        audioPlayerService.loadAsync('test.mp3');
        flushMicrotasks();

        audioPlayerService.stop();

        expect(console.error).toHaveBeenCalledWith('Howl.stop');
        expect(subjectNext).toHaveBeenCalledTimes(2);
        expect(audioTranslationManagerService.clearSecondaryAudioTranslations)
          .toHaveBeenCalled();
      }));

    it('should rewind the track when user clicks the \'Rewind\' ' +
    'button', fakeAsync(() => {
      spyOn(console, 'error');
      audioPlayerService.loadAsync('test.mp3');
      flushMicrotasks();

      audioPlayerService.rewind(5);

      expect(console.error).toHaveBeenCalledWith('Howl.seek ', 5);
    }));

    it('should forward the track when user clicks the \'forward\'' +
    ' button', fakeAsync(() => {
      spyOn(console, 'error');
      audioPlayerService.loadAsync('test.mp3');
      flushMicrotasks();

      audioPlayerService.forward(5);

      expect(console.error).toHaveBeenCalledWith('Howl.seek ', 15);
    }));

    it('should get the current time of the track when it is being played',
      fakeAsync(() => {
        audioPlayerService.loadAsync('test.mp3');
        flushMicrotasks();

        expect(audioPlayerService.getCurrentTime()).toBe(10);
      }));

    it('should set the time when user clicks on the track', fakeAsync(() => {
      spyOn(console, 'error');
      audioPlayerService.loadAsync('test.mp3');
      flushMicrotasks();

      audioPlayerService.setCurrentTime(15);

      expect(console.error).toHaveBeenCalledWith('Howl.seek ', 15);
    }));

    it('should set the time as track duration when user clicks on end ' +
    'of the track', fakeAsync(() => {
      spyOn(console, 'error');
      audioPlayerService.loadAsync('test.mp3');
      flushMicrotasks();

      audioPlayerService.setCurrentTime(31);

      expect(console.error).toHaveBeenCalledWith('Howl.seek ', 30);
    }));

    it('should set the time as 0 when user clicks on beginning ' +
    'of the track', fakeAsync(() => {
      spyOn(console, 'error');
      audioPlayerService.loadAsync('test.mp3');
      flushMicrotasks();

      audioPlayerService.setCurrentTime(-1);

      expect(console.error).toHaveBeenCalledWith('Howl.seek ', 0);
    }));

    it('should return duration of the track when called', fakeAsync(() => {
      audioPlayerService.loadAsync('test.mp3');
      flushMicrotasks();

      expect(audioPlayerService.getAudioDuration()).toBe(30);
    }));

    it('should return false when audio is not being played', fakeAsync(() => {
      audioPlayerService.loadAsync('test.mp3');
      flushMicrotasks();

      expect(audioPlayerService.isPlaying()).toBe(false);
    }));

    it('should return whether track is loaded', fakeAsync(() => {
      expect(audioPlayerService.isTrackLoaded()).toBe(false);

      audioPlayerService.loadAsync('test.mp3');
      flushMicrotasks();

      expect(audioPlayerService.isTrackLoaded()).toBe(true);

      audioPlayerService.clear();

      expect(audioPlayerService.isTrackLoaded()).toBe(false);
    }));

    it('should clear track when called', fakeAsync(() => {
      spyOn(audioPlayerService, 'isPlaying').and.callThrough();
      spyOn(audioPlayerService, 'stop');
      audioPlayerService.loadAsync('test.mp3');
      flushMicrotasks();

      expect(audioPlayerService.isTrackLoaded()).toBe(true);

      audioPlayerService.clear();

      expect(audioPlayerService.stop).not.toHaveBeenCalled();
      expect(audioPlayerService.isTrackLoaded()).toBe(false);
    }));

    it('should stop and clear track when called', fakeAsync(() => {
      spyOn(audioPlayerService, 'isPlaying').and.returnValue(true);
      spyOn(audioPlayerService, 'stop');
      audioPlayerService.loadAsync('test.mp3');
      flushMicrotasks();

      expect(audioPlayerService.isTrackLoaded()).toBe(true);

      audioPlayerService.clear();

      expect(audioPlayerService.stop).toHaveBeenCalled();
      expect(audioPlayerService.isTrackLoaded()).toBe(false);
    }));
  });

  describe('when track is not loaded', () => {
    beforeEach(() => {
      spyOn(howler, 'Howl').and.returnValue({
        on: (evt: string, func: () => void) => {
          if (evt === 'load') {
            func();
          }
        },
        seek: (num: number) => {
          if (typeof num !== 'undefined') {
            console.error('Howl.seek ', num);
            return num;
          }
          console.error('Howl.seek');
          return {};
        },
        stop: () => {
          console.error('Howl.stop');
        },
        playing: () => {
          return true;
        }
      } as Howl);
      spyOn(assetsBackendApiService, 'loadAudio').and.returnValue(
        Promise.resolve({
          data: new Blob(),
          filename: 'test.mp3'
        }));
      spyOn(console, 'error');
    });

    it('should not call Howl.stop when no audio is loaded', fakeAsync(() => {
      spyOn(audioPlayerService, 'setCurrentTime');
      let subjectNext = spyOn(Subject.prototype, 'next');

      audioPlayerService.stop();

      expect(console.error).not.toHaveBeenCalledWith('Howl.stop');
      expect(subjectNext).not.toHaveBeenCalledTimes(2);
    }));

    it('should not rewind track when no audio is loaded', fakeAsync(() => {
      audioPlayerService.rewind(5);

      expect(console.error).not.toHaveBeenCalled();
    }));

    it('should not rewind track when seek does not return an number',
      fakeAsync(() => {
        audioPlayerService.loadAsync('test.mp3');
        flushMicrotasks();

        audioPlayerService.rewind(5);

        expect(console.error).toHaveBeenCalledTimes(1);
        expect(console.error).toHaveBeenCalledWith('Howl.seek');
      }));

    it('should not forward track when no audio is loaded', fakeAsync(() => {
      audioPlayerService.forward(5);

      expect(console.error).not.toHaveBeenCalled();
    }));

    it('should not foward track when seek does not return an number',
      fakeAsync(() => {
        audioPlayerService.loadAsync('test.mp3');
        flushMicrotasks();

        audioPlayerService.forward(5);

        expect(console.error).toHaveBeenCalledTimes(1);
        expect(console.error).toHaveBeenCalledWith('Howl.seek');
      }));

    it('should not get the current time of track when no audio is' +
    ' loaded', () => {
      expect(audioPlayerService.getCurrentTime()).toBe(0);
    });

    it('should not get the current time of track when seek does not ' +
    'return an number', fakeAsync(() => {
      audioPlayerService.loadAsync('test.mp3');
      flushMicrotasks();

      expect(audioPlayerService.getCurrentTime()).toBe(0);
    }));

    it('should not forward track when no audio is loaded', fakeAsync(() => {
      audioPlayerService.forward(5);

      expect(console.error).not.toHaveBeenCalled();
    }));

    it('should not set time of the track when audio is not loaded', () => {
      audioPlayerService.setCurrentTime(5);

      expect(console.error).not.toHaveBeenCalled();
    });

    it('should return 0 duration when no audio is loaded', fakeAsync(() => {
      expect(audioPlayerService.getAudioDuration()).toBe(0);
    }));

    it('should return whether audio is playing', fakeAsync(() => {
      audioPlayerService.loadAsync('test.mp3');
      flushMicrotasks();

      expect(audioPlayerService.isPlaying()).toBe(true);
    }));
  });

  it('should clear secondary audio translations when audio ' +
  'ends', fakeAsync(async() => {
    spyOn(howler, 'Howl').and.returnValue({
      on: (evt: string, func: () => void) => {
        if (evt === 'end') {
          func();
        }
      }
    } as Howl);
    spyOn(assetsBackendApiService, 'loadAudio').and.returnValue(
      Promise.resolve({
        data: new Blob(),
        filename: 'test'
      }));
    spyOn(audioTranslationManagerService, 'clearSecondaryAudioTranslations');

    audioPlayerService.loadAsync('test.mp3');
    flushMicrotasks();

    expect(audioTranslationManagerService.clearSecondaryAudioTranslations)
      .toHaveBeenCalled();
  }));

  it('should display error when audio fails to load', fakeAsync(() => {
    spyOn(assetsBackendApiService, 'loadAudio').and.returnValue(
      Promise.reject('Error'));
    spyOn(audioTranslationManagerService, 'clearSecondaryAudioTranslations');

    audioPlayerService.loadAsync('test.mp3').then(
      successHandler, failHandler);
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Error');
  }));

  it('should fetch event emitter for update in view', () => {
    let mockEventEmitter = new EventEmitter();
    expect(audioPlayerService.viewUpdate).toEqual(
      mockEventEmitter);
  });

  it('should fetch event emitter for auto play audio', () => {
    let mockEventEmitter = new EventEmitter();
    expect(audioPlayerService.onAutoplayAudio).toEqual(
      mockEventEmitter);
  });

  it('should return subject when audio stops playing', () => {
    let mockSubject = new Subject<void>();
    expect(audioPlayerService.onAudioStop).toEqual(
      mockSubject);
  });
});
