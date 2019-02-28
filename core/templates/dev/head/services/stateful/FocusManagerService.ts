// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for setting focus. This broadcasts a 'focusOn' event
 * which sets focus to the element in the page with the corresponding focusOn
 * attribute.
 * Note: This requires LABEL_FOR_CLEARING_FOCUS to exist somewhere in the HTML
 * page.
 */

oppia.factory('FocusManagerService', [
  '$rootScope', '$timeout', 'DeviceInfoService', 'IdGenerationService',
  'LABEL_FOR_CLEARING_FOCUS',
  function(
      $rootScope, $timeout, DeviceInfoService, IdGenerationService,
      LABEL_FOR_CLEARING_FOCUS) {
    var _nextLabelToFocusOn = null;
    return {
      clearFocus: function() {
        this.setFocus(LABEL_FOR_CLEARING_FOCUS);
      },
      setFocus: function(name) {
        if (_nextLabelToFocusOn) {
          return;
        }

        _nextLabelToFocusOn = name;
        $timeout(function() {
          $rootScope.$broadcast('focusOn', _nextLabelToFocusOn);
          _nextLabelToFocusOn = null;
        });
      },
      setFocusIfOnDesktop: function(newFocusLabel) {
        if (!DeviceInfoService.isMobileDevice()) {
          this.setFocus(newFocusLabel);
        }
      },
      // Generates a random string (to be used as a focus label).
      generateFocusLabel: function() {
        return IdGenerationService.generateNewId();
      }
    };
  }
]);
