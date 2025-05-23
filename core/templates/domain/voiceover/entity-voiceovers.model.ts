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
  [voiceoverType: string]: Voiceover | undefined;
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

export interface AudioOffsetBackendType {
  token: string;
  audio_offset_msecs: number;
}

export interface AudioOffset {
  token: string;
  audioOffsetMsecs: number;
}

export interface ContentIdToVoiceoversAudioOffsetsMsecsBackendDict {
  [contentId: string]: AudioOffsetBackendType[];
}

export interface ContentIdToVoiceoversAudioOffsetsMsecs {
  [contentId: string]: AudioOffset[];
}

export interface EntityVoiceoversBackendDict {
  entity_id: string;
  entity_type: string;
  entity_version: number;
  language_accent_code: string;
  voiceovers_mapping: ContentIdToVoiceoversMappingBackendDict;
  automated_voiceovers_audio_offsets_msecs: ContentIdToVoiceoversAudioOffsetsMsecsBackendDict;
}

export class EntityVoiceovers {
  entityId: string;
  entityType: string;
  entityVersion: number;
  languageAccentCode: string;
  voiceoversMapping: ContentIdToVoiceoversMapping;
  automatedVoiceoversAudioOffsetsMsecs: ContentIdToVoiceoversAudioOffsetsMsecs;

  constructor(
    entityId: string,
    entityType: string,
    entityVersion: number,
    languageAccentCode: string,
    voiceoversMapping: ContentIdToVoiceoversMapping,
    automatedVoiceoversAudioOffsetsMsecs: ContentIdToVoiceoversAudioOffsetsMsecs
  ) {
    this.entityId = entityId;
    this.entityType = entityType;
    this.entityVersion = entityVersion;
    this.languageAccentCode = languageAccentCode;
    this.voiceoversMapping = voiceoversMapping;
    this.automatedVoiceoversAudioOffsetsMsecs =
      automatedVoiceoversAudioOffsetsMsecs;
  }

  static createFromBackendDict(
    entityVoiceoversBackendDict: EntityVoiceoversBackendDict
  ): EntityVoiceovers {
    let contentIdToVoiceoversMapping: ContentIdToVoiceoversMapping = {};
    for (let contentId in entityVoiceoversBackendDict.voiceovers_mapping) {
      let voiceoverTypeToVoiceovers =
        entityVoiceoversBackendDict.voiceovers_mapping[contentId];

      let manualVoiceovers!: Voiceover;
      let automaticVoiceovers!: Voiceover;

      if (voiceoverTypeToVoiceovers.manual) {
        manualVoiceovers = Voiceover.createFromBackendDict(
          voiceoverTypeToVoiceovers.manual
        );
      }

      if (voiceoverTypeToVoiceovers.auto) {
        automaticVoiceovers = Voiceover.createFromBackendDict(
          voiceoverTypeToVoiceovers.auto
        );
      }

      contentIdToVoiceoversMapping[contentId] = {
        manual: manualVoiceovers,
        auto: automaticVoiceovers,
      };
    }

    let contentIdToVoiceoversAudioOffsetsMsecs: ContentIdToVoiceoversAudioOffsetsMsecs =
      {};

    for (let contentId in entityVoiceoversBackendDict.automated_voiceovers_audio_offsets_msecs) {
      let audioOffsets =
        entityVoiceoversBackendDict.automated_voiceovers_audio_offsets_msecs[
          contentId
        ];
      contentIdToVoiceoversAudioOffsetsMsecs[contentId] = audioOffsets.map(
        audioOffset => {
          return {
            token: audioOffset.token,
            audioOffsetMsecs: audioOffset.audio_offset_msecs,
          };
        }
      );
    }

    return new EntityVoiceovers(
      entityVoiceoversBackendDict.entity_id,
      entityVoiceoversBackendDict.entity_type,
      entityVoiceoversBackendDict.entity_version,
      entityVoiceoversBackendDict.language_accent_code,
      contentIdToVoiceoversMapping,
      contentIdToVoiceoversAudioOffsetsMsecs
    );
  }

  getManualVoiceover(contentId: string): Voiceover | undefined {
    return this.voiceoversMapping[contentId]?.manual;
  }

  getAutomaticVoiceover(contentId: string): Voiceover | undefined {
    return this.voiceoversMapping[contentId]?.auto;
  }

  removeVoiceover(contentId: string): void {
    if (this.voiceoversMapping[contentId]) {
      delete this.voiceoversMapping[contentId];
    }
  }

  toggleManualVoiceoverNeedsUpdate(contentId: string): void {
    let voiceover = this.getManualVoiceover(contentId);
    if (voiceover) {
      voiceover.needsUpdate = !voiceover.needsUpdate;
    }
  }
}
