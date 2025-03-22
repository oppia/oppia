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
 * @fileoverview Service to fetch and store EntityTranslation for the given
 * entity in a given langauge.
 */

import {Injectable} from '@angular/core';
import {TranslatedContent} from 'domain/exploration/TranslatedContentObjectFactory';
import {
  EntityTranslation,
  LanguageCodeToEntityTranslationBackendDict,
} from 'domain/translation/EntityTranslationObjectFactory';
import {EntityTranslationBackendApiService} from 'pages/exploration-editor-page/services/entity-translation-backend-api.service';
import {AlertsService} from './alerts.service';

export interface LanguageCodeToEntityTranslations {
  [languageCode: string]: EntityTranslation;
}

@Injectable({
  providedIn: 'root',
})
export class EntityTranslationsService {
  private entityId!: string;
  private entityType!: string;
  private entityVersion!: number;

  // Dictionary storing translations that exist in the last published version
  // of the exploration.
  public languageCodeToLastPublishedEntityTranslations: LanguageCodeToEntityTranslations =
    {};

  // Dictionary storing latest translations including those that have been modified
  // in the editor and haven't been published yet.
  public languageCodeToLatestEntityTranslations: LanguageCodeToEntityTranslations =
    {};

  constructor(
    private alertsService: AlertsService,
    private entityTranslationBackendApiService: EntityTranslationBackendApiService
  ) {}

  init(entityId: string, entityType: string, entityVersion: number): void {
    this.entityType = entityType;
    this.entityVersion = entityVersion;
    this.entityId = entityId;
  }

  async getEntityTranslationsAsync(
    languageCode: string
  ): Promise<EntityTranslation> {
    return new Promise((resolve, reject) => {
      if (languageCode in this.languageCodeToLatestEntityTranslations) {
        resolve(this.languageCodeToLatestEntityTranslations[languageCode]);
        return;
      }
      this.alertsService.addInfoMessage('Fetching translation.');
      this.entityTranslationBackendApiService
        .fetchEntityTranslationAsync(
          this.entityId,
          this.entityType,
          this.entityVersion,
          languageCode
        )
        .then(entityTranslation => {
          if (Object.keys(entityTranslation.translationMapping).length > 0) {
            this.languageCodeToLatestEntityTranslations[languageCode] =
              entityTranslation;
          }
          this.alertsService.clearMessages();
          this.alertsService.addSuccessMessage('Translations fetched.');
          resolve(entityTranslation);
        });
    });
  }

  getHtmlTranslations(languageCode: string, contentIds: string[]): string[] {
    if (
      !this.languageCodeToLatestEntityTranslations.hasOwnProperty(languageCode)
    ) {
      return [];
    }

    let entityTranslation = this.languageCodeToLatestEntityTranslations[
      languageCode
    ] as EntityTranslation;
    let htmlStrings: string[] = [];
    contentIds.forEach(contentId => {
      if (!entityTranslation.hasWrittenTranslation(contentId)) {
        return;
      }

      let writtenTranslation = entityTranslation.getWrittenTranslation(
        contentId
      ) as TranslatedContent;
      if (writtenTranslation.dataFormat === 'html') {
        htmlStrings.push(writtenTranslation.translation as string);
      }
    });
    return htmlStrings;
  }

  removeAllTranslationsForContent(contentId: string): void {
    Object.keys(this.languageCodeToLatestEntityTranslations).forEach(
      (language: string) => {
        this.languageCodeToLatestEntityTranslations[language].removeTranslation(
          contentId
        );
      }
    );
  }

  markAllTranslationsAsNeedingUpdate(contentId: string): void {
    Object.keys(this.languageCodeToLatestEntityTranslations).forEach(
      (language: string) => {
        this.languageCodeToLatestEntityTranslations[
          language
        ].markTranslationAsNeedingUpdate(contentId);
      }
    );
  }

  converBulkTranslationsToBackendDict(
    languageCodeToEntityTranslations: LanguageCodeToEntityTranslations
  ): LanguageCodeToEntityTranslationBackendDict {
    let bulkTranslationsBackendDict: LanguageCodeToEntityTranslationBackendDict =
      {};

    Object.keys(languageCodeToEntityTranslations).forEach(languageCode => {
      bulkTranslationsBackendDict[languageCode] =
        languageCodeToEntityTranslations[languageCode].toBackendDict();
    });
    return bulkTranslationsBackendDict;
  }

  sortBulkTranslationsByLanguageCode(
    languageCodeToEntityTranslations: LanguageCodeToEntityTranslations
  ): LanguageCodeToEntityTranslations {
    const sortedLanguageCodes = Object.keys(
      languageCodeToEntityTranslations
    ).sort();
    const sortedTranslations: LanguageCodeToEntityTranslations = {};

    sortedLanguageCodes.forEach(language => {
      sortedTranslations[language] = languageCodeToEntityTranslations[language];
    });

    return sortedTranslations;
  }

  reset(): void {
    this.languageCodeToLatestEntityTranslations = {};
  }
}
