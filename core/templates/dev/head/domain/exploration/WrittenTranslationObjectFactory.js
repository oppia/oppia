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
 * WrittenTranslation domain objects.
 */

oppia.factory('WrittenTranslationObjectFactory', [function() {
  var WrittenTranslation = function(html, needsUpdate) {
    this.html = html;
    this.needsUpdate = needsUpdate;
  };

  WrittenTranslation.prototype.getHtml = function() {
    return this.html;
  };

  WrittenTranslation.prototype.setHtml = function(html) {
    this.html = html;
  };

  WrittenTranslation.prototype.markAsNeedingUpdate = function() {
    this.needsUpdate = true;
  };

  WrittenTranslation.prototype.toggleNeedsUpdateAttribute = function() {
    this.needsUpdate = !this.needsUpdate;
  };

  WrittenTranslation.prototype.toBackendDict = function() {
    return {
      html: this.html,
      needs_update: this.needsUpdate
    };
  };

  WrittenTranslation.createNew = function(html) {
    return new WrittenTranslation(html, false);
  };

  WrittenTranslation.createFromBackendDict = function(translationBackendDict) {
    return new WrittenTranslation(
      translationBackendDict.html,
      translationBackendDict.needs_update);
  };

  return WrittenTranslation;
}]);
