// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit test for the Translation tab active content id service.
 */

import { TestBed } from '@angular/core/testing';

import { StateRecordedVoiceoversService } from
// eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-recorded-voiceovers.service';
import { TranslationTabActiveContentIdService } from
// eslint-disable-next-line max-len
  'pages/exploration-editor-page/translation-tab/services/translation-tab-active-content-id.service';

class MockRecordedVoiceovers {
  getAllContentId() {
    return ['content', 'feedback_1'];
  }
}

describe('TranslationTabActiveContentIdService', () => {
  let stateVoiceService: StateRecordedVoiceoversService;
  let contentIdService: TranslationTabActiveContentIdService;

  let mockRecordedVoiceOvers: MockRecordedVoiceovers;

  beforeEach(() => {
    stateVoiceService = TestBed.get(StateRecordedVoiceoversService);
    contentIdService = TestBed.get(TranslationTabActiveContentIdService);

    mockRecordedVoiceOvers = new MockRecordedVoiceovers();

    spyOnProperty(stateVoiceService, 'displayed')
      .and.returnValue(mockRecordedVoiceOvers);
  });

  it('should correctly set and get active content id', function() {
    contentIdService.setActiveContent('content', 'html');
    expect(contentIdService.getActiveContentId()).toBe('content');
  });

  it('should throw error on setting invalid content id', () => {
    expect(() => {
      contentIdService.setActiveContent('feedback_2', 'html');
    }).toThrowError('Invalid active content id: feedback_2');
  });
});
