// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for creating new frontend instances of Hint
 * domain objects.
 */

require('domain/exploration/SubtitledHtmlObjectFactory.ts');

oppia.factory('HintObjectFactory', [
  'SubtitledHtmlObjectFactory',
  function(SubtitledHtmlObjectFactory) {
    var Hint = function(hintContent) {
      this.hintContent = hintContent;
    };

    Hint.prototype.toBackendDict = function() {
      return {
        hint_content: this.hintContent.toBackendDict()
      };
    };

    // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
    /* eslint-disable dot-notation */
    Hint['createFromBackendDict'] = function(hintBackendDict) {
    /* eslint-enable dot-notation */
      return new Hint(
        SubtitledHtmlObjectFactory.createFromBackendDict(
          hintBackendDict.hint_content));
    };

    // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
    /* eslint-disable dot-notation */
    Hint['createNew'] = function(hintContentId, hintContent) {
    /* eslint-enable dot-notation */
      return new Hint(
        SubtitledHtmlObjectFactory.createDefault(hintContent, hintContentId));
    };

    return Hint;
  }
]);
