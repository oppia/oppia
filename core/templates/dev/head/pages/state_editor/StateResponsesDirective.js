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
 * @fileoverview Directive for managing the state responses in the state editor.
 */
oppia.directive('stateResponses', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        addState: '=',
        onResponsesInitialized: '=',
        onSaveContentIdsToAudioTranslations: '=',
        onSaveInteractionAnswerGroups: '=',
        onSaveInteractionDefaultOutcome: '=',
        navigateToState: '=',
        refreshWarnings: '&'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/state_editor/state_responses_directive.html'),
      controller: [
        '$scope', '$rootScope', '$uibModal', '$filter',
        'StateInteractionIdService', 'AlertsService',
        'ResponsesService', 'ContextService',
        'EditabilityService', 'StateEditorService',
        'StateContentIdsToAudioTranslationsService', 'INTERACTION_SPECS',
        'StateCustomizationArgsService', 'PLACEHOLDER_OUTCOME_DEST',
        'UrlInterpolationService', 'AnswerGroupObjectFactory',
        'RULE_SUMMARY_WRAP_CHARACTER_COUNT', function(
            $scope, $rootScope, $uibModal, $filter,
            StateInteractionIdService, AlertsService,
            ResponsesService, ContextService,
            EditabilityService, StateEditorService,
            StateContentIdsToAudioTranslationsService, INTERACTION_SPECS,
            StateCustomizationArgsService, PLACEHOLDER_OUTCOME_DEST,
            UrlInterpolationService, AnswerGroupObjectFactory,
            RULE_SUMMARY_WRAP_CHARACTER_COUNT) {
          $scope.SHOW_TRAINABLE_UNRESOLVED_ANSWERS = (
            GLOBALS.SHOW_TRAINABLE_UNRESOLVED_ANSWERS);
          $scope.EditabilityService = EditabilityService;
          $scope.stateName = StateEditorService.getActiveStateName();
          $scope.dragDotsImgUrl = UrlInterpolationService.getStaticImageUrl(
            '/general/drag_dots.png');

          var _initializeTrainingData = function() {
            if (StateEditorService.isInQuestionMode()) {
              return;
            }
            var explorationId = ContextService.getExplorationId();
            var currentStateName = $scope.stateName;
          };

          $scope.suppressDefaultAnswerGroupWarnings = function() {
            var interactionId = $scope.getCurrentInteractionId();
            var answerGroups = ResponsesService.getAnswerGroups();
            // This array contains the text of each of the possible answers
            // for the interaction.
            var answerChoices = [];
            var customizationArgs = StateCustomizationArgsService.savedMemento;
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
                // This array contains a list of booleans, one for each answer
                // choice. Each boolean is true if the corresponding answer has
                // been covered by at least one rule, and false otherwise.
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
                // been handled by at least one answer group, based on rule
                // type.
                return areAllChoicesCovered;
              }
            }
          };

          $scope.isSelfLoopWithNoFeedback = function(outcome) {
            if (!outcome) {
              return false;
            }
            return outcome.isConfusing($scope.stateName);
          };

          $scope.isSelfLoopThatIsMarkedCorrect = function(outcome) {
            if (!outcome ||
                !StateEditorService.getCorrectnessFeedbackEnabled()) {
              return false;
            }
            var currentStateName = $scope.stateName;
            return (
              (outcome.dest === currentStateName) &&
              outcome.labelledAsCorrect);
          };

          $scope.changeActiveAnswerGroupIndex = function(newIndex) {
            $rootScope.$broadcast('externalSave');
            ResponsesService.changeActiveAnswerGroupIndex(newIndex);
            $scope.activeAnswerGroupIndex = (
              ResponsesService.getActiveAnswerGroupIndex());
          };

          $scope.getCurrentInteractionId = function() {
            return StateInteractionIdService.savedMemento;
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
            // Returns false if current interaction is linear and has no
            // feedback
            if (!outcome) {
              return false;
            }
            return $scope.isCurrentInteractionLinear() &&
              !outcome.hasNonemptyFeedback();
          };

          $scope.getOutcomeTooltip = function(outcome) {
            if ($scope.isSelfLoopThatIsMarkedCorrect(outcome)) {
              return 'Self-loops should not be labelled as correct.';
            }

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
            // answer, automatically expand the default response. Otherwise,
            // default to having no responses initially selected.
            if ($scope.isCurrentInteractionLinear()) {
              ResponsesService.changeActiveAnswerGroupIndex(0);
            }

            // Initialize training data for these answer groups.
            _initializeTrainingData();

            $scope.activeAnswerGroupIndex = (
              ResponsesService.getActiveAnswerGroupIndex());
            $rootScope.$broadcast('externalSave');
          });

          $scope.$on('onInteractionIdChanged', function(
              evt, newInteractionId) {
            $rootScope.$broadcast('externalSave');
            ResponsesService.onInteractionIdChanged(
              newInteractionId, function(newAnswerGroups, newDefaultOutcome) {
                $scope.onSaveContentIdsToAudioTranslations(
                  angular.copy(
                    StateContentIdsToAudioTranslationsService.displayed));
                $scope.onSaveInteractionDefaultOutcome(newDefaultOutcome);
                $scope.onSaveInteractionAnswerGroups(newAnswerGroups);
                $scope.refreshWarnings()();
                $scope.answerGroups = ResponsesService.getAnswerGroups();
                $scope.defaultOutcome = ResponsesService.getDefaultOutcome();

                // Reinitialize training data if the interaction ID is changed.
                _initializeTrainingData();

                $scope.activeAnswerGroupIndex = (
                  ResponsesService.getActiveAnswerGroupIndex());
              });

            // Prompt the user to create a new response if it is not a linear or
            // non-terminal interaction and if an actual interaction is
            // specified (versus one being deleted).
            if (newInteractionId &&
                !INTERACTION_SPECS[newInteractionId].is_linear &&
                !INTERACTION_SPECS[newInteractionId].is_terminal) {
              $scope.openAddAnswerGroupModal();
            }
          });

          $scope.$on('answerGroupChanged', function() {
            $scope.answerGroups = ResponsesService.getAnswerGroups();
            $scope.defaultOutcome = ResponsesService.getDefaultOutcome();
            $scope.activeAnswerGroupIndex = (
              ResponsesService.getActiveAnswerGroupIndex());
          });

          $scope.$on('updateAnswerChoices', function(evt, newAnswerChoices) {
            ResponsesService.updateAnswerChoices(
              newAnswerChoices, function(newAnswerGroups) {
                $scope.onSaveInteractionAnswerGroups(newAnswerGroups);
                $scope.refreshWarnings()();
              });
          });

          $scope.openAddAnswerGroupModal = function() {
            AlertsService.clearWarnings();
            $rootScope.$broadcast('externalSave');
            var stateName = StateEditorService.getActiveStateName();
            var addState = $scope.addState;
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/exploration_editor/editor_tab/' +
                'add_answer_group_modal_directive.html'),
              // Clicking outside this modal should not dismiss it.
              backdrop: 'static',
              controller: [
                '$scope', '$uibModalInstance', 'ResponsesService',
                'EditorFirstTimeEventsService', 'StateEditorService',
                'RuleObjectFactory', 'OutcomeObjectFactory',
                'COMPONENT_NAME_FEEDBACK', 'GenerateContentIdService',
                function(
                    $scope, $uibModalInstance, ResponsesService,
                    EditorFirstTimeEventsService, StateEditorService,
                    RuleObjectFactory, OutcomeObjectFactory,
                    COMPONENT_NAME_FEEDBACK, GenerateContentIdService) {
                  $scope.feedbackEditorIsOpen = false;
                  $scope.addState = addState;
                  $scope.questionModeEnabled =
                    StateEditorService.isInQuestionMode();
                  $scope.openFeedbackEditor = function() {
                    $scope.feedbackEditorIsOpen = true;
                  };
                  $scope.tmpRule = RuleObjectFactory.createNew(null, {});
                  var feedbackContentId = GenerateContentIdService.getNextId(
                    COMPONENT_NAME_FEEDBACK);

                  $scope.tmpOutcome = OutcomeObjectFactory.createNew(
                    $scope.questionModeEnabled ? null : stateName,
                    feedbackContentId, '', []);

                  $scope.isSelfLoopWithNoFeedback = function(tmpOutcome) {
                    return (
                      tmpOutcome.dest ===
                      stateName && !tmpOutcome.hasNonemptyFeedback());
                  };

                  $scope.addAnswerGroupForm = {};

                  $scope.saveResponse = function(reopen) {
                    $scope.$broadcast('saveOutcomeFeedbackDetails');
                    $scope.$broadcast('saveOutcomeDestDetails');

                    EditorFirstTimeEventsService.registerFirstSaveRuleEvent();

                    // Close the modal and save it afterwards.
                    $uibModalInstance.close({
                      tmpRule: angular.copy($scope.tmpRule),
                      tmpOutcome: angular.copy($scope.tmpOutcome),
                      reopen: reopen
                    });
                  };

                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                    AlertsService.clearWarnings();
                  };
                }
              ]
            }).result.then(function(result) {
              // Create a new answer group.
              $scope.answerGroups.push(AnswerGroupObjectFactory.createNew(
                [result.tmpRule], result.tmpOutcome, [], null));
              ResponsesService.save(
                $scope.answerGroups, $scope.defaultOutcome,
                function(newAnswerGroups, newDefaultOutcome) {
                  $scope.onSaveInteractionAnswerGroups(newAnswerGroups);
                  $scope.onSaveInteractionDefaultOutcome(newDefaultOutcome);
                  $scope.refreshWarnings()();
                });
              StateContentIdsToAudioTranslationsService.displayed.addContentId(
                result.tmpOutcome.feedback.getContentId());
              StateContentIdsToAudioTranslationsService.saveDisplayedValue();
              $scope.onSaveContentIdsToAudioTranslations(
                StateContentIdsToAudioTranslationsService.displayed
              );
              $scope.changeActiveAnswerGroupIndex(
                $scope.answerGroups.length - 1);

              // After saving it, check if the modal should be reopened right
              // away.
              if (result.reopen) {
                $scope.openAddAnswerGroupModal();
              }
            });
          };

          // When the page is scrolled so that the top of the page is above the
          // browser viewport, there are some bugs in the positioning of the
          // helper. This is a bug in jQueryUI that has not been fixed yet. For
          // more details, see http://stackoverflow.com/q/5791886
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
              ResponsesService.save(
                $scope.answerGroups, $scope.defaultOutcome,
                function(newAnswerGroups, newDefaultOutcome) {
                  $scope.onSaveInteractionAnswerGroups(newAnswerGroups);
                  $scope.onSaveInteractionDefaultOutcome(newDefaultOutcome);
                  $scope.refreshWarnings()();
                });
            }
          };

          $scope.deleteAnswerGroup = function(index, evt) {
            // Prevent clicking on the delete button from also toggling the
            // display state of the answer group.
            evt.stopPropagation();

            AlertsService.clearWarnings();
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/exploration_editor/editor_tab/' +
                'delete_answer_group_modal_directive.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance', function(
                    $scope, $uibModalInstance) {
                  $scope.reallyDelete = function() {
                    $uibModalInstance.close();
                  };

                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                    AlertsService.clearWarnings();
                  };
                }
              ]
            }).result.then(function() {
              var deletedOutcome =
                ResponsesService.getAnswerGroup(index).outcome;
              ResponsesService.deleteAnswerGroup(
                index, function(newAnswerGroups) {
                  $scope.onSaveInteractionAnswerGroups(newAnswerGroups);
                  $scope.refreshWarnings()();
                });
              var deletedFeedbackContentId =
                deletedOutcome.feedback.getContentId();
              StateContentIdsToAudioTranslationsService.
                displayed.deleteContentId(deletedFeedbackContentId);
              StateContentIdsToAudioTranslationsService.saveDisplayedValue();
              $scope.onSaveContentIdsToAudioTranslations(
                StateContentIdsToAudioTranslationsService.displayed
              );
            });
          };

          $scope.saveTaggedMisconception = function(misconceptionId) {
            ResponsesService.updateActiveAnswerGroup({
              taggedMisconceptionId: misconceptionId
            }, function(newAnswerGroups) {
              $scope.onSaveInteractionAnswerGroups(newAnswerGroups);
              $scope.refreshWarnings()();
            });
          };

          $scope.saveActiveAnswerGroupFeedback = function(updatedOutcome) {
            ResponsesService.updateActiveAnswerGroup({
              feedback: updatedOutcome.feedback
            }, function(newAnswerGroups) {
              $scope.onSaveInteractionAnswerGroups(newAnswerGroups);
              $scope.refreshWarnings()();
            });
          };

          $scope.saveActiveAnswerGroupDest = function(updatedOutcome) {
            ResponsesService.updateActiveAnswerGroup({
              dest: updatedOutcome.dest,
              refresherExplorationId: updatedOutcome.refresherExplorationId,
              missingPrerequisiteSkillId:
                updatedOutcome.missingPrerequisiteSkillId
            }, function(newAnswerGroups) {
              $scope.onSaveInteractionAnswerGroups(newAnswerGroups);
              $scope.refreshWarnings()();
            });
          };

          $scope.saveActiveAnswerGroupCorrectnessLabel = function(
              updatedOutcome) {
            ResponsesService.updateActiveAnswerGroup({
              labelledAsCorrect: updatedOutcome.labelledAsCorrect
            }, function(newAnswerGroups) {
              $scope.onSaveInteractionAnswerGroups(newAnswerGroups);
              $scope.refreshWarnings()();
            });
          };

          $scope.saveActiveAnswerGroupRules = function(updatedRules) {
            ResponsesService.updateActiveAnswerGroup({
              rules: updatedRules
            }, function(newAnswerGroups) {
              $scope.onSaveInteractionAnswerGroups(newAnswerGroups);
              $scope.refreshWarnings()();
            });
          };

          $scope.saveDefaultOutcomeFeedback = function(updatedOutcome) {
            ResponsesService.updateDefaultOutcome({
              feedback: updatedOutcome.feedback
            }, function(newDefaultOutcome) {
              $scope.onSaveInteractionDefaultOutcome(newDefaultOutcome);
            });
          };

          $scope.saveDefaultOutcomeDest = function(updatedOutcome) {
            ResponsesService.updateDefaultOutcome({
              dest: updatedOutcome.dest,
              refresherExplorationId: updatedOutcome.refresherExplorationId,
              missingPrerequisiteSkillId:
                updatedOutcome.missingPrerequisiteSkillId
            }, function(newDefaultOutcome) {
              $scope.onSaveInteractionDefaultOutcome(newDefaultOutcome);
            });
          };

          $scope.saveDefaultOutcomeCorrectnessLabel = function(updatedOutcome) {
            ResponsesService.updateDefaultOutcome({
              labelledAsCorrect: updatedOutcome.labelledAsCorrect
            }, function(newDefaultOutcome) {
              $scope.onSaveInteractionDefaultOutcome(newDefaultOutcome);
            });
          };

          $scope.getAnswerChoices = function() {
            return ResponsesService.getAnswerChoices();
          };

          $scope.summarizeAnswerGroup = function(
              answerGroup, interactionId, answerChoices, shortenRule) {
            var summary = '';
            var outcome = answerGroup.outcome;
            var hasFeedback = outcome.hasNonemptyFeedback();

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
                  $filter('truncate')(outcome.feedback.getHtml(), 30) :
                  $filter('convertToPlainText')(outcome.feedback.getHtml()));
            }
            return summary;
          };

          $scope.summarizeDefaultOutcome = function(
              defaultOutcome, interactionId, answerGroupCount, shortenRule) {
            if (!defaultOutcome) {
              return '';
            }

            var summary = '';
            var hasFeedback = defaultOutcome.hasNonemptyFeedback();

            if (interactionId && INTERACTION_SPECS[interactionId].is_linear) {
              summary =
                INTERACTION_SPECS[interactionId].default_outcome_heading;
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
              summary +=
                $filter(
                  'convertToPlainText'
                )(defaultOutcome.feedback.getHtml());
            }
            return summary;
          };

          $scope.isOutcomeLooping = function(outcome) {
            var activeStateName = $scope.stateName;
            return outcome && (outcome.dest === activeStateName);
          };

          if (StateEditorService.isInQuestionMode()) {
            $scope.onResponsesInitialized();
          }
        }
      ]
    };
  }]);
