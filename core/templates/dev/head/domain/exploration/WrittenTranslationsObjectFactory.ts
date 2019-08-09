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
  translationsMapping: any;
  _writtenTranslationObjectFactory: any;
  constructor(translationsMapping, writtenTranslationObjectFactory) {
    this.translationsMapping = translationsMapping;
    this._writtenTranslationObjectFactory = writtenTranslationObjectFactory;
  }

  getAllContentId() {
    return Object.keys(this.translationsMapping);
  }

  getWrittenTranslation(contentId, langCode) {
    return this.translationsMapping[contentId][langCode];
  }

  markAllTranslationsAsNeedingUpdate(contentId) {
    var languageCodeToWrittenTranslation = (
      this.translationsMapping[contentId]);
    for (var languageCode in languageCodeToWrittenTranslation) {
      languageCodeToWrittenTranslation[languageCode].markAsNeedingUpdate();
    }
  }

  getTranslationsLanguageCodes(contentId) {
    return Object.keys(this.translationsMapping[contentId]);
  }

  hasWrittenTranslation(contentId, langaugeCode) {
    if (!this.translationsMapping.hasOwnProperty(contentId)) {
      return false;
    }
    return this.getTranslationsLanguageCodes(
      contentId).indexOf(langaugeCode) !== -1;
  }

  hasUnflaggedWrittenTranslations(contentId) {
    var writtenTranslations = this.translationsMapping[contentId];
    for (var languageCode in writtenTranslations) {
      if (!writtenTranslations[languageCode].needsUpdate) {
        return true;
      }
    }
    return false;
  }

  addContentId(contentId) {
    if (this.translationsMapping.hasOwnProperty(contentId)) {
      throw Error('Trying to add duplicate content id.');
    }
    this.translationsMapping[contentId] = {};
  }

  deleteContentId(contentId) {
    if (!this.translationsMapping.hasOwnProperty(contentId)) {
      throw Error('Unable to find the given content id.');
    }
    delete this.translationsMapping[contentId];
  }

  addWrittenTranslation(contentId, languageCode, html) {
    var writtenTranslations = this.translationsMapping[contentId];
    if (writtenTranslations.hasOwnProperty(languageCode)) {
      throw Error('Trying to add duplicate language code.');
    }
    writtenTranslations[languageCode] = (
      this._writtenTranslationObjectFactory.createNew(html));
  }

  updateWrittenTranslationHtml(contentId, languageCode, html) {
    var writtenTranslations = this.translationsMapping[contentId];
    if (!writtenTranslations.hasOwnProperty(languageCode)) {
      throw Error('Unable to find the given language code.');
    }
    writtenTranslations[languageCode].setHtml(html);
    // Marking translation updated.
    writtenTranslations[languageCode].needsUpdate = false;
  }

  toggleNeedsUpdateAttribute(contentId, languageCode) {
    var writtenTranslations = this.translationsMapping[contentId];
    writtenTranslations[languageCode].toggleNeedsUpdateAttribute();
  }

  toBackendDict() {
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

  createFromBackendDict(writtenTranslationsDict) {
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

  createEmpty() {
    return new WrittenTranslations({}, this.writtenTranslationObjectFactory);
  }
}

angular.module('oppia').factory(
  'WrittenTranslationsObjectFactory',
  downgradeInjectable(WrittenTranslationsObjectFactory));
