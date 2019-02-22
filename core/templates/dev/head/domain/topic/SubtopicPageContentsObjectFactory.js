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
 * @fileoverview Factory for creating and mutating instances of frontend
 * subtopic page data domain objects.
 */

oppia.factory('SubtopicPageContentsObjectFactory', [
  'ContentIdsToAudioTranslationsObjectFactory', 'SubtitledHtmlObjectFactory',
  function(
      ContentIdsToAudioTranslationsObjectFactory, SubtitledHtmlObjectFactory) {
    var SubtopicPageContents = function(
        subtitledHtml, contentIdsToAudioTranslations) {
      this._subtitledHtml = subtitledHtml;
      this._contentIdsToAudioTranslations =
        contentIdsToAudioTranslations;
    };

    SubtopicPageContents.prototype.getSubtitledHtml = function() {
      return this._subtitledHtml;
    };

    SubtopicPageContents.prototype.setSubtitledHtml = function(
        newSubtitledHtml) {
      this._subtitledHtml = angular.copy(newSubtitledHtml);
    };

    SubtopicPageContents.prototype.getHtml = function() {
      return this._subtitledHtml.getHtml();
    };

    SubtopicPageContents.prototype.setHtml = function(html) {
      this._subtitledHtml.setHtml(html);
    };

    SubtopicPageContents.prototype.getContentIdsToAudioTranslations =
    function() {
      return this._contentIdsToAudioTranslations;
    };

    SubtopicPageContents.prototype.setContentIdsToAudioTranslations =
    function(newContentIdsToAudioTranslations) {
      this._contentIdsToAudioTranslations =
        angular.copy(newContentIdsToAudioTranslations);
    };

    SubtopicPageContents.createDefault = function() {
      var contentIdsToAudioTranslations =
        ContentIdsToAudioTranslationsObjectFactory.createEmpty();
      contentIdsToAudioTranslations.addContentId('content');
      return new SubtopicPageContents(
        SubtitledHtmlObjectFactory.createDefault('', 'content'),
        contentIdsToAudioTranslations);
    };

    SubtopicPageContents.prototype.toBackendDict = function() {
      return {
        subtitled_html: this._subtitledHtml.toBackendDict(),
        content_ids_to_audio_translations:
          this._contentIdsToAudioTranslations.toBackendDict()
      };
    };

    SubtopicPageContents.createFromBackendDict = function(backendDict) {
      return new SubtopicPageContents(
        SubtitledHtmlObjectFactory.createFromBackendDict(
          backendDict.subtitled_html),
        ContentIdsToAudioTranslationsObjectFactory.createFromBackendDict(
          backendDict.content_ids_to_audio_translations));
    };

    return SubtopicPageContents;
  }
]);
