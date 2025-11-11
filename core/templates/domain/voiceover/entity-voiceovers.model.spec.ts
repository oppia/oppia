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
  let entityId: string = 'exp_1';
  let entityType: string = 'exploration';
  let entityVersion: number = 1;
  let languageAccentCode: string = 'en-In';
  let manualVoiceoverBackendDict: VoiceoverBackendDict = {
    filename: 'a.mp3',
    file_size_bytes: 200000,
    needs_update: false,
    duration_secs: 10.0,
  };
  let automaticVoiceoverBackendDict: VoiceoverBackendDict = {
    filename: 'b.mp3',
    file_size_bytes: 200000,
    needs_update: false,
    duration_secs: 10.0,
  };
  let contentIdToVoiceoversMappingBackendDict = {
    content0: {
      manual: manualVoiceoverBackendDict,
      auto: automaticVoiceoverBackendDict,
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
    entity_id: entityId,
    entity_type: entityType,
    entity_version: entityVersion,
    language_accent_code: languageAccentCode,
    voiceovers_mapping: contentIdToVoiceoversMappingBackendDict,
    automated_voiceovers_audio_offsets_msecs:
      contentIdToVoiceoversAudioOffsetsMsecsBackendDict,
  };

  let manualVoiceover = Voiceover.createFromBackendDict(
    manualVoiceoverBackendDict
  );
  let automaticVoiceover = Voiceover.createFromBackendDict(
    automaticVoiceoverBackendDict
  );

  let contentIdToVoiceoversMapping = {
    content0: {
      manual: manualVoiceover,
      auto: automaticVoiceover,
    },
  };

  let contentIdToVoiceoversAudioOffsetsMsecs = {
    content0: [
      {token: 'This', audioOffsetMsecs: 0.0},
      {token: 'is', audioOffsetMsecs: 100.0},
      {token: 'from', audioOffsetMsecs: 200.0},
      {token: 'cached', audioOffsetMsecs: 300.0},
      {token: 'model', audioOffsetMsecs: 400.0},
    ],
  };

  it('should be able to create model instance', () => {
    let entityVoiceovers = EntityVoiceovers.createFromBackendDict(
      entityVoiceoversBackendDict
    );

    expect(entityVoiceovers.entityId).toEqual(entityId);
    expect(entityVoiceovers.entityType).toEqual(entityType);
    expect(entityVoiceovers.entityVersion).toEqual(entityVersion);
    expect(entityVoiceovers.languageAccentCode).toEqual(languageAccentCode);
    expect(entityVoiceovers.voiceoversMapping).toEqual(
      contentIdToVoiceoversMapping
    );
    expect(entityVoiceovers.automatedVoiceoversAudioOffsetsMsecs).toEqual(
      contentIdToVoiceoversAudioOffsetsMsecs
    );
  });

  it('should be able to get manual voiceovers', () => {
    let entityVoiceovers = EntityVoiceovers.createFromBackendDict(
      entityVoiceoversBackendDict
    );

    let retrievedManualVoiceover =
      entityVoiceovers.getManualVoiceover('content0');
    expect(retrievedManualVoiceover).toEqual(manualVoiceover);
  });

  it('should be able to get automatic voiceovers', () => {
    let entityVoiceovers = EntityVoiceovers.createFromBackendDict(
      entityVoiceoversBackendDict
    );

    let retrievedAutomaticVoiceover =
      entityVoiceovers.getAutomaticVoiceover('content0');
    expect(retrievedAutomaticVoiceover).toEqual(automaticVoiceover);
  });

  it('should get undefined for unknown content IDs', () => {
    let entityVoiceovers = EntityVoiceovers.createFromBackendDict(
      entityVoiceoversBackendDict
    );

    let retrievedManualVoiceover =
      entityVoiceovers.getManualVoiceover('content1');
    expect(retrievedManualVoiceover).toEqual(undefined);
  });
});
