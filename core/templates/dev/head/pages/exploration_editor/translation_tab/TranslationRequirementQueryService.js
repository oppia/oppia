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
* @fileoverview A service that check s the requirement of translation for a
* content using it's translation_id.
*/

oppia.factory('TranslationRequirementQueryService', [
  'ExplorationStatesService', 'INTERACTION_SPECS', function(
      ExplorationStatesService, INTERACTION_SPECS) {
    var stateToUnnecessaryContentIdList = {};
    var _checkAndUpdateList = function(stateName, subtitledHtml) {
      if (!subtitledHtml.getHtml()) {
        stateToUnnecessaryContentIdList[stateName].push(
          subtitledHtml.getContentId());
      }
    };
    var _init = function() {
      if (!ExplorationStatesService.isInitialized()) {
        return;
      }
      var stateNames = ExplorationStatesService.getStateNames();
      for (index in stateNames) {
        var stateName = stateNames[index];
        stateToUnnecessaryContentIdList[stateName] = [];
        var stateContent = (
          ExplorationStatesService.getStateContentMemento(stateName));
        var stateInteractionId = (
          ExplorationStatesService.getInteractionIdMemento(stateName));
        var stateAnswerGroups = (
          ExplorationStatesService.getInteractionAnswerGroupsMemento(
            stateName));
        var stateDefaultOutcome = (
          ExplorationStatesService.getInteractionDefaultOutcomeMemento(
            stateName));
        var stateHints = ExplorationStatesService.getHintsMemento(stateName);
        var stateSolution = (
          ExplorationStatesService.getSolutionMemento(stateName));

        _checkAndUpdateList(stateName, stateContent);
        // This is used to prevent looking up for other parts of state when the
        // interaction is linear or terminal, as of now we do not delete
        // interaction.hints when a user deletes interaction.
        if (!stateInteractionId ||
        INTERACTION_SPECS[stateInteractionId].is_linear ||
        INTERACTION_SPECS[stateInteractionId].is_terminal) {
          break;
        }
        stateAnswerGroups.forEach(function(answerGroup) {
          _checkAndUpdateList(stateName, answerGroup.outcome.feedback);
        });

        if (stateDefaultOutcome) {
          _checkAndUpdateList(stateName, stateDefaultOutcome.feedback);
        }

        stateHints.forEach(function(hint) {
          _checkAndUpdateList(stateName, hint.hintContent);
        });

        if (stateSolution) {
          _checkAndUpdateList(stateName, stateSolution.explanation);
        }
      }
    };
    return {
      init: function() {
        _init();
      },
      getNotRequiredContentIdList: function(stateName) {
        return angular.copy(stateToUnnecessaryContentIdList[stateName]);
      },
      isNotRequired: function(stateName, contentId) {
        return (
          stateToUnnecessaryContentIdList[stateName].indexOf(contentId) >= 0);
      }
    };
  }
]);
