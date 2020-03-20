// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for creating new frontend instances of Interaction
 * domain objects.
 */
import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import cloneDeep from 'lodash/cloneDeep';

import { AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { HintObjectFactory } from 'domain/exploration/HintObjectFactory';
import { OutcomeObjectFactory } from 'domain/exploration/OutcomeObjectFactory';
import { SolutionObjectFactory } from
  'domain/exploration/SolutionObjectFactory';

export class Interaction {
  answerGroups;
  confirmedUnclassifiedAnswers;
  customizationArgs;
  defaultOutcome;
  hints;
  id;
  solution;
  constructor(
      answerGroups, confirmedUnclassifiedAnswers, customizationArgs,
      defaultOutcome, hints, id, solution) {
    this.answerGroups = answerGroups;
    this.confirmedUnclassifiedAnswers = confirmedUnclassifiedAnswers;
    this.customizationArgs = customizationArgs;
    this.defaultOutcome = defaultOutcome;
    this.hints = hints;
    this.id = id;
    this.solution = solution;
  }

  setId(newValue: string): void {
    this.id = newValue;
  }
  // TODO(#7165): Replace any with exact type.
  setAnswerGroups(newValue: any): void {
    this.answerGroups = newValue;
  }
  // TODO(#7165): Replace any with exact type.
  setDefaultOutcome(newValue: any): void {
    this.defaultOutcome = newValue;
  }
  // TODO(#7165): Replace any with exact type.
  setCustomizationArgs(newValue: any): void {
    this.customizationArgs = newValue;
  }
  // TODO(#7165): Replace any with exact type.
  setSolution(newValue: any): void {
    this.solution = newValue;
  }
  // TODO(#7165): Replace any with exact type.
  setHints(newValue: any): void {
    this.hints = newValue;
  }
  // TODO(#7165): Replace any with exact type.
  copy(otherInteraction: any): void {
    this.answerGroups = cloneDeep(otherInteraction.answerGroups);
    this.confirmedUnclassifiedAnswers =
      cloneDeep(otherInteraction.confirmedUnclassifiedAnswers);
    this.customizationArgs = cloneDeep(otherInteraction.customizationArgs);
    this.defaultOutcome = cloneDeep(otherInteraction.defaultOutcome);
    this.hints = cloneDeep(otherInteraction.hints);
    this.id = cloneDeep(otherInteraction.id);
    this.solution = cloneDeep(otherInteraction.solution);
  }
  // TODO(#7165): Replace any with exact type.
  toBackendDict(): any {
    return {
      answer_groups: this.answerGroups.map(function(answerGroup) {
        return answerGroup.toBackendDict();
      }),
      confirmed_unclassified_answers: this.confirmedUnclassifiedAnswers,
      customization_args: this.customizationArgs,
      default_outcome:
        this.defaultOutcome ? this.defaultOutcome.toBackendDict() : null,
      hints: this.hints.map(function(hint) {
        return hint.toBackendDict();
      }),
      id: this.id,
      solution: this.solution ? this.solution.toBackendDict() : null
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class InteractionObjectFactory {
  constructor(
    private answerGroupFactory: AnswerGroupObjectFactory,
    private hintFactory: HintObjectFactory,
    private solutionFactory: SolutionObjectFactory,
    private outcomeFactory: OutcomeObjectFactory) {}
  // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
  /* eslint-disable dot-notation */
  // TODO(#7165): Replace any with exact type.
  createFromBackendDict(interactionDict: any): Interaction {
  /* eslint-enable dot-notation */
    var defaultOutcome;
    if (interactionDict.default_outcome) {
      defaultOutcome = this.outcomeFactory.createFromBackendDict(
        interactionDict.default_outcome);
    } else {
      defaultOutcome = null;
    }
    return new Interaction(
      this.generateAnswerGroupsFromBackend(interactionDict.answer_groups),
      interactionDict.confirmed_unclassified_answers,
      interactionDict.customization_args,
      defaultOutcome,
      this.generateHintsFromBackend(interactionDict.hints),
      interactionDict.id,
      interactionDict.solution ? (
        this.generateSolutionFromBackend(interactionDict.solution)) : null);
  }
  // TODO(#7165): Replace any with exact type.
  generateAnswerGroupsFromBackend(answerGroupBackendDicts: any) {
    return answerGroupBackendDicts.map((
        answerGroupBackendDict) => {
      return this.answerGroupFactory.createFromBackendDict(
        answerGroupBackendDict);
    });
  }
  // TODO(#7165): Replace any with exact type.
  generateHintsFromBackend(hintBackendDicts: any) {
    return hintBackendDicts.map((hintBackendDict) => {
      return this.hintFactory.createFromBackendDict(hintBackendDict);
    });
  }
  // TODO(#7165): Replace any with exact type.
  generateSolutionFromBackend(solutionBackendDict: any) {
    return this.solutionFactory.createFromBackendDict(solutionBackendDict);
  }
}

angular.module('oppia').factory(
  'InteractionObjectFactory', downgradeInjectable(
    InteractionObjectFactory));
