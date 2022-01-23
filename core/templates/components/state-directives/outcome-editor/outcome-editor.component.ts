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
 * @fileoverview Component for the outcome editor.
 */

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import cloneDeep from 'lodash/cloneDeep';
import { AppConstants } from 'app.constants';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { StateInteractionIdService } from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { Outcome } from 'domain/exploration/OutcomeObjectFactory';
import { Subscription } from 'rxjs';
import { ExternalSaveService } from 'services/external-save.service';
import INTERACTION_SPECS from 'interactions/interaction_specs.json';

@Component({
  selector: 'oppia-outcome-editor',
  templateUrl: './outcome-editor.component.html'
})
export class OutcomeEditorComponent implements OnInit {
  @Input() displayFeedback: boolean;
  @Input() isEditable: boolean;
  @Input() outcome;
  @Input() outcomeHasFeedback: boolean = false;
  @Input() warningsAreSuppressed: boolean;
  @Input() showMarkAllAudioAsNeedingUpdateModalIfRequired;
  @Output() saveDest: EventEmitter<string> = new EventEmitter();
  @Output() saveFeedback: EventEmitter<string> = new EventEmitter();
  @Output() saveCorrectnessLabel: EventEmitter<string> = new EventEmitter();
  directiveSubscriptions = new Subscription();
  ENABLE_PREREQUISITE_SKILLS = AppConstants.ENABLE_PREREQUISITE_SKILLS;
  canAddPrerequisiteSkill: boolean;
  feedbackEditorIsOpen: boolean;
  editOutcomeForm;
  destinationEditorIsOpen;
  correctnessLabelEditorIsOpen;
  savedOutcome;


  constructor(
    private externalSaveService: ExternalSaveService,
    private stateEditorService: StateEditorService,
    private stateInteractionIdService: StateInteractionIdService,
  ) {}

  isInQuestionMode(): boolean {
    return this.stateEditorService.isInQuestionMode();
  }

  isCorrectnessFeedbackEnabled(): boolean {
    return this.stateEditorService.getCorrectnessFeedbackEnabled();
  }

  // This returns false if the current interaction ID is null.
  isCurrentInteractionLinear(): boolean {
    let interactionId = this.getCurrentInteractionId();
    return interactionId && INTERACTION_SPECS[interactionId].is_linear;
  }

  onExternalSave(): void {
    // The reason for this guard is because, when the editor page for an
    // exploration is first opened, the 'initializeAnswerGroups' event
    // (which fires an 'externalSave' event) only fires after the
    // this.savedOutcome is set above. Until then, this.savedOutcome
    // is undefined.
    if (this.savedOutcome === undefined) {
      this.savedOutcome = cloneDeep(this.outcome);
    }

    if (this.feedbackEditorIsOpen) {
      if (this.editOutcomeForm.editFeedbackForm.$valid &&
          !this.invalidStateAfterFeedbackSave()) {
        this.saveThisFeedback(false);
      } else {
        this.cancelThisFeedbackEdit();
      }
    }

    if (this.destinationEditorIsOpen) {
      if (this.editOutcomeForm.editDestForm.$valid &&
          !this.invalidStateAfterDestinationSave()) {
        this.saveThisDestination();
      } else {
        this.cancelThisDestinationEdit();
      }
    }
  }

  isFeedbackLengthExceeded(): boolean {
    // TODO(#13764): Edit this check after appropriate limits are found.
    return (this.outcome.feedback._html.length > 10000);
  }

  isSelfLoop(outcome: Outcome): boolean {
    return (
      outcome &&
      outcome.dest === this.stateEditorService.getActiveStateName());
  }

  getCurrentInteractionId(): string {
    return this.stateInteractionIdService.savedMemento;
  }

  isSelfLoopWithNoFeedback(outcome: Outcome): boolean {
    if (outcome && typeof outcome === 'object' &&
      outcome.constructor.name === 'Outcome') {
      return this.isSelfLoop(outcome) &&
        !outcome.hasNonemptyFeedback();
    }
    return false;
  }

  invalidStateAfterFeedbackSave(): boolean {
    let tmpOutcome = cloneDeep(this.savedOutcome);
    tmpOutcome.feedback = cloneDeep(this.outcome.feedback);
    return this.isSelfLoopWithNoFeedback(tmpOutcome);
  }

  invalidStateAfterDestinationSave(): boolean {
    let tmpOutcome = cloneDeep(this.savedOutcome);
    tmpOutcome.dest = cloneDeep(this.outcome.dest);
    return this.isSelfLoopWithNoFeedback(tmpOutcome);
  }

  openFeedbackEditor(): void {
    if (this.isEditable) {
      this.feedbackEditorIsOpen = true;
    }
  }

  openDestinationEditor(): void {
    if (this.isEditable) {
      this.destinationEditorIsOpen = true;
    }
  }

  saveThisFeedback(fromClickSaveFeedbackButton: boolean): void {
    this.feedbackEditorIsOpen = false;
    let contentHasChanged = (
      this.savedOutcome.feedback.html !==
      this.outcome.feedback.html);
    this.savedOutcome.feedback = cloneDeep(
      this.outcome.feedback);

    if (this.stateEditorService.isInQuestionMode()) {
      this.savedOutcome.dest = null;
    } else if (
      this.savedOutcome.dest === this.outcome.dest &&
        !this.stateEditorService.getStateNames().includes(
          this.outcome.dest)) {
      // If the stateName has changed and previously saved
      // destination points to the older name, update it to
      // the active state name.
      this.savedOutcome.dest = this.stateEditorService.getActiveStateName();
    }
    if (fromClickSaveFeedbackButton && contentHasChanged) {
      let contentId = this.savedOutcome.feedback.contentId;
      this.showMarkAllAudioAsNeedingUpdateModalIfRequired([contentId]);
    }
    this.saveFeedback.emit(this.savedOutcome);
  }

  saveThisDestination(): void {
    this.stateEditorService.onSaveOutcomeDestDetails.emit();
    this.destinationEditorIsOpen = false;
    this.savedOutcome.dest = cloneDeep(this.outcome.dest);
    if (!this.isSelfLoop(this.outcome)) {
      this.outcome.refresherExplorationId = null;
    }
    this.savedOutcome.refresherExplorationId = (
      this.outcome.refresherExplorationId);
    this.savedOutcome.missingPrerequisiteSkillId =
      this.outcome.missingPrerequisiteSkillId;

    this.saveDest.emit(this.savedOutcome);
  }

  onChangeCorrectnessLabel(): void {
    this.savedOutcome.labelledAsCorrect = (
      this.outcome.labelledAsCorrect);

    this.saveCorrectnessLabel.emit(this.savedOutcome);
  }

  cancelThisFeedbackEdit(): void {
    this.outcome.feedback = cloneDeep(
      this.savedOutcome.feedback);
    this.feedbackEditorIsOpen = false;
  }

  cancelThisDestinationEdit(): void {
    this.outcome.dest = cloneDeep(this.savedOutcome.dest);
    this.outcome.refresherExplorationId = (
      this.savedOutcome.refresherExplorationId);
    this.outcome.missingPrerequisiteSkillId =
      this.savedOutcome.missingPrerequisiteSkillId;
    this.destinationEditorIsOpen = false;
  }

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.externalSaveService.onExternalSave.subscribe(
        () => this.onExternalSave()
      )
    );
    this.directiveSubscriptions.add(
      this.stateInteractionIdService.onInteractionIdChanged.subscribe(
        () => this.onExternalSave())
    );
    this.editOutcomeForm = {};
    this.canAddPrerequisiteSkill = (
      this.ENABLE_PREREQUISITE_SKILLS &&
      this.stateEditorService.isExplorationWhitelisted());
    this.feedbackEditorIsOpen = false;
    this.destinationEditorIsOpen = false;
    this.correctnessLabelEditorIsOpen = false;
    // TODO(sll): Investigate whether this line can be removed, due to
    // this.savedOutcome now being set in onExternalSave().
    this.savedOutcome = cloneDeep(this.outcome);
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive('oppiaOutcomeEditor',
  downgradeComponent({component: OutcomeEditorComponent}));
