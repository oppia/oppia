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
import { InteractionSpecsKey } from 'pages/interaction-specs.constants';
import { States } from 'domain/exploration/StatesObjectFactory';
import { ComputeGraphService } from 'services/compute-graph.service';
import { ExplorationWarningsService } from 'pages/exploration-editor-page/services/exploration-warnings.service';
import { ExplorationInitStateNameService } from 'pages/exploration-editor-page/services/exploration-init-state-name.service';
import { ExplorationStatesService } from 'pages/exploration-editor-page/services/exploration-states.service';

@Component({
  selector: 'oppia-outcome-editor',
  templateUrl: './outcome-editor.component.html'
})
export class OutcomeEditorComponent implements OnInit {
  @Output() showMarkAllAudioAsNeedingUpdateModalIfRequired:
  EventEmitter<string[]> = new EventEmitter();

  @Output() saveDest: EventEmitter<Outcome> = new EventEmitter();
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
  feedbackEditorIsOpen: boolean = false;

  constructor(
    private externalSaveService: ExternalSaveService,
    private computeGraphService: ComputeGraphService,
    private stateEditorService: StateEditorService,
    private stateInteractionIdService: StateInteractionIdService,
    private explorationWarningsService: ExplorationWarningsService,
    private explorationInitStateNameService: ExplorationInitStateNameService,
    private explorationStatesService: ExplorationStatesService
  ) {}

  isInQuestionMode(): boolean {
    return this.stateEditorService.isInQuestionMode();
  }

  isCorrectnessFeedbackEnabled(): boolean {
    return this.stateEditorService.getCorrectnessFeedbackEnabled();
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
        this.saveThisFeedback(false);
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
  }

  getDistanceToDestState(
    initStateId: string, states: States, sourceStateName: string, destStateName: string): number {
      let distance = -1;
      let stateFound = false;
      let stateGraph = this.computeGraphService.compute(initStateId, states);
      let stateNamesInBfsOrder: string[] = [];
      let queue: string[] = [];
      let seen: Record<string, boolean> = {};
      seen[sourceStateName] = true;
      queue.push(sourceStateName);
      while (queue.length > 0) {
        // '.shift()' here can return an undefined value, but we're already
        // checking for queue.length > 0, so this is safe.
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        let queueSize = queue.length;
        distance++;
        while(queueSize-- && !stateFound) {
          let currStateName = queue.shift()!;
          if (currStateName == destStateName) {
            stateFound = true;
          }
          stateNamesInBfsOrder.push(currStateName);
          for (let e = 0; e < stateGraph.links.length; e++) {
            let edge = stateGraph.links[e];
            let dest = edge.target;
            if (edge.source === currStateName && !seen.hasOwnProperty(dest)) {
              seen[dest] = true;
              queue.push(dest);
            }
          }
        }
      }
      if(distance!= -1 && !stateFound) {
        distance = -1;
      }
      return distance;
  }

  isFeedbackLengthExceeded(): boolean {
    // TODO(#13764): Edit this check after appropriate limits are found.
    return (this.outcome.feedback._html.length > 10000);
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
    if (fromClickSaveFeedbackButton && contentHasChanged) {
      let contentId = this.savedOutcome.feedback.contentId;
      if (contentId === null) {
        throw new Error(
          'The content ID is null in the outcome editor.');
      }
      this.showMarkAllAudioAsNeedingUpdateModalIfRequired.emit([contentId]);
    }
    this.saveFeedback.emit(this.savedOutcome);
  }

  saveThisDestination(): void {
    this.stateEditorService.onSaveOutcomeDestDetails.emit();
    let activeStateName = this.stateEditorService.getActiveStateName();
    let initStateName = this.explorationInitStateNameService.displayed;
    let states = this.explorationStatesService.getStates();
    let destStateName = this.outcome.dest;
    if(!this.redirectionIsValid(
      (initStateName) as string, states, destStateName, activeStateName)) {
      this.explorationWarningsService.raiseRedirectionError(activeStateName);
    }
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

  redirectionIsValid(
    initStateId: string, states: States, sourceStateName: string, destStateName: string) : boolean {
    let distance = this.getDistanceToDestState(initStateId, states, sourceStateName, destStateName);
    // Raise validation error if the creator redirects the learner
    // back by more than 3 cards.
    if(distance-1 > 2) return false; 
    else {
      return true;
    }
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
    this.canAddPrerequisiteSkill = (
      this.ENABLE_PREREQUISITE_SKILLS &&
      this.stateEditorService.isExplorationWhitelisted());
    this.feedbackEditorIsOpen = false;
    this.destinationEditorIsOpen = false;
    this.correctnessLabelEditorIsOpen = false;
    this.savedOutcome = cloneDeep(this.outcome);
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive('oppiaOutcomeEditor',
downgradeComponent({
  component: OutcomeEditorComponent
}) as angular.IDirectiveFactory);
