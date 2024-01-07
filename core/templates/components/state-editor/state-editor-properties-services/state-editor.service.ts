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
import { Observable } from 'rxjs';

import { downgradeInjectable } from '@angular/upgrade/static';
import { EventEmitter, Injectable } from '@angular/core';

import { AnswerGroup } from
  'domain/exploration/AnswerGroupObjectFactory';
import { Hint } from 'domain/exploration/hint-object.model';
import { SubtitledHtml } from
  'domain/exploration/subtitled-html.model';
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
import { State } from 'domain/state/StateObjectFactory';

export interface AnswerChoice {
  val: string | number | SubtitledHtml;
  label: string;
}

type CustomizationArgs = (
  ItemSelectionInputCustomizationArgs | DragAndDropSortInputCustomizationArgs);

@Injectable({
  providedIn: 'root'
})
export class StateEditorService {
  constructor(private solutionValidityService: SolutionValidityService) {}

  private _stateEditorInitializedEventEmitter = new EventEmitter<State>();
  private _stateEditorDirectiveInitializedEventEmitter =
    new EventEmitter<void>();

  private _interactionEditorInitializedEventEmitter = new EventEmitter<void>();
  private _showTranslationTabBusyModalEventEmitter = new EventEmitter<void>();
  private _refreshStateTranslationEventEmitter = new EventEmitter<void>();
  private _updateAnswerChoicesEventEmitter =
    new EventEmitter<AnswerChoice[]>();

  private _saveOutcomeDestDetailsEventEmitter = new EventEmitter<void>();
  private _saveOutcomeDestIfStuckDetailsEventEmitter = new EventEmitter<void>();
  private _handleCustomArgsUpdateEventEmitter =
    new EventEmitter<AnswerChoice[]>();

  private _stateNamesChangedEventEmitter = new EventEmitter<void>();
  private _objectFormValidityChangeEventEmitter = new EventEmitter<boolean>();

  activeStateName: string | null = null;
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  // Currently, the only place where this is used in the state editor
  // is in solution verification. So, once the interaction is set in this
  // service, the given solutions would be automatically verified for the set
  // interaction.
  interaction!: Interaction;
  linkedSkillId!: string;
  stateNames: string[] = [];
  inQuestionMode: boolean = false;
  misconceptionsBySkill: {} = {};
  explorationIsCurated: boolean = false;
  solicitAnswerDetails: boolean = false;
  cardIsCheckpoint: boolean = false;
  stateContentEditorInitialised: boolean = false;
  stateInteractionEditorInitialised: boolean = false;
  stateResponsesInitialised: boolean = false;
  stateHintsEditorInitialised: boolean = false;
  stateSolutionEditorInitialised: boolean = false;
  stateEditorDirectiveInitialised: boolean = false;
  currentRuleInputIsValid: boolean = false;
  inapplicableSkillMisconceptionIds: string[] = [];
  initActiveContentId: string | null = null;

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

  updateCurrentRuleInputIsValid(value: boolean): void {
    this.currentRuleInputIsValid = value;
  }

  get onStateNamesChanged(): Observable<void> {
    return this._stateNamesChangedEventEmitter;
  }

  checkCurrentRuleInputIsValid(): boolean {
    return this.currentRuleInputIsValid;
  }

  checkEventListenerRegistrationStatus(): boolean {
    return (
      this.stateInteractionEditorInitialised &&
      this.stateResponsesInitialised &&
      this.stateEditorDirectiveInitialised);
  }

  getActiveStateName(): string | null {
    return this.activeStateName;
  }

  setActiveStateName(newActiveStateName: string): void {
    if (newActiveStateName === '' || newActiveStateName === null) {
      console.error('Invalid active state name: ' + newActiveStateName);
      return;
    }
    this.activeStateName = newActiveStateName;
  }

  isExplorationCurated(): boolean {
    return this.explorationIsCurated;
  }

  setMisconceptionsBySkill(newMisconceptionsBySkill: {}): void {
    this.misconceptionsBySkill = newMisconceptionsBySkill;
  }

  getMisconceptionsBySkill(): {} {
    return this.misconceptionsBySkill;
  }

  setInteraction(newInteraction: Interaction): void {
    this.interaction = newInteraction;
  }

  setInteractionId(newId: string): void {
    this.interaction.setId(newId);
  }

  setLinkedSkillId(newLinkedSkillId: string): void {
    this.linkedSkillId = newLinkedSkillId;
  }

  getLinkedSkillId(): string {
    return this.linkedSkillId;
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

  // Function will return null if interactionId does not exist or is not
  // equivalent to 'MultipleChoiceInput', 'ItemSelectionInput',
  // 'DragAndDropSortInput'.
  getAnswerChoices(
      interactionId: string,
      customizationArgs: InteractionCustomizationArgs
  ): AnswerChoice[] | null {
    if (!interactionId) {
      return null;
    }
    // Special cases for multiple choice input and image click input.
    if (interactionId === 'MultipleChoiceInput') {
      return (
        customizationArgs as MultipleChoiceInputCustomizationArgs
      ).choices.value.map((val, ind) => (
        { val: ind, label: val.html }
      )) as AnswerChoice[];
    } else if (interactionId === 'ImageClickInput') {
      var _answerChoices = [];
      var imageWithRegions = (
        customizationArgs as ImageClickInputCustomizationArgs)
        .imageAndRegions.value;
      for (
        var j = 0; j < imageWithRegions.labeledRegions.length; j++) {
        _answerChoices.push({
          val: imageWithRegions.labeledRegions[j].label,
          label: imageWithRegions.labeledRegions[j].label
        });
      }
      return _answerChoices;
    } else if (
      interactionId === 'ItemSelectionInput' ||
      interactionId === 'DragAndDropSortInput'
    ) {
      return (
        customizationArgs as CustomizationArgs
      ).choices.value.map(
        val => ({
          val: val.contentId, label: val.html}
        )
      ) as AnswerChoice[];
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

  setSolicitAnswerDetails(newSolicitAnswerDetails: boolean): void {
    this.solicitAnswerDetails = newSolicitAnswerDetails;
  }

  getSolicitAnswerDetails(): boolean {
    return this.solicitAnswerDetails;
  }

  setCardIsCheckpoint(newCardIsCheckpoint: boolean): void {
    this.cardIsCheckpoint = newCardIsCheckpoint;
  }

  getCardIsCheckpoint(): boolean {
    return this.cardIsCheckpoint;
  }

  setStateNames(newStateNames: string[]): void {
    this.stateNames = newStateNames;
    this._stateNamesChangedEventEmitter.emit();
  }

  getStateNames(): string[] {
    return this.stateNames;
  }

  setInapplicableSkillMisconceptionIds(
      newInapplicableSkillMisconceptionIds: string[]): void {
    this.inapplicableSkillMisconceptionIds = (
      newInapplicableSkillMisconceptionIds);
  }

  getInapplicableSkillMisconceptionIds(): string[] {
    return this.inapplicableSkillMisconceptionIds;
  }

  isCurrentSolutionValid(): boolean {
    if (this.activeStateName === null) {
      return false;
    }
    return this.solutionValidityService.isSolutionValid(this.activeStateName);
  }

  deleteCurrentSolutionValidity(): void {
    if (this.activeStateName === null) {
      throw new Error('Active State for this solution is not set');
    }
    this.solutionValidityService.deleteSolutionValidity(this.activeStateName);
  }

  setInitActiveContentId(newActiveContentId: string | null): void {
    this.initActiveContentId = newActiveContentId;
  }

  getInitActiveContentId(): string | null {
    return this.initActiveContentId;
  }

  get onStateEditorInitialized(): EventEmitter<State> {
    return this._stateEditorInitializedEventEmitter;
  }

  get onStateEditorDirectiveInitialized(): EventEmitter<void> {
    return this._stateEditorDirectiveInitializedEventEmitter;
  }

  get onInteractionEditorInitialized(): EventEmitter<void> {
    return this._interactionEditorInitializedEventEmitter;
  }

  get onShowTranslationTabBusyModal(): EventEmitter<void> {
    return this._showTranslationTabBusyModalEventEmitter;
  }

  get onRefreshStateTranslation(): EventEmitter<void> {
    return this._refreshStateTranslationEventEmitter;
  }

  get onUpdateAnswerChoices(): EventEmitter<AnswerChoice[]> {
    return this._updateAnswerChoicesEventEmitter;
  }

  get onSaveOutcomeDestDetails(): EventEmitter<void> {
    return this._saveOutcomeDestDetailsEventEmitter;
  }

  get onSaveOutcomeDestIfStuckDetails(): EventEmitter<void> {
    return this._saveOutcomeDestIfStuckDetailsEventEmitter;
  }

  get onHandleCustomArgsUpdate(): EventEmitter<AnswerChoice[]> {
    return this._handleCustomArgsUpdateEventEmitter;
  }

  get onObjectFormValidityChange(): EventEmitter<boolean> {
    return this._objectFormValidityChangeEventEmitter;
  }
}

angular.module('oppia').factory(
  'StateEditorService', downgradeInjectable(StateEditorService));
