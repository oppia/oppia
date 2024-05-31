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
 * @fileoverview Model class for creating new frontend instances of Entity
 * voiceovers.
 */

import {
  Voiceover,
  VoiceoverBackendDict,
} from 'domain/exploration/voiceover.model';

export interface VoiceoverTypeToVoiceovers {
  [voiceoverType: string]: Voiceover;
}

export interface VoiceoverTypeToVoiceoversBackendDict {
  [voiceoverType: string]: VoiceoverBackendDict;
}

export interface ContentIdToVoiceoversMapping {
  [contentId: string]: VoiceoverTypeToVoiceovers;
}

export interface ContentIdToVoiceoversMappingBackendDict {
  [contentId: string]: VoiceoverTypeToVoiceoversBackendDict;
}

export interface EntityVoiceoversBackendDict {
  entity_id: string;
  entity_type: string;
  entity_version: number;
  language_accent_code: string;
  voiceovers_mapping: ContentIdToVoiceoversMappingBackendDict;
}

export class EntityVoiceovers {
  entityId: string;
  entityType: string;
  entityVersion: number;
  languageAccentCode: string;
  voiceoversMapping: ContentIdToVoiceoversMapping;

  constructor(
    entityId: string,
    entityType: string,
    entityVersion: number,
    languageAccentCode: string,
    voiceoversMapping: ContentIdToVoiceoversMapping
  ) {
    this.entityId = entityId;
    this.entityType = entityType;
    this.entityVersion = entityVersion;
    this.languageAccentCode = languageAccentCode;
    this.voiceoversMapping = voiceoversMapping;
  }

  static createFromBackendDict(
    entityVoiceoversBackendDict: EntityVoiceoversBackendDict
  ): EntityVoiceovers {
    let contentIdToVoiceoversMapping: ContentIdToVoiceoversMapping = {};
    for (let contentId in entityVoiceoversBackendDict.voiceovers_mapping) {
      let voiceoverTypeToVoiceovers =
        entityVoiceoversBackendDict.voiceovers_mapping[contentId];

      contentIdToVoiceoversMapping[contentId] = {
        manual: Voiceover.createFromBackendDict(
          voiceoverTypeToVoiceovers.manual
        ),
      };
    }
    return new EntityVoiceovers(
      entityVoiceoversBackendDict.entity_id,
      entityVoiceoversBackendDict.entity_type,
      entityVoiceoversBackendDict.entity_version,
      entityVoiceoversBackendDict.language_accent_code,
      contentIdToVoiceoversMapping
    );
  }

  getManualVoiceover(contentId: string): Voiceover | undefined {
    let voiceoverTypeToVoiceovers = this.voiceoversMapping[contentId];

    if (voiceoverTypeToVoiceovers) {
      return voiceoverTypeToVoiceovers.manual;
    } else {
      return undefined;
    }
  }
}
