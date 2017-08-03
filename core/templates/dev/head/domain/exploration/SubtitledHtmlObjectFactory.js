// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for creating new frontend instances of SubtitledHtml
 * domain objects.
 */

oppia.factory('SubtitledHtmlObjectFactory', [
  'AudioTranslationObjectFactory', function(AudioTranslationObjectFactory) {
    var SubtitledHtml = function(html, audioTranslations) {
      this._html = html;
      this._audioTranslations = audioTranslations;
    };

    SubtitledHtml.prototype.getHtml = function() {
      return this._html;
    };

    SubtitledHtml.prototype.setHtml = function(newHtml) {
      // TODO(sll): Consider sanitizing here.
      // TODO(sll): At this point do we invalidate the existing audio
      // translations? In particular, saving empty HTML should invalidate all
      // audio.
      this._html = newHtml;
    };

    SubtitledHtml.prototype.getBindableAudioTranslations = function() {
      return this._audioTranslations;
    };

    SubtitledHtml.prototype.getAudioTranslation = function(languageCode) {
      return this._audioTranslations[languageCode];
    };

    SubtitledHtml.prototype.markAudioAsNeedingUpdate = function() {
      for (var languageCode in this._audioTranslations) {
        this._audioTranslations[languageCode].markAsNeedingUpdate();
      }
    };

    SubtitledHtml.prototype.isEmpty = function() {
      return !this._html;
    };

    SubtitledHtml.prototype.toBackendDict = function() {
      var audioTranslationsBackendDict = {};
      for (var languageCode in this._audioTranslations) {
        audioTranslationsBackendDict[languageCode] = (
          this._audioTranslations[languageCode].toBackendDict());
      }

      return {
        html: this._html,
        audio_translations: audioTranslationsBackendDict
      };
    };

    SubtitledHtml.createFromBackendDict = function(subtitledHtmlBackendDict) {
      var audioTranslationsBackendDict = (
        subtitledHtmlBackendDict.audio_translations);

      var audioTranslations = {};
      for (var languageCode in audioTranslationsBackendDict) {
        audioTranslations[languageCode] = (
          AudioTranslationObjectFactory.createFromBackendDict(
            audioTranslationsBackendDict[languageCode]));
      }

      return new SubtitledHtml(
        subtitledHtmlBackendDict.html, audioTranslations);
    };

    SubtitledHtml.createDefault = function(html) {
      return new SubtitledHtml(html, {});
    };

    return SubtitledHtml;
  }
]);
