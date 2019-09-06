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
import { Injectable } from '@angular/core';

/* eslint-disable max-len */
import { AnswerGroup } from
  'domain/exploration/AnswerGroupObjectFactory';
import { Hint } from 'domain/exploration/HintObjectFactory';
import { Outcome } from
  'domain/exploration/OutcomeObjectFactory';
import { SolutionValidityService } from
  'pages/exploration-editor-page/editor-tab/services/solution-validity.service';
/* eslint-enable max-len */

@Injectable({
  providedIn: 'root'
})
export class StateEditorService {
  constructor(private solutionValidityService: SolutionValidityService) {}

  activeStateName: string = null;
  stateNames: string[] = [];
  correctnessFeedbackEnabled: boolean = null;
  inQuestionMode: boolean = null;
  // Currently, the only place where this is used in the state editor
  // is in solution verification. So, once the interaction is set in this
  // service, the given solutions would be automatically verified for the set
  // interaction.
  // TODO(#7165): Replace 'any' with the exact type. This has been kept as
  // 'any' because the return type is a interaction domain object which can be
  // typed once InteractionObjectFactory is upgraded.
  interaction: any = null;
  misconceptionsBySkill: {} = {};
  explorationIsWhitelisted: boolean = false;
  solicitAnswerDetails: boolean = null;

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

  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'newArgs' is a dict with underscore_cased keys which
  // give tslint errors against underscore_casing in favor of camelCasing.
  setInteractionCustomizationArgs(newArgs: any): void {
    this.interaction.setCustomizationArgs(newArgs);
  }

  // TODO(#7165): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'solution' is a solution domain object which can be typed
  // once SolutionObjectFactory is upgraded.
  setInteractionSolution(solution: any): void {
    this.interaction.setSolution(solution);
  }

  setInteractionHints(hints: Hint[]): void {
    this.interaction.setHints(hints);
  }

  // TODO(#7165): Replace 'any' with the exact type. This has been kept as
  // 'any' because the return type is a interaction domain object which can be
  // typed once InteractionObjectFactory is upgraded.
  getInteraction(): any {
    return cloneDeep(this.interaction);
  }

  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'customizationArgs' is a dict with underscore_cased keys
  // which give tslint errors against underscore_casing in favor of camelCasing.
  getAnswerChoices(interactionId: string, customizationArgs: any): any {
    if (!interactionId) {
      return null;
    }
    // Special cases for multiple choice input and image click input.
    if (interactionId === 'MultipleChoiceInput') {
      return customizationArgs.choices.value.map(
        function(val, ind) {
          return {
            val: ind,
            label: val
          };
        }
      );
    } else if (interactionId === 'ImageClickInput') {
      var _answerChoices = [];
      var imageWithRegions =
        customizationArgs.imageAndRegions.value;
      for (
        var j = 0; j < imageWithRegions.labeledRegions.length; j++) {
        _answerChoices.push({
          val: imageWithRegions.labeledRegions[j].label,
          label: imageWithRegions.labeledRegions[j].label
        });
      }
      return _answerChoices;
    } else if (interactionId === 'ItemSelectionInput' ||
        interactionId === 'DragAndDropSortInput') {
      return customizationArgs.choices.value.map(function(val) {
        return {
          val: val,
          label: val
        };
      });
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
}

angular.module('oppia').factory(
  'StateEditorService', downgradeInjectable(StateEditorService));
