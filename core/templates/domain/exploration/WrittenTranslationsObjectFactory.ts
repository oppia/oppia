// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * WrittenTranslations domain objects.
 */

import {Injectable} from '@angular/core';

import {
  DataFormatToDefaultValuesKey,
  TranslationBackendDict,
  WrittenTranslation,
  WrittenTranslationObjectFactory,
} from 'domain/exploration/WrittenTranslationObjectFactory';

export interface WrittenTranslationsBackendDict {
  translations_mapping: {
    [contentId: string]: {
      [langCode: string]: TranslationBackendDict;
    };
  };
}

interface TranslationMappingDict {
  [contentId: string]: {
    [langCode: string]: TranslationBackendDict;
  };
}

interface WrittenTranslationsMapping {
  [contentId: string]: {
    [langCode: string]: WrittenTranslation;
  };
}

export class WrittenTranslations {
  translationsMapping: WrittenTranslationsMapping;
  _writtenTranslationObjectFactory: WrittenTranslationObjectFactory;
  constructor(
    translationsMapping: WrittenTranslationsMapping,
    writtenTranslationObjectFactory: WrittenTranslationObjectFactory
  ) {
    this.translationsMapping = translationsMapping;
    this._writtenTranslationObjectFactory = writtenTranslationObjectFactory;
  }

  getAllContentIds(): string[] {
    return Object.keys(this.translationsMapping);
  }

  getWrittenTranslation(
    contentId: string,
    langCode: string
  ): WrittenTranslation {
    return this.translationsMapping[contentId][langCode];
  }

  markAllTranslationsAsNeedingUpdate(contentId: string): void {
    const languageCodeToWrittenTranslation =
      this.translationsMapping[contentId];
    for (const languageCode in languageCodeToWrittenTranslation) {
      languageCodeToWrittenTranslation[languageCode].markAsNeedingUpdate();
    }
  }

  getLanguageCodes(contentId: string): string[] {
    return Object.keys(this.translationsMapping[contentId]);
  }

  hasWrittenTranslation(contentId: string, languageCode: string): boolean {
    if (!this.translationsMapping.hasOwnProperty(contentId)) {
      return false;
    }
    return this.getLanguageCodes(contentId).indexOf(languageCode) !== -1;
  }

  hasUnflaggedWrittenTranslations(contentId: string): boolean {
    const writtenTranslations = this.translationsMapping[contentId];
    for (const languageCode in writtenTranslations) {
      if (!writtenTranslations[languageCode].needsUpdate) {
        return true;
      }
    }
    return false;
  }

  addContentId(contentId: string): void {
    if (this.translationsMapping.hasOwnProperty(contentId)) {
      throw new Error('Trying to add duplicate content id.');
    }
    this.translationsMapping[contentId] = {};
  }

  deleteContentId(contentId: string): void {
    if (!this.translationsMapping.hasOwnProperty(contentId)) {
      throw new Error('Unable to find the given content id.');
    }
    delete this.translationsMapping[contentId];
  }

  addWrittenTranslation(
    contentId: string,
    languageCode: string,
    dataFormat: DataFormatToDefaultValuesKey,
    translation: string | string[]
  ): void {
    const writtenTranslations = this.translationsMapping[contentId];
    if (writtenTranslations.hasOwnProperty(languageCode)) {
      throw new Error('Trying to add duplicate language code.');
    }
    writtenTranslations[languageCode] =
      this._writtenTranslationObjectFactory.createNew(dataFormat);
    writtenTranslations[languageCode].setTranslation(translation);
  }

  updateWrittenTranslation(
    contentId: string,
    languageCode: string,
    translation: string | string[]
  ): void {
    const writtenTranslations = this.translationsMapping[contentId];
    if (!writtenTranslations.hasOwnProperty(languageCode)) {
      throw new Error('Unable to find the given language code.');
    }
    writtenTranslations[languageCode].setTranslation(translation);
    // Marking translation updated.
    writtenTranslations[languageCode].needsUpdate = false;
  }

  toggleNeedsUpdateAttribute(contentId: string, languageCode: string): void {
    const writtenTranslations = this.translationsMapping[contentId];
    writtenTranslations[languageCode].toggleNeedsUpdateAttribute();
  }

  toBackendDict(): WrittenTranslationsBackendDict {
    const translationsMappingDict: TranslationMappingDict = {};
    for (const contentId in this.translationsMapping) {
      const languageToWrittenTranslation = this.translationsMapping[contentId];
      const languageToWrittenTranslationDict: Record<
        string,
        TranslationBackendDict
      > = {};
      Object.keys(languageToWrittenTranslation).forEach(lang => {
        languageToWrittenTranslationDict[lang] =
          languageToWrittenTranslation[lang].toBackendDict();
      });
      translationsMappingDict[contentId] = languageToWrittenTranslationDict;
    }

    return {translations_mapping: translationsMappingDict};
  }
}

@Injectable({
  providedIn: 'root',
})
export class WrittenTranslationsObjectFactory {
  constructor(
    private writtenTranslationObjectFactory: WrittenTranslationObjectFactory
  ) {}

  createFromBackendDict(
    writtenTranslationsDict: WrittenTranslationsBackendDict
  ): WrittenTranslations {
    const translationsMapping: WrittenTranslationsMapping = {};
    Object.keys(writtenTranslationsDict.translations_mapping).forEach(
      contentId => {
        translationsMapping[contentId] = {};
        const languageCodeToWrittenTranslationDict =
          writtenTranslationsDict.translations_mapping[contentId];
        Object.keys(languageCodeToWrittenTranslationDict).forEach(langCode => {
          translationsMapping[contentId][langCode] =
            this.writtenTranslationObjectFactory.createFromBackendDict(
              languageCodeToWrittenTranslationDict[langCode]
            );
        });
      }
    );
    return new WrittenTranslations(
      translationsMapping,
      this.writtenTranslationObjectFactory
    );
  }

  createEmpty(): WrittenTranslations {
    return new WrittenTranslations({}, this.writtenTranslationObjectFactory);
  }
}
