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
import {TestBed, fakeAsync, flushMicrotasks, tick} from '@angular/core/testing';
import {EntityVoiceovers} from 'domain/voiceover/entity-voiceovers.model';
import {VoiceoverBackendApiService} from 'domain/voiceover/voiceover-backend-api.service';
import {EntityVoiceoversService} from './entity-voiceovers.services';
import {
  Voiceover,
  VoiceoverBackendDict,
} from '../domain/exploration/voiceover.model';

describe('Entity voiceovers service', () => {
  let entityVoiceoversService: EntityVoiceoversService;
  let voiceoverBackendApiService: VoiceoverBackendApiService;
  let entityVoiceovers: EntityVoiceovers;
  let manualVoiceover: VoiceoverBackendDict;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EntityVoiceoversService],
    });
    entityVoiceoversService = TestBed.inject(EntityVoiceoversService);
    voiceoverBackendApiService = TestBed.inject(VoiceoverBackendApiService);

    manualVoiceover = {
      filename: 'a.mp3',
      file_size_bytes: 200000,
      needs_update: false,
      duration_secs: 10.0,
    };
    let contentIdToVoiceoversMapping = {
      content0: {
        manual: manualVoiceover,
        auto: undefined,
      },
    };
    let entityVoiceoversBackendDict = {
      entity_id: 'exp_1',
      entity_type: 'exploration',
      entity_version: 1,
      language_accent_code: 'en-US',
      voiceovers_mapping: contentIdToVoiceoversMapping,
      automated_voiceovers_audio_offsets_msecs: {},
    };
    entityVoiceovers = EntityVoiceovers.createFromBackendDict(
      entityVoiceoversBackendDict
    );

    let entityVoiceoversList = [entityVoiceovers];
    entityVoiceoversService.init('exp_id', 'exploration', 0, 'en');

    spyOn(
      voiceoverBackendApiService,
      'fetchEntityVoiceoversByLanguageCodeAsync'
    ).and.returnValue(Promise.resolve(entityVoiceoversList));
  });

  it('should successfully fetch data from backend api service', fakeAsync(() => {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    entityVoiceoversService
      .fetchEntityVoiceovers()
      .then(successHandler, failHandler);
    tick();
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should be able to set and get language code', () => {
    expect(entityVoiceoversService.getLanguageCode()).toEqual('en');

    entityVoiceoversService.setLanguageCode('hi');

    expect(entityVoiceoversService.getLanguageCode()).toEqual('hi');
  });

  it('should be able to set and get language accent code', () => {
    entityVoiceoversService.setActiveLanguageAccentCode('en-US');
    expect(entityVoiceoversService.getActiveLanguageAccentCode()).toEqual(
      'en-US'
    );

    entityVoiceoversService.setActiveLanguageAccentCode('en-IN');
    expect(entityVoiceoversService.getActiveLanguageAccentCode()).toEqual(
      'en-IN'
    );
  });

  it('should be able to add entity voiceovers', () => {
    expect(
      entityVoiceoversService.getEntityVoiceoversByLanguageAccentCode('en-US')
    ).toBeUndefined();

    entityVoiceoversService.addEntityVoiceovers('en-US', entityVoiceovers);

    expect(
      entityVoiceoversService.getEntityVoiceoversByLanguageAccentCode('en-US')
    ).toEqual(entityVoiceovers);
  });

  it('should be able to remove entity voiceovers', () => {
    entityVoiceoversService.addEntityVoiceovers('en-US', entityVoiceovers);

    expect(
      entityVoiceoversService.getEntityVoiceoversByLanguageAccentCode('en-US')
    ).toEqual(entityVoiceovers);

    entityVoiceoversService.removeEntityVoiceovers('en-US');

    expect(
      entityVoiceoversService.getEntityVoiceoversByLanguageAccentCode('en-US')
    ).toBeUndefined();
  });

  it('should get all language accent codes', () => {
    let retrievedLanguageAccentCodes =
      entityVoiceoversService.getLanguageAccentCodes();

    expect(retrievedLanguageAccentCodes).toEqual([]);

    entityVoiceoversService.addEntityVoiceovers('en-US', entityVoiceovers);

    retrievedLanguageAccentCodes =
      entityVoiceoversService.getLanguageAccentCodes();

    expect(retrievedLanguageAccentCodes).toEqual(['en-US']);
  });

  it('should be able to mark voiceovers as needing update', () => {
    entityVoiceoversService.addEntityVoiceovers('en-US', entityVoiceovers);
    expect(
      entityVoiceovers.voiceoversMapping.content0.manual.needsUpdate
    ).toBeFalse();

    entityVoiceoversService.markManualVoiceoverAsNeedingUpdate('content0');
    expect(
      entityVoiceovers.voiceoversMapping.content0.manual.needsUpdate
    ).toBeTrue();
  });

  it('should be able to remove voiceovers for a content ID', () => {
    entityVoiceoversService.addEntityVoiceovers('en-US', entityVoiceovers);
    expect(
      Object.keys(entityVoiceovers.voiceoversMapping).includes('content0')
    ).toBeTrue();

    entityVoiceoversService.removeAllVoiceoversForContent('content0');

    expect(
      Object.keys(entityVoiceovers.voiceoversMapping).includes('content0')
    ).toBeFalse();
  });

  it('should be able to get all content ID to voiceovers mapping', () => {
    let manualVoiceover2: VoiceoverBackendDict = {
      filename: 'b.mp3',
      file_size_bytes: 200000,
      needs_update: false,
      duration_secs: 10.0,
    };
    let automaticVoiceover2: VoiceoverBackendDict = {
      filename: 'c.mp3',
      file_size_bytes: 200000,
      needs_update: false,
      duration_secs: 10.0,
    };
    let contentIdToVoiceoversMapping = {
      content0: {
        manual: manualVoiceover2,
        auto: automaticVoiceover2,
      },
    };

    let contentIdToVoiceoversAudioOffsetsMsecsBackendDict = {
      content0: [
        {token: 'This', audio_offset_msecs: 0.0},
        {token: 'is', audio_offset_msecs: 100.0},
        {token: 'from', audio_offset_msecs: 200.0},
        {token: 'cached', audio_offset_msecs: 300.0},
        {token: 'model', audio_offset_msecs: 400.0},
      ],
    };

    let entityVoiceoversBackendDict = {
      entity_id: 'exp_1',
      entity_type: 'exploration',
      entity_version: 1,
      language_accent_code: 'en-IN',
      voiceovers_mapping: contentIdToVoiceoversMapping,
      automated_voiceovers_audio_offsets_msecs:
        contentIdToVoiceoversAudioOffsetsMsecsBackendDict,
    };
    let entityVoiceovers2 = EntityVoiceovers.createFromBackendDict(
      entityVoiceoversBackendDict
    );

    entityVoiceoversService.addEntityVoiceovers('en-US', entityVoiceovers);
    entityVoiceoversService.addEntityVoiceovers('en-IN', entityVoiceovers2);

    let retrievedContentIdToEntityVoiceovers =
      entityVoiceoversService.getAllContentIdsToVoiceovers();

    let voiceover1 = Voiceover.createFromBackendDict(manualVoiceover);
    let voiceover2 = Voiceover.createFromBackendDict(manualVoiceover2);
    let voiceover3 = Voiceover.createFromBackendDict(automaticVoiceover2);

    expect(retrievedContentIdToEntityVoiceovers).toEqual({
      content0: [voiceover1, voiceover2, voiceover3],
    });
  });

  it('should verify if entity voiceovers are loaded', () => {
    entityVoiceoversService.entityVoiceoversLoaded = false;
    expect(entityVoiceoversService.isEntityVoiceoversLoaded()).toBeFalse();

    entityVoiceoversService.entityVoiceoversLoaded = true;
    expect(entityVoiceoversService.isEntityVoiceoversLoaded()).toBeTrue();
  });
});
