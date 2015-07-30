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
 * @fileoverview Controllers for the graphical state editor.
 *
 * @author sll@google.com (Sean Lip)
 */

oppia.controller('StateEditor', [
  '$scope', '$rootScope', 'editorContextService', 'changeListService',
  'editabilityService', 'explorationStatesService', 'stateInteractionIdService',
  'INTERACTION_SPECS',
  function(
    $scope, $rootScope, editorContextService, changeListService,
    editabilityService, explorationStatesService, stateInteractionIdService,
    INTERACTION_SPECS) {

  $scope.STATE_CONTENT_SCHEMA = {
    type: 'html'
  };

  $scope.isCurrentStateTerminal = false;
  $scope.isInteractionIdSet = false;
  $scope.isInteractionShown = false;

  $scope.$on('refreshStateEditor', function() {
    $scope.initStateEditor();
  });

  $scope.$on('onInteractionIdChanged', function(evt, newInteractionId) {
    $scope.isInteractionIdSet = Boolean(newInteractionId);
    $scope.isCurrentStateTerminal = (
      $scope.isInteractionIdSet && INTERACTION_SPECS[
        newInteractionId].is_terminal);
  });

  $scope.initStateEditor = function() {
    $scope.stateName = editorContextService.getActiveStateName();

    var stateData = explorationStatesService.getState($scope.stateName);
    $scope.content = stateData.content;

    // This should only be non-null when the content editor is open.
    $scope.contentMemento = null;

    if ($scope.stateName && stateData) {
      $rootScope.$broadcast('stateEditorInitialized', stateData);
      $scope.isInteractionIdSet = Boolean(stateData.interaction.id);
      $scope.isCurrentStateTerminal = (
        $scope.isInteractionIdSet &&
        INTERACTION_SPECS[stateData.interaction.id].is_terminal);
      }

    if ($scope.content[0].value || stateData.interaction.id) {
      $scope.isInteractionShown = true;
    }

    $rootScope.loadingMessage = '';
  };

  $scope.openStateContentEditor = function() {
    if (editabilityService.isEditable()) {
      $scope.contentMemento = angular.copy($scope.content);
    }
  };

  $scope.saveTextContent = function() {
    if ($scope.contentMemento !== null && !angular.equals($scope.contentMemento, $scope.content)) {
      changeListService.editStateProperty(
        editorContextService.getActiveStateName(), 'content',
        angular.copy($scope.content), angular.copy($scope.contentMemento));

      var _stateData = explorationStatesService.getState(
        editorContextService.getActiveStateName());
      _stateData.content = angular.copy($scope.content);
      explorationStatesService.setState(
        editorContextService.getActiveStateName(), _stateData);
    }
    $scope.contentMemento = null;
  };

  $scope.$on('externalSave', function() {
    $scope.saveTextContent();
  });

  $scope.onSaveContentButtonClicked = function() {
    $scope.saveTextContent();
    // Show the interaction when the text content is saved, even if no content
    // is entered.
    $scope.isInteractionShown = true;
  };

  $scope.cancelEdit = function() {
     var _stateData = explorationStatesService.getState(
       editorContextService.getActiveStateName());
     $scope.content = angular.copy(_stateData.content);
     $scope.contentMemento = null;
  };
}]);


// A service that, given an exploration ID and state name, determines all of the
// answers which do not have certain classification and are not currently used
// as part of any fuzzy rule training models.
oppia.factory('trainingDataService', ['$rootScope', '$http', 'responsesService',
    'FUZZY_RULE_TYPE', 'DEFAULT_FUZZY_RULE',
    function($rootScope, $http, responsesService, FUZZY_RULE_TYPE,
      DEFAULT_FUZZY_RULE) {

  var _servicedTrainingDataAnswers = [];
  var _servicedTrainingDataCounts = [];

  // Attempts to remove a given answer from a list of trained answers. This
  // function returns the index of the answer that was removed if it was
  // successfully removed from the training data, or -1 if otherwise.
  var _removeAnswerFromTrainingData = function(answer, trainingData) {
    var index = trainingData.indexOf(answer);
    if (index != -1) {
      trainingData.splice(index, 1);
    }
    return index;
  };

  // This removes any occurrences of the answer from any training data inputs or
  // the confirmed unclassified answer list. It also removes the answer from the
  // training data being presented to the user so that it does not show up
  // again.
  var _removeAnswer = function(answer) {
    var answerGroups = responsesService.getAnswerGroups();
    var confirmedUnclassifiedAnswers = (
      responsesService.getConfirmedUnclassifiedAnswers());
    var updatedAnswerGroups = false;
    var updatedConfirmedUnclassifiedAnswers = false;

    // Guarantee uniqueness in all answer groups.
    for (var i = 0; i < answerGroups.length; i++) {
      var answerGroup = answerGroups[i];
      var ruleSpecs = answerGroup.rule_specs;
      var trainingData = null;
      var fuzzyRuleIndex = -1;
      for (var j = 0; j < ruleSpecs.length; j++) {
        var ruleSpec = ruleSpecs[j];
        if (ruleSpec.rule_type == FUZZY_RULE_TYPE) {
          trainingData = ruleSpec.inputs.training_data;
          fuzzyRuleIndex = j;
          break;
        }
      }
      if (trainingData &&
          _removeAnswerFromTrainingData(answer, trainingData) != -1) {
        if (trainingData.length == 0 && ruleSpecs.length > 1) {
          // If the last of the training data for a fuzzy rule has been removed
          // and the fuzzy rule is not the only rule in the group, remove the
          // rule since it is no longer doing anything.
          ruleSpecs.splice(fuzzyRuleIndex, 1);
        }
        updatedAnswerGroups = true;
      }
    }

    // Guarantee uniqueness in the confirmed unclassified answers.
    updatedConfirmedUnclassifiedAnswers = _removeAnswerFromTrainingData(
      answer, confirmedUnclassifiedAnswers);

    if (updatedAnswerGroups) {
      responsesService.save(answerGroups, responsesService.getDefaultOutcome());
    }

    if (updatedConfirmedUnclassifiedAnswers) {
      responsesService.updateConfirmedUnclassifiedAnswers(
        confirmedUnclassifiedAnswers);
    }

    var index = _removeAnswerFromTrainingData(
      answer, _servicedTrainingDataAnswers);
    if (index != -1) {
      _servicedTrainingDataCounts.splice(index, 1);
      $rootScope.$broadcast('updatedTrainingData');
    }
  };

  var _getOutcomeSummary = function(stateName, outcome) {
    var summary = '';
    if (outcome.feedback.length > 0) {
      summary += outcome.feedback[0];
    } else {
      summary += '<em>(No feedback)</em><br>';
    }
    summary += '<br><span style="float: right;">→ ';
    if (outcome.dest != stateName) {
      summary += outcome.dest;
    } else {
      summary += '<em>(try again)</em>';
    }
    summary += '</span>';
    return summary;
  };

  return {
    initializeTrainingData: function(explorationId, stateName) {
      var trainingDataUrl = '/createhandler/training_data/' + explorationId +
        '/' + encodeURIComponent(stateName);
      $http.get(trainingDataUrl).success(function(result) {
        var unhandledAnswers = result['unhandled_answers'];
        _servicedTrainingDataAnswers = [];
        _servicedTrainingDataCounts = [];
        for (var i = 0; i < unhandledAnswers.length; i++) {
          var unhandledAnswer = unhandledAnswers[i];
          _servicedTrainingDataAnswers.push(unhandledAnswer.value);
          _servicedTrainingDataCounts.push(unhandledAnswer.count);
        }
        $rootScope.$broadcast('updatedTrainingData');
        console.debug('Received training data: ', _servicedTrainingDataAnswers);
      });
    },

    getTrainingDataAnswers: function() {
      return _servicedTrainingDataAnswers;
    },

    getTrainingDataCounts: function() {
      return _servicedTrainingDataCounts;
    },

    getAllPotentialFeedback: function(state, stateName) {
      var feedback = [];
      var interaction = state.interaction;

      for (var i = 0; i < interaction.answer_groups.length; i++) {
        feedback.push(_getOutcomeSummary(
          stateName, interaction.answer_groups[i].outcome));
      }

      if (interaction.default_outcome) {
        var outcome = interaction.default_outcome;
        feedback.push(_getOutcomeSummary(
          stateName, interaction.default_outcome));
      }

      return feedback;
    },

    trainAnswerGroup: function(answerGroupIndex, answer) {
      _removeAnswer(answer);

      var answerGroup = responsesService.getAnswerGroup(answerGroupIndex);
      var rules = answerGroup.rule_specs;

      // Ensure the answer group has a fuzzy rule.
      var fuzzyRule = null;
      for (var i = 0; i < rules.length; i++) {
        var rule = rules[i];
        if (rule.rule_type == FUZZY_RULE_TYPE) {
          fuzzyRule = rule;
          break;
        }
      }
      if (!fuzzyRule) {
        // Create new fuzzy rule for classification. All fuzzy rules should
        // match this schema.
        fuzzyRule = angular.copy(DEFAULT_FUZZY_RULE);
        rules.push(fuzzyRule);
      }

      // Train the rule to include this answer, but only if it's not already in
      // the training data.
      if (fuzzyRule.inputs.training_data.indexOf(answer) == -1) {
        fuzzyRule.inputs.training_data.push(answer);
      }

      responsesService.updateAnswerGroup(answerGroupIndex, {'rules': rules});
    },

    trainDefaultResponse: function(answer) {
      _removeAnswer(answer);

      var confirmedUnclassifiedAnswers = (
        responsesService.getConfirmedUnclassifiedAnswers());

      if (confirmedUnclassifiedAnswers.indexOf(answer) == -1) {
        confirmedUnclassifiedAnswers.push(answer);
      }

      responsesService.updateConfirmedUnclassifiedAnswers(
        confirmedUnclassifiedAnswers);
    }
  };
}]);

oppia.directive('trainingPanel', [function() {
  return {
    restrict: 'E',
    scope: {
      answer: '=',
      answerFeedback: '=',
      answerOutcomeDest: '=',
      classification: '=',
      onFinishTraining: '&'
    },
    templateUrl: 'teaching/trainingPanel',
    controller: [
      '$scope', 'oppiaExplorationHtmlFormatterService', 'editorContextService',
      'explorationStatesService', 'trainingDataService', 'responsesService',
      'stateInteractionIdService', 'stateCustomizationArgsService',
      function($scope, oppiaExplorationHtmlFormatterService,
          editorContextService, explorationStatesService, trainingDataService,
          responsesService, stateInteractionIdService,
          stateCustomizationArgsService) {
        $scope.changingFeedbackIndex = false;
        $scope.addingNewResponse = false;

        var _stateName = editorContextService.getActiveStateName();
        var _state = explorationStatesService.getState(_stateName);
        $scope.allFeedback = trainingDataService.getAllPotentialFeedback(
          _state, _stateName);

        // Use the multiple choice interaction to select the feedback that
        // should be used for a particular answer.
        var _customizationArgs = {
          'choices': {
            'value': $scope.allFeedback
          }
        };
        $scope.inputTemplate = (
          oppiaExplorationHtmlFormatterService.getInteractionHtml(
            'MultipleChoiceInput', _customizationArgs, 'trainOppiaInput'));

        var _updateAnswerTemplate = function() {
          $scope.answerTemplate = (
            oppiaExplorationHtmlFormatterService.getAnswerHtml(
              $scope.answer, stateInteractionIdService.savedMemento,
              stateCustomizationArgsService.savedMemento));
        };
        _updateAnswerTemplate();
        $scope.$watch('answer', _updateAnswerTemplate);

        $scope.beginChangingFeedbackIndex = function() {
          $scope.changingFeedbackIndex = true;
        };

        $scope.beginAddingNewResponse = function() {
          $scope.classification.newOutcome = {
            'dest': editorContextService.getActiveStateName(),
            'feedback': [''],
            'param_changes': []
          };
          $scope.addingNewResponse = true;
        };

        $scope.confirmFeedbackIndex = function(index) {
          $scope.classification.feedbackIndex = index;

          if (index == responsesService.getAnswerGroupCount()) {
            trainingDataService.trainDefaultResponse($scope.answer);
          } else {
            trainingDataService.trainAnswerGroup(index, $scope.answer);
          }

          $scope.onFinishTraining();
        };
        $scope.confirmNewFeedback = function() {
          if ($scope.classification.newOutcome) {
            // Create a new answer group with the given feedback.
            var answerGroups = responsesService.getAnswerGroups();
            answerGroups.push({
              'rule_specs': [],
              'outcome': angular.copy($scope.classification.newOutcome)
            });
            responsesService.save(
              answerGroups, responsesService.getDefaultOutcome());

            // Train the group with the answer.
            var index = responsesService.getAnswerGroupCount() - 1;
            trainingDataService.trainAnswerGroup(index, $scope.answer);
          }

          $scope.onFinishTraining();
        };

        // Use confirmFeedbackIndex to submit the MultipleChoice interaction.
        // Note that this is based on MultipleChoice submitting the selected
        // index, rather than the text of an answer.
        // TODO(bhenning): This needs to be changed when MultipleChoice no
        // longer refers to choices by their index.
        $scope.submitAnswer = $scope.confirmFeedbackIndex;
      }
    ]
  };
}]);
