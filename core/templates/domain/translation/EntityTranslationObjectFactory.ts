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
 * @fileoverview Factory for creating new frontend instances of
 * EntityTranslation domain objects.
 */

import {
  TranslatedContent,
  TranslatedContentBackendDict,
} from 'domain/exploration/TranslatedContentObjectFactory';

interface TranslationMappingDict {
  [contentId: string]: TranslatedContentBackendDict;
}
export interface EntityTranslationBackendDict {
  entity_id: string;
  entity_type: string;
  entity_version: number;
  language_code: string;
  translations: TranslationMappingDict;
}

export interface LanguageCodeToEntityTranslationBackendDict {
  [languageCode: string]: EntityTranslationBackendDict;
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

  getWrittenTranslation(contentId: string): TranslatedContent | null {
    if (!this.hasWrittenTranslation(contentId)) {
      return null;
    }
    return this.translationMapping[contentId];
  }

  markTranslationAsNeedingUpdate(contentId: string): void {
    if (!this.translationMapping.hasOwnProperty(contentId)) {
      return;
    }

    this.translationMapping[contentId].markAsNeedingUpdate();
  }

  updateTranslation(
    contentId: string,
    translatedContent: TranslatedContent
  ): void {
    this.translationMapping[contentId] = translatedContent;
  }

  removeTranslation(contentId: string): void {
    delete this.translationMapping[contentId];
  }

  hasWrittenTranslation(contentId: string): boolean {
    return this.translationMapping.hasOwnProperty(contentId);
  }

  toBackendDict(): EntityTranslationBackendDict {
    return {
      entity_id: this.entityId,
      entity_type: this.entityType,
      entity_version: this.entityVersion,
      language_code: this.languageCode,
      translations: this.translationMappingToBackendDict(),
    };
  }

  translationMappingToBackendDict(): TranslationMappingDict {
    const translationMappingDict: TranslationMappingDict = {};
    Object.keys(this.translationMapping).forEach(contentId => {
      translationMappingDict[contentId] =
        this.translationMapping[contentId].toBackendDict();
    });
    return translationMappingDict;
  }

  static createTranslationMappingFromBackendDict(
    backendDict: TranslationMappingDict
  ): TranslationMapping {
    const translationsMapping: TranslationMapping = {};
    Object.keys(backendDict).forEach(contentId => {
      translationsMapping[contentId] = TranslatedContent.createFromBackendDict(
        backendDict[contentId]
      );
    });

    return translationsMapping;
  }

  static createFromBackendDict(
    backendDict: EntityTranslationBackendDict
  ): EntityTranslation {
    return new EntityTranslation(
      backendDict.entity_id,
      backendDict.entity_type,
      backendDict.entity_version,
      backendDict.language_code,
      EntityTranslation.createTranslationMappingFromBackendDict(
        backendDict.translations
      )
    );
  }
}
