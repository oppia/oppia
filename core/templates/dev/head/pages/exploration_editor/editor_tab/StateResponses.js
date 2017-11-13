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
 * @fileoverview Controllers and filters for responses corresponding
 * to a state's interaction and answer groups.
 */

oppia.controller('StateResponses', [
  '$scope', '$rootScope', '$modal', '$filter', 'stateInteractionIdService',
  'editorContextService', 'AlertsService', 'ResponsesService', 'RouterService',
  'ExplorationContextService', 'TrainingDataService',
  'stateCustomizationArgsService', 'PLACEHOLDER_OUTCOME_DEST',
  'INTERACTION_SPECS', 'UrlInterpolationService', 'AnswerGroupObjectFactory',
  function(
      $scope, $rootScope, $modal, $filter, stateInteractionIdService,
      editorContextService, AlertsService, ResponsesService, RouterService,
      ExplorationContextService, TrainingDataService,
      stateCustomizationArgsService, PLACEHOLDER_OUTCOME_DEST,
      INTERACTION_SPECS, UrlInterpolationService, AnswerGroupObjectFactory) {
    $scope.editorContextService = editorContextService;

    $scope.dragDotsImgUrl = UrlInterpolationService.getStaticImageUrl(
      '/general/drag_dots.png');

    var _initializeTrainingData = function() {
      var explorationId = ExplorationContextService.getExplorationId();
      var currentStateName = editorContextService.getActiveStateName();
      TrainingDataService.initializeTrainingData(
        explorationId, currentStateName);
    };

    $scope.suppressDefaultAnswerGroupWarnings = function() {
      var interactionId = $scope.getCurrentInteractionId();
      var answerGroups = ResponsesService.getAnswerGroups();
      // This array contains the text of each of the possible answers
      // for the interaction.
      var answerChoices = [];
      var customizationArgs = stateCustomizationArgsService.savedMemento;
      var handledAnswersArray = [];

      if (interactionId === 'MultipleChoiceInput') {
        var numChoices = $scope.getAnswerChoices().length;
        var choiceIndices = [];
        // Collect all answers which have been handled by at least one
        // answer group.
        for (var i = 0; i < answerGroups.length; i++) {
          for (var j = 0; j < answerGroups[i].rules.length; j++) {
            handledAnswersArray.push(answerGroups[i].rules[j].inputs.x);
          }
        }
        for (var i = 0; i < numChoices; i++) {
          choiceIndices.push(i);
        }
        // We only suppress the default warning if each choice index has
        // been handled by at least one answer group.
        return choiceIndices.every(function(choiceIndex) {
          return handledAnswersArray.indexOf(choiceIndex) !== -1;
        });
      } else if (interactionId === 'ItemSelectionInput') {
        var maxSelectionCount = (
            customizationArgs.maxAllowableSelectionCount.value);
        if (maxSelectionCount === 1) {
          var numChoices = $scope.getAnswerChoices().length;
          // This array contains a list of booleans, one for each answer choice.
          // Each boolean is true if the corresponding answer has been
          // covered by at least one rule, and false otherwise.
          handledAnswersArray = [];
          for (var i = 0; i < numChoices; i++) {
            handledAnswersArray.push(false);
            answerChoices.push($scope.getAnswerChoices()[i].val);
          }

          var answerChoiceToIndex = {};
          answerChoices.forEach(function(answerChoice, choiceIndex) {
            answerChoiceToIndex[answerChoice] = choiceIndex;
          });

          answerGroups.forEach(function(answerGroup) {
            var rules = answerGroup.rules;
            rules.forEach(function(rule) {
              var ruleInputs = rule.inputs.x;
              ruleInputs.forEach(function(ruleInput) {
                var choiceIndex = answerChoiceToIndex[ruleInput];
                if (rule.type === 'Equals' ||
                    rule.type === 'ContainsAtLeastOneOf') {
                  handledAnswersArray[choiceIndex] = true;
                } else if (rule.type ===
                  'DoesNotContainAtLeastOneOf') {
                  for (var i = 0; i < handledAnswersArray.length; i++) {
                    if (i !== choiceIndex) {
                      handledAnswersArray[i] = true;
                    }
                  }
                }
              });
            });
          });

          var areAllChoicesCovered = handledAnswersArray.every(
            function(handledAnswer) {
              return handledAnswer;
            });
          // We only suppress the default warning if each choice text has
          // been handled by at least one answer group, based on rule type.
          return areAllChoicesCovered;
        }
      }
    };

    $scope.isSelfLoopWithNoFeedback = function(outcome) {
      var isSelfLoop = function(outcome) {
        return (
          outcome &&
          outcome.dest === editorContextService.getActiveStateName());
      };
      if (!outcome) {
        return false;
      }
      var hasFeedback = outcome.feedback.some(function(feedbackItem) {
        return Boolean(feedbackItem);
      });
      return isSelfLoop(outcome) && !hasFeedback;
    };

    $scope.changeActiveAnswerGroupIndex = function(newIndex) {
      $rootScope.$broadcast('externalSave');
      ResponsesService.changeActiveAnswerGroupIndex(newIndex);
      $scope.activeAnswerGroupIndex = (
        ResponsesService.getActiveAnswerGroupIndex());
    };

    $scope.getCurrentInteractionId = function() {
      return stateInteractionIdService.savedMemento;
    };

    $scope.isCurrentInteractionTrainable = function() {
      var interactionId = $scope.getCurrentInteractionId();
      return (
        interactionId &&
        INTERACTION_SPECS[interactionId].is_trainable);
    };

    $scope.isCreatingNewState = function(outcome) {
      return outcome && outcome.dest === PLACEHOLDER_OUTCOME_DEST;
    };

    // This returns false if the current interaction ID is null.
    $scope.isCurrentInteractionLinear = function() {
      var interactionId = $scope.getCurrentInteractionId();
      return interactionId && INTERACTION_SPECS[interactionId].is_linear;
    };

    $scope.isLinearWithNoFeedback = function(outcome) {
      // Returns false if current interaction is linear and has no feedback
      if (!outcome) {
        return false;
      }
      var hasFeedback = outcome.feedback.some(function(feedbackItem) {
        return Boolean(feedbackItem);
      });
      return $scope.isCurrentInteractionLinear() && !hasFeedback;
    };

    $scope.getOutcomeTooltip = function(outcome) {
      // Outcome tooltip depends on whether feedback is displayed
      if ($scope.isLinearWithNoFeedback(outcome)) {
        return 'Please direct the learner to a different card.';
      } else {
        return 'Please give Oppia something useful to say,' +
               ' or direct the learner to a different card.';
      }
    };

    $scope.$on('initializeAnswerGroups', function(evt, data) {
      ResponsesService.init(data);
      $scope.answerGroups = ResponsesService.getAnswerGroups();
      $scope.defaultOutcome = ResponsesService.getDefaultOutcome();

      // If the creator selects an interaction which has only one possible
      // answer, automatically expand the default response. Otherwise, default
      // to having no responses initially selected.
      if ($scope.isCurrentInteractionLinear()) {
        ResponsesService.changeActiveAnswerGroupIndex(0);
      }

      // Initialize training data for these answer groups.
      _initializeTrainingData();

      $scope.activeAnswerGroupIndex = (
        ResponsesService.getActiveAnswerGroupIndex());
      $rootScope.$broadcast('externalSave');
    });

    $scope.$on('onInteractionIdChanged', function(evt, newInteractionId) {
      $rootScope.$broadcast('externalSave');
      ResponsesService.onInteractionIdChanged(newInteractionId, function() {
        $scope.answerGroups = ResponsesService.getAnswerGroups();
        $scope.defaultOutcome = ResponsesService.getDefaultOutcome();

        // Reinitialize training data if the interaction ID is changed.
        _initializeTrainingData();

        $scope.activeAnswerGroupIndex = (
          ResponsesService.getActiveAnswerGroupIndex());
      });

      // Prompt the user to create a new response if it is not a linear or
      // non-terminal interaction and if an actual interaction is specified
      // (versus one being deleted).
      if (newInteractionId &&
          !INTERACTION_SPECS[newInteractionId].is_linear &&
          !INTERACTION_SPECS[newInteractionId].is_terminal) {
        // Open the training interface if the interaction is trainable,
        // otherwise open the answer group modal.
        if (GLOBALS.SHOW_TRAINABLE_UNRESOLVED_ANSWERS &&
            $scope.isCurrentInteractionTrainable()) {
          $scope.openTeachOppiaModal();
        } else {
          $scope.openAddAnswerGroupModal();
        }
      }
    });

    $scope.$on('answerGroupChanged', function() {
      $scope.answerGroups = ResponsesService.getAnswerGroups();
      $scope.defaultOutcome = ResponsesService.getDefaultOutcome();
      $scope.activeAnswerGroupIndex = (
        ResponsesService.getActiveAnswerGroupIndex());
    });

    $scope.$on('updateAnswerChoices', function(evt, newAnswerChoices) {
      ResponsesService.updateAnswerChoices(newAnswerChoices);
    });

    $scope.openTeachOppiaModal = function() {
      AlertsService.clearWarnings();
      $rootScope.$broadcast('externalSave');

      $modal.open({
        templateUrl: 'modals/teachOppia',
        backdrop: false,
        controller: [
          '$scope', '$injector', '$modalInstance',
          'ExplorationHtmlFormatterService',
          'stateInteractionIdService', 'stateCustomizationArgsService',
          'ExplorationContextService', 'editorContextService',
          'explorationStatesService', 'TrainingDataService',
          'AnswerClassificationService', 'FocusManagerService',
          'angularNameService', 'RULE_TYPE_CLASSIFIER',
          function(
              $scope, $injector, $modalInstance,
              ExplorationHtmlFormatterService,
              stateInteractionIdService, stateCustomizationArgsService,
              ExplorationContextService, editorContextService,
              explorationStatesService, TrainingDataService,
              AnswerClassificationService, FocusManagerService,
              angularNameService, RULE_TYPE_CLASSIFIER) {
            var _explorationId = ExplorationContextService.getExplorationId();
            var _stateName = editorContextService.getActiveStateName();
            var _state = explorationStatesService.getState(_stateName);

            $scope.stateContent = _state.content.getHtml();
            $scope.inputTemplate = (
              ExplorationHtmlFormatterService.getInteractionHtml(
                stateInteractionIdService.savedMemento,
                stateCustomizationArgsService.savedMemento,
                'testInteractionInput'));
            $scope.answerTemplate = '';

            $scope.trainingData = [];
            $scope.trainingDataAnswer = '';
            $scope.trainingDataFeedback = '';
            $scope.trainingDataOutcomeDest = '';

            // Retrieve the interaction ID.
            var interactionId = stateInteractionIdService.savedMemento;

            var rulesServiceName =
              angularNameService.getNameOfInteractionRulesService(
                interactionId)

            // Inject RulesService dynamically.
            var rulesService = $injector.get(rulesServiceName);

            // See the training panel directive in StateEditor for an
            // explanation on the structure of this object.
            $scope.classification = {
              answerGroupIndex: 0,
              newOutcome: null
            };

            FocusManagerService.setFocus('testInteractionInput');

            $scope.finishTeaching = function(reopen) {
              $modalInstance.close({
                reopen: reopen
              });
            };

            $scope.submitAnswer = function(answer) {
              $scope.answerTemplate = (
                ExplorationHtmlFormatterService.getAnswerHtml(
                  answer, stateInteractionIdService.savedMemento,
                  stateCustomizationArgsService.savedMemento));

              var classificationResult = (
                AnswerClassificationService.getMatchingClassificationResult(
                  _explorationId, _stateName, _state, answer, true,
                  rulesService));
              var feedback = 'Nothing';
              var dest = classificationResult.outcome.dest;
              if (classificationResult.outcome.feedback.length > 0) {
                feedback = classificationResult.outcome.feedback[0];
              }
              if (dest === _stateName) {
                dest = '<em>(try again)</em>';
              }
              $scope.trainingDataAnswer = answer;
              $scope.trainingDataFeedback = feedback;
              $scope.trainingDataOutcomeDest = dest;

              var answerGroupIndex =
                classificationResult.answerGroupIndex;
              var ruleIndex = classificationResult.ruleIndex;
              if (answerGroupIndex !==
                _state.interaction.answerGroups.length &&
                  _state.interaction.answerGroups[answerGroupIndex]
                    .rules[ruleIndex].type !== RULE_TYPE_CLASSIFIER) {
                $scope.classification.answerGroupIndex = -1;
              } else {
                $scope.classification.answerGroupIndex = (
                  classificationResult.answerGroupIndex);
              }
            };
          }]
      }).result.then(function(result) {
        // Check if the modal should be reopened right away.
        if (result.reopen) {
          $scope.openTeachOppiaModal();
        }
      });
    };

    $scope.openAddAnswerGroupModal = function() {
      AlertsService.clearWarnings();
      $rootScope.$broadcast('externalSave');

      $modal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/exploration_editor/editor_tab/' +
          'add_answer_group_modal_directive.html'),
        // Clicking outside this modal should not dismiss it.
        backdrop: 'static',
        controller: [
          '$scope', '$modalInstance', 'ResponsesService',
          'editorContextService', 'editorFirstTimeEventsService',
          'RuleObjectFactory', 'OutcomeObjectFactory',
          function(
              $scope, $modalInstance, ResponsesService,
              editorContextService, editorFirstTimeEventsService,
              RuleObjectFactory, OutcomeObjectFactory) {
            $scope.feedbackEditorIsOpen = false;
            $scope.openFeedbackEditor = function() {
              $scope.feedbackEditorIsOpen = true;
            };
            $scope.tmpRule = RuleObjectFactory.createNew(null, {});
            $scope.tmpOutcome = OutcomeObjectFactory.createNew(
              editorContextService.getActiveStateName(), [''], []);

            $scope.isSelfLoopWithNoFeedback = function(tmpOutcome) {
              var hasFeedback = false;
              for (var i = 0; i < tmpOutcome.feedback.length; i++) {
                if (tmpOutcome.feedback[i]) {
                  hasFeedback = true;
                  break;
                }
              }

              return (
                tmpOutcome.dest === editorContextService.getActiveStateName() &&
                !hasFeedback);
            };

            $scope.addAnswerGroupForm = {};

            $scope.saveResponse = function(reopen) {
              $scope.$broadcast('saveOutcomeFeedbackDetails');
              $scope.$broadcast('saveOutcomeDestDetails');

              // If the feedback editor is never opened, replace the feedback
              // with an empty array.
              if ($scope.tmpOutcome.feedback.length === 1 &&
                  $scope.tmpOutcome.feedback[0] === '') {
                $scope.tmpOutcome.feedback = [];
              }

              editorFirstTimeEventsService.registerFirstSaveRuleEvent();

              // Close the modal and save it afterwards.
              $modalInstance.close({
                tmpRule: angular.copy($scope.tmpRule),
                tmpOutcome: angular.copy($scope.tmpOutcome),
                reopen: reopen
              });
            };

            $scope.cancel = function() {
              $modalInstance.dismiss('cancel');
              AlertsService.clearWarnings();
            };
          }
        ]
      }).result.then(function(result) {
        // Create a new answer group.
        $scope.answerGroups.push(AnswerGroupObjectFactory.createNew(
          [result.tmpRule], result.tmpOutcome, false));
        ResponsesService.save($scope.answerGroups, $scope.defaultOutcome);
        $scope.changeActiveAnswerGroupIndex($scope.answerGroups.length - 1);

        // After saving it, check if the modal should be reopened right away.
        if (result.reopen) {
          $scope.openAddAnswerGroupModal();
        }
      });
    };

    // When the page is scrolled so that the top of the page is above the
    // browser viewport, there are some bugs in the positioning of the helper.
    // This is a bug in jQueryUI that has not been fixed yet. For more details,
    // see http://stackoverflow.com/q/5791886
    $scope.ANSWER_GROUP_LIST_SORTABLE_OPTIONS = {
      axis: 'y',
      cursor: 'move',
      handle: '.oppia-rule-sort-handle',
      items: '.oppia-sortable-rule-block',
      revert: 100,
      tolerance: 'pointer',
      start: function(e, ui) {
        $rootScope.$broadcast('externalSave');
        $scope.changeActiveAnswerGroupIndex(-1);
        ui.placeholder.height(ui.item.height());
      },
      stop: function() {
        ResponsesService.save($scope.answerGroups, $scope.defaultOutcome);
      }
    };

    $scope.deleteAnswerGroup = function(index, evt) {
      // Prevent clicking on the delete button from also toggling the display
      // state of the answer group.
      evt.stopPropagation();

      AlertsService.clearWarnings();
      $modal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/exploration_editor/editor_tab/' +
          'delete_answer_group_modal_directive.html'),
        backdrop: true,
        controller: [
          '$scope', '$modalInstance', function($scope, $modalInstance) {
            $scope.reallyDelete = function() {
              $modalInstance.close();
            };

            $scope.cancel = function() {
              $modalInstance.dismiss('cancel');
              AlertsService.clearWarnings();
            };
          }
        ]
      }).result.then(function() {
        ResponsesService.deleteAnswerGroup(index);
      });
    };

    $scope.saveActiveAnswerGroupFeedback = function(updatedOutcome) {
      ResponsesService.updateActiveAnswerGroup({
        feedback: updatedOutcome.feedback
      });
    };

    $scope.saveActiveAnswerGroupDest = function(updatedOutcome) {
      ResponsesService.updateActiveAnswerGroup({
        dest: updatedOutcome.dest
      });
    };

    $scope.saveActiveAnswerGroupRules = function(updatedRules) {
      ResponsesService.updateActiveAnswerGroup({
        rules: updatedRules
      });
    };

    $scope.saveDefaultOutcomeFeedback = function(updatedOutcome) {
      ResponsesService.updateDefaultOutcome({
        feedback: updatedOutcome.feedback
      });
    };

    $scope.saveDefaultOutcomeDest = function(updatedOutcome) {
      ResponsesService.updateDefaultOutcome({
        dest: updatedOutcome.dest
      });
    };

    $scope.getAnswerChoices = function() {
      return ResponsesService.getAnswerChoices();
    };

    $scope.isOutcomeLooping = function(outcome) {
      var activeStateName = editorContextService.getActiveStateName();
      return outcome && (outcome.dest === activeStateName);
    };

    $scope.navigateToState = function(stateName) {
      RouterService.navigateToMainTab(stateName);
    };
  }
]);

oppia.filter('summarizeAnswerGroup', [
  '$filter', 'RULE_SUMMARY_WRAP_CHARACTER_COUNT',
  function($filter, RULE_SUMMARY_WRAP_CHARACTER_COUNT) {
    return function(answerGroup, interactionId, answerChoices, shortenRule) {
      var summary = '';
      var outcome = answerGroup.outcome;
      var hasFeedback = outcome.feedback.length > 0 && outcome.feedback[0];

      if (answerGroup.rules) {
        var firstRule = $filter('convertToPlainText')(
          $filter('parameterizeRuleDescription')(
            answerGroup.rules[0], interactionId, answerChoices));
        summary = 'Answer ' + firstRule;

        if (hasFeedback && shortenRule) {
          summary = $filter('wrapTextWithEllipsis')(
            summary, RULE_SUMMARY_WRAP_CHARACTER_COUNT);
        }
        summary = '[' + summary + '] ';
      }

      if (hasFeedback) {
        summary += (
          shortenRule ?
          $filter('truncate')(outcome.feedback[0], 30) :
          $filter('convertToPlainText')(outcome.feedback[0]));
      }
      return summary;
    };
  }
]);

oppia.filter('summarizeDefaultOutcome', [
  '$filter', 'INTERACTION_SPECS', 'RULE_SUMMARY_WRAP_CHARACTER_COUNT',
  function($filter, INTERACTION_SPECS, RULE_SUMMARY_WRAP_CHARACTER_COUNT) {
    return function(
        defaultOutcome, interactionId, answerGroupCount, shortenRule) {
      if (!defaultOutcome) {
        return '';
      }

      var summary = '';
      var feedback = defaultOutcome.feedback;
      var hasFeedback = feedback.length > 0 && feedback[0];

      if (interactionId && INTERACTION_SPECS[interactionId].is_linear) {
        summary = INTERACTION_SPECS[interactionId].default_outcome_heading;
      } else if (answerGroupCount > 0) {
        summary = 'All other answers';
      } else {
        summary = 'All answers';
      }

      if (hasFeedback && shortenRule) {
        summary = $filter('wrapTextWithEllipsis')(
          summary, RULE_SUMMARY_WRAP_CHARACTER_COUNT);
      }
      summary = '[' + summary + '] ';

      if (hasFeedback) {
        summary += $filter('convertToPlainText')(defaultOutcome.feedback[0]);
      }
      return summary;
    };
  }
]);
