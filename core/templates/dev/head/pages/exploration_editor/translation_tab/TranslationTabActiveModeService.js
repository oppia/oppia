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

oppia.constant('VOICEOVER_MODE', 'voiceoverMode');
oppia.constant('TRANSLATION_MODE', 'translationMode');

oppia.factory('TranslationTabActiveModeService', [
  '$rootScope', 'TRANSLATION_MODE', 'VOICEOVER_MODE',
  function($rootScope, TRANSLATION_MODE, VOICEOVER_MODE) {
    var activeMode = null;
    return {
      activateVoiceoverMode: function() {
        activeMode = VOICEOVER_MODE;
        $rootScope.$broadcast('translationTabModeChange');
      },
      activateTranslationMode: function() {
        activeMode = TRANSLATION_MODE;
        $rootScope.$broadcast('translationTabModeChange');
      },
      isTranslationModeActive: function() {
        return activeMode === TRANSLATION_MODE;
      },
      isVoiceoverModeActive: function() {
        return activeMode === VOICEOVER_MODE;
      }
    };
  }]);
