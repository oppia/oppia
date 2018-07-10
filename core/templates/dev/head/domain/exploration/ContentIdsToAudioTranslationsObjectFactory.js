// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * ContentIdsToAudioTranslations domain objects.
 */

oppia.factory('ContentIdsToAudioTranslationsObjectFactory', [
  'AudioTranslationObjectFactory', 'LanguageUtilService',
  'COMPONENT_NAME_FEEDBACK', function(AudioTranslationObjectFactory,
      LanguageUtilService, COMPONENT_NAME_FEEDBACK) {
    var ContentIdsToAudioTranslations = function(
        contentIdsToAudioTranslations) {
      this._contentIdsToAudioTranslations = contentIdsToAudioTranslations;
    };

    ContentIdsToAudioTranslations.prototype.getAllContentId = function() {
      return Object.keys(this._contentIdsToAudioTranslations);
    };

    ContentIdsToAudioTranslations.prototype.getBindableAudioTranslations = (
      function(contentId) {
        return this._contentIdsToAudioTranslations[contentId];
      });

    ContentIdsToAudioTranslations.prototype.getAudioTranslation = function(
        contentId, langCode) {
      console.log(this._contentIdsToAudioTranslations, contentId, langCode, "jhashdhasdhahsdas");
      return this._contentIdsToAudioTranslations[contentId][
        langCode];
    };

    ContentIdsToAudioTranslations.prototype.markAllAudioAsNeedingUpdate = (
      function(contentId) {
        var audioTranslations = this._contentIdsToAudioTranslations[contentId];
        for (var languageCode in audioTranslations) {
          audioTranslations[languageCode].markAsNeedingUpdate();
        }
      });

    ContentIdsToAudioTranslations.prototype.getAudioLanguageCodes = function(
        contentId) {
      return Object.keys(this._contentIdsToAudioTranslations[contentId]);
    };

    ContentIdsToAudioTranslations.prototype.hasAudioTranslations = function(
        contentId) {
      return this.getAudioLanguageCodes(contentId).length > 0;
    };

    ContentIdsToAudioTranslations.prototype.hasUnflaggedAudioTranslations = (
      function(contentId) {
        var audioTranslations = this._contentIdsToAudioTranslations[contentId];
        for (var languageCode in audioTranslations) {
          if (!audioTranslations[languageCode].needsUpdate) {
            return true;
          }
        }
        return false;
      });

    ContentIdsToAudioTranslations.prototype.isFullyTranslated = function(
        contentId) {
      var audioTranslations = this._contentIdsToAudioTranslations[contentId];
      var numLanguages = Object.keys(audioTranslations).length;
      return (numLanguages === LanguageUtilService.getAudioLanguagesCount());
    };

    ContentIdsToAudioTranslations.prototype.addContentId = function(contentId) {
      if (this._contentIdsToAudioTranslations.hasOwnProperty(contentId)) {
        throw Error('Trying to add duplicate content id.');
      }
      this._contentIdsToAudioTranslations[contentId] = {};
    };

    ContentIdsToAudioTranslations.prototype.deleteContentId = function(
        contentId) {
      if (!this._contentIdsToAudioTranslations.hasOwnProperty(contentId)) {
        throw Error('Unable to find the given content id.');
      }
      delete this._contentIdsToAudioTranslations[contentId];
    };

    ContentIdsToAudioTranslations.prototype.deleteAllFeedbackContentId =
      function(contentId) {
        var ContentIdList = this.getAllContentId();
        var searchKey = COMPONENT_NAME_FEEDBACK + '_';
        for (index in ContentIdList) {
          if (ContentIdList[index].indexOf(searchKey) === 0) {
            this.deleteContentId(ContentIdList[index]);
          }
        }
      };

    ContentIdsToAudioTranslations.prototype.addAudioTranslation = function(
        contentId, languageCode, filename, fileSizeBytes) {
      var audioTranslations = this._contentIdsToAudioTranslations[contentId];
      if (audioTranslations.hasOwnProperty(languageCode)) {
        throw Error('Trying to add duplicate language code.');
      }
      audioTranslations[languageCode] = (
        AudioTranslationObjectFactory.createNew(filename, fileSizeBytes));
    };

    ContentIdsToAudioTranslations.prototype.deleteAudioTranslation = function(
        contentId, languageCode) {
      var audioTranslations = this._contentIdsToAudioTranslations[contentId];
      if (!audioTranslations.hasOwnProperty(languageCode)) {
        throw Error(
          'Trying to remove non-existing translation for language code ' +
          languageCode);
      }
      delete audioTranslations[languageCode];
    };

    ContentIdsToAudioTranslations.prototype.toggleNeedsUpdateAttribute = (
      function(contentId, languageCode) {
        var audioTranslations = this._contentIdsToAudioTranslations[contentId];
        audioTranslations[languageCode].toggleNeedsUpdateAttribute();
      });

    ContentIdsToAudioTranslations.prototype.toBackendDict = function() {
      var contentIdsToAudioTranslationsDict = {};
      for (contentId in this._contentIdsToAudioTranslations) {
        var audioTanslations = this._contentIdsToAudioTranslations[contentId];
        var audioTranslationsDict = {};
        Object.keys(audioTanslations).forEach(function(lang){
          audioTranslationsDict[lang] = audioTanslations[lang].toBackendDict();
        });
        contentIdsToAudioTranslationsDict[contentId] = audioTranslationsDict;
      }

      return contentIdsToAudioTranslationsDict;
    };

    ContentIdsToAudioTranslations.createFromBackendDict = function(
        contentIdsToAudioTranslationsDict) {
      var contentIdsToAudioTranslations = {};
      Object.keys(contentIdsToAudioTranslationsDict).forEach(function(
          contentId) {
        var audioTanslationsDict = (
          contentIdsToAudioTranslationsDict[contentId]);
        var audioTranslations = {};
        Object.keys(audioTanslationsDict).forEach(function(langCode){
          audioTranslations[langCode] = (
            AudioTranslationObjectFactory.createFromBackendDict(
              audioTanslationsDict[langCode]));
        });
        contentIdsToAudioTranslations[contentId] = audioTranslations;
      });

      return new ContentIdsToAudioTranslations(contentIdsToAudioTranslations);
    };

    return ContentIdsToAudioTranslations;
  }
]);
