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

import { IAnswerGroupBackendDict, AnswerGroup, AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { IHintBackendDict, Hint, HintObjectFactory } from
  'domain/exploration/HintObjectFactory';
import { IOutcomeBackendDict, Outcome, OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { ISolutionBackendDict, Solution, SolutionObjectFactory } from
  'domain/exploration/SolutionObjectFactory';
import { ICustomizationArgs } from
  'domain/state/CustomizationArgsObjectFactory';

export interface IInteractionBackendDict {
  /* eslint-disable camelcase */
  id: string;
  customization_args: ICustomizationArgs;
  answer_groups: IAnswerGroupBackendDict[];
  default_outcome: IOutcomeBackendDict;
  confirmed_unclassified_answers: IAnswerGroupBackendDict[];
  hints: IHintBackendDict[];
  solution: ISolutionBackendDict;
  /* eslint-enable camelcase */
}

export class Interaction {
  constructor(
      public answerGroups: AnswerGroup[],
      public confirmedUnclassifiedAnswers: IAnswerGroupBackendDict[],
      public customizationArgs: ICustomizationArgs,
      public defaultOutcome: Outcome,
      public hints: Hint[],
      public id: string,
      public solution: Solution) {}

  setId(newValue: string): void {
    this.id = newValue;
  }

  setAnswerGroups(newValue: AnswerGroup[]): void {
    this.answerGroups = newValue;
  }

  setDefaultOutcome(newValue: Outcome): void {
    this.defaultOutcome = newValue;
  }

  setCustomizationArgs(newValue: ICustomizationArgs): void {
    this.customizationArgs = newValue;
  }

  setSolution(newValue: Solution): void {
    this.solution = newValue;
  }

  setHints(newValue: Hint[]): void {
    this.hints = newValue;
  }

  copy(otherInteraction: Interaction): void {
    this.answerGroups = cloneDeep(otherInteraction.answerGroups);
    this.confirmedUnclassifiedAnswers =
      cloneDeep(otherInteraction.confirmedUnclassifiedAnswers);
    this.customizationArgs = cloneDeep(otherInteraction.customizationArgs);
    this.defaultOutcome = cloneDeep(otherInteraction.defaultOutcome);
    this.hints = cloneDeep(otherInteraction.hints);
    this.id = cloneDeep(otherInteraction.id);
    this.solution = cloneDeep(otherInteraction.solution);
  }

  toBackendDict(): IInteractionBackendDict {
    return {
      answer_groups: (
        this.answerGroups.map(answerGroup => answerGroup.toBackendDict())),
      confirmed_unclassified_answers: this.confirmedUnclassifiedAnswers,
      customization_args: this.customizationArgs,
      default_outcome: (
        this.defaultOutcome ? this.defaultOutcome.toBackendDict() : null),
      hints: this.hints.map(hint => hint.toBackendDict()),
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

  createFromBackendDict(interactionDict: IInteractionBackendDict): Interaction {
    const defaultOutcome = (
      interactionDict.default_outcome ?
        this.outcomeFactory.createFromBackendDict(
          interactionDict.default_outcome) :
        null);
    const solution = (
      interactionDict.solution ?
        this.generateSolutionFromBackend(interactionDict.solution) :
        null);

    return new Interaction(
      this.generateAnswerGroupsFromBackend(interactionDict.answer_groups),
      interactionDict.confirmed_unclassified_answers,
      interactionDict.customization_args,
      defaultOutcome,
      this.generateHintsFromBackend(interactionDict.hints),
      interactionDict.id,
      solution);
  }

  generateAnswerGroupsFromBackend(
      answerGroupBackendDicts: IAnswerGroupBackendDict[]) {
    return answerGroupBackendDicts.map(
      backendDict => this.answerGroupFactory.createFromBackendDict(backendDict)
    );
  }

  generateHintsFromBackend(hintBackendDicts: IHintBackendDict[]) {
    return hintBackendDicts.map(
      backendDict => this.hintFactory.createFromBackendDict(backendDict));
  }

  generateSolutionFromBackend(solutionBackendDict: ISolutionBackendDict) {
    return this.solutionFactory.createFromBackendDict(solutionBackendDict);
  }
}

angular.module('oppia').factory(
  'InteractionObjectFactory',
  downgradeInjectable(InteractionObjectFactory));
