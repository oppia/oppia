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

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');
require(
  'components/state-directives/answer-group-editor/' +
  'answer-group-editor.directive.ts');
require(
  'components/state-directives/response-header/response-header.directive.ts');
require('components/state-editor/state-editor.directive.ts');
require(
  'components/state-directives/outcome-editor/' +
  'outcome-destination-editor.directive.ts');
require(
  'components/state-directives/outcome-editor/' +
  'outcome-feedback-editor.directive.ts');
require('components/state-directives/rule-editor/rule-editor.directive.ts');
require(
  'pages/exploration-editor-page/editor-tab/templates/modal-templates/' +
  'add-answer-group-modal.controller.ts');

require('domain/exploration/AnswerGroupObjectFactory.ts');
require('domain/exploration/HintObjectFactory.ts');
require('domain/exploration/OutcomeObjectFactory.ts');
require('domain/exploration/RuleObjectFactory.ts');
require('domain/exploration/SubtitledHtmlObjectFactory.ts');
require('domain/utilities/url-interpolation.service.ts');
require('filters/string-utility-filters/camel-case-to-hyphens.filter.ts');
require('filters/string-utility-filters/convert-to-plain-text.filter.ts');
require('filters/parameterize-rule-description.filter.ts');
require('filters/string-utility-filters/truncate.filter.ts');
require('filters/string-utility-filters/wrap-text-with-ellipsis.filter.ts');
require(
  'pages/exploration-editor-page/services/editor-first-time-events.service.ts');
require(
  'pages/exploration-editor-page/editor-tab/services/' +
  'interaction-details-cache.service.ts');
require(
  'pages/exploration-editor-page/editor-tab/services/responses.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-content.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-customization-args.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-hints.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-interaction-id.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-solicit-answer-details.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-solution.service.ts');
require('services/alerts.service.ts');
require('services/context.service.ts');
require('services/editability.service.ts');
require('services/exploration-html-formatter.service.ts');
require('services/generate-content-id.service.ts');
require('services/html-escaper.service.ts');

angular.module('oppia').directive('stateResponses', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        addState: '=',
        onResponsesInitialized: '=',
        onSaveInteractionAnswerGroups: '=',
        onSaveInteractionDefaultOutcome: '=',
        onSaveSolicitAnswerDetails: '=',
        navigateToState: '=',
        refreshWarnings: '&',
        showMarkAllAudioAsNeedingUpdateModalIfRequired: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/state-editor/state-responses-editor/' +
        'state-responses.directive.html'),
      controller: [
        '$filter', '$rootScope', '$scope', '$uibModal', 'AlertsService',
        'AnswerGroupObjectFactory', 'ContextService',
        'EditabilityService', 'ResponsesService',
        'StateCustomizationArgsService', 'StateEditorService',
        'StateInteractionIdService', 'StateSolicitAnswerDetailsService',
        'UrlInterpolationService', 'ENABLE_SOLICIT_ANSWER_DETAILS_FEATURE',
        'INTERACTION_IDS_WITHOUT_ANSWER_DETAILS', 'INTERACTION_SPECS',
        'PLACEHOLDER_OUTCOME_DEST', 'RULE_SUMMARY_WRAP_CHARACTER_COUNT',
        'SHOW_TRAINABLE_UNRESOLVED_ANSWERS',
        function(
            $filter, $rootScope, $scope, $uibModal, AlertsService,
            AnswerGroupObjectFactory, ContextService,
            EditabilityService, ResponsesService,
            StateCustomizationArgsService, StateEditorService,
            StateInteractionIdService, StateSolicitAnswerDetailsService,
            UrlInterpolationService, ENABLE_SOLICIT_ANSWER_DETAILS_FEATURE,
            INTERACTION_IDS_WITHOUT_ANSWER_DETAILS, INTERACTION_SPECS,
            PLACEHOLDER_OUTCOME_DEST, RULE_SUMMARY_WRAP_CHARACTER_COUNT,
            SHOW_TRAINABLE_UNRESOLVED_ANSWERS) {
          var ctrl = this;
          var _initializeTrainingData = function() {
            if (StateEditorService.isInQuestionMode()) {
              return;
            }
            var explorationId = ContextService.getExplorationId();
            var currentStateName = $scope.stateName;
          };

          var _getExistingFeedbackContentIds = function() {
            var existingContentIds = [];
            $scope.answerGroups.forEach(function(answerGroup) {
              var contentId = answerGroup.outcome.feedback.getContentId();
              existingContentIds.push(contentId);
            });
            return existingContentIds;
          };

          $scope.isInQuestionMode = function() {
            return StateEditorService.isInQuestionMode();
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

          $scope.onChangeSolicitAnswerDetails = function() {
            $scope.onSaveSolicitAnswerDetails(
              $scope.stateSolicitAnswerDetailsService.displayed);
            StateSolicitAnswerDetailsService.saveDisplayedValue();
          };

          $scope.isSelfLoopWithNoFeedback = function(outcome) {
            if (outcome && typeof outcome === 'object' &&
              outcome.constructor.name === 'Outcome') {
              return outcome.isConfusing($scope.stateName);
            }
            return false;
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

          $scope.isCurrentInteractionTrivial = function() {
            var interactionId = $scope.getCurrentInteractionId();
            return INTERACTION_IDS_WITHOUT_ANSWER_DETAILS.indexOf(
              interactionId) !== -1;
          };

          $scope.isLinearWithNoFeedback = function(outcome) {
            // Returns false if current interaction is linear and has no
            // feedback
            if (outcome && typeof outcome === 'object' &&
              outcome.constructor.name === 'Outcome') {
              return $scope.isCurrentInteractionLinear() &&
                !outcome.hasNonemptyFeedback();
            }
            return false;
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

          $scope.openAddAnswerGroupModal = function() {
            AlertsService.clearWarnings();
            $rootScope.$broadcast('externalSave');
            var stateName = StateEditorService.getActiveStateName();
            var addState = $scope.addState;
            var existingContentIds = _getExistingFeedbackContentIds();
            var currentInteractionId = $scope.getCurrentInteractionId();
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/exploration-editor-page/editor-tab/templates/' +
                'modal-templates/add-answer-group-modal.template.html'),
              // Clicking outside this modal should not dismiss it.
              backdrop: 'static',
              resolve: {
                addState: () => addState,
                currentInteractionId: () => currentInteractionId,
                existingContentIds: () => existingContentIds,
                stateName: () => stateName,
              },
              controller: 'AddAnswerGroupModalController'
            }).result.then(function(result) {
              // Create a new answer group.
              $scope.answerGroups.push(AnswerGroupObjectFactory.createNew(
                [result.tmpRule], result.tmpOutcome, [],
                result.tmpTaggedSkillMisconceptionId));
              ResponsesService.save(
                $scope.answerGroups, $scope.defaultOutcome,
                function(newAnswerGroups, newDefaultOutcome) {
                  $scope.onSaveInteractionAnswerGroups(newAnswerGroups);
                  $scope.onSaveInteractionDefaultOutcome(newDefaultOutcome);
                  $scope.refreshWarnings()();
                });
              $scope.changeActiveAnswerGroupIndex(
                $scope.answerGroups.length - 1);

              // After saving it, check if the modal should be reopened right
              // away.
              if (result.reopen) {
                $scope.openAddAnswerGroupModal();
              }
            }, function() {
              AlertsService.clearWarnings();
            });
          };

          $scope.deleteAnswerGroup = function(index, evt) {
            // Prevent clicking on the delete button from also toggling the
            // display state of the answer group.
            evt.stopPropagation();

            AlertsService.clearWarnings();
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/exploration-editor-page/editor-tab/templates/' +
                'modal-templates/delete-answer-group-modal.template.html'),
              backdrop: true,
              controller: 'ConfirmOrCancelModalController'
            }).result.then(function() {
              ResponsesService.deleteAnswerGroup(
                index, function(newAnswerGroups) {
                  $scope.onSaveInteractionAnswerGroups(newAnswerGroups);
                  $scope.refreshWarnings()();
                });
            }, function() {
              AlertsService.clearWarnings();
            });
          };

          $scope.saveTaggedMisconception = function(misconceptionId, skillId) {
            ResponsesService.updateActiveAnswerGroup({
              taggedSkillMisconceptionId: skillId + '-' + misconceptionId
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
              feedback: updatedOutcome.feedback,
              dest: updatedOutcome.dest
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

          ctrl.$onInit = function() {
            $scope.SHOW_TRAINABLE_UNRESOLVED_ANSWERS = (
              SHOW_TRAINABLE_UNRESOLVED_ANSWERS);
            $scope.EditabilityService = EditabilityService;
            $scope.stateName = StateEditorService.getActiveStateName();
            $scope.enableSolicitAnswerDetailsFeature = (
              ENABLE_SOLICIT_ANSWER_DETAILS_FEATURE);
            $scope.stateSolicitAnswerDetailsService = (
              StateSolicitAnswerDetailsService);
            $scope.$on('initializeAnswerGroups', function(evt, data) {
              ResponsesService.init(data);
              $scope.answerGroups = ResponsesService.getAnswerGroups();
              $scope.defaultOutcome = ResponsesService.getDefaultOutcome();

              // If the creator selects an interaction which has only one
              // possible answer, automatically expand the default response.
              // Otherwise, default to having no responses initially selected.
              if ($scope.isCurrentInteractionLinear()) {
                ResponsesService.changeActiveAnswerGroupIndex(0);
              }

              // Initialize training data for these answer groups.
              _initializeTrainingData();

              $scope.activeAnswerGroupIndex = (
                ResponsesService.getActiveAnswerGroupIndex());
              $rootScope.$broadcast('externalSave');
            });

            $scope.getStaticImageUrl = function(imagePath) {
              return UrlInterpolationService.getStaticImageUrl(imagePath);
            };

            $scope.$on('onInteractionIdChanged', function(
                evt, newInteractionId) {
              $rootScope.$broadcast('externalSave');
              ResponsesService.onInteractionIdChanged(
                newInteractionId, function(newAnswerGroups, newDefaultOutcome) {
                  $scope.onSaveInteractionDefaultOutcome(newDefaultOutcome);
                  $scope.onSaveInteractionAnswerGroups(newAnswerGroups);
                  $scope.refreshWarnings()();
                  $scope.answerGroups = ResponsesService.getAnswerGroups();
                  $scope.defaultOutcome = ResponsesService.getDefaultOutcome();

                  // Reinitialize training data if the interaction ID is
                  // changed.
                  _initializeTrainingData();

                  $scope.activeAnswerGroupIndex = (
                    ResponsesService.getActiveAnswerGroupIndex());
                });

              // Prompt the user to create a new response if it is not a linear
              // or non-terminal interaction and if an actual interaction is
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
            // When the page is scrolled so that the top of the page is above
            // the browser viewport, there are some bugs in the positioning of
            // the helper. This is a bug in jQueryUI that has not been fixed
            // yet. For more details, see http://stackoverflow.com/q/5791886
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
            if (StateEditorService.isInQuestionMode()) {
              $scope.onResponsesInitialized();
            }
            StateEditorService.updateStateResponsesInitialised();
          };
        }
      ]
    };
  }]);
