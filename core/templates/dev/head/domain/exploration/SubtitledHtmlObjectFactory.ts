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

var oppia = require('AppInit.ts').module;

oppia.factory('SubtitledHtmlObjectFactory', [function() {
  var SubtitledHtml = function(html, contentId) {
    this._html = html;
    this._contentId = contentId;
  };

  SubtitledHtml.prototype.getHtml = function() {
    return this._html;
  };

  SubtitledHtml.prototype.getContentId = function() {
    return this._contentId;
  };

  SubtitledHtml.prototype.setHtml = function(newHtml) {
    this._html = newHtml;
  };

  SubtitledHtml.prototype.hasNoHtml = function() {
    return !this._html;
  };

  SubtitledHtml.prototype.toBackendDict = function() {
    return {
      html: this._html,
      content_id: this._contentId
    };
  };

  SubtitledHtml.prototype.isEmpty = function() {
    return this.hasNoHtml();
  };

  // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
  /* eslint-disable dot-notation */
  SubtitledHtml['createFromBackendDict'] = function(
  /* eslint-enable dot-notation */
      subtitledHtmlBackendDict) {
    return new SubtitledHtml(
      subtitledHtmlBackendDict.html, subtitledHtmlBackendDict.content_id);
  };

  // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
  /* eslint-disable dot-notation */
  SubtitledHtml['createDefault'] = function(html, contentId) {
  /* eslint-enable dot-notation */
    return new SubtitledHtml(html, contentId);
  };

  return SubtitledHtml;
}
]);
