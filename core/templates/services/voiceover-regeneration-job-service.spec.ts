// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests that the voiceover regeneration task mapping service is
 * working as expected.
 */

import {
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
  flush,
  discardPeriodicTasks,
} from '@angular/core/testing';
import {Subscription} from 'rxjs';
import {VoiceoverRegenerationJobService} from './voiceover-regeneration-job-service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {VoiceoverBackendApiService} from 'domain/voiceover/voiceover-backend-api.service';

describe('Voiceover regeneration task mapping service', () => {
  let voiceoverRegenerationJobService: VoiceoverRegenerationJobService;
  let voiceoverBackendApiService: VoiceoverBackendApiService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    voiceoverRegenerationJobService = TestBed.inject(
      VoiceoverRegenerationJobService
    );
    voiceoverBackendApiService = TestBed.inject(VoiceoverBackendApiService);
  });

  it('should be able to initialize the service', fakeAsync(() => {
    voiceoverRegenerationJobService.explorationID = '';

    spyOn(
      voiceoverBackendApiService,
      'fetchLatestVoiceoverRegenerationStatusAsync'
    ).and.returnValue(Promise.resolve({}));

    voiceoverRegenerationJobService.init('exp1');
    flush();
    discardPeriodicTasks();
    tick();

    expect(voiceoverRegenerationJobService.explorationID).toBe('exp1');
  }));

  it('should be able to get content regeneration status', async () => {
    voiceoverRegenerationJobService.languageAccentToContentStatusMap = {
      'en-US': {
        content_0: 'SUCCEEDED',
        content_1: 'FAILED',
      },
    };

    expect(
      voiceoverRegenerationJobService.getContentRegenerationStatus(
        'en-US',
        'content_0'
      )
    ).toBe('SUCCEEDED');

    expect(
      voiceoverRegenerationJobService.getContentRegenerationStatus(
        'en-US',
        'content_1'
      )
    ).toBe('FAILED');
  });

  it('should be able to update content regeneration status', async () => {
    voiceoverRegenerationJobService.languageAccentToContentStatusMap = {
      'en-US': {
        content_0: 'GENERATING',
        content_1: 'FAILED',
      },
    };

    voiceoverRegenerationJobService.updateContentRegenerationStatus(
      'en-US',
      'content_0',
      'SUCCEEDED'
    );

    expect(
      voiceoverRegenerationJobService.getContentRegenerationStatus(
        'en-US',
        'content_0'
      )
    ).toBe('SUCCEEDED');

    voiceoverRegenerationJobService.updateContentRegenerationStatus(
      'en-IN',
      'content_0',
      'SUCCEEDED'
    );

    expect(
      voiceoverRegenerationJobService.getContentRegenerationStatus(
        'en-IN',
        'content_0'
      )
    ).toBe('SUCCEEDED');
  });

  it('should unsubscribe previous polling, call initial fetch, and poll repeatedly', fakeAsync(() => {
    const status2 = {'en-US': {content_0: 'SUCCEEDED'}};

    const fetchLatestVoiceoverRegenerationStatusSpy = spyOn(
      voiceoverBackendApiService,
      'fetchLatestVoiceoverRegenerationStatusAsync'
    );
    fetchLatestVoiceoverRegenerationStatusSpy.and.returnValue(
      Promise.resolve(status2)
    );

    const fakeSub = new Subscription();
    spyOn(fakeSub, 'unsubscribe');
    voiceoverRegenerationJobService.pollingSub = fakeSub;

    spyOn(
      voiceoverRegenerationJobService,
      'getLatestVoiceoverRegenerationStatus'
    ).and.callThrough();

    voiceoverRegenerationJobService.startPolling();

    expect(fakeSub.unsubscribe).toHaveBeenCalled();

    expect(
      voiceoverRegenerationJobService.getLatestVoiceoverRegenerationStatus
    ).toHaveBeenCalled();

    expect(
      voiceoverBackendApiService.fetchLatestVoiceoverRegenerationStatusAsync
    ).toHaveBeenCalledTimes(1);

    tick(5000);
    discardPeriodicTasks();

    expect(
      voiceoverBackendApiService.fetchLatestVoiceoverRegenerationStatusAsync
    ).toHaveBeenCalledTimes(2);

    tick();

    expect(
      voiceoverRegenerationJobService.languageAccentToContentStatusMap
    ).toEqual(status2);

    let emittedValue = null;
    voiceoverRegenerationJobService.statusSubject.subscribe(
      v => (emittedValue = v)
    );

    tick(5000);
    tick();
    discardPeriodicTasks();

    expect(emittedValue).toEqual(status2);
  }));

  it('should be able to update newly added regeneration tasks', () => {
    voiceoverRegenerationJobService.currentLanguageAccentCodes = ['en-US'];
    voiceoverRegenerationJobService.languageAccentToContentStatusMap = {};

    voiceoverRegenerationJobService.updateNewlyAddedRegenerationTasks([
      'content_0',
      'content_1',
    ]);

    expect(
      voiceoverRegenerationJobService.getContentRegenerationStatus(
        'en-US',
        'content_0'
      )
    ).toBe('GENERATING');

    expect(
      voiceoverRegenerationJobService.getContentRegenerationStatus(
        'en-US',
        'content_1'
      )
    ).toBe('GENERATING');
  });
});
