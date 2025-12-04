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

import {TestBed, waitForAsync} from '@angular/core/testing';
import {VoiceoverRegenerationTaskMappingService} from './voiceover-regeneration-task-mapping-service';
import {HttpClientTestingModule} from '@angular/common/http/testing';

describe('Voiceover regeneration task mapping service', () => {
  let voiceoverRegenerationTaskMappingService: VoiceoverRegenerationTaskMappingService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    voiceoverRegenerationTaskMappingService = TestBed.inject(
      VoiceoverRegenerationTaskMappingService
    );
  });

  it('should be able to initialize the service', () => {
    voiceoverRegenerationTaskMappingService.explorationID = '';
    voiceoverRegenerationTaskMappingService.init('exp1');
    expect(voiceoverRegenerationTaskMappingService.explorationID).toBe('exp1');
  });

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
});
