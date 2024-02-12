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

import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import cloneDeep from 'lodash/cloneDeep';
import { AppConstants } from 'app.constants';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { StateInteractionIdService } from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { Outcome } from 'domain/exploration/OutcomeObjectFactory';
import { Subscription } from 'rxjs';
import { ExternalSaveService } from 'services/external-save.service';
import INTERACTION_SPECS from 'interactions/interaction_specs.json';
import { InteractionSpecsKey } from 'pages/interaction-specs.constants';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AddOutcomeModalComponent } from 'pages/exploration-editor-page/editor-tab/templates/modal-templates/add-outcome-modal.component';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';


interface AddOutcomeModalResponse {
  outcome: Outcome;
}

@Component({
  selector: 'oppia-outcome-editor',
  templateUrl: './outcome-editor.component.html'
})
export class OutcomeEditorComponent implements OnInit {
  @Output() saveDest: EventEmitter<Outcome> = new EventEmitter();
  @Output() saveDestIfStuck: EventEmitter<Outcome> = new EventEmitter();
  @Output() saveFeedback: EventEmitter<Outcome> = new EventEmitter();
  @Output() saveCorrectnessLabel: EventEmitter<Outcome> = new EventEmitter();
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() areWarningsSuppressed!: boolean;
  @Input() displayFeedback!: boolean;
  @Input() isEditable!: boolean;
  @Input() outcome!: Outcome;
  @Input() addState!: (value: string) => void;
  savedOutcome!: Outcome;
  directiveSubscriptions = new Subscription();
  ENABLE_PREREQUISITE_SKILLS = AppConstants.ENABLE_PREREQUISITE_SKILLS;
  canAddPrerequisiteSkill: boolean = false;
  correctnessLabelEditorIsOpen: boolean = false;
  destinationEditorIsOpen: boolean = false;
  destinationIfStuckEditorIsOpen: boolean = false;
  feedbackEditorIsOpen: boolean = false;

  onMobile: boolean = false;
  resizeSubscription!: Subscription;
  // The value of this variable should match the breapoint used in
  // outcome-editor.component.html.
  mobileBreakpoint: number = 500;

  constructor(
    private externalSaveService: ExternalSaveService,
    private stateEditorService: StateEditorService,
    private stateInteractionIdService: StateInteractionIdService,
    private ngbModal: NgbModal,
    private changeDetectorRef: ChangeDetectorRef,
    private windowDimensionsService: WindowDimensionsService
  ) {}

  isInQuestionMode(): boolean {
    return this.stateEditorService.isInQuestionMode();
  }

  shouldShowDestIfReallyStuck(): boolean {
    return !this.savedOutcome.labelledAsCorrect ||
      this.savedOutcome.destIfReallyStuck !== null;
  }

  isFeedbackLengthExceeded(): boolean {
    // TODO(#13764): Edit this check after appropriate limits are found.
    return (this.outcome.feedback._html.length > 10000);
  }

  isCurrentInteractionLinear(): boolean {
    let interactionId = this.getCurrentInteractionId();
    return Boolean(interactionId) && INTERACTION_SPECS[
      interactionId as InteractionSpecsKey].is_linear;
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
      if (!this.invalidStateAfterFeedbackSave()) {
        this.saveThisFeedback();
      } else {
        this.cancelThisFeedbackEdit();
      }
    }

    if (this.destinationEditorIsOpen) {
      if (!this.invalidStateAfterDestinationSave()) {
        this.saveThisDestination();
      } else {
        this.cancelThisDestinationEdit();
      }
    }

    if (this.destinationIfStuckEditorIsOpen) {
      this.saveThisIfStuckDestination();
    }
  }

  isSelfLoop(outcome: Outcome): boolean {
    return Boolean (
      outcome &&
      outcome.dest === this.stateEditorService.getActiveStateName());
  }

  getCurrentInteractionId(): string {
    return this.stateInteractionIdService.savedMemento;
  }

  isSelfLoopWithNoFeedback(outcome: Outcome): boolean {
    return Boolean (
      this.isSelfLoop(outcome) &&
      !outcome.hasNonemptyFeedback());
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

  openFeedbackEditorModal(): void {
    if (this.isEditable) {
      let modalRef = this.ngbModal.open(AddOutcomeModalComponent, {
        backdrop: 'static',
      });

      let currentOutcome = cloneDeep(this.outcome);
      modalRef.componentInstance.outcome = currentOutcome;

      modalRef.result.then((result: AddOutcomeModalResponse): void => {
        this.outcome = result.outcome;
        this.saveThisFeedback();
      }, () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        // No further action is needed.
      });
    }
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

  openDestinationIfStuckEditor(): void {
    if (this.isEditable) {
      this.destinationIfStuckEditorIsOpen = true;
    }
  }

  saveThisFeedback(): void {
    this.feedbackEditorIsOpen = false;
    this.savedOutcome.feedback = cloneDeep(
      this.outcome.feedback);

    if (
      !this.stateEditorService.isInQuestionMode() &&
      this.savedOutcome.dest === this.outcome.dest &&
        !this.stateEditorService.getStateNames().includes(
          this.outcome.dest)) {
      // If the stateName has changed and previously saved
      // destination points to the older name, update it to
      // the active state name.
      let activeStateName = this.stateEditorService.getActiveStateName();
      if (activeStateName === null) {
        throw new Error(
          'The active state name is null in the outcome editor.');
      }
      this.savedOutcome.dest = activeStateName;
    }
    this.saveFeedback.emit(this.savedOutcome);
  }

  saveThisDestination(): void {
    this.stateEditorService.onSaveOutcomeDestDetails.emit();
    this.destinationEditorIsOpen = false;
    this.savedOutcome.dest = cloneDeep(this.outcome.dest);
    if (!this.isSelfLoop(this.outcome)) {
      this.outcome.refresherExplorationId = null;
    } else {
      if (this.outcome.labelledAsCorrect) {
        this.outcome.labelledAsCorrect = false;
        this.onChangeCorrectnessLabel();
      }
    }
    this.savedOutcome.refresherExplorationId = (
      this.outcome.refresherExplorationId);
    this.savedOutcome.missingPrerequisiteSkillId =
      this.outcome.missingPrerequisiteSkillId;

    this.saveDest.emit(this.savedOutcome);
  }

  saveThisIfStuckDestination(): void {
    this.stateEditorService.onSaveOutcomeDestIfStuckDetails.emit();
    this.destinationIfStuckEditorIsOpen = false;
    this.savedOutcome.destIfReallyStuck = (
      cloneDeep(this.outcome.destIfReallyStuck));
    this.saveDestIfStuck.emit(this.savedOutcome);
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

  cancelThisIfStuckDestinationEdit(): void {
    this.outcome.destIfReallyStuck = (
      cloneDeep(this.savedOutcome.destIfReallyStuck));
    this.destinationIfStuckEditorIsOpen = false;
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
    this.canAddPrerequisiteSkill = (
      this.ENABLE_PREREQUISITE_SKILLS &&
      this.stateEditorService.isExplorationCurated());
    this.feedbackEditorIsOpen = false;
    this.destinationEditorIsOpen = false;
    this.correctnessLabelEditorIsOpen = false;
    this.savedOutcome = cloneDeep(this.outcome);

    this.onMobile = (
      this.windowDimensionsService.getWidth() <= this.mobileBreakpoint);
    this.resizeSubscription = this.windowDimensionsService.getResizeEvent()
      .subscribe(event => {
        this.onMobile = (
          this.windowDimensionsService.getWidth() <= this.mobileBreakpoint);
      });
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive('oppiaOutcomeEditor',
downgradeComponent({
  component: OutcomeEditorComponent
}) as angular.IDirectiveFactory);
