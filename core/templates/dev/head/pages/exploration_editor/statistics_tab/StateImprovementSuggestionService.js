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
 * @fileoverview Service for suggestion improvements to a specific state.
 */

oppia.factory('StateImprovementSuggestionService', [
  'IMPROVE_TYPE_INCOMPLETE',
  function(IMPROVE_TYPE_INCOMPLETE) {
    return {
      // Returns an array of suggested improvements to states. Each suggestion
      // is an object with the keys: rank, improveType, and stateName.
      getStateImprovements: function(explorationStates, allStateStats) {
        var rankComparator = function(lhs, rhs) {
          return rhs.rank - lhs.rank;
        };

        var rankedStates = [];
        explorationStates.getStateNames().forEach(function(stateName) {
          if (!allStateStats.hasOwnProperty(stateName)) {
            return;
          }

          var stateStats = allStateStats[stateName];
          var totalEntryCount = stateStats.total_entry_count;
          var noAnswerSubmittedCount = stateStats.no_submitted_answer_count;

          if (totalEntryCount === 0) {
            return;
          }

          var threshold = 0.2 * totalEntryCount;
          var eligibleFlags = [];
          var state = explorationStates.getState(stateName);
          var stateInteraction = state.interaction;
          if (noAnswerSubmittedCount > threshold) {
            eligibleFlags.push({
              rank: noAnswerSubmittedCount,
              improveType: IMPROVE_TYPE_INCOMPLETE,
            });
          }
          if (eligibleFlags.length > 0) {
            eligibleFlags.sort(rankComparator);
            rankedStates.push({
              rank: eligibleFlags[0].rank,
              stateName: stateName,
              type: eligibleFlags[0].improveType,
            });
          }
        });

        // The returned suggestions are sorted decreasingly by their ranks.
        rankedStates.sort(rankComparator);
        return rankedStates;
      }
    };
  }
]);
