// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service that maintains state of the current exploration.
 */

oppia.factory('ExplorationPlayerStateService', [function() {
  var exploration = null;
  return {
    setExploration: function(newExploration) {
      exploration = newExploration;
    },

    getExploration: function() {
      return exploration;
    },

    isInteractionInline: function(stateName) {
      return exploration.isInteractionInline(stateName);
    },

    getInteractionInstructions: function(stateName) {
      return exploration.getInteractionInstructions(stateName);
    },

    isStateTerminal: function(stateName) {
      return exploration.isStateTerminal(stateName);
    },

    isStateShowingConceptCard: function(stateName) {
      if (stateName === null) {
        return true;
      }
      return false;
    },

    getAuthorRecommendedExpIds: function(stateName) {
      return exploration.getAuthorRecommendedExpIds(stateName);
    },

    getLanguageCode: function() {
      return exploration.getLanguageCode();
    },
  };
}]);
