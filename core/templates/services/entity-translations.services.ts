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

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { TranslatedContent } from 'domain/exploration/TranslatedContentObjectFactory';
import { EntityTranslation } from 'domain/translation/EntityTranslationObjectFactory';
import { EntityTranslationBackendApiService } from 'pages/exploration-editor-page/services/entity-translation-backend-api.service';
import { AlertsService } from './alerts.service';

export interface LanguageCodeToEntityTranslations {
  [languageCode: string]: EntityTranslation;
}

@Injectable({
  providedIn: 'root'
})
export class EntityTranslationsService {
  private entityId!: string;
  private entityType!: string;
  private entityVersion!: number;
  public languageCodeToEntityTranslations: LanguageCodeToEntityTranslations = (
    {}
  );

  constructor(
    private alertsService: AlertsService,
    private entityTranslationBackendApiService: (
      EntityTranslationBackendApiService)
  ) {}

  init(
      entityId: string,
      entityType: string,
      entityVersion: number
  ): void {
    this.entityType = entityType;
    this.entityVersion = entityVersion;
    this.entityId = entityId;
  }

  async getEntityTranslationsAsync(languageCode: string):
    Promise<EntityTranslation> {
    return new Promise((resolve, reject) => {
      if (languageCode in this.languageCodeToEntityTranslations) {
        resolve(this.languageCodeToEntityTranslations[languageCode]);
        return;
      }
      this.alertsService.addInfoMessage('Fetching translation.');
      this.entityTranslationBackendApiService.fetchEntityTranslationAsync(
        this.entityId,
        this.entityType,
        this.entityVersion,
        languageCode
      ).then((entityTranslation) => {
        this.languageCodeToEntityTranslations[languageCode] = entityTranslation;
        this.alertsService.clearMessages();
        this.alertsService.addSuccessMessage('Translations fetched.');
        resolve(entityTranslation);
      });
    });
  }

  getHtmlTranslations(languageCode: string, contentIds: string[]): string[] {
    if (
      !this.languageCodeToEntityTranslations.hasOwnProperty(languageCode)) {
      return [];
    }

    let entityTranslation = this.languageCodeToEntityTranslations[
      languageCode] as EntityTranslation;
    let htmlStrings: string[] = [];
    contentIds.forEach((contentId) => {
      if (!entityTranslation.hasWrittenTranslation(contentId)) {
        return;
      }

      let writtenTranslation = entityTranslation.getWrittenTranslation(
        contentId) as TranslatedContent;
      if (writtenTranslation.dataFormat === 'html') {
        htmlStrings.push(writtenTranslation.translation as string);
      }
    });
    return htmlStrings;
  }

  reset(): void {
    this.languageCodeToEntityTranslations = {};
  }
}

angular.module('oppia').factory(
  'EntityTranslationsService',
  downgradeInjectable(EntityTranslationsService));
