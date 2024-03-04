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
 * @fileoverview Component for managing the state responses in the state
 * editor.
 */

import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { AddAnswerGroupModalComponent } from 'pages/exploration-editor-page/editor-tab/templates/modal-templates/add-answer-group-modal.component';
import { DeleteAnswerGroupModalComponent } from 'pages/exploration-editor-page/editor-tab/templates/modal-templates/delete-answer-group-modal.component';
import { Misconception, MisconceptionSkillMap, TaggedMisconception } from 'domain/skill/MisconceptionObjectFactory';
import { Subscription } from 'rxjs';
import { AnswerChoice, StateEditorService } from '../state-editor-properties-services/state-editor.service';
import { ResponsesService } from 'pages/exploration-editor-page/editor-tab/services/responses.service';
import { StateSolicitAnswerDetailsService } from '../state-editor-properties-services/state-solicit-answer-details.service';
import { ExternalSaveService } from 'services/external-save.service';
import { StateInteractionIdService } from '../state-editor-properties-services/state-interaction-id.service';
import { AppConstants } from 'app.constants';
import INTERACTION_SPECS from 'interactions/interaction_specs.json';
import { Outcome } from 'domain/exploration/OutcomeObjectFactory';
import { AlertsService } from 'services/alerts.service';
import { AnswerGroup, AnswerGroupObjectFactory } from 'domain/exploration/AnswerGroupObjectFactory';
import { Interaction } from 'domain/exploration/InteractionObjectFactory';
import { Rule } from 'domain/exploration/rule.model';
import { ParameterizeRuleDescriptionPipe } from 'filters/parameterize-rule-description.pipe';
import { ConvertToPlainTextPipe } from 'filters/string-utility-filters/convert-to-plain-text.pipe';
import { TruncatePipe } from 'filters/string-utility-filters/truncate.pipe';
import { WrapTextWithEllipsisPipe } from 'filters/string-utility-filters/wrap-text-with-ellipsis.pipe';
import { CdkDragSortEvent, moveItemInArray} from '@angular/cdk/drag-drop';
import { EditabilityService } from 'services/editability.service';
import { GenerateContentIdService } from 'services/generate-content-id.service';
import { InteractionSpecsKey } from 'pages/interaction-specs.constants';


@Component({
  selector: 'oppia-state-responses',
  templateUrl: './state-responses.component.html'
})
export class StateResponsesComponent implements OnInit, OnDestroy {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() addState!: (value: string) => void;
  inapplicableSkillMisconceptionIds!: string[];
  // If the interaction is terminal, then the default outcome is null.
  defaultOutcome!: Outcome | null;
  misconceptionsBySkill!: MisconceptionSkillMap;
  activeAnswerGroupIndex!: number;
  // State name is null if their is no state selected or have no active state.
  // This is the case when the user is creating a new state.
  @Output() onResponsesInitialized = new EventEmitter<void>();
  @Output() onSaveInteractionAnswerGroups = (
    new EventEmitter<AnswerGroup[] | AnswerGroup>());

  @Output() onSaveInteractionDefaultOutcome = (
    new EventEmitter<Outcome | null>());

  @Output() onSaveNextContentIdIndex = new EventEmitter<number>();
  @Output() onSaveSolicitAnswerDetails = new EventEmitter<boolean>();
  @Output() navigateToState = new EventEmitter<string>();
  @Output() refreshWarnings = new EventEmitter<void>();

  @Output() onSaveInapplicableSkillMisconceptionIds = (
    new EventEmitter<string[]>());

  directiveSubscriptions = new Subscription();
  activeEditOption: boolean = false;
  answerGroups: AnswerGroup[] = [];
  SHOW_TRAINABLE_UNRESOLVED_ANSWERS: boolean = false;
  responseCardIsShown: boolean = false;
  enableSolicitAnswerDetailsFeature: boolean = false;
  containsOptionalMisconceptions: boolean = false;

  constructor(
    private stateEditorService: StateEditorService,
    private responsesService: ResponsesService,
    private stateSolicitAnswerDetailsService: StateSolicitAnswerDetailsService,
    private externalSaveService: ExternalSaveService,
    private stateInteractionIdService: StateInteractionIdService,
    private alertsService: AlertsService,
    private ngbModal: NgbModal,
    private generateContentIdService: GenerateContentIdService,
    private answerGroupObjectFactory: AnswerGroupObjectFactory,
    private urlInterpolationService: UrlInterpolationService,
    private convertToPlainText: ConvertToPlainTextPipe,
    private parameterizeRuleDescription: ParameterizeRuleDescriptionPipe,
    private truncate: TruncatePipe,
    private wrapTextWithEllipsis: WrapTextWithEllipsisPipe,
    private editabilityService: EditabilityService,
  ) {}

  sendOnSaveNextContentIdIndex(event: number): void {
    this.onSaveNextContentIdIndex.emit(event);
  }

  drop(event: CdkDragSortEvent<AnswerGroup[]>): void {
    moveItemInArray(
      this.answerGroups, event.previousIndex,
      event.currentIndex);

    this.responsesService.save(
      this.answerGroups, this.defaultOutcome,
      (newAnswerGroups, newDefaultOutcome) => {
        this.onSaveInteractionAnswerGroups.emit(newAnswerGroups);
        this.onSaveInteractionDefaultOutcome.emit(newDefaultOutcome);
        this.refreshWarnings.emit();
      });
  }

  _initializeTrainingData(): void {
    if (this.stateEditorService.isInQuestionMode()) {
      return;
    }
  }

  isInQuestionMode(): boolean {
    return this.stateEditorService.isInQuestionMode();
  }

  shouldHideDefaultAnswerGroup(): boolean {
    return this.responsesService.shouldHideDefaultAnswerGroup();
  }

  onChangeSolicitAnswerDetails(): void {
    this.onSaveSolicitAnswerDetails.emit(
      this.stateSolicitAnswerDetailsService.displayed);
    this.stateSolicitAnswerDetailsService.saveDisplayedValue();
  }

  getActiveStateName(): string | null {
    return this.stateEditorService.getActiveStateName();
  }

  isSelfLoopWithNoFeedback(outcome: Outcome): boolean | void {
    let currentStateName = this.getActiveStateName();
    if (outcome && typeof outcome === 'object' && currentStateName &&
      outcome.constructor.name === 'Outcome') {
      return outcome.isConfusing(currentStateName);
    }
  }

  isSelfLoopThatIsMarkedCorrect(outcome: Outcome): boolean {
    if (!outcome) {
      return false;
    } else {
      const currentStateName = this.getActiveStateName();
      return (
        (outcome.dest === currentStateName) &&
        outcome.labelledAsCorrect);
    }
  }

  changeActiveAnswerGroupIndex(newIndex: number): void {
    this.externalSaveService.onExternalSave.emit();
    this.responsesService.changeActiveAnswerGroupIndex(newIndex);
    this.activeAnswerGroupIndex = (
      this.responsesService.getActiveAnswerGroupIndex());
  }

  getCurrentInteractionId(): string {
    return this.stateInteractionIdService.savedMemento;
  }

  isCreatingNewState(outcome: Outcome): boolean {
    return (outcome && outcome.dest === AppConstants.PLACEHOLDER_OUTCOME_DEST);
  }

  // This returns false if the current interaction ID is null.
  isCurrentInteractionLinear(): boolean {
    let interactionId = this.getCurrentInteractionId();
    return Boolean(interactionId) && INTERACTION_SPECS[
      interactionId as InteractionSpecsKey].is_linear;
  }

  isCurrentInteractionTrivial(): boolean {
    let interactionId = this.getCurrentInteractionId();
    let array: string[] = [
      ...AppConstants.INTERACTION_IDS_WITHOUT_ANSWER_DETAILS];
    return array.indexOf(
      interactionId) !== -1;
  }

  isLinearWithNoFeedback(outcome: Outcome): boolean | void {
    // Returns false if current interaction is linear and has no
    // feedback.
    if (outcome && typeof outcome === 'object' &&
      outcome.constructor.name === 'Outcome') {
      return this.isCurrentInteractionLinear() &&
        !outcome.hasNonemptyFeedback();
    }
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
      this.onSaveNextContentIdIndex.emit();

      // Create a new answer group.
      this.answerGroups.push(this.answerGroupObjectFactory.createNew(
        [result.tmpRule], result.tmpOutcome, [],
        result.tmpTaggedSkillMisconceptionId));
      this.responsesService.save(
        this.answerGroups, this.defaultOutcome,
        (newAnswerGroups, newDefaultOutcome) => {
          this.onSaveInteractionAnswerGroups.emit(newAnswerGroups);
          this.onSaveInteractionDefaultOutcome.emit(newDefaultOutcome);
          this.refreshWarnings.emit();
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
      this.generateContentIdService.revertUnusedContentIdIndex();
    });
  }

  deleteAnswerGroup(evt: Event, index: number): void {
    // Prevent clicking on the delete button from also toggling the
    // display state of the answer group.
    evt.stopPropagation();

    this.alertsService.clearWarnings();
    this.ngbModal.open(DeleteAnswerGroupModalComponent, {
      backdrop: true,
    }).result.then(() => {
      this.responsesService.deleteAnswerGroup(
        index, (newAnswerGroups) => {
          this.onSaveInteractionAnswerGroups.emit(newAnswerGroups);
          this.refreshWarnings.emit();
        });
    }, () => {
      this.alertsService.clearWarnings();
    });
  }

  verifyAndUpdateInapplicableSkillMisconceptionIds(): void {
    let answerGroups = this.responsesService.getAnswerGroups();
    let taggedSkillMisconceptionIds: string[] = [];
    for (let i = 0; i < answerGroups.length; i++) {
      let taggedSkillMisconceptionId = (
        answerGroups[i].taggedSkillMisconceptionId);
      if (!answerGroups[i].outcome.labelledAsCorrect &&
          taggedSkillMisconceptionId !== null) {
        taggedSkillMisconceptionIds.push(
          taggedSkillMisconceptionId);
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
      this.onSaveInapplicableSkillMisconceptionIds.emit(
        this.inapplicableSkillMisconceptionIds);
    }
  }

  saveTaggedMisconception(taggedMisconception: TaggedMisconception): void {
    const { skillId, misconceptionId } = taggedMisconception;
    this.responsesService.updateActiveAnswerGroup({
      taggedSkillMisconceptionId: skillId + '-' + misconceptionId
    } as AnswerGroup, (newAnswerGroups) => {
      this.onSaveInteractionAnswerGroups.emit(newAnswerGroups);
      this.refreshWarnings.emit();
    });
  }

  saveActiveAnswerGroupFeedback(updatedOutcome: Outcome): void {
    this.responsesService.updateActiveAnswerGroup({
      feedback: updatedOutcome.feedback
    }, (newAnswerGroups) => {
      this.onSaveInteractionAnswerGroups.emit(newAnswerGroups);
      this.refreshWarnings.emit();
    });
  }

  saveActiveAnswerGroupDest(updatedOutcome: Outcome): void {
    this.responsesService.updateActiveAnswerGroup({
      dest: updatedOutcome.dest,
      refresherExplorationId: updatedOutcome.refresherExplorationId,
      missingPrerequisiteSkillId:
        updatedOutcome.missingPrerequisiteSkillId
    }, (newAnswerGroups) => {
      this.onSaveInteractionAnswerGroups.emit(newAnswerGroups);
      this.refreshWarnings.emit();
    });
  }

  saveActiveAnswerGroupDestIfStuck(updatedOutcome: Outcome): void {
    this.responsesService.updateActiveAnswerGroup({
      destIfReallyStuck: updatedOutcome.destIfReallyStuck,
    } as typeof updatedOutcome, (newAnswerGroups) => {
      this.onSaveInteractionAnswerGroups.emit(newAnswerGroups);
      this.refreshWarnings.emit();
    });
  }

  saveActiveAnswerGroupCorrectnessLabel(
      updatedOutcome: Outcome): void {
    this.responsesService.updateActiveAnswerGroup({
      labelledAsCorrect: updatedOutcome.labelledAsCorrect
    }, (newAnswerGroups) => {
      this.onSaveInteractionAnswerGroups.emit(newAnswerGroups);
      this.refreshWarnings.emit();
    });
  }

  saveActiveAnswerGroupRules(updatedRules: Rule[]): void {
    this.responsesService.updateActiveAnswerGroup({
      rules: updatedRules
    } as AnswerGroup, (newAnswerGroups) => {
      this.onSaveInteractionAnswerGroups.emit(newAnswerGroups);
      this.refreshWarnings.emit();
    });
  }

  saveDefaultOutcomeFeedback(updatedOutcome: Outcome): void {
    this.responsesService.updateDefaultOutcome({
      feedback: updatedOutcome.feedback,
      dest: updatedOutcome.dest
    } as Outcome, (newDefaultOutcome) => {
      this.onSaveInteractionDefaultOutcome.emit(newDefaultOutcome);
    });
  }

  saveDefaultOutcomeDest(updatedOutcome: Outcome): void {
    this.responsesService.updateDefaultOutcome({
      dest: updatedOutcome.dest,
      refresherExplorationId: updatedOutcome.refresherExplorationId,
      missingPrerequisiteSkillId:
        updatedOutcome.missingPrerequisiteSkillId
    } as Outcome, (newDefaultOutcome) => {
      this.onSaveInteractionDefaultOutcome.emit(newDefaultOutcome);
    });
  }

  saveDefaultOutcomeDestIfStuck(updatedOutcome: Outcome): void {
    this.responsesService.updateDefaultOutcome({
      destIfReallyStuck: updatedOutcome.destIfReallyStuck
    } as Outcome, (newDefaultOutcome) => {
      this.onSaveInteractionDefaultOutcome.emit(newDefaultOutcome);
    });
  }

  saveDefaultOutcomeCorrectnessLabel(
      updatedOutcome: Outcome): void {
    this.responsesService.updateDefaultOutcome({
      labelledAsCorrect: updatedOutcome.labelledAsCorrect
    } as Outcome, (newDefaultOutcome) => {
      this.onSaveInteractionDefaultOutcome.emit(newDefaultOutcome);
    });
  }

  getAnswerChoices(): AnswerChoice[] {
    return this.responsesService.getAnswerChoices();
  }

  summarizeAnswerGroup(
      answerGroup: AnswerGroup, interactionId: string,
      answerChoices: AnswerChoice[], shortenRule: boolean
  ): string {
    let summary = '';
    let outcome = answerGroup.outcome;
    let hasFeedback = outcome.hasNonemptyFeedback();

    if (answerGroup.rules) {
      let firstRule = this.convertToPlainText.transform(
        this.parameterizeRuleDescription.transform(
          answerGroup.rules[0], interactionId, answerChoices));
      summary = 'Answer ' + firstRule;

      if (hasFeedback && shortenRule) {
        summary = this.wrapTextWithEllipsis.transform(
          summary, AppConstants.RULE_SUMMARY_WRAP_CHARACTER_COUNT);
      }
      summary = '[' + summary + '] ';
    }

    if (hasFeedback) {
      summary += (
        shortenRule ?
          this.truncate.transform(outcome.feedback.html, 30) :
          this.convertToPlainText.transform(outcome.feedback.html));
    }
    return summary;
  }

  summarizeDefaultOutcome(
      defaultOutcome: Outcome, interactionId: string,
      answerGroupCount: number, shortenRule: boolean
  ): string {
    if (!defaultOutcome) {
      return '';
    }

    let summary = '';
    let hasFeedback = defaultOutcome.hasNonemptyFeedback();

    if (interactionId && INTERACTION_SPECS[
      interactionId as InteractionSpecsKey].is_linear) {
      let defaultOutcomeHeading = INTERACTION_SPECS[
        interactionId as InteractionSpecsKey].default_outcome_heading;
      if (defaultOutcomeHeading) {
        summary = defaultOutcomeHeading;
      }
    } else if (answerGroupCount > 0) {
      summary = 'All other answers';
    } else {
      summary = 'All answers';
    }

    if (hasFeedback && shortenRule) {
      summary = this.wrapTextWithEllipsis.transform(
        summary, AppConstants.RULE_SUMMARY_WRAP_CHARACTER_COUNT);
    }
    summary = '[' + summary + '] ';

    if (hasFeedback) {
      summary +=
        this.convertToPlainText.transform(defaultOutcome.feedback.html);
    }
    return summary;
  }

  isOutcomeLooping(outcome: Outcome): boolean {
    let activeStateName = this.getActiveStateName();
    return outcome && (outcome.dest === activeStateName);
  }

  toggleResponseCard(): void {
    this.responseCardIsShown = !this.responseCardIsShown;
  }

  getUnaddressedMisconceptionNames(): string[] {
    let answerGroups = this.responsesService.getAnswerGroups();
    let taggedSkillMisconceptionIds: Record<string, boolean> = {};
    for (let i = 0; i < answerGroups.length; i++) {
      let taggedSkillMisconceptionId = (
        answerGroups[i].taggedSkillMisconceptionId);
      if (!answerGroups[i].outcome.labelledAsCorrect &&
          taggedSkillMisconceptionId !== null) {
        taggedSkillMisconceptionIds[taggedSkillMisconceptionId] = true;
      }
    }
    let unaddressedMisconceptionNames: string[] = [];
    Object.keys(this.misconceptionsBySkill).forEach(
      (skillId) => {
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
      optionalSkillMisconceptionId: string): string {
    let answerGroups = this.responsesService.getAnswerGroups();
    let taggedSkillMisconceptionIds = [];
    for (let i = 0; i < answerGroups.length; i++) {
      let taggedSkillMisconceptionId = (
        answerGroups[i].taggedSkillMisconceptionId);
      if (!answerGroups[i].outcome.labelledAsCorrect &&
          taggedSkillMisconceptionId !== null) {
        taggedSkillMisconceptionIds.push(taggedSkillMisconceptionId);
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
  }

  updateOptionalMisconceptionIdStatus(
      skillMisconceptionId: string, isApplicable: boolean): void {
    if (isApplicable) {
      this.inapplicableSkillMisconceptionIds = (
        this.inapplicableSkillMisconceptionIds.filter(
          item => item !== skillMisconceptionId));
    } else {
      this.inapplicableSkillMisconceptionIds.push(
        skillMisconceptionId);
    }
    this.onSaveInapplicableSkillMisconceptionIds.emit(
      this.inapplicableSkillMisconceptionIds);
    this.setActiveEditOption(false);
  }

  setActiveEditOption(activeEditOption: boolean): void {
    this.activeEditOption = activeEditOption;
  }

  isNoActionExpected(skillMisconceptionId: string): boolean {
    return ['Assigned', 'Not Applicable'].includes(
      this.getOptionalSkillMisconceptionStatus(
        skillMisconceptionId));
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  ngOnInit(): void {
    this.SHOW_TRAINABLE_UNRESOLVED_ANSWERS = (
      AppConstants.SHOW_TRAINABLE_UNRESOLVED_ANSWERS);
    this.responseCardIsShown = true;
    this.enableSolicitAnswerDetailsFeature = (
      AppConstants.ENABLE_SOLICIT_ANSWER_DETAILS_FEATURE);
    this.misconceptionsBySkill = {};
    this.directiveSubscriptions.add(
      this.responsesService.onInitializeAnswerGroups.subscribe((data) => {
        this.responsesService.init(data as Interaction);
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
        this._initializeTrainingData();

        this.activeAnswerGroupIndex = (
          this.responsesService.getActiveAnswerGroupIndex());
        this.externalSaveService.onExternalSave.emit();
      })
    );

    this.directiveSubscriptions.add(
      this.stateInteractionIdService.onInteractionIdChanged.subscribe(
        (newInteractionId) => {
          this.externalSaveService.onExternalSave.emit();
          this.responsesService.onInteractionIdChanged(
            newInteractionId,
            (newAnswerGroups, newDefaultOutcome) => {
              this.onSaveInteractionDefaultOutcome.emit(
                newDefaultOutcome);
              this.onSaveInteractionAnswerGroups.emit(newAnswerGroups);
              this.refreshWarnings.emit();
              this.answerGroups = this.responsesService.getAnswerGroups();
              this.defaultOutcome =
                this.responsesService.getDefaultOutcome();

              // Reinitialize training data if the interaction ID is
              // changed.
              this._initializeTrainingData();

              this.activeAnswerGroupIndex = (
                this.responsesService.getActiveAnswerGroupIndex());
            });

          // Prompt the user to create a new response if it is not a
          // linear or non-terminal interaction and if an actual
          // interaction is specified (versus one being deleted).
          if (newInteractionId &&
              !INTERACTION_SPECS[
                newInteractionId as InteractionSpecsKey].is_linear &&
              !INTERACTION_SPECS[
                newInteractionId as InteractionSpecsKey].is_terminal) {
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
          this.verifyAndUpdateInapplicableSkillMisconceptionIds();
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
            newAnswerChoices, (newAnswerGroups) => {
              this.onSaveInteractionAnswerGroups.emit(newAnswerGroups);
              this.refreshWarnings.emit();
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

    if (this.stateEditorService.isInQuestionMode()) {
      this.onResponsesInitialized.emit();
    }
    this.stateEditorService.updateStateResponsesInitialised();
    this.inapplicableSkillMisconceptionIds = (
      this.stateEditorService.getInapplicableSkillMisconceptionIds());
    this.activeEditOption = false;
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive('oppiaStateResponses',
  downgradeComponent({
    component: StateResponsesComponent
  }) as angular.IDirectiveFactory);
