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
 * @fileoverview A service that maintains a record of the objects exclusive to
 * a state.
 */

import cloneDeep from 'lodash/cloneDeep';

import { downgradeInjectable } from '@angular/upgrade/static';
import { EventEmitter, Injectable } from '@angular/core';

import { AnswerGroup } from
  'domain/exploration/AnswerGroupObjectFactory';
import { Hint } from 'domain/exploration/HintObjectFactory';
import {
  DragAndDropSortInputCustomizationArgs,
  ImageClickInputCustomizationArgs,
  InteractionCustomizationArgs,
  ItemSelectionInputCustomizationArgs,
  MultipleChoiceInputCustomizationArgs
} from 'extensions/interactions/customization-args-defs';
import { Interaction } from 'domain/exploration/InteractionObjectFactory';
import { Outcome } from 'domain/exploration/OutcomeObjectFactory';
import { Solution } from 'domain/exploration/SolutionObjectFactory';
import { SolutionValidityService } from
  'pages/exploration-editor-page/editor-tab/services/solution-validity.service';

interface AnswerChoice {
  val: string | number;
  label: string;
}

@Injectable({
  providedIn: 'root'
})
export class StateEditorService {
  constructor(private solutionValidityService: SolutionValidityService) {}

  private _stateEditorInitializedEventEmitter = new EventEmitter();
  private _stateEditorDirectiveInitializedEventEmitter = new EventEmitter();
  private _interactionEditorInitializedEventEmitter = new EventEmitter();
  private _showTranslationTabBusyModalEventEmitter = new EventEmitter();
  private _refreshStateTranslationEventEmitter = new EventEmitter();
  private _updateAnswerChoicesEventEmitter = new EventEmitter();
  private _saveOutcomeDestDetailsEventEmitter = new EventEmitter();

  activeStateName: string = null;
  stateNames: string[] = [];
  correctnessFeedbackEnabled: boolean = null;
  inQuestionMode: boolean = null;
  // Currently, the only place where this is used in the state editor
  // is in solution verification. So, once the interaction is set in this
  // service, the given solutions would be automatically verified for the set
  // interaction.
  interaction: Interaction = null;
  misconceptionsBySkill: {} = {};
  explorationIsWhitelisted: boolean = false;
  solicitAnswerDetails: boolean = null;
  stateContentEditorInitialised: boolean = false;
  stateInteractionEditorInitialised: boolean = false;
  stateResponsesInitialised: boolean = false;
  stateHintsEditorInitialised: boolean = false;
  stateSolutionEditorInitialised: boolean = false;
  stateEditorDirectiveInitialised: boolean = false;

  updateStateContentEditorInitialised(): void {
    this.stateContentEditorInitialised = true;
  }

  updateStateInteractionEditorInitialised(): void {
    this.stateInteractionEditorInitialised = true;
  }

  updateStateResponsesInitialised(): void {
    this.stateResponsesInitialised = true;
  }

  updateStateHintsEditorInitialised(): void {
    this.stateHintsEditorInitialised = true;
  }

  updateStateSolutionEditorInitialised(): void {
    this.stateSolutionEditorInitialised = true;
  }

  updateStateEditorDirectiveInitialised(): void {
    this.stateEditorDirectiveInitialised = true;
  }

  checkEventListenerRegistrationStatus(): boolean {
    return (
      this.stateInteractionEditorInitialised &&
      this.stateResponsesInitialised &&
      this.stateEditorDirectiveInitialised);
  }

  getActiveStateName(): string {
    return this.activeStateName;
  }

  setActiveStateName(newActiveStateName: string): void {
    if (newActiveStateName === '' || newActiveStateName === null) {
      console.error('Invalid active state name: ' + newActiveStateName);
      return;
    }
    this.activeStateName = newActiveStateName;
  }

  isExplorationWhitelisted(): boolean {
    return this.explorationIsWhitelisted;
  }

  updateExplorationWhitelistedStatus(value: boolean): void {
    this.explorationIsWhitelisted = value;
  }

  setMisconceptionsBySkill(newMisconceptionsBySkill: {}): void {
    this.misconceptionsBySkill = newMisconceptionsBySkill;
  }

  getMisconceptionsBySkill(): {} {
    return this.misconceptionsBySkill;
  }

  setInteraction(newInteraction): void {
    this.interaction = newInteraction;
  }

  setInteractionId(newId: string): void {
    this.interaction.setId(newId);
  }

  setInteractionAnswerGroups(newAnswerGroups: AnswerGroup[]): void {
    this.interaction.setAnswerGroups(newAnswerGroups);
  }

  setInteractionDefaultOutcome(newOutcome: Outcome): void {
    this.interaction.setDefaultOutcome(newOutcome);
  }

  setInteractionCustomizationArgs(
      newArgs: InteractionCustomizationArgs): void {
    this.interaction.setCustomizationArgs(newArgs);
  }

  setInteractionSolution(solution: Solution): void {
    this.interaction.setSolution(solution);
  }

  setInteractionHints(hints: Hint[]): void {
    this.interaction.setHints(hints);
  }

  getInteraction(): Interaction {
    return cloneDeep(this.interaction);
  }

  getAnswerChoices(
      interactionId: string,
      customizationArgs: InteractionCustomizationArgs): AnswerChoice[] {
    if (!interactionId) {
      return null;
    }
    // Special cases for multiple choice input and image click input.
    if (interactionId === 'MultipleChoiceInput') {
      return (<MultipleChoiceInputCustomizationArgs> customizationArgs)
        .choices.value.map((val, ind) => ({ val: ind, label: val.getHtml() }));
    } else if (interactionId === 'ImageClickInput') {
      var _answerChoices = [];
      var imageWithRegions = (
        <ImageClickInputCustomizationArgs> customizationArgs)
        .imageAndRegions.value;
      for (
        var j = 0; j < imageWithRegions.labeledRegions.length; j++) {
        _answerChoices.push({
          val: imageWithRegions.labeledRegions[j].label,
          label: imageWithRegions.labeledRegions[j].label
        });
      }
      return _answerChoices;
    } else if (interactionId === 'ItemSelectionInput') {
      return (
        <ItemSelectionInputCustomizationArgs> customizationArgs)
        .choices.value.map(val => (
          { val: val.getHtml(), label: val.getHtml() }
        ));
    } else if (interactionId === 'DragAndDropSortInput') {
      return (
        <DragAndDropSortInputCustomizationArgs> customizationArgs)
        .choices.value.map(val => (
          { val: val.getHtml(), label: val.getHtml() }
        ));
    } else {
      return null;
    }
  }

  setInQuestionMode(newModeValue: boolean): void {
    this.inQuestionMode = newModeValue;
  }

  isInQuestionMode(): boolean {
    return this.inQuestionMode;
  }

  setCorrectnessFeedbackEnabled(newCorrectnessFeedbackEnabled: boolean): void {
    this.correctnessFeedbackEnabled = newCorrectnessFeedbackEnabled;
  }

  getCorrectnessFeedbackEnabled(): boolean {
    return this.correctnessFeedbackEnabled;
  }

  setSolicitAnswerDetails(newSolicitAnswerDetails: boolean): void {
    this.solicitAnswerDetails = newSolicitAnswerDetails;
  }

  getSolicitAnswerDetails(): boolean {
    return this.solicitAnswerDetails;
  }

  setStateNames(newStateNames: string[]): void {
    this.stateNames = newStateNames;
  }

  getStateNames(): string[] {
    return this.stateNames;
  }

  isCurrentSolutionValid(): boolean {
    return this.solutionValidityService.isSolutionValid(this.activeStateName);
  }

  deleteCurrentSolutionValidity(): void {
    this.solutionValidityService.deleteSolutionValidity(this.activeStateName);
  }

  get onStateEditorInitialized() {
    return this._stateEditorInitializedEventEmitter;
  }

  get onStateEditorDirectiveInitialized() {
    return this._stateEditorDirectiveInitializedEventEmitter;
  }

  get onInteractionEditorInitialized() {
    return this._interactionEditorInitializedEventEmitter;
  }

  get onShowTranslationTabBusyModal() {
    return this._showTranslationTabBusyModalEventEmitter;
  }

  get onRefreshStateTranslation() {
    return this._refreshStateTranslationEventEmitter;
  }

  get onUpdateAnswerChoices() {
    return this._updateAnswerChoicesEventEmitter;
  }

  get onSaveOutcomeDestDetails() {
    return this._saveOutcomeDestDetailsEventEmitter;
  }
}

angular.module('oppia').factory(
  'StateEditorService', downgradeInjectable(StateEditorService));
