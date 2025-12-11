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
import {VoiceoverRegenerationTaskMappingService} from './voiceover-regeneration-task-mapping-service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {VoiceoverBackendApiService} from 'domain/voiceover/voiceover-backend-api.service';

describe('Voiceover regeneration task mapping service', () => {
  let voiceoverRegenerationTaskMappingService: VoiceoverRegenerationTaskMappingService;
  let voiceoverBackendApiService: VoiceoverBackendApiService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    voiceoverRegenerationTaskMappingService = TestBed.inject(
      VoiceoverRegenerationTaskMappingService
    );
    voiceoverBackendApiService = TestBed.inject(VoiceoverBackendApiService);
  });

  it('should be able to initialize the service', fakeAsync(() => {
    voiceoverRegenerationTaskMappingService.explorationID = '';

    spyOn(
      voiceoverBackendApiService,
      'fetchLatestVoiceoverRegenerationStatusAsync'
    ).and.returnValue(Promise.resolve({}));

    voiceoverRegenerationTaskMappingService.init('exp1');
    flush();
    discardPeriodicTasks();
    tick();

    expect(voiceoverRegenerationTaskMappingService.explorationID).toBe('exp1');
  }));

  it('should be able to get content regeneration status', async () => {
    voiceoverRegenerationTaskMappingService.languageAccentToContentStatusMap = {
      'en-US': {
        content_0: 'SUCCEEDED',
        content_1: 'FAILED',
      },
    };

    expect(
      voiceoverRegenerationTaskMappingService.getContentRegenerationStatus(
        'en-US',
        'content_0'
      )
    ).toBe('SUCCEEDED');

    expect(
      voiceoverRegenerationTaskMappingService.getContentRegenerationStatus(
        'en-US',
        'content_1'
      )
    ).toBe('FAILED');
  });

  it('should be able to update content regeneration status', async () => {
    voiceoverRegenerationTaskMappingService.languageAccentToContentStatusMap = {
      'en-US': {
        content_0: 'GENERATING',
        content_1: 'FAILED',
      },
    };

    voiceoverRegenerationTaskMappingService.updateContentRegenerationStatus(
      'en-US',
      'content_0',
      'SUCCEEDED'
    );

    expect(
      voiceoverRegenerationTaskMappingService.getContentRegenerationStatus(
        'en-US',
        'content_0'
      )
    ).toBe('SUCCEEDED');

    voiceoverRegenerationTaskMappingService.updateContentRegenerationStatus(
      'en-IN',
      'content_0',
      'SUCCEEDED'
    );

    expect(
      voiceoverRegenerationTaskMappingService.getContentRegenerationStatus(
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
    voiceoverRegenerationTaskMappingService.pollingSub = fakeSub;

    spyOn(
      voiceoverRegenerationTaskMappingService,
      'getLatestVoiceoverRegenerationStatus'
    ).and.callThrough();

    voiceoverRegenerationTaskMappingService.startPolling();

    expect(fakeSub.unsubscribe).toHaveBeenCalled();

    expect(
      voiceoverRegenerationTaskMappingService.getLatestVoiceoverRegenerationStatus
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
      voiceoverRegenerationTaskMappingService.languageAccentToContentStatusMap
    ).toEqual(status2);

    let emittedValue = null;
    voiceoverRegenerationTaskMappingService.statusSubject.subscribe(
      v => (emittedValue = v)
    );

    tick(5000);
    tick();
    discardPeriodicTasks();

    expect(emittedValue).toEqual(status2);
  }));

  it('should be able to update newly added regeneration tasks', () => {
    voiceoverRegenerationTaskMappingService.currentLanguageAccentCodes = [
      'en-US',
    ];
    voiceoverRegenerationTaskMappingService.languageAccentToContentStatusMap =
      {};

    voiceoverRegenerationTaskMappingService.updateNewlyAddedRegenerationTasks([
      'content_0',
      'content_1',
    ]);

    expect(
      voiceoverRegenerationTaskMappingService.getContentRegenerationStatus(
        'en-US',
        'content_0'
      )
    ).toBe('GENERATING');

    expect(
      voiceoverRegenerationTaskMappingService.getContentRegenerationStatus(
        'en-US',
        'content_1'
      )
    ).toBe('GENERATING');
  });
});
