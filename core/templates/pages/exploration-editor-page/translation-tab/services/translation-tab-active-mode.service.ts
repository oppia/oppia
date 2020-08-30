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
 * @fileoverview Service to change and validate active mode in the translation
 * tab.
 */

require(
  'pages/exploration-editor-page/exploration-editor-page.constants.ajs.ts');

angular.module('oppia').factory('TranslationTabActiveModeService', [
  'TRANSLATION_MODE', 'VOICEOVER_MODE',
  function(TRANSLATION_MODE, VOICEOVER_MODE) {
    var activeMode = null;
    return {
      activateVoiceoverMode: function() {
        activeMode = VOICEOVER_MODE;
      },
      activateTranslationMode: function() {
        activeMode = TRANSLATION_MODE;
      },
      isTranslationModeActive: function() {
        return activeMode === TRANSLATION_MODE;
      },
      isVoiceoverModeActive: function() {
        return activeMode === VOICEOVER_MODE;
      }
    };
  }]);
