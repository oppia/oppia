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

oppia.factory('WrittenTranslationsObjectFactory', [
  'WrittenTranslationObjectFactory', function(WrittenTranslationObjectFactory) {
    var WrittenTranslations = function(translationsMapping) {
      this.translationsMapping = translationsMapping;
    };

    WrittenTranslations.prototype.getAllContentId = function() {
      return Object.keys(this.translationsMapping);
    };

    WrittenTranslations.prototype.getWrittenTranslation = function(
        contentId, langCode) {
      return this.translationsMapping[contentId][langCode];
    };

    WrittenTranslations.prototype.markAllTranslationsAsNeedingUpdate = (
      function(contentId) {
        var languageCodeToWrittenTranslation = (
          this.translationsMapping[contentId]);
        for (var languageCode in languageCodeToWrittenTranslation) {
          languageCodeToWrittenTranslation[languageCode].markAsNeedingUpdate();
        }
      });

    WrittenTranslations.prototype.getTranslationsLanguageCodes = function(
        contentId) {
      return Object.keys(this.translationsMapping[contentId]);
    };

    WrittenTranslations.prototype.hasWrittenTranslation = function(
        contentId, langaugeCode) {
      if (!this.translationsMapping.hasOwnProperty(contentId)) {
        return false;
      }
      return this.getTranslationsLanguageCodes(
        contentId).indexOf(langaugeCode) !== -1;
    };

    WrittenTranslations.prototype.hasUnflaggedWrittenTranslations = function(
        contentId) {
      var writtenTranslations = this.translationsMapping[contentId];
      for (var languageCode in writtenTranslations) {
        if (!writtenTranslations[languageCode].needsUpdate) {
          return true;
        }
      }
      return false;
    };

    WrittenTranslations.prototype.addContentId = function(contentId) {
      if (this.translationsMapping.hasOwnProperty(contentId)) {
        throw Error('Trying to add duplicate content id.');
      }
      this.translationsMapping[contentId] = {};
    };

    WrittenTranslations.prototype.deleteContentId = function(contentId) {
      if (!this.translationsMapping.hasOwnProperty(contentId)) {
        throw Error('Unable to find the given content id.');
      }
      delete this.translationsMapping[contentId];
    };

    WrittenTranslations.prototype.addWrittenTranslation = function(
        contentId, languageCode, html) {
      var writtenTranslations = this.translationsMapping[contentId];
      if (writtenTranslations.hasOwnProperty(languageCode)) {
        throw Error('Trying to add duplicate language code.');
      }
      writtenTranslations[languageCode] = (
        WrittenTranslationObjectFactory.createNew(html));
    };

    WrittenTranslations.prototype.updateWrittenTranslationHtml = function(
        contentId, languageCode, html) {
      var writtenTranslations = this.translationsMapping[contentId];
      if (!writtenTranslations.hasOwnProperty(languageCode)) {
        throw Error('Unable to find the given language code.');
      }
      writtenTranslations[languageCode].setHtml(html);
      // Marking translation updated.
      writtenTranslations[languageCode].needsUpdate = false;
    };

    WrittenTranslations.prototype.toggleNeedsUpdateAttribute = (
      function(contentId, languageCode) {
        var writtenTranslations = this.translationsMapping[contentId];
        writtenTranslations[languageCode].toggleNeedsUpdateAttribute();
      });

    WrittenTranslations.prototype.toBackendDict = function() {
      var translationsMappingDict = {};
      for (contentId in this.translationsMapping) {
        var langaugeToWrittenTranslation = this.translationsMapping[contentId];
        var langaugeToWrittenTranslationDict = {};
        Object.keys(langaugeToWrittenTranslation).forEach(function(lang) {
          langaugeToWrittenTranslationDict[lang] = (
            langaugeToWrittenTranslation[lang].toBackendDict());
        });
        translationsMappingDict[contentId] = langaugeToWrittenTranslationDict;
      }

      return {translations_mapping: translationsMappingDict};
    };

    WrittenTranslations.createFromBackendDict = function(
        writtenTranslationsDict) {
      var translationsMapping = {};
      Object.keys(writtenTranslationsDict.translations_mapping).forEach(
        function(contentId) {
          translationsMapping[contentId] = {};
          var languageCodeToWrittenTranslationDict = (
            writtenTranslationsDict.translations_mapping[contentId]);
          Object.keys(languageCodeToWrittenTranslationDict).forEach(
            function(langCode) {
              translationsMapping[contentId][langCode] = (
                WrittenTranslationObjectFactory.createFromBackendDict(
                  languageCodeToWrittenTranslationDict[langCode]));
            });
        });
      return new WrittenTranslations(translationsMapping);
    };

    WrittenTranslations.createEmpty = function() {
      return new WrittenTranslations({});
    };

    return WrittenTranslations;
  }
]);
