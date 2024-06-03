// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to fetch and store EntityVoiceovers for the given
 * entity in a given langauge accent code.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {EntityVoiceovers} from 'domain/voiceover/entity-voiceovers.model';
import {EntityVoiceoversService} from '../../../services/entity-voiceovers.services';
import {
  Voiceover,
  VoiceoverBackendDict,
} from 'domain/exploration/voiceover.model';
import {VoiceoverPlayerService} from './voiceover-player.service';
import {AppConstants} from 'app.constants';

describe('Voiceover player service', () => {
  let entityVoiceoversService: EntityVoiceoversService;
  let entityVoiceovers: EntityVoiceovers;
  let voiceoverPlayerService: VoiceoverPlayerService;
  let manualVoiceover: Voiceover;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EntityVoiceoversService, VoiceoverPlayerService],
    });
    entityVoiceoversService = TestBed.inject(EntityVoiceoversService);
    voiceoverPlayerService = TestBed.inject(VoiceoverPlayerService);

    let manualVoiceoverBackendDict: VoiceoverBackendDict = {
      filename: 'a.mp3',
      file_size_bytes: 200000,
      needs_update: false,
      duration_secs: 10.0,
    };

    let contentIdToVoiceoversMapping = {
      content0: {
        manual: manualVoiceoverBackendDict,
      },
    };

    manualVoiceover = Voiceover.createFromBackendDict(
      manualVoiceoverBackendDict
    );
    let entityVoiceoversBackendDict = {
      entity_id: 'exp_1',
      entity_type: 'exploration',
      entity_version: 1,
      language_accent_code: 'en-US',
      voiceovers_mapping: contentIdToVoiceoversMapping,
    };
    entityVoiceovers = EntityVoiceovers.createFromBackendDict(
      entityVoiceoversBackendDict
    );
  });

  it('should be able to set active voiceovers', () => {
    let entityVoiceoversSpy = spyOn(
      entityVoiceoversService,
      'getActiveEntityVoiceovers'
    );

    entityVoiceoversSpy.and.returnValue(entityVoiceovers);

    expect(voiceoverPlayerService.activeContentId).toBeUndefined();

    voiceoverPlayerService.setActiveVoiceover('content0');

    expect(voiceoverPlayerService.activeContentId).toEqual('content0');
    expect(voiceoverPlayerService.activeVoiceover).toEqual(manualVoiceover);

    voiceoverPlayerService.setActiveVoiceover('content1');

    expect(voiceoverPlayerService.activeContentId).toEqual('content1');
    expect(voiceoverPlayerService.activeVoiceover).toBeUndefined();
  });

  it('should be able to get active voiceovers', () => {
    voiceoverPlayerService.activeVoiceover = manualVoiceover;

    expect(voiceoverPlayerService.getActiveVoiceover().filename).toEqual(
      'a.mp3'
    );

    manualVoiceover.filename = 'b.mp3';
    expect(voiceoverPlayerService.getActiveVoiceover().filename).toEqual(
      'b.mp3'
    );
  });

  it('should be able to set and get active component name', () => {
    voiceoverPlayerService.setActiveComponentName(
      AppConstants.COMPONENT_NAME_FEEDBACK
    );

    expect(voiceoverPlayerService.getActiveComponentName()).toEqual(
      AppConstants.COMPONENT_NAME_FEEDBACK
    );

    voiceoverPlayerService.setActiveComponentName(
      AppConstants.COMPONENT_NAME_CONTENT
    );

    expect(voiceoverPlayerService.getActiveComponentName()).toEqual(
      AppConstants.COMPONENT_NAME_CONTENT
    );
  });

  it('should be able to set language accent codes description', () => {
    voiceoverPlayerService.languageAccentMasterList = {
      en: {
        'en-US': 'English (United States)',
        'en-IN': 'English (India)',
      },
      hi: {
        'hi-IN': 'Hindi (India)',
      },
    };

    voiceoverPlayerService.languageAccentDescriptions = [];

    let expectedLanguageAccentDescriptions = [
      'English (United States)',
      'English (India)',
    ];
    let languageAccentCodes = ['en-US', 'en-IN'];

    voiceoverPlayerService.setLanguageAccentCodesDescriptions(
      'en',
      languageAccentCodes
    );

    expect(voiceoverPlayerService.languageAccentDescriptions).toEqual(
      expectedLanguageAccentDescriptions
    );
  });
});
