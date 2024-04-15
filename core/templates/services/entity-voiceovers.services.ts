// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * entity in a given langauge code.
 */

import {Injectable} from '@angular/core';
import {downgradeInjectable} from '@angular/upgrade/static';
import {TranslatedContent} from 'domain/exploration/TranslatedContentObjectFactory';
import {EntityTranslation} from 'domain/translation/EntityTranslationObjectFactory';
import {EntityTranslationBackendApiService} from 'pages/exploration-editor-page/services/entity-translation-backend-api.service';
import {AlertsService} from './alerts.service';
import {EntityVoiceovers} from 'domain/voiceover/entity-voiceovers.model';

export interface LanguageCodeToEntityTranslations {
  [languageCode: string]: EntityTranslation;
}

@Injectable({
  providedIn: 'root',
})
export class EntityVoiceoversService {
  public entityVoiceoversList: EntityVoiceovers[];

  getLanguageCodes() {
    let voiceoverLanguageCodes = [];
    for (let entityVoiceovers of this.entityVoiceoversList) {
      let languageAccentCode = entityVoiceovers._languageAccentCode;
      voiceoverLanguageCodes.push(languageAccentCode);
    }

    return voiceoverLanguageCodes;
  }

  setEntityVoiceovers(entityVoiceoversList) {
    this.entityVoiceoversList = entityVoiceoversList;
  }

  getVoiceoverInGivenLanguageAccentCode(languageAccentCode) {
    this.entityVoiceoversList.forEach(entityVoiceovers => {
      if (entityVoiceovers._languageAccentCode == languageAccentCode) {
        return entityVoiceovers;
      }
    });
  }
}

angular
  .module('oppia')
  .factory(
    'EntityVoiceoversService',
    downgradeInjectable(EntityVoiceoversService)
  );
