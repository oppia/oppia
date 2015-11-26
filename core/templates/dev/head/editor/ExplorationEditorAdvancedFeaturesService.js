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
 * @fileoverview Service for determining the visibility of advanced features in
 *               the exploration editor.
 */

oppia.factory('explorationAdvancedFeaturesService', [function() {
  var _settings = {
    areFallbacksEnabled: false,
    areGadgetsEnabled: false,
    areParametersEnabled: false
  };

  return {
    areFallbacksEnabled: function() {
      return _settings.areFallbacksEnabled;
    },
    areGadgetsEnabled: function() {
      return _settings.areGadgetsEnabled;
    },
    areParametersEnabled: function() {
      return _settings.areParametersEnabled;
    },
    enableFallbacks: function() {
      _settings.areFallbacksEnabled = true;
    },
    enableGadgets: function() {
      _settings.areGadgetsEnabled = true;
    },
    enableParameters: function() {
      _settings.areParametersEnabled = true;
    },
    init: function(explorationData) {
      for (var state in explorationData.states) {
        if (explorationData.states[state].interaction.fallbacks.length > 0) {
          this.enableFallbacks();
          break;
        }
      }

      var skinCustomizations = explorationData.skin_customizations;
      for (var panel in skinCustomizations.panels_contents) {
        if (skinCustomizations.panels_contents[panel].length > 0) {
          this.enableGadgets();
          break;
        }
      }

      if (explorationData.param_changes.length > 0) {
        this.enableParameters();
      } else {
        for (var state in explorationData.states) {
          if (explorationData.states[state].param_changes.length > 0) {
            this.enableParameters();
            break;
          }
        }
      }
    }
  };
}]);
