// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directives for the answer group, feedback, and outcome editors.
 *
 * @author bhenning@google.com (Ben Henning)
 */

oppia.directive('answerGroupEditor', [function() {
  return {
    restrict: 'E',
    scope: {
      rules: '=',
      outcome: '=',
      onSaveAnswerGroupFeedback: '&',
      onSaveAnswerGroupRules: '&',
      onSaveAnswerGroupDest: '&',
      isEditable: '='
    },
    templateUrl: 'inline/answer_group_editor',
    controller: [
      '$scope', 'stateInteractionIdService', 'responsesService',
      'editorContextService', 'routerService', 'warningsData',
      'INTERACTION_SPECS', 'FUZZY_RULE_TYPE',
      function(
        $scope, stateInteractionIdService, responsesService,
        editorContextService, routerService, warningsData, INTERACTION_SPECS,
        FUZZY_RULE_TYPE) {

    $scope.rulesMemento = null;
    $scope.outcomeFeedbackMemento = null;
    $scope.outcomeDestMemento = null;

    $scope.feedbackEditorIsOpen = false;
    $scope.destinationEditorIsOpen = false;
    $scope.activeRuleIndex = responsesService.getActiveRuleIndex();
    $scope.editAnswerGroupForm = {};

    $scope.getAnswerChoices = function() {
      return responsesService.getAnswerChoices();
    };
    $scope.answerChoices = $scope.getAnswerChoices();

    // Updates answer choices when the interaction requires it -- for example,
    // the rules for multiple choice need to refer to the multiple choice
    // interaction's customization arguments.
    // TODO(sll): Remove the need for this watcher, or make it less ad hoc.
    $scope.$on('updateAnswerChoices', function(evt, newAnswerChoices) {
      $scope.answerChoices = $scope.getAnswerChoices();
    });

    $scope.getCurrentInteractionId = function() {
      return stateInteractionIdService.savedMemento;
    };

    $scope.openFeedbackEditor = function() {
      if ($scope.isEditable) {
        $scope.outcomeFeedbackMemento = angular.copy($scope.outcome.feedback);
        $scope.feedbackEditorIsOpen = true;
        if ($scope.outcome.feedback.length === 0) {
          $scope.outcome.feedback.push('');
        }
      }
    };

    $scope.openDestinationEditor = function() {
      if ($scope.isEditable) {
        $scope.outcomeDestMemento = angular.copy($scope.outcome.dest);
        $scope.destinationEditorIsOpen = true;
      }
    };

    $scope.saveThisFeedback = function() {
      $scope.$broadcast('saveOutcomeFeedbackDetails');
      $scope.feedbackEditorIsOpen = false;
      $scope.outcomeFeedbackMemento = null;
      $scope.onSaveAnswerGroupFeedback();
    };

    $scope.saveThisDestination = function() {
      $scope.$broadcast('saveOutcomeDestDetails');
      $scope.destinationEditorIsOpen = false;
      $scope.outcomeDestMemento = null;
      $scope.onSaveAnswerGroupDest();
    };

    $scope.cancelThisFeedbackEdit = function() {
      $scope.outcome.feedback = angular.copy($scope.outcomeFeedbackMemento);
      $scope.outcomeFeedbackMemento = null;
      $scope.feedbackEditorIsOpen = false;
    };

    $scope.cancelThisDestinationEdit = function() {
      $scope.outcome.dest = angular.copy($scope.outcomeDestMemento);
      $scope.outcomeDestMemento = null;
      $scope.destinationEditorIsOpen = false;
    };

    $scope.$on('externalSave', function() {
      if ($scope.feedbackEditorIsOpen &&
          $scope.editAnswerGroupForm.editFeedbackForm.$valid) {
        $scope.saveThisFeedback();
      }
      if ($scope.destinationEditorIsOpen &&
          $scope.editAnswerGroupForm.editDestForm.$valid) {
        $scope.saveThisDestination();
      }
      if ($scope.isRuleEditorOpen()) {
        $scope.saveRules();
      }
    });

    var getDefaultInputValue = function(varType) {
      // TODO(bhenning): Typed objects in the backend should be required to
      // provide a default value specific for their type.
      switch (varType) {
        default:
        case 'Null':
          return null;
        case 'Boolean':
          return false;
        case 'Real':
        case 'Int':
        case 'NonnegativeInt':
          return 0;
        case 'UnicodeString':
        case 'NormalizedString':
        case 'MathLatexString':
        case 'Html':
        case 'SanitizedUrl':
        case 'Filepath':
        case 'LogicErrorCategory':
          return '';
        case 'CodeEvaluation':
          return {
            'code': getDefaultInputValue('UnicodeString'),
            'output': getDefaultInputValue('UnicodeString'),
            'evaluation': getDefaultInputValue('UnicodeString'),
            'error': getDefaultInputValue('UnicodeString')
          };
        case 'CoordTwoDim':
          return [getDefaultInputValue('Real'), getDefaultInputValue('Real')];
        case 'ListOfUnicodeString':
        case 'SetOfUnicodeString':
        case 'SetOfHtmlString':
          return [];
        case 'MusicPhrase':
          return [];
        case 'CheckedProof':
          return {
            'assumptions_string': getDefaultInputValue('UnicodeString'),
            'target_string': getDefaultInputValue('UnicodeString'),
            'proof_string': getDefaultInputValue('UnicodeString'),
            'correct': getDefaultInputValue('Boolean')
          };
        case 'LogicQuestion':
          return {
            'top_kind_name': getDefaultInputValue('UnicodeString'),
            'top_operator_name': getDefaultInputValue('UnicodeString'),
            'arguments': [],
            'dummies': []
          };
        case 'Graph':
          return {
            'vertices': [],
            'edges': [],
            'isLabeled': getDefaultInputValue('Boolean'),
            'isDirected': getDefaultInputValue('Boolean'),
            'isWeighted': getDefaultInputValue('Boolean')
          };
        case 'NormalizedRectangle2D':
          return [
            [getDefaultInputValue('Real'), getDefaultInputValue('Real')],
            [getDefaultInputValue('Real'), getDefaultInputValue('Real')]];
        case 'ImageRegion':
          return {
            'regionType': getDefaultInputValue('UnicodeString'),
            'area': getDefaultInputValue('NormalizedRectangle2D')
          };
        case 'ImageWithRegions':
          return {
            'imagePath': getDefaultInputValue('Filepath'),
            'labeledRegions': []
          };
        case 'ClickOnImage':
          return {
            'clickPosition': [
              getDefaultInputValue('Real'), getDefaultInputValue('Real')],
            'clickedRegions': []
          };
      }
    };

    $scope.addNewRule = function() {
      // Build an initial blank set of inputs for the initial rule.
      var interactionId = $scope.getCurrentInteractionId();
      var ruleDescriptions = INTERACTION_SPECS[interactionId].rule_descriptions;
      var ruleTypes = Object.keys(ruleDescriptions);
      var ruleType = null;
      for (var i = 0; i < ruleTypes.length; i++) {
        if (ruleTypes[i] != FUZZY_RULE_TYPE) {
          ruleType = ruleTypes[i];
          break;
        }
      }
      if (!ruleType) {
        // This should never happen. An interaction must have more than just a
        // fuzzy rule, as verified in a backend test suite:
        //   extensions.interactions.base_test.InteractionUnitTests.
        return;
      }
      var description = ruleDescriptions[ruleType];

      var PATTERN = /\{\{\s*(\w+)\s*(\|\s*\w+\s*)?\}\}/;
      var inputs = {};
      while (description.match(PATTERN)) {
        var varName = description.match(PATTERN)[1];
        var varType = description.match(PATTERN)[2];
        if (varType) {
          varType = varType.substring(1);
        }

        inputs[varName] = getDefaultInputValue(varType);
        description = description.replace(PATTERN, ' ');
      }

      // Save the state of the rules before adding a new one (in case the user
      // cancels the addition).
      $scope.rulesMemento = angular.copy($scope.rules);

      // TODO(bhenning): Should use functionality in ruleEditor.js, but move it
      // to responsesService in StateResponses.js to properly form a new rule.
      $scope.rules.push({
        'rule_type': ruleType,
        'inputs': inputs,
      });
      $scope.changeActiveRuleIndex($scope.rules.length - 1);
    };

    $scope.deleteRule = function(index) {
      $scope.rules.splice(index, 1);
      $scope.saveRules();

      if ($scope.rules.length == 0) {
        warningsData.addWarning(
          'All answer groups must have at least one rule.');
      }
    };

    $scope.cancelActiveRuleEdit = function() {
      $scope.rules.splice(0, $scope.rules.length);
      for (var i = 0; i < $scope.rulesMemento.length; i++) {
        $scope.rules.push($scope.rulesMemento[i]);
      }
      $scope.saveRules();
    };

    $scope.saveRules = function() {
      $scope.changeActiveRuleIndex(-1);
      $scope.rulesMemento = null;
      $scope.onSaveAnswerGroupRules();
    };

    $scope.changeActiveRuleIndex = function(newIndex) {
      responsesService.changeActiveRuleIndex(newIndex);
      $scope.activeRuleIndex = responsesService.getActiveRuleIndex();
      $scope.onSaveAnswerGroupRules();
    };

    $scope.openRuleEditor = function(index) {
      if (!$scope.isEditable) {
        // The rule editor may not be opened in a read-only editor view.
        return;
      }
      $scope.rulesMemento = angular.copy($scope.rules);
      $scope.changeActiveRuleIndex(index);
    };

    $scope.isRuleEditorOpen = function() {
      return $scope.activeRuleIndex !== -1;
    };

    $scope.isSelfLoop = function(outcome) {
      return (
        outcome && outcome.dest === editorContextService.getActiveStateName());
    };

    $scope.isSelfLoopWithNoFeedback = function(outcome) {
      if (!outcome) {
        return false;
      }

      var hasFeedback = false;
      for (var i = 0; i < outcome.feedback.length; i++) {
        if (outcome.feedback[i]) {
          hasFeedback = true;
          break;
        }
      }

      return $scope.isSelfLoop(outcome) && !hasFeedback;
    };

    $scope.navigateToOutcomeDest = function() {
      routerService.navigateToMainTab($scope.outcome.dest);
    };

    $scope.$on('onInteractionIdChanged', function(evt, newInteractionId) {
      if ($scope.feedbackEditorIsOpen &&
          $scope.editAnswerGroupForm.editFeedbackForm.$valid) {
        $scope.saveThisFeedback();
      }
      if ($scope.destinationEditorIsOpen &&
          $scope.editAnswerGroupForm.editDestForm.$valid) {
        $scope.saveThisDestination();
      }
      if ($scope.isRuleEditorOpen()) {
        $scope.saveRules();
      }
      $scope.$broadcast('updateAnswerGroupInteractionId');
      $scope.answerChoices = $scope.getAnswerChoices();
    });
  }]};
}]);

oppia.directive('outcomeFeedbackEditor', [function() {
  return {
    restrict: 'E',
    scope: {
      outcome: '='
    },
    templateUrl: 'rules/outcomeFeedbackEditor',
    controller: ['$scope', function($scope) {
      $scope.OUTCOME_FEEDBACK_SCHEMA = {type: 'html'};

      $scope.$on('saveOutcomeFeedbackDetails', function() {
        // Remove null feedback. If the first element of the feedback is null or
        // empty, clear the entire feedback array. This is so that if the first
        // feedback is removed all feedback is thereby removed. Only the first
        // feedback is usable and editable. This also preserves all feedback
        // entries after the first if the first is non-empty.
        var nonemptyFeedback = [];
        for (var i = 0; i < $scope.outcome.feedback.length; i++) {
          var feedbackStr = $scope.outcome.feedback[i];
          if (feedbackStr) {
            feedbackStr = feedbackStr.trim();
          }
          if (feedbackStr) {
            nonemptyFeedback.push(feedbackStr);
          }
          if (!feedbackStr && i == 0) {
            // If the first feedback is empty, copy no more feedback after.
            break;
          }
        }
        $scope.outcome.feedback = nonemptyFeedback;
      });
    }]
  };
}]);

oppia.directive('outcomeDestinationEditor', [function() {
  return {
    restrict: 'E',
    scope: {
      outcome: '='
    },
    templateUrl: 'rules/outcomeDestinationEditor',
    controller: [
      '$scope', 'editorContextService', 'explorationStatesService',
      'stateGraphArranger', 'PLACEHOLDER_OUTCOME_DEST', 'focusService',
      function(
          $scope, editorContextService, explorationStatesService,
          stateGraphArranger, PLACEHOLDER_OUTCOME_DEST, focusService) {

        $scope.$on('saveOutcomeDestDetails', function() {
          // Create new state if specified.
          if ($scope.outcome.dest == PLACEHOLDER_OUTCOME_DEST) {
            var newStateName = $scope.outcome.newStateName;
            $scope.outcome.dest = newStateName;
            delete $scope.outcome['newStateName'];

            explorationStatesService.addState(newStateName, null);
          }
        });

        $scope.onDestSelectorChange = function() {
          if ($scope.outcome.dest === PLACEHOLDER_OUTCOME_DEST) {
            focusService.setFocus('newStateNameInputField');
          }
        };

        $scope.isCreatingNewState = function(outcome) {
          return outcome.dest == PLACEHOLDER_OUTCOME_DEST;
        };

        $scope.newStateNamePattern = /^[a-zA-Z0-9.\s-]+$/;
        $scope.destChoices = [];
        $scope.$watch(explorationStatesService.getStates, function(newValue) {
          var _currentStateName = editorContextService.getActiveStateName();

          // This is a list of objects, each with an ID and name. These
          // represent all states, as well as an option to create a
          // new state.
          $scope.destChoices = [{
            id: _currentStateName,
            text: '(try again)'
          }];

          // Arrange the remaining states based on their order in the state graph.
          var lastComputedArrangement = stateGraphArranger.getLastComputedArrangement();
          var allStateNames = Object.keys(explorationStatesService.getStates());

          var maxDepth = 0;
          var maxOffset = 0;
          for (var stateName in lastComputedArrangement) {
            maxDepth = Math.max(
              maxDepth, lastComputedArrangement[stateName].depth);
            maxOffset = Math.max(
              maxOffset, lastComputedArrangement[stateName].offset);
          }

          // Higher scores come later.
          var allStateScores = {};
          var unarrangedStateCount = 0;
          for (var i = 0; i < allStateNames.length; i++) {
            var stateName = allStateNames[i];
            if (lastComputedArrangement.hasOwnProperty(stateName)) {
              allStateScores[stateName] = (
                lastComputedArrangement[stateName].depth * (maxOffset + 1) +
                lastComputedArrangement[stateName].offset);
            } else {
              // States that have just been added in the rule 'create new'
              // modal are not yet included as part of lastComputedArrangement,
              // so we account for them here.
              allStateScores[stateName] = (
                (maxDepth + 1) * (maxOffset + 1) + unarrangedStateCount);
              unarrangedStateCount++;
            }
          }

          var stateNames = allStateNames.sort(function(a, b) {
            return allStateScores[a] - allStateScores[b];
          });

          for (var i = 0; i < stateNames.length; i++) {
            if (stateNames[i] !== _currentStateName) {
              $scope.destChoices.push({
                id: stateNames[i],
                text: stateNames[i]
              });
            }
          }

          $scope.destChoices.push({
            id: PLACEHOLDER_OUTCOME_DEST,
            text: 'A New Card Called...'
          });
        }, true);
      }
    ]
  };
}]);
