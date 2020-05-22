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
  /* eslint-disable camelcase */
  translations_mapping: ITranslationMappingBackendDict;
  /* eslint-enable camelcase */
}

export class WrittenTranslations {
  constructor(
      private writtenTranslationObjectFactory: WrittenTranslationObjectFactory,
      public translationsMapping: TranslationsMapping) {}

  getAllContentId(): string[] {
    return Object.keys(this.translationsMapping);
  }

  getWrittenTranslation(
      contentId: string, langCode: string): WrittenTranslation {
    return this.translationsMapping[contentId][langCode];
  }

  markAllTranslationsAsNeedingUpdate(contentId: string): void {
    const translationsByLangCode = this.translationsMapping[contentId];
    for (const translation of Object.values(translationsByLangCode)) {
      translation.markAsNeedingUpdate();
    }
  }

  getTranslationsLanguageCodes(contentId: string): string[] {
    const translationsByLangCode = this.translationsMapping[contentId];
    return translationsByLangCode ? Object.keys(translationsByLangCode) : [];
  }

  hasWrittenTranslation(contentId: string, langCode: string): boolean {
    return (
      this.translationsMapping.hasOwnProperty(contentId) &&
      this.translationsMapping[contentId].hasOwnProperty(langCode));
  }

  hasUnflaggedWrittenTranslations(contentId: string): boolean {
    return Object.values(this.translationsMapping[contentId])
      .some(t => t.needsUpdate);
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
      contentId: string, langCode: string, html: string): void {
    const translationsByLangCode = this.translationsMapping[contentId];
    if (translationsByLangCode.hasOwnProperty(langCode)) {
      throw new Error('Trying to add duplicate language code.');
    }
    translationsByLangCode[langCode] = (
      this.writtenTranslationObjectFactory.createNew(html));
  }

  updateWrittenTranslationHtml(
      contentId: string, langCode: string, html: string): void {
    const translationsByLangCode = this.translationsMapping[contentId];
    if (!translationsByLangCode.hasOwnProperty(langCode)) {
      throw new Error('Unable to find the given language code.');
    }
    translationsByLangCode[langCode].setHtml(html);
    // Marking translation updated.
    translationsByLangCode[langCode].needsUpdate = false;
  }

  toggleNeedsUpdateAttribute(contentId: string, langCode: string): void {
    this.translationsMapping[contentId][langCode].toggleNeedsUpdateAttribute();
  }

  toBackendDict(): IWrittenTranslationsBackendDict {
    const translationEntries = Object.entries(this.translationsMapping);

    const translationBackendDictMapping: ITranslationMappingBackendDict = {};
    for (const [contentId, translationsByLangCode] of translationEntries) {
      const translationsByLangCodeEntries = (
        Object.entries(translationsByLangCode));

      translationBackendDictMapping[contentId] = {};
      for (const [langCode, translation] of translationsByLangCodeEntries) {
        translationBackendDictMapping[contentId][langCode] = (
          translation.toBackendDict());
      }
    }
    return {translations_mapping: translationBackendDictMapping};
  }
}

@Injectable({
  providedIn: 'root'
})
export class WrittenTranslationsObjectFactory {
  constructor(
      private writtenTranslationObjectFactory:
        WrittenTranslationObjectFactory) {}

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
      this.writtenTranslationObjectFactory, translationsMapping);
  }

  createEmpty(): WrittenTranslations {
    return new WrittenTranslations(this.writtenTranslationObjectFactory, {});
  }
}

angular.module('oppia').factory(
  'WrittenTranslationsObjectFactory',
  downgradeInjectable(WrittenTranslationsObjectFactory));
