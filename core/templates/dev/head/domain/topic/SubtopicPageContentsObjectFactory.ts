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

require('domain/exploration/RecordedVoiceoversObjectFactory.ts');
require('domain/exploration/SubtitledHtmlObjectFactory.ts');

var oppia = require('AppInit.ts').module;

oppia.factory('SubtopicPageContentsObjectFactory', [
  'RecordedVoiceoversObjectFactory', 'SubtitledHtmlObjectFactory',
  function(RecordedVoiceoversObjectFactory, SubtitledHtmlObjectFactory) {
    var SubtopicPageContents = function(subtitledHtml, recordedVoiceovers) {
      this._subtitledHtml = subtitledHtml;
      this._recordedVoiceovers = recordedVoiceovers;
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

    SubtopicPageContents.prototype.getRecordedVoiceovers =
    function() {
      return this._recordedVoiceovers;
    };

    SubtopicPageContents.prototype.setRecordedVoiceovers = function(
        newRecordedVoiceovers) {
      this._recordedVoiceovers = angular.copy(newRecordedVoiceovers);
    };

    // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
    /* eslint-disable dot-notation */
    SubtopicPageContents['createDefault'] = function() {
    /* eslint-enable dot-notation */
      var recordedVoiceovers = RecordedVoiceoversObjectFactory.createEmpty();
      recordedVoiceovers.addContentId('content');
      return new SubtopicPageContents(
        SubtitledHtmlObjectFactory.createDefault('', 'content'),
        recordedVoiceovers);
    };

    SubtopicPageContents.prototype.toBackendDict = function() {
      return {
        subtitled_html: this._subtitledHtml.toBackendDict(),
        recorded_voiceovers: this._recordedVoiceovers.toBackendDict()
      };
    };

    // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
    /* eslint-disable dot-notation */
    SubtopicPageContents['createFromBackendDict'] = function(backendDict) {
    /* eslint-enable dot-notation */
      return new SubtopicPageContents(
        SubtitledHtmlObjectFactory.createFromBackendDict(
          backendDict.subtitled_html),
        RecordedVoiceoversObjectFactory.createFromBackendDict(
          backendDict.recorded_voiceovers));
    };

    return SubtopicPageContents;
  }
]);
