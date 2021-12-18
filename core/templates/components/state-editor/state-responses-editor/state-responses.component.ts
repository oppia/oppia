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
 * @fileoverview Directive for managing the state responses in the state
 * editor.
 */
import { DeleteAnswerGroupModalComponent } from
  // eslint-disable-next-line max-len
  'pages/exploration-editor-page/editor-tab/templates/modal-templates/delete-answer-group-modal.component';

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');
require(
  'components/state-directives/answer-group-editor/' +
  'answer-group-editor.component.ts');
require(
  'components/state-directives/response-header/response-header.component.ts');
require('components/state-editor/state-editor.component.ts');
require(
  'components/state-directives/outcome-editor/' +
  'outcome-destination-editor.component.ts');
require(
  'components/state-directives/outcome-editor/' +
  'outcome-feedback-editor.component.ts');
require('components/state-directives/rule-editor/rule-editor.component.ts');
require(
  'pages/exploration-editor-page/editor-tab/templates/modal-templates/' +
  'add-answer-group-modal.controller.ts');

require('domain/exploration/AnswerGroupObjectFactory.ts');
require('domain/exploration/HintObjectFactory.ts');
require('domain/exploration/OutcomeObjectFactory.ts');
require('domain/exploration/RuleObjectFactory.ts');
require('domain/utilities/url-interpolation.service.ts');
require('filters/string-utility-filters/camel-case-to-hyphens.filter.ts');
require('filters/string-utility-filters/convert-to-plain-text.filter.ts');
require('filters/parameterize-rule-description.filter.ts');
require('filters/string-utility-filters/truncate.filter.ts');
require('filters/string-utility-filters/wrap-text-with-ellipsis.filter.ts');
require(
  'pages/exploration-editor-page/services/' +
  'editor-first-time-events.service.ts');
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
  'state-next-content-id-index.service');
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
require('services/contextual/window-dimensions.service.ts');
require('services/external-save.service.ts');
require('pages/interaction-specs.constants.ajs.ts');
require('services/ngb-modal.service.ts');

import { Misconception } from 'domain/skill/MisconceptionObjectFactory';
import { Subscription } from 'rxjs';

angular.module('oppia').component('stateResponses', {
  bindings: {
    addState: '=',
    onResponsesInitialized: '=',
    onSaveInapplicableSkillMisconceptionIds: '=',
    onSaveInteractionAnswerGroups: '=',
    onSaveInteractionDefaultOutcome: '=',
    onSaveNextContentIdIndex: '=',
    onSaveSolicitAnswerDetails: '=',
    navigateToState: '=',
    refreshWarnings: '&',
    showMarkAllAudioAsNeedingUpdateModalIfRequired: '='
  },
  template: require('./state-responses.component.html'),
  controller: [
    '$filter', '$scope', '$uibModal', 'AlertsService',
    'AnswerGroupObjectFactory',
    'EditabilityService', 'ExternalSaveService', 'NgbModal', 'ResponsesService',
    'StateCustomizationArgsService', 'StateEditorService',
    'StateInteractionIdService', 'StateNextContentIdIndexService',
    'StateSolicitAnswerDetailsService',
    'UrlInterpolationService', 'WindowDimensionsService',
    'ENABLE_SOLICIT_ANSWER_DETAILS_FEATURE',
    'INTERACTION_IDS_WITHOUT_ANSWER_DETAILS', 'INTERACTION_SPECS',
    'PLACEHOLDER_OUTCOME_DEST', 'RULE_SUMMARY_WRAP_CHARACTER_COUNT',
    'SHOW_TRAINABLE_UNRESOLVED_ANSWERS',
    function(
        $filter, $scope, $uibModal, AlertsService,
        AnswerGroupObjectFactory,
        EditabilityService, ExternalSaveService, NgbModal, ResponsesService,
        StateCustomizationArgsService, StateEditorService,
        StateInteractionIdService, StateNextContentIdIndexService,
        StateSolicitAnswerDetailsService,
        UrlInterpolationService, WindowDimensionsService,
        ENABLE_SOLICIT_ANSWER_DETAILS_FEATURE,
        INTERACTION_IDS_WITHOUT_ANSWER_DETAILS, INTERACTION_SPECS,
        PLACEHOLDER_OUTCOME_DEST, RULE_SUMMARY_WRAP_CHARACTER_COUNT,
        SHOW_TRAINABLE_UNRESOLVED_ANSWERS) {
      var ctrl = this;

      ctrl.directiveSubscriptions = new Subscription();
      var _initializeTrainingData = function() {
        if (StateEditorService.isInQuestionMode()) {
          return;
        }
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
        var customizationArgs = (
          StateCustomizationArgsService.savedMemento);
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
                  } else if (rule.type === 'DoesNotContainAtLeastOneOf') {
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
        return false;
      };

      $scope.onChangeSolicitAnswerDetails = function() {
        ctrl.onSaveSolicitAnswerDetails(
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
        ExternalSaveService.onExternalSave.emit();
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
        // feedback.
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

        // Outcome tooltip depends on whether feedback is displayed.
        if ($scope.isLinearWithNoFeedback(outcome)) {
          return 'Please direct the learner to a different card.';
        } else {
          return 'Please give Oppia something useful to say,' +
                 ' or direct the learner to a different card.';
        }
      };

      $scope.openAddAnswerGroupModal = function() {
        AlertsService.clearWarnings();
        ExternalSaveService.onExternalSave.emit();
        var stateName = StateEditorService.getActiveStateName();
        var addState = ctrl.addState;
        var currentInteractionId = $scope.getCurrentInteractionId();
        $uibModal.open({
          template: require(
            'pages/exploration-editor-page/editor-tab/templates/' +
            'modal-templates/add-answer-group-modal.template.html'),
          // Clicking outside this modal should not dismiss it.
          backdrop: 'static',
          resolve: {
            addState: () => addState,
            currentInteractionId: () => currentInteractionId,
            stateName: () => stateName,
          },
          windowClass: 'add-answer-group-modal',
          controller: 'AddAnswerGroupModalController'
        }).result.then(function(result) {
          StateNextContentIdIndexService.saveDisplayedValue();
          ctrl.onSaveNextContentIdIndex(
            StateNextContentIdIndexService.displayed);

          // Create a new answer group.
          $scope.answerGroups.push(AnswerGroupObjectFactory.createNew(
            [result.tmpRule], result.tmpOutcome, [],
            result.tmpTaggedSkillMisconceptionId));
          ResponsesService.save(
            $scope.answerGroups, $scope.defaultOutcome,
            function(newAnswerGroups, newDefaultOutcome) {
              ctrl.onSaveInteractionAnswerGroups(newAnswerGroups);
              ctrl.onSaveInteractionDefaultOutcome(newDefaultOutcome);
              ctrl.refreshWarnings()();
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
        NgbModal.open(DeleteAnswerGroupModalComponent, {
          backdrop: true,
        }).result.then(function() {
          ResponsesService.deleteAnswerGroup(
            index, function(newAnswerGroups) {
              ctrl.onSaveInteractionAnswerGroups(newAnswerGroups);
              ctrl.refreshWarnings()();
            });
        }, function() {
          AlertsService.clearWarnings();
        });
      };

      var verifyAndUpdateInapplicableSkillMisconceptionIds = function() {
        var answerGroups = ResponsesService.getAnswerGroups();
        var taggedSkillMisconceptionIds = [];
        for (var i = 0; i < answerGroups.length; i++) {
          if (!answerGroups[i].outcome.labelledAsCorrect &&
              answerGroups[i].taggedSkillMisconceptionId !== null) {
            taggedSkillMisconceptionIds.push(
              answerGroups[i].taggedSkillMisconceptionId);
          }
        }
        var commonSkillMisconceptionIds = (
          taggedSkillMisconceptionIds.filter(
            skillMisconceptionId => (
              $scope.inapplicableSkillMisconceptionIds.includes(
                skillMisconceptionId))));
        if (commonSkillMisconceptionIds.length) {
          commonSkillMisconceptionIds.forEach((skillMisconceptionId => {
            $scope.inapplicableSkillMisconceptionIds = (
              $scope.inapplicableSkillMisconceptionIds.filter(
                item => item !== skillMisconceptionId));
          }));
          ctrl.onSaveInapplicableSkillMisconceptionIds(
            $scope.inapplicableSkillMisconceptionIds);
        }
      };

      $scope.saveTaggedMisconception = function(misconceptionId, skillId) {
        ResponsesService.updateActiveAnswerGroup({
          taggedSkillMisconceptionId: skillId + '-' + misconceptionId
        }, function(newAnswerGroups) {
          ctrl.onSaveInteractionAnswerGroups(newAnswerGroups);
          ctrl.refreshWarnings()();
        });
      };

      $scope.saveActiveAnswerGroupFeedback = function(updatedOutcome) {
        ResponsesService.updateActiveAnswerGroup({
          feedback: updatedOutcome.feedback
        }, function(newAnswerGroups) {
          ctrl.onSaveInteractionAnswerGroups(newAnswerGroups);
          ctrl.refreshWarnings()();
        });
      };

      $scope.saveActiveAnswerGroupDest = function(updatedOutcome) {
        ResponsesService.updateActiveAnswerGroup({
          dest: updatedOutcome.dest,
          refresherExplorationId: updatedOutcome.refresherExplorationId,
          missingPrerequisiteSkillId:
            updatedOutcome.missingPrerequisiteSkillId
        }, function(newAnswerGroups) {
          ctrl.onSaveInteractionAnswerGroups(newAnswerGroups);
          ctrl.refreshWarnings()();
        });
      };

      $scope.saveActiveAnswerGroupCorrectnessLabel = function(
          updatedOutcome) {
        ResponsesService.updateActiveAnswerGroup({
          labelledAsCorrect: updatedOutcome.labelledAsCorrect
        }, function(newAnswerGroups) {
          ctrl.onSaveInteractionAnswerGroups(newAnswerGroups);
          ctrl.refreshWarnings()();
        });
      };

      $scope.saveActiveAnswerGroupRules = function(updatedRules) {
        ResponsesService.updateActiveAnswerGroup({
          rules: updatedRules
        }, function(newAnswerGroups) {
          ctrl.onSaveInteractionAnswerGroups(newAnswerGroups);
          ctrl.refreshWarnings()();
        });
      };

      $scope.saveDefaultOutcomeFeedback = function(updatedOutcome) {
        ResponsesService.updateDefaultOutcome({
          feedback: updatedOutcome.feedback,
          dest: updatedOutcome.dest
        }, function(newDefaultOutcome) {
          ctrl.onSaveInteractionDefaultOutcome(newDefaultOutcome);
        });
      };

      $scope.saveDefaultOutcomeDest = function(updatedOutcome) {
        ResponsesService.updateDefaultOutcome({
          dest: updatedOutcome.dest,
          refresherExplorationId: updatedOutcome.refresherExplorationId,
          missingPrerequisiteSkillId:
            updatedOutcome.missingPrerequisiteSkillId
        }, function(newDefaultOutcome) {
          ctrl.onSaveInteractionDefaultOutcome(newDefaultOutcome);
        });
      };

      $scope.saveDefaultOutcomeCorrectnessLabel = function(
          updatedOutcome) {
        ResponsesService.updateDefaultOutcome({
          labelledAsCorrect: updatedOutcome.labelledAsCorrect
        }, function(newDefaultOutcome) {
          ctrl.onSaveInteractionDefaultOutcome(newDefaultOutcome);
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
              $filter('truncate')(outcome.feedback.html, 30) :
              $filter('convertToPlainText')(outcome.feedback.html));
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
            )(defaultOutcome.feedback.html);
        }
        return summary;
      };

      $scope.isOutcomeLooping = function(outcome) {
        var activeStateName = $scope.stateName;
        return outcome && (outcome.dest === activeStateName);
      };

      $scope.toggleResponseCard = function() {
        $scope.responseCardIsShown = !$scope.responseCardIsShown;
      };

      $scope.getUnaddressedMisconceptionNames = function() {
        var answerGroups = ResponsesService.getAnswerGroups();
        var taggedSkillMisconceptionIds = {};
        for (var i = 0; i < answerGroups.length; i++) {
          if (!answerGroups[i].outcome.labelledAsCorrect &&
              answerGroups[i].taggedSkillMisconceptionId !== null) {
            taggedSkillMisconceptionIds[
              answerGroups[i].taggedSkillMisconceptionId] = true;
          }
        }
        var unaddressedMisconceptionNames = [];
        Object.keys($scope.misconceptionsBySkill).forEach(
          function(skillId) {
            var misconceptions = $scope.misconceptionsBySkill[skillId];
            for (var i = 0; i < misconceptions.length; i++) {
              if (!misconceptions[i].isMandatory()) {
                continue;
              }
              var skillMisconceptionId = (
                skillId + '-' + misconceptions[i].getId());
              if (!taggedSkillMisconceptionIds.hasOwnProperty(
                skillMisconceptionId)) {
                unaddressedMisconceptionNames.push(
                  misconceptions[i].getName());
              }
            }
          });
        return unaddressedMisconceptionNames;
      };

      $scope.getOptionalSkillMisconceptionStatus = function(
          optionalSkillMisconceptionId) {
        var answerGroups = ResponsesService.getAnswerGroups();
        var taggedSkillMisconceptionIds = [];
        for (var i = 0; i < answerGroups.length; i++) {
          if (!answerGroups[i].outcome.labelledAsCorrect &&
              answerGroups[i].taggedSkillMisconceptionId !== null) {
            taggedSkillMisconceptionIds.push(
              answerGroups[i].taggedSkillMisconceptionId);
          }
        }
        var skillMisconceptionIdIsAssigned = (
          taggedSkillMisconceptionIds.includes(
            optionalSkillMisconceptionId));
        if (skillMisconceptionIdIsAssigned) {
          return 'Assigned';
        }
        return $scope.inapplicableSkillMisconceptionIds.includes(
          optionalSkillMisconceptionId) ? 'Not Applicable' : '';
      };

      $scope.updateOptionalMisconceptionIdStatus = function(
          skillMisconceptionId, isApplicable) {
        if (isApplicable) {
          $scope.inapplicableSkillMisconceptionIds = (
            $scope.inapplicableSkillMisconceptionIds.filter(
              item => item !== skillMisconceptionId));
        } else {
          $scope.inapplicableSkillMisconceptionIds.push(
            skillMisconceptionId);
        }
        ctrl.onSaveInapplicableSkillMisconceptionIds(
          $scope.inapplicableSkillMisconceptionIds);
        $scope.setActiveEditOption(null);
      };

      $scope.setActiveEditOption = function(activeEditOption) {
        $scope.activeEditOption = activeEditOption;
      };

      $scope.isNoActionExpected = function(skillMisconceptionId) {
        return ['Assigned', 'Not Applicable'].includes(
          $scope.getOptionalSkillMisconceptionStatus(
            skillMisconceptionId));
      };

      ctrl.$onInit = function() {
        $scope.SHOW_TRAINABLE_UNRESOLVED_ANSWERS = (
          SHOW_TRAINABLE_UNRESOLVED_ANSWERS);
        $scope.EditabilityService = EditabilityService;
        $scope.responseCardIsShown = (
          !WindowDimensionsService.isWindowNarrow());
        $scope.stateName = StateEditorService.getActiveStateName();
        $scope.enableSolicitAnswerDetailsFeature = (
          ENABLE_SOLICIT_ANSWER_DETAILS_FEATURE);
        $scope.stateSolicitAnswerDetailsService = (
          StateSolicitAnswerDetailsService);
        $scope.misconceptionsBySkill = {};
        ctrl.directiveSubscriptions.add(
          ResponsesService.onInitializeAnswerGroups.subscribe((data) => {
            ResponsesService.init(data);
            $scope.answerGroups = ResponsesService.getAnswerGroups();
            $scope.defaultOutcome = ResponsesService.getDefaultOutcome();

            // If the creator selects an interaction which has only one
            // possible answer, automatically expand the default response.
            // Otherwise, default to having no responses initially
            // selected.
            if ($scope.isCurrentInteractionLinear()) {
              ResponsesService.changeActiveAnswerGroupIndex(0);
            }

            // Initialize training data for these answer groups.
            _initializeTrainingData();

            $scope.activeAnswerGroupIndex = (
              ResponsesService.getActiveAnswerGroupIndex());
            ExternalSaveService.onExternalSave.emit();
          })
        );

        $scope.getStaticImageUrl = function(imagePath) {
          return UrlInterpolationService.getStaticImageUrl(imagePath);
        };

        ctrl.directiveSubscriptions.add(
          StateInteractionIdService.onInteractionIdChanged.subscribe(
            (newInteractionId) => {
              ExternalSaveService.onExternalSave.emit();
              ResponsesService.onInteractionIdChanged(
                newInteractionId,
                function(newAnswerGroups, newDefaultOutcome) {
                  ctrl.onSaveInteractionDefaultOutcome(
                    newDefaultOutcome);
                  ctrl.onSaveInteractionAnswerGroups(newAnswerGroups);
                  ctrl.refreshWarnings()();
                  $scope.answerGroups = ResponsesService.getAnswerGroups();
                  $scope.defaultOutcome =
                    ResponsesService.getDefaultOutcome();

                  // Reinitialize training data if the interaction ID is
                  // changed.
                  _initializeTrainingData();

                  $scope.activeAnswerGroupIndex = (
                    ResponsesService.getActiveAnswerGroupIndex());
                });

              // Prompt the user to create a new response if it is not a
              // linear or non-terminal interaction and if an actual
              // interaction is specified (versus one being deleted).
              if (newInteractionId &&
                  !INTERACTION_SPECS[newInteractionId].is_linear &&
                  !INTERACTION_SPECS[newInteractionId].is_terminal) {
                $scope.openAddAnswerGroupModal();
              }
            }
          )
        );

        ctrl.directiveSubscriptions.add(
          ResponsesService.onAnswerGroupsChanged.subscribe(
            () => {
              $scope.answerGroups = ResponsesService.getAnswerGroups();
              $scope.defaultOutcome = ResponsesService.getDefaultOutcome();
              $scope.activeAnswerGroupIndex =
              ResponsesService.getActiveAnswerGroupIndex();
              verifyAndUpdateInapplicableSkillMisconceptionIds();
            }
          ));
        ctrl.directiveSubscriptions.add(
          StateEditorService.onUpdateAnswerChoices.subscribe(
            (newAnswerChoices) => {
              ResponsesService.updateAnswerChoices(newAnswerChoices);
            })
        );

        ctrl.directiveSubscriptions.add(
          StateEditorService.onHandleCustomArgsUpdate.subscribe(
            (newAnswerChoices) => {
              ResponsesService.handleCustomArgsUpdate(
                newAnswerChoices, function(newAnswerGroups) {
                  ctrl.onSaveInteractionAnswerGroups(newAnswerGroups);
                  ctrl.refreshWarnings()();
                });
            }
          )
        );

        ctrl.directiveSubscriptions.add(
          StateEditorService.onStateEditorInitialized.subscribe(
            () => {
              $scope.misconceptionsBySkill = (
                StateEditorService.getMisconceptionsBySkill());
              $scope.containsOptionalMisconceptions = (
                Object.values($scope.misconceptionsBySkill).some(
                  (misconceptions: Misconception[]) => misconceptions.some(
                    misconception => !misconception.isMandatory())));
            })
        );

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
            ExternalSaveService.onExternalSave.emit();
            $scope.changeActiveAnswerGroupIndex(-1);
            ui.placeholder.height(ui.item.height());
          },
          stop: function() {
            ResponsesService.save(
              $scope.answerGroups, $scope.defaultOutcome,
              function(newAnswerGroups, newDefaultOutcome) {
                ctrl.onSaveInteractionAnswerGroups(newAnswerGroups);
                ctrl.onSaveInteractionDefaultOutcome(newDefaultOutcome);
                ctrl.refreshWarnings()();
              });
          }
        };
        if (StateEditorService.isInQuestionMode()) {
          ctrl.onResponsesInitialized();
        }
        StateEditorService.updateStateResponsesInitialised();
        $scope.inapplicableSkillMisconceptionIds = (
          StateEditorService.getInapplicableSkillMisconceptionIds());
        $scope.activeEditOption = null;
      };
      ctrl.$onDestroy = function() {
        ctrl.directiveSubscriptions.unsubscribe();
      };
    }
  ]
});
