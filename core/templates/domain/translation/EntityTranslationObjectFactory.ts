// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for creating new frontend instances of
 * EntityTranslation domain objects.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import {
  DataFormatToDefaultValuesKey,
  TranslatedContent,
  TranslatedContentBackendDict,
  TranslatedContentObjectFactory
} from 'domain/exploration/TranslatedContentObjectFactory'
import { TopicDomainConstants } from 'domain/topic/topic-domain.constants';

export interface EntityTranslationBackendDict {
  'entity_id': string;
  'entity_type': string;
  'entity_version': number;
  'language_code': string;
  'translations': {
    [contentId: string]: TranslatedContentBackendDict;
  };
}
interface TranslationMappingDict {
  [contentId: string]: TranslatedContentBackendDict;
}

interface TranslationMapping {
  [contentId: string]: TranslatedContent;
}

export class EntityTranslation {
  constructor(
    public entityId: string,
    public entityType: string,
    public entityVersion: number,
    public languageCode: string,
    public translationMapping: TranslationMapping
  ) {}

  getAllContentIds(): string[] {
    return Object.keys(this.translationMapping);
  }

  getWrittenTranslation(contentId: string): TranslatedContent {
    return this.translationMapping[contentId];
  }

  markTranslationAsNeedingUpdate(contentId: string): void {
    this.translationMapping[contentId].markAsNeedingUpdate();
  }

  getLanguageCode(contentId: string): string {
    return this.languageCode;
  }

  hasWrittenTranslation(contentId: string, languageCode: string): boolean {
    if (!this.translationMapping.hasOwnProperty(contentId)) {
      return false;
    }
    return this.getLanguageCode(
      contentId).indexOf(languageCode) !== -1;
  }

  hasUnflaggedWrittenTranslations(contentId: string): boolean {
    if (!this.translationMapping[contentId].needsUpdate) {
        return true;
      }
    return false;
  }

  addWrittenTranslation(
    contentId: string, languageCode: string,
    dataFormat: DataFormatToDefaultValuesKey,
    translations: string|string[]
  ): void {
    // todo.
  }

  updateWrittenTranslation(
      contentId: string, languageCode: string,
      translations: string|string[]): void {
    const writtenTranslations = this.translationMapping[contentId];
    // todo
  }
}

@Injectable({
  providedIn: 'root'
})
export class EntityTranlationObjectFactory {
  createTranslationMappingFromBackendDict(backendDict): TranslationMapping {
    const translationsMapping: TranslationMapping = {};
    Object.keys(backendDict.translations).forEach(
      (contentId) => translationsMapping[contentId]);

    return translationsMapping;
  }
  createFromBackendDict(
    backendDict: EntityTranslationBackendDict
  ): EntityTranslation {
    return new EntityTranslation(
      backendDict.entity_id,
      backendDict.entity_type,
      backendDict.entity_version,
      backendDict.language_code,
      this.createTranslationMappingFromBackendDict(backendDict.translations)
    );
  }
}

angular.module('oppia').factory(
  'EntityTranlationObjectFactory',
  downgradeInjectable(EntityTranlationObjectFactory));
