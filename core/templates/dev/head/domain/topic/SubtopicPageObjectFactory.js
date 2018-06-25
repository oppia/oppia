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
 * subtopic page domain objects.
 */

oppia.factory('SubtopicPageObjectFactory', [
  function() {
    var SubtopicPage = function(
        subtopicPageId, topicId, htmlData, languageCode) {
      this._id = subtopicPageId;
      this._topicId = topicId;
      this._htmlData = htmlData;
      this._languageCode = languageCode;
    };

    var getSubtopicPageId = function(topicId, subtopicId) {
      return topicId + '-' + subtopicId.toString();
    };

    // Instance methods

    // Returns the id of the subtopic page.
    SubtopicPage.prototype.getId = function() {
      return this._id;
    };

    SubtopicPage.prototype.setId = function(id) {
      this._id = id;
    };

    // Returns the topic id that the subtopic page is linked to.
    SubtopicPage.prototype.getTopicId = function() {
      return this._topicId;
    };

    // Returns the html data for the subtopic page.
    SubtopicPage.prototype.getHtmlData = function() {
      return this._htmlData;
    };

    // Sets the html data for the subtopic page.
    SubtopicPage.prototype.setHtmlData = function(htmlData) {
      this._htmlData = htmlData;
    };

    // Returns the language code for the subtopic page.
    SubtopicPage.prototype.getLanguageCode = function() {
      return this._languageCode;
    };

    SubtopicPage.createFromBackendDict = function(subtopicPageBackendDict) {
      return new SubtopicPage(
        subtopicPageBackendDict.id, subtopicPageBackendDict.topic_id,
        subtopicPageBackendDict.html_data, subtopicPageBackendDict.language_code
      );
    };

    SubtopicPage.prototype.copyFromSubtopicPage = function(otherSubtopicPage) {
      this._id = otherSubtopicPage.getId();
      this._topicId = otherSubtopicPage.getTopicId();
      this._htmlData = otherSubtopicPage.getHtmlData();
      this._languageCode = otherSubtopicPage.getLanguageCode();
    };

    SubtopicPage.createDefault = function(topicId, subtopicId) {
      return new SubtopicPage(
        getSubtopicPageId(topicId, subtopicId), topicId, '', 'en'
      );
    };

    // Create an interstitial subtopic page that would be displayed in the
    // editor until the actual subtopic page is fetched from the backend.
    SubtopicPage.createInterstitialSubtopicPage = function() {
      return new SubtopicPage(null, null, null, 'en');
    };
    return SubtopicPage;
  }
]);
