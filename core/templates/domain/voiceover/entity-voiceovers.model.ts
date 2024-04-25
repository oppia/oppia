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

import cloneDeep from 'lodash/cloneDeep';

import {AppConstants} from 'app.constants';
import {AudioTranslationLanguageService} from 'pages/exploration-player-page/services/audio-translation-language.service';
import {Interaction} from 'domain/exploration/InteractionObjectFactory';
import {
  BindableVoiceovers,
  RecordedVoiceovers,
} from 'domain/exploration/recorded-voiceovers.model';
import {InteractionCustomizationArgs} from 'interactions/customization-args-defs';
import {Hint} from 'domain/exploration/hint-object.model';
import {Solution} from 'domain/exploration/SolutionObjectFactory';

import {
  InteractionSpecsConstants,
  InteractionSpecsKey,
} from 'pages/interaction-specs.constants';
import {EntityTranslation} from 'domain/translation/EntityTranslationObjectFactory';
import {TranslatedContent} from 'domain/exploration/TranslatedContentObjectFactory';
import {InteractionAnswer} from 'interactions/answer-defs';
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

export interface ContentIdToVoiceoverMapping {
  [contentId: string]: VoiceoverTypeToVoiceovers;
}

export interface ContentIdToVoiceoverMappingBackendDict {
  [contentId: string]: VoiceoverTypeToVoiceoversBackendDict;
}

export interface EntityVoiceoversBackendDict {
  entity_id: string;
  entity_type: string;
  entity_version: number;
  language_accent_code: string;
  voiceovers: ContentIdToVoiceoverMappingBackendDict;
}

export class EntityVoiceovers {
  _entityId: string;
  _entityType: string;
  _entityVersion: number;
  _languageAccentCode: string;
  _voiceovers: ContentIdToVoiceoverMapping;

  constructor(
    entityId: string,
    entityType: string,
    entityVersion: number,
    languageAccentCode: string,
    voiceovers: ContentIdToVoiceoverMapping
  ) {
    this._entityId = entityId;
    this._entityType = entityType;
    this._entityVersion = entityVersion;
    this._languageAccentCode = languageAccentCode;
    this._voiceovers = voiceovers;
  }

  static createFromBackendDict(
    entityVoiceoversBackendDict: EntityVoiceoversBackendDict
  ) {
    let voiceovers = {};
    for (let contentId in entityVoiceoversBackendDict['voiceovers']) {
      let voiceoverTypeToVoiceovers =
        entityVoiceoversBackendDict['voiceovers'][contentId];
      voiceovers[contentId] = {
        manual: Voiceover.createFromBackendDict(
          voiceoverTypeToVoiceovers['manual']
        ),
      };
    }
    return new EntityVoiceovers(
      entityVoiceoversBackendDict['entity_id'],
      entityVoiceoversBackendDict['entity_type'],
      entityVoiceoversBackendDict['entity_version'],
      entityVoiceoversBackendDict['language_accent_code'],
      voiceovers
    );
  }
}
