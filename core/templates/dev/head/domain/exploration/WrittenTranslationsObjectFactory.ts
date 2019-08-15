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

import { WrittenTranslationObjectFactory } from
  'domain/exploration/WrittenTranslationObjectFactory.ts';

export class WrittenTranslations {
  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'translationsMapping' is a dict with underscore_cased keys
  // which give tslint errors against underscore_casing in favor of camelCasing.
  translationsMapping: any;
  _writtenTranslationObjectFactory: WrittenTranslationObjectFactory;
  constructor(translationsMapping: any, writtenTranslationObjectFactory: any) {
    this.translationsMapping = translationsMapping;
    this._writtenTranslationObjectFactory = writtenTranslationObjectFactory;
  }

  getAllContentId(): string[] {
    return Object.keys(this.translationsMapping);
  }

  // TODO(#7165): Replace 'any' with the exact type. This has been kept as
  // 'any' because the return type is a dict whose exact type needs to be
  // found by doing a good research.
  getWrittenTranslation(contentId: string, langCode: string): any {
    return this.translationsMapping[contentId][langCode];
  }

  markAllTranslationsAsNeedingUpdate(contentId: string): void {
    var languageCodeToWrittenTranslation = (
      this.translationsMapping[contentId]);
    for (var languageCode in languageCodeToWrittenTranslation) {
      languageCodeToWrittenTranslation[languageCode].markAsNeedingUpdate();
    }
  }

  getTranslationsLanguageCodes(contentId: string): string[] {
    return Object.keys(this.translationsMapping[contentId]);
  }

  hasWrittenTranslation(contentId: string, langaugeCode: string): boolean {
    if (!this.translationsMapping.hasOwnProperty(contentId)) {
      return false;
    }
    return this.getTranslationsLanguageCodes(
      contentId).indexOf(langaugeCode) !== -1;
  }

  hasUnflaggedWrittenTranslations(contentId: string): boolean {
    var writtenTranslations = this.translationsMapping[contentId];
    for (var languageCode in writtenTranslations) {
      if (!writtenTranslations[languageCode].needsUpdate) {
        return true;
      }
    }
    return false;
  }

  addContentId(contentId: string): void {
    if (this.translationsMapping.hasOwnProperty(contentId)) {
      throw Error('Trying to add duplicate content id.');
    }
    this.translationsMapping[contentId] = {};
  }

  deleteContentId(contentId: string): void {
    if (!this.translationsMapping.hasOwnProperty(contentId)) {
      throw Error('Unable to find the given content id.');
    }
    delete this.translationsMapping[contentId];
  }

  addWrittenTranslation(contentId: string, languageCode: string, html: string) {
    var writtenTranslations = this.translationsMapping[contentId];
    if (writtenTranslations.hasOwnProperty(languageCode)) {
      throw Error('Trying to add duplicate language code.');
    }
    writtenTranslations[languageCode] = (
      this._writtenTranslationObjectFactory.createNew(html));
  }

  updateWrittenTranslationHtml(
      contentId: string, languageCode: string, html: string) {
    var writtenTranslations = this.translationsMapping[contentId];
    if (!writtenTranslations.hasOwnProperty(languageCode)) {
      throw Error('Unable to find the given language code.');
    }
    writtenTranslations[languageCode].setHtml(html);
    // Marking translation updated.
    writtenTranslations[languageCode].needsUpdate = false;
  }

  toggleNeedsUpdateAttribute(contentId: string, languageCode: string): void {
    var writtenTranslations = this.translationsMapping[contentId];
    writtenTranslations[languageCode].toggleNeedsUpdateAttribute();
  }

  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because the return type is a dict with underscore_cased keys which
  // give tslint errors against underscore_casing in favor of camelCasing.
  toBackendDict(): any {
    var translationsMappingDict = {};
    for (var contentId in this.translationsMapping) {
      var langaugeToWrittenTranslation = this.translationsMapping[contentId];
      var langaugeToWrittenTranslationDict = {};
      Object.keys(langaugeToWrittenTranslation).forEach((lang) => {
        langaugeToWrittenTranslationDict[lang] = (
          langaugeToWrittenTranslation[lang].toBackendDict());
      });
      translationsMappingDict[contentId] = langaugeToWrittenTranslationDict;
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

  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'writtenTranslationsDict' is a dict with underscore_cased
  // keys which give tslint errors against underscore_casing in favor of
  // camelCasing.
  createFromBackendDict(writtenTranslationsDict: any): WrittenTranslations {
    var translationsMapping = {};
    Object.keys(writtenTranslationsDict.translations_mapping).forEach(
      (contentId) => {
        translationsMapping[contentId] = {};
        var languageCodeToWrittenTranslationDict = (
          writtenTranslationsDict.translations_mapping[contentId]);
        Object.keys(languageCodeToWrittenTranslationDict).forEach(
          (langCode) => {
            translationsMapping[contentId][langCode] = (
              this.writtenTranslationObjectFactory.createFromBackendDict(
                languageCodeToWrittenTranslationDict[langCode]));
          });
      });
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
