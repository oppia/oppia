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

import { Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { ContextService } from 'services/context.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { AddAnswerGroupModalComponent } from 'pages/exploration-editor-page/editor-tab/templates/modal-templates/add-answer-group-modal.component';
import { DeleteAnswerGroupModalComponent } from 'pages/exploration-editor-page/editor-tab/templates/modal-templates/delete-answer-group-modal.component';
import { Misconception } from 'domain/skill/MisconceptionObjectFactory';
import { Subscription } from 'rxjs';
import { AnswerChoice, StateEditorService } from '../state-editor-properties-services/state-editor.service';
import { ResponsesService } from 'pages/exploration-editor-page/editor-tab/services/responses.service';
import { StateSolicitAnswerDetailsService } from '../state-editor-properties-services/state-solicit-answer-details.service';
import { ExternalSaveService } from 'services/external-save.service';
import { StateInteractionIdService } from '../state-editor-properties-services/state-interaction-id.service';
import { AppConstants } from 'app.constants';
import INTERACTION_SPECS from 'interactions/interaction_specs.json';
import { Outcome } from 'domain/exploration/OutcomeObjectFactory';
import { StateCustomizationArgsService } from '../state-editor-properties-services/state-customization-args.service';
import { AlertsService } from 'services/alerts.service';

@Component({
  selector: 'oppia-state-responses',
  templateUrl: './state-responses.component.html'
})
export class StateResponsesComponent {
  @Input() addState;
  @Input() onResponsesInitialized;
  @Input() onSaveInapplicableSkillMisconceptionIds;
  @Input() onSaveInteractionAnswerGroups;
  @Input() onSaveInteractionDefaultOutcome;
  @Input() onSaveNextContentIdIndex;
  @Input() onSaveSolicitAnswerDetails;
  @Input() navigateToState;
  @Input() refreshWarnings;
  @Input() showMarkAllAudioAsNeedingUpdateModalIfRequired;

  directiveSubscriptions = new Subscription();

  constructor(
    private stateEditorService: StateEditorService,
    private responsesService: ResponsesService,
    private stateCustomizationArgsService: StateCustomizationArgsService,
    private stateSolicitAnswerDetailsService: StateSolicitAnswerDetailsService,
    private externalSaveService: ExternalSaveService,
    private stateInteractionIdService: StateInteractionIdService,
    private alertsService: AlertsService,
    private ngbModal: NgbModal,
    private stateNextContentIdIndexService: StateNextContentIdIndexService,
    private answerGroupObjectFactory: AnswerGroupObjectFactory,
  ) {}

  _initializeTrainingData(): void {
    if (this.stateEditorService.isInQuestionMode()) {
      return;
    }
  }

  isInQuestionMode(): boolean {
    return this.stateEditorService.isInQuestionMode();
  }

  suppressDefaultAnswerGroupWarnings(): boolean {
    let interactionId = this.getCurrentInteractionId();
    let answerGroups = this.responsesService.getAnswerGroups();
    // This array contains the text of each of the possible answers
    // for the interaction.
    let answerChoices = [];
    let customizationArgs = (
      this.stateCustomizationArgsService.savedMemento);
    let handledAnswersArray = [];

    if (interactionId === 'MultipleChoiceInput') {
      let numChoices = this.getAnswerChoices().length;
      let choiceIndices = [];
      // Collect all answers which have been handled by at least one
      // answer group.
      for (let i = 0; i < answerGroups.length; i++) {
        for (let j = 0; j < answerGroups[i].rules.length; j++) {
          handledAnswersArray.push(answerGroups[i].rules[j].inputs.x);
        }
      }
      for (let i = 0; i < numChoices; i++) {
        choiceIndices.push(i);
      }
      // We only suppress the default warning if each choice index has
      // been handled by at least one answer group.
      return choiceIndices.every((choiceIndex) => {
        return handledAnswersArray.indexOf(choiceIndex) !== -1;
      });
    } else if (interactionId === 'ItemSelectionInput') {
      let maxSelectionCount = (
        customizationArgs.maxAllowableSelectionCount.value);
      if (maxSelectionCount === 1) {
        let numChoices = this.getAnswerChoices().length;
        // This array contains a list of booleans, one for each answer
        // choice. Each boolean is true if the corresponding answer has
        // been covered by at least one rule, and false otherwise.
        handledAnswersArray = [];
        for (let i = 0; i < numChoices; i++) {
          handledAnswersArray.push(false);
          answerChoices.push(this.getAnswerChoices()[i].val);
        }

        let answerChoiceToIndex = {};
        answerChoices.forEach((answerChoice, choiceIndex) => {
          answerChoiceToIndex[answerChoice] = choiceIndex;
        });

        answerGroups.forEach((answerGroup) => {
          let rules = answerGroup.rules;
          rules.forEach((rule) => {
            let ruleInputs = rule.inputs.x;
            ruleInputs.forEach((ruleInput) => {
              let choiceIndex = answerChoiceToIndex[ruleInput];
              if (rule.type === 'Equals' ||
                  rule.type === 'ContainsAtLeastOneOf') {
                handledAnswersArray[choiceIndex] = true;
              } else if (rule.type === 'DoesNotContainAtLeastOneOf') {
                for (let i = 0; i < handledAnswersArray.length; i++) {
                  if (i !== choiceIndex) {
                    handledAnswersArray[i] = true;
                  }
                }
              }
            });
          });
        });

        let areAllChoicesCovered = handledAnswersArray.every(
          (handledAnswer) => {
            return handledAnswer;
          });
        // We only suppress the default warning if each choice text has
        // been handled by at least one answer group, based on rule
        // type.
        return areAllChoicesCovered;
      }
    }
    return false;
  }

  onChangeSolicitAnswerDetails(): void {
    this.onSaveSolicitAnswerDetails(
      this.stateSolicitAnswerDetailsService.displayed);
    this.stateSolicitAnswerDetailsService.saveDisplayedValue();
  };

  isSelfLoopWithNoFeedback(outcome): boolean {
    if (outcome && typeof outcome === 'object' &&
      outcome.constructor.name === 'Outcome') {
      return outcome.isConfusing(this.stateName);
    }
    return false;
  }

  isSelfLoopThatIsMarkedCorrect(outcome): boolean {
    if (!outcome ||
        !this.stateEditorService.getCorrectnessFeedbackEnabled()) {
      return false;
    }

    let currentStateName = this.stateName;

    return (
      (outcome.dest === currentStateName) &&
      outcome.labelledAsCorrect);
  }

  changeActiveAnswerGroupIndex(newIndex): void {
    this.externalSaveService.onExternalSave.emit();
    this.responsesService.changeActiveAnswerGroupIndex(newIndex);
    this.activeAnswerGroupIndex = (
      this.responsesService.getActiveAnswerGroupIndex());
  }

  getCurrentInteractionId(): string {
    return this.stateInteractionIdService.savedMemento;
  }

  isCreatingNewState(outcome): boolean {
    return (outcome && outcome.dest === AppConstants.PLACEHOLDER_OUTCOME_DEST);
  }

  // This returns false if the current interaction ID is null.
  isCurrentInteractionLinear(): boolean {
    let interactionId = this.getCurrentInteractionId();
    return interactionId && INTERACTION_SPECS[interactionId].is_linear;
  }

  isCurrentInteractionTrivial(): boolean {
    let interactionId = this.getCurrentInteractionId();
    let array: string[] = [...AppConstants.INTERACTION_IDS_WITHOUT_ANSWER_DETAILS];
    return array.indexOf(
      interactionId) !== -1;
  }

  isLinearWithNoFeedback(outcome: Outcome): boolean {
    // Returns false if current interaction is linear and has no
    // feedback.
    if (outcome && typeof outcome === 'object' &&
      outcome.constructor.name === 'Outcome') {
      return this.isCurrentInteractionLinear() &&
        !outcome.hasNonemptyFeedback();
    }
    return false;
  }

  getOutcomeTooltip(outcome: Outcome): string {
    if (this.isSelfLoopThatIsMarkedCorrect(outcome)) {
      return 'Self-loops should not be labelled as correct.';
    }

    // Outcome tooltip depends on whether feedback is displayed.
    if (this.isLinearWithNoFeedback(outcome)) {
      return 'Please direct the learner to a different card.';
    } else {
      return 'Please give Oppia something useful to say,' +
             ' or direct the learner to a different card.';
    }
  }

  openAddAnswerGroupModal(): void {
    this.alertsService.clearWarnings();
    this.externalSaveService.onExternalSave.emit();
    let stateName = this.stateEditorService.getActiveStateName();
    let addState = this.addState;
    let currentInteractionId = this.getCurrentInteractionId();

    let modalRef = this.ngbModal.open(AddAnswerGroupModalComponent, {
      backdrop: 'static',
    });

    modalRef.componentInstance.addState.subscribe(
      (value: string) => {
        addState(value);
      });

    modalRef.componentInstance.currentInteractionId = currentInteractionId;
    modalRef.componentInstance.stateName = stateName;

    modalRef.result.then((result) => {
      this.stateNextContentIdIndexService.saveDisplayedValue();
      this.onSaveNextContentIdIndex(
        this.stateNextContentIdIndexService.displayed);

      // Create a new answer group.
      this.answerGroups.push(this.answerGroupObjectFactory.createNew(
        [result.tmpRule], result.tmpOutcome, [],
        result.tmpTaggedSkillMisconceptionId));
      this.responsesService.save(
        this.answerGroups, this.defaultOutcome,
        (newAnswerGroups, newDefaultOutcome) => {
          this.onSaveInteractionAnswerGroups(newAnswerGroups);
          this.onSaveInteractionDefaultOutcome(newDefaultOutcome);
          this.refreshWarnings()();
        });
      this.changeActiveAnswerGroupIndex(
        this.answerGroups.length - 1);

      // After saving it, check if the modal should be reopened right
      // away.
      if (result.reopen) {
        this.openAddAnswerGroupModal();
      }
    }, () => {
      this.alertsService.clearWarnings();
    });
  }

  deleteAnswerGroup(value): void {
    // Prevent clicking on the delete button from also toggling the
    // display state of the answer group.
    value.evt.stopPropagation();

    this.alertsService.clearWarnings();
    this.ngbModal.open(DeleteAnswerGroupModalComponent, {
      backdrop: true,
    }).result.then(() => {
      this.responsesService.deleteAnswerGroup(
        value.index, (newAnswerGroups) => {
          this.onSaveInteractionAnswerGroups(newAnswerGroups);
          this.refreshWarnings()();
        });
    }, () => {
      this.alertsService.clearWarnings();
    });
  }

  verifyAndUpdateInapplicableSkillMisconceptionIds(): void {
    let answerGroups = this.responsesService.getAnswerGroups();
    let taggedSkillMisconceptionIds = [];
    for (let i = 0; i < answerGroups.length; i++) {
      if (!answerGroups[i].outcome.labelledAsCorrect &&
          answerGroups[i].taggedSkillMisconceptionId !== null) {
        taggedSkillMisconceptionIds.push(
          answerGroups[i].taggedSkillMisconceptionId);
      }
    }
    let commonSkillMisconceptionIds = (
      taggedSkillMisconceptionIds.filter(
        skillMisconceptionId => (
          this.inapplicableSkillMisconceptionIds.includes(
            skillMisconceptionId))));
    if (commonSkillMisconceptionIds.length) {
      commonSkillMisconceptionIds.forEach((skillMisconceptionId => {
        this.inapplicableSkillMisconceptionIds = (
          this.inapplicableSkillMisconceptionIds.filter(
            item => item !== skillMisconceptionId));
      }));
      this.onSaveInapplicableSkillMisconceptionIds(
        this.inapplicableSkillMisconceptionIds);
    }
  }

  saveTaggedMisconception(misconceptionId, skillId): void {
    this.responsesService.updateActiveAnswerGroup({
      taggedSkillMisconceptionId: skillId + '-' + misconceptionId
    }, (newAnswerGroups) => {
      this.onSaveInteractionAnswerGroups(newAnswerGroups);
      this.refreshWarnings()();
    });
  }

  saveActiveAnswerGroupFeedback(updatedOutcome): void {
    this.responsesService.updateActiveAnswerGroup({
      feedback: updatedOutcome.feedback
    }, (newAnswerGroups) => {
      this.onSaveInteractionAnswerGroups(newAnswerGroups);
      this.refreshWarnings()();
    });
  }

  saveActiveAnswerGroupDest(updatedOutcome): void {
    this.responsesService.updateActiveAnswerGroup({
      dest: updatedOutcome.dest,
      refresherExplorationId: updatedOutcome.refresherExplorationId,
      missingPrerequisiteSkillId:
        updatedOutcome.missingPrerequisiteSkillId
    }, (newAnswerGroups) => {
      this.onSaveInteractionAnswerGroups(newAnswerGroups);
      this.refreshWarnings()();
    });
  }

  saveActiveAnswerGroupCorrectnessLabel(
      updatedOutcome): void {
    this.responsesService.updateActiveAnswerGroup({
      labelledAsCorrect: updatedOutcome.labelledAsCorrect
    }, (newAnswerGroups) => {
      this.onSaveInteractionAnswerGroups(newAnswerGroups);
      this.refreshWarnings()();
    });
  }

  saveActiveAnswerGroupRules(updatedRules): void {
    this.responsesService.updateActiveAnswerGroup({
      rules: updatedRules
    }, (newAnswerGroups) => {
      this.onSaveInteractionAnswerGroups(newAnswerGroups);
      this.refreshWarnings()();
    });
  }

  saveDefaultOutcomeFeedback(updatedOutcome): void {
    this.responsesService.updateDefaultOutcome({
      feedback: updatedOutcome.feedback,
      dest: updatedOutcome.dest
    }, (newDefaultOutcome) => {
      this.onSaveInteractionDefaultOutcome(newDefaultOutcome);
    });
  }

  saveDefaultOutcomeDest(updatedOutcome): void {
    this.responsesService.updateDefaultOutcome({
      dest: updatedOutcome.dest,
      refresherExplorationId: updatedOutcome.refresherExplorationId,
      missingPrerequisiteSkillId:
        updatedOutcome.missingPrerequisiteSkillId
    }, (newDefaultOutcome) => {
      this.onSaveInteractionDefaultOutcome(newDefaultOutcome);
    });
  };

  saveDefaultOutcomeCorrectnessLabel(
      updatedOutcome): void {
    this.responsesService.updateDefaultOutcome({
      labelledAsCorrect: updatedOutcome.labelledAsCorrect
    }, (newDefaultOutcome) => {
      this.onSaveInteractionDefaultOutcome(newDefaultOutcome);
    });
  };

  getAnswerChoices(): AnswerChoice[] {
    return this.responsesService.getAnswerChoices();
  };

  summarizeAnswerGroup(
      answerGroup, interactionId: string, answerChoices: AnswerChoice[], shortenRule): string {
    let summary = '';
    let outcome = answerGroup.outcome;
    let hasFeedback = outcome.hasNonemptyFeedback();

    if (answerGroup.rules) {
      let firstRule = $filter('convertToPlainText')(
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
  }

  summarizeDefaultOutcome(
      defaultOutcome, interactionId, answerGroupCount, shortenRule): string {
    if (!defaultOutcome) {
      return '';
    }

    let summary = '';
    let hasFeedback = defaultOutcome.hasNonemptyFeedback();

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

  isOutcomeLooping(outcome): boolean {
    let activeStateName = this.stateName;
    return outcome && (outcome.dest === activeStateName);
  }

  toggleResponseCard(): void {
    this.responseCardIsShown = !this.responseCardIsShown;
  }

  getUnaddressedMisconceptionNames(): any {
    let answerGroups = this.responsesService.getAnswerGroups();
    let taggedSkillMisconceptionIds = {};
    for (let i = 0; i < answerGroups.length; i++) {
      if (!answerGroups[i].outcome.labelledAsCorrect &&
          answerGroups[i].taggedSkillMisconceptionId !== null) {
        taggedSkillMisconceptionIds[
          answerGroups[i].taggedSkillMisconceptionId] = true;
      }
    }
    let unaddressedMisconceptionNames = [];
    Object.keys(this.misconceptionsBySkill).forEach(
      function(skillId) {
        let misconceptions = this.misconceptionsBySkill[skillId];
        for (let i = 0; i < misconceptions.length; i++) {
          if (!misconceptions[i].isMandatory()) {
            continue;
          }
          let skillMisconceptionId = (
            skillId + '-' + misconceptions[i].getId());
          if (!taggedSkillMisconceptionIds.hasOwnProperty(
            skillMisconceptionId)) {
            unaddressedMisconceptionNames.push(
              misconceptions[i].getName());
          }
        }
      });
    return unaddressedMisconceptionNames;
  }

  getOptionalSkillMisconceptionStatus(
      optionalSkillMisconceptionId): string {
    let answerGroups = this.responsesService.getAnswerGroups();
    let taggedSkillMisconceptionIds = [];
    for (let i = 0; i < answerGroups.length; i++) {
      if (!answerGroups[i].outcome.labelledAsCorrect &&
          answerGroups[i].taggedSkillMisconceptionId !== null) {
        taggedSkillMisconceptionIds.push(
          answerGroups[i].taggedSkillMisconceptionId);
      }
    }
    let skillMisconceptionIdIsAssigned = (
      taggedSkillMisconceptionIds.includes(
        optionalSkillMisconceptionId));
    if (skillMisconceptionIdIsAssigned) {
      return 'Assigned';
    }
    return this.inapplicableSkillMisconceptionIds.includes(
      optionalSkillMisconceptionId) ? 'Not Applicable' : '';
  };

  this.updateOptionalMisconceptionIdStatus = function(
      skillMisconceptionId, isApplicable) {
    if (isApplicable) {
      this.inapplicableSkillMisconceptionIds = (
        this.inapplicableSkillMisconceptionIds.filter(
          item => item !== skillMisconceptionId));
    } else {
      this.inapplicableSkillMisconceptionIds.push(
        skillMisconceptionId);
    }
    this.onSaveInapplicableSkillMisconceptionIds(
      this.inapplicableSkillMisconceptionIds);
    this.setActiveEditOption(null);
  };

  this.setActiveEditOption = function(activeEditOption) {
    this.activeEditOption = activeEditOption;
  };

  this.isNoActionExpected = function(skillMisconceptionId) {
    return ['Assigned', 'Not Applicable'].includes(
      this.getOptionalSkillMisconceptionStatus(
        skillMisconceptionId));
  };
}


angular.module('oppia').component('stateResponses', {
  bindings: {
  },
  template: require(''),
  controller: [
    '$filter', '$rootScope', '$scope', 'AlertsService',
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
        $filter, $rootScope, $scope, AlertsService,
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
      let ctrl = this;

      this.$onInit = function() {
        this.SHOW_TRAINABLE_UNRESOLVED_ANSWERS = (
          SHOW_TRAINABLE_UNRESOLVED_ANSWERS);
        this.EditabilityService = EditabilityService;
        this.responseCardIsShown = (
          !WindowDimensionsService.isWindowNarrow());
        this.stateName = this.stateEditorService.getActiveStateName();
        this.enableSolicitAnswerDetailsFeature = (
          ENABLE_SOLICIT_ANSWER_DETAILS_FEATURE);
        this.stateSolicitAnswerDetailsService = (
          StateSolicitAnswerDetailsService);
        this.misconceptionsBySkill = {};
        this.directiveSubscriptions.add(
          this.responsesService.onInitializeAnswerGroups.subscribe((data) => {
            this.responsesService.init(data);
            this.answerGroups = this.responsesService.getAnswerGroups();
            this.defaultOutcome = this.responsesService.getDefaultOutcome();

            // If the creator selects an interaction which has only one
            // possible answer, automatically expand the default response.
            // Otherwise, default to having no responses initially
            // selected.
            if (this.isCurrentInteractionLinear()) {
              this.responsesService.changeActiveAnswerGroupIndex(0);
            }

            // Initialize training data for these answer groups.
            _initializeTrainingData();

            this.activeAnswerGroupIndex = (
              this.responsesService.getActiveAnswerGroupIndex());
            ExternalSaveService.onExternalSave.emit();
          })
        );

        this.getStaticImageUrl = function(imagePath) {
          return UrlInterpolationService.getStaticImageUrl(imagePath);
        };

        this.directiveSubscriptions.add(
          StateInteractionIdService.onInteractionIdChanged.subscribe(
            (newInteractionId) => {
              ExternalSaveService.onExternalSave.emit();
              this.responsesService.onInteractionIdChanged(
                newInteractionId,
                function(newAnswerGroups, newDefaultOutcome) {
                  this.onSaveInteractionDefaultOutcome(
                    newDefaultOutcome);
                  this.onSaveInteractionAnswerGroups(newAnswerGroups);
                  this.refreshWarnings()();
                  this.answerGroups = this.responsesService.getAnswerGroups();
                  this.defaultOutcome =
                    this.responsesService.getDefaultOutcome();

                  // Reinitialize training data if the interaction ID is
                  // changed.
                  _initializeTrainingData();

                  this.activeAnswerGroupIndex = (
                    this.responsesService.getActiveAnswerGroupIndex());
                });

              // Prompt the user to create a new response if it is not a
              // linear or non-terminal interaction and if an actual
              // interaction is specified (versus one being deleted).
              if (newInteractionId &&
                  !INTERACTION_SPECS[newInteractionId].is_linear &&
                  !INTERACTION_SPECS[newInteractionId].is_terminal) {
                this.openAddAnswerGroupModal();
              }
            }
          )
        );

        this.directiveSubscriptions.add(
          this.responsesService.onAnswerGroupsChanged.subscribe(
            () => {
              this.answerGroups = this.responsesService.getAnswerGroups();
              this.defaultOutcome = this.responsesService.getDefaultOutcome();
              this.activeAnswerGroupIndex =
              this.responsesService.getActiveAnswerGroupIndex();
              verifyAndUpdateInapplicableSkillMisconceptionIds();
            }
          ));
        this.directiveSubscriptions.add(
          this.stateEditorService.onUpdateAnswerChoices.subscribe(
            (newAnswerChoices) => {
              this.responsesService.updateAnswerChoices(newAnswerChoices);
            })
        );

        this.directiveSubscriptions.add(
          this.stateEditorService.onHandleCustomArgsUpdate.subscribe(
            (newAnswerChoices) => {
              this.responsesService.handleCustomArgsUpdate(
                newAnswerChoices, function(newAnswerGroups) {
                  this.onSaveInteractionAnswerGroups(newAnswerGroups);
                  this.refreshWarnings()();
                });
            }
          )
        );

        this.directiveSubscriptions.add(
          this.stateEditorService.onStateEditorInitialized.subscribe(
            () => {
              this.misconceptionsBySkill = (
                this.stateEditorService.getMisconceptionsBySkill());
              this.containsOptionalMisconceptions = (
                Object.values(this.misconceptionsBySkill).some(
                  (misconceptions: Misconception[]) => misconceptions.some(
                    misconception => !misconception.isMandatory())));
            })
        );

        // When the page is scrolled so that the top of the page is above
        // the browser viewport, there are some bugs in the positioning of
        // the helper. This is a bug in jQueryUI that has not been fixed
        // yet. For more details, see http://stackoverflow.com/q/5791886
        this.ANSWER_GROUP_LIST_SORTABLE_OPTIONS = {
          axis: 'y',
          cursor: 'move',
          handle: '.oppia-rule-sort-handle',
          items: '.oppia-sortable-rule-block',
          revert: 100,
          tolerance: 'pointer',
          start: function(e, ui) {
            ExternalSaveService.onExternalSave.emit();
            this.changeActiveAnswerGroupIndex(-1);
            ui.placeholder.height(ui.item.height());
          },
          stop: function() {
            this.responsesService.save(
              this.answerGroups, this.defaultOutcome,
              function(newAnswerGroups, newDefaultOutcome) {
                this.onSaveInteractionAnswerGroups(newAnswerGroups);
                this.onSaveInteractionDefaultOutcome(newDefaultOutcome);
                this.refreshWarnings()();
              });
          }
        };
        if (this.stateEditorService.isInQuestionMode()) {
          this.onResponsesInitialized();
        }
        this.stateEditorService.updateStateResponsesInitialised();
        this.inapplicableSkillMisconceptionIds = (
          this.stateEditorService.getInapplicableSkillMisconceptionIds());
        this.activeEditOption = null;
      };
      this.$onDestroy = function() {
        this.directiveSubscriptions.unsubscribe();
      };
    }
  ]
});
