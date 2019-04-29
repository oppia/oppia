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
 * @fileoverview A service that maintains a record of which language
 * in the translation tab is currently active.
 */

oppia.factory('TranslationLanguageService', [
  '$log', '$rootScope', 'LanguageUtilService',
  function($log, $rootScope, LanguageUtilService) {
    var activeLanguageCode = null;
    var allAudioLanguageCodes = LanguageUtilService.getAllAudioLanguageCodes();
    return {
      getActiveLanguageCode: function() {
        return activeLanguageCode;
      },
      setActiveLanguageCode: function(newActiveLanguageCode) {
        if (allAudioLanguageCodes.indexOf(newActiveLanguageCode) < 0) {
          $log.error('Invalid active language code: ' + newActiveLanguageCode);
          return;
        }
        activeLanguageCode = newActiveLanguageCode;
        $rootScope.$broadcast('activeLanguageChanged');
      }
    };
  }]);
