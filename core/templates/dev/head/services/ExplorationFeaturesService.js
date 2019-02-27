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

oppia.factory('ExplorationFeaturesService', [function() {
  var settings = {
    areParametersEnabled: false,
    isImprovementsTabEnabled: false,
    isPlaythroughRecordingEnabled: false,
  };

  return {
    init: function(explorationData, featuresData) {
      settings.isImprovementsTabEnabled =
        featuresData.is_improvements_tab_enabled;
      settings.isPlaythroughRecordingEnabled =
        featuresData.is_exploration_whitelisted;
      if (explorationData.param_changes &&
          explorationData.param_changes.length > 0) {
        this.enableParameters();
      } else {
        for (var state in explorationData.states) {
          if (explorationData.states[state].param_changes.length > 0) {
            this.enableParameters();
            break;
          }
        }
      }
    },
    areParametersEnabled: function() {
      return settings.areParametersEnabled;
    },
    isImprovementsTabEnabled: function() {
      return settings.isImprovementsTabEnabled;
    },
    isPlaythroughRecordingEnabled: function() {
      return settings.isPlaythroughRecordingEnabled;
    },
    enableParameters: function() {
      settings.areParametersEnabled = true;
    },
  };
}]);
