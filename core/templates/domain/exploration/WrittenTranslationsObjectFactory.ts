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

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import {
  IWrittenTranslationBackendDict,
  WrittenTranslation, WrittenTranslationObjectFactory
} from 'domain/exploration/WrittenTranslationObjectFactory';

type TranslationsMapping = {
  [contentId: string]: {[langCode: string]: WrittenTranslation}
};

type ITranslationMappingBackendDict = {
  [contentId: string]: {[langCode: string]: IWrittenTranslationBackendDict}
};

export interface IWrittenTranslationsBackendDict {
  translations_mapping: TranslationsMapping;
}

export class WrittenTranslations {
  private writtenTranslationObjectFactory: WrittenTranslationObjectFactory;
  translationsMapping: TranslationsMapping;

  constructor(
      translationsMapping: TranslationsMapping,
      writtenTranslationObjectFactory: WrittenTranslationObjectFactory) {
    this.translationsMapping = translationsMapping;
    this.writtenTranslationObjectFactory = writtenTranslationObjectFactory;
  }

  getAllContentId(): string[] {
    return Object.keys(this.translationsMapping);
  }

  getWrittenTranslation(
      contentId: string, langCode: string): WrittenTranslation {
    return this.translationsMapping[contentId][langCode];
  }

  markAllTranslationsAsNeedingUpdate(contentId: string): void {
    const languageCodeToWrittenTranslation = (
      this.translationsMapping[contentId]);
    for (const languageCode in languageCodeToWrittenTranslation) {
      languageCodeToWrittenTranslation[languageCode].markAsNeedingUpdate();
    }
  }

  getTranslationsLanguageCodes(contentId: string): string[] {
    return Object.keys(this.translationsMapping[contentId]);
  }

  hasWrittenTranslation(contentId: string, languageCode: string): boolean {
    if (!this.translationsMapping.hasOwnProperty(contentId)) {
      return false;
    }
    return this.getTranslationsLanguageCodes(
      contentId).indexOf(languageCode) !== -1;
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

  addWrittenTranslation(contentId: string, languageCode: string, html: string) {
    const writtenTranslations = this.translationsMapping[contentId];
    if (writtenTranslations.hasOwnProperty(languageCode)) {
      throw new Error('Trying to add duplicate language code.');
    }
    writtenTranslations[languageCode] = (
      this.writtenTranslationObjectFactory.createNew(html));
  }

  updateWrittenTranslationHtml(
      contentId: string, languageCode: string, html: string) {
    const writtenTranslations = this.translationsMapping[contentId];
    if (!writtenTranslations.hasOwnProperty(languageCode)) {
      throw new Error('Unable to find the given language code.');
    }
    writtenTranslations[languageCode].setHtml(html);
    // Marking translation updated.
    writtenTranslations[languageCode].needsUpdate = false;
  }

  toggleNeedsUpdateAttribute(contentId: string, languageCode: string): void {
    const writtenTranslations = this.translationsMapping[contentId];
    writtenTranslations[languageCode].toggleNeedsUpdateAttribute();
  }

  toBackendDict(): IWrittenTranslationsBackendDict {
    const translationsMappingDict = {};
    for (const contentId in this.translationsMapping) {
      const languageToWrittenTranslation = this.translationsMapping[contentId];
      const languageToWrittenTranslationDict = {};
      Object.keys(languageToWrittenTranslation).forEach((lang) => {
        languageToWrittenTranslationDict[lang] = (
          languageToWrittenTranslation[lang].toBackendDict());
      });
      translationsMappingDict[contentId] = languageToWrittenTranslationDict;
    }

    return {translations_mapping: translationsMappingDict};
  }
}

@Injectable({
  providedIn: 'root'
})
export class WrittenTranslationsObjectFactory {
  constructor(
    private writtenTranslationObjectFactory: WrittenTranslationObjectFactory) {}

  createFromBackendDict(
      writtenTranslationsDict:
        IWrittenTranslationsBackendDict): WrittenTranslations {
    const translationsMapping: TranslationsMapping = {};
    for (const contentId in writtenTranslationsDict.translations_mapping) {
      translationsMapping[contentId] = {};
      const langCodeToWrittenTranslationDict = (
        writtenTranslationsDict.translations_mapping[contentId]);
      for (const langCode in langCodeToWrittenTranslationDict) {
        translationsMapping[contentId][langCode] = (
          this.writtenTranslationObjectFactory.createFromBackendDict(
            langCodeToWrittenTranslationDict[langCode]));
      }
    }
    return new WrittenTranslations(
      translationsMapping, this.writtenTranslationObjectFactory);
  }

  createEmpty(): WrittenTranslations {
    return new WrittenTranslations({}, this.writtenTranslationObjectFactory);
  }
}

angular.module('oppia').factory(
  'WrittenTranslationsObjectFactory',
  downgradeInjectable(WrittenTranslationsObjectFactory));
