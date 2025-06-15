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
 * @fileoverview Service for converting state or metadata dicts into yaml during
 * version comparison in history tab.
 */

import {Injectable} from '@angular/core';
import {ExplorationMetadata} from 'domain/exploration/ExplorationMetadataObjectFactory';
import {State} from 'domain/state/StateObjectFactory';
import {
  EntityTranslationsService,
  LanguageCodeToEntityTranslations,
} from 'services/entity-translations.services';
import {YamlService} from 'services/yaml.service';

@Injectable({
  providedIn: 'root',
})
export class HistoryTabYamlConversionService {
  constructor(
    private yamlService: YamlService,
    private entityTranslationService: EntityTranslationsService
  ) {}

  getYamlStringFromStateOrMetadata(
    entity: (State | ExplorationMetadata) | null
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      // Note: the timeout is needed or the string will be sent
      // before codemirror has fully loaded and will not be
      // displayed. This causes issues with the e2e tests.
      setTimeout(() => {
        if (entity) {
          resolve(this.yamlService.stringify(entity.toBackendDict()));
        } else {
          resolve('');
        }
      }, 200);
    });
  }

  getYamlStringFromTranslations(
    languageCodeToEntityTranslations: LanguageCodeToEntityTranslations | null
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      // Note: the timeout is needed or the string will be sent
      // before codemirror has fully loaded and will not be
      // displayed. This causes issues with the e2e tests.
      setTimeout(() => {
        if (languageCodeToEntityTranslations) {
          const sortedBulkTranslations: LanguageCodeToEntityTranslations =
            this.entityTranslationService.sortBulkTranslationsByLanguageCode(
              languageCodeToEntityTranslations
            );
          resolve(
            this.yamlService.stringify(
              this.entityTranslationService.converBulkTranslationsToBackendDict(
                sortedBulkTranslations
              )
            )
          );
        } else {
          resolve('');
        }
      }, 200);
    });
  }
}
