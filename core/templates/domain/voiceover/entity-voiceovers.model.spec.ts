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
 * @fileoverview Unit tests for EntityVoiceovers.
 */

import {EntityVoiceovers} from './entity-voiceovers.model';
import {
  Voiceover,
  VoiceoverBackendDict,
} from 'domain/exploration/voiceover.model';

describe('EntityVoiceovers model class', function () {
  let entity_id: string = 'exp_1';
  let entity_type: string = 'exploration';
  let entity_version: number = 1;
  let language_accent_code: string = 'en-In';
  let manual_voiceover: VoiceoverBackendDict = {
    filename: 'a.mp3',
    file_size_bytes: 200000,
    needs_update: false,
    duration_secs: 10.0,
  };
  let autotmatic_voiceover: VoiceoverBackendDict = {
    filename: 'b.mp3',
    file_size_bytes: 100000,
    needs_update: false,
    duration_secs: 12.0,
  };
  let content_id_to_voiceovers_mapping = {
    content0: {
      manual: manual_voiceover,
      auto: autotmatic_voiceover,
    },
  };

  let entity_voiceovers_backend_dict = {
    entity_id: entity_id,
    entity_type: entity_type,
    entity_version: entity_version,
    language_accent_code: language_accent_code,
    voiceovers_mapping: content_id_to_voiceovers_mapping,
  };

  let entityId: string = entity_id;
  let entityType: string = entity_type;
  let entityVersion: number = entity_version;
  let languageAccentCode: string = language_accent_code;

  let manualVoiceover = Voiceover.createFromBackendDict(manual_voiceover);

  let contentIdToVoiceoversMapping = {
    content0: {
      manual: manualVoiceover,
    },
  };

  it('should be able to create model instance', () => {
    let entityVoiceovers = EntityVoiceovers.createFromBackendDict(
      entity_voiceovers_backend_dict
    );

    expect(entityVoiceovers.entityId).toEqual(entityId);
    expect(entityVoiceovers.entityType).toEqual(entityType);
    expect(entityVoiceovers.entityVersion).toEqual(entityVersion);
    expect(entityVoiceovers.languageAccentCode).toEqual(languageAccentCode);
    console.log(entityVoiceovers.voiceoversMapping);
    console.log('---');
    console.log(contentIdToVoiceoversMapping);
    expect(entityVoiceovers.voiceoversMapping).toEqual(
      contentIdToVoiceoversMapping
    );
  });

  it('should be able to get manual voiceovers', () => {
    let entityVoiceovers = EntityVoiceovers.createFromBackendDict(
      entity_voiceovers_backend_dict
    );

    let retrievedManualVoiceover =
      entityVoiceovers.getManualVoiceover('content0');
    expect(retrievedManualVoiceover).toEqual(manualVoiceover);
  });

  it('should be able to undefined for unknown content IDs', () => {
    let entityVoiceovers = EntityVoiceovers.createFromBackendDict(
      entity_voiceovers_backend_dict
    );

    let retrievedManualVoiceover =
      entityVoiceovers.getManualVoiceover('content1');
    expect(retrievedManualVoiceover).toEqual(undefined);
  });
});
