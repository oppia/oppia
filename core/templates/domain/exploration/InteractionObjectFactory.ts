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

import { AnswerGroup, AnswerGroupObjectFactory, IAnswerGroupBackendDict } from
  'domain/exploration/AnswerGroupObjectFactory';
import { Hint, HintObjectFactory, IHintBackendDict } from
  'domain/exploration/HintObjectFactory';
import { ICustomizationArgs } from
  'domain/state/CustomizationArgsObjectFactory';
import { IOutcomeBackendDict, Outcome, OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { ISolutionBackendDict, Solution, SolutionObjectFactory } from
  'domain/exploration/SolutionObjectFactory';

export interface IInteractionBackendDict {
  /* eslint-disable camelcase */
  answer_groups: IAnswerGroupBackendDict[];
  confirmed_unclassified_answers: IAnswerGroupBackendDict[];
  customization_args: ICustomizationArgs;
  default_outcome: IOutcomeBackendDict;
  hints: IHintBackendDict[];
  id: string;
  solution: ISolutionBackendDict;
  /* eslint-enable camelcase */
}

export class Interaction {
  constructor(
      public answerGroups: AnswerGroup[],
      public confirmedUnclassifiedAnswers: IAnswerGroupBackendDict[],
      public customizationArgs: ICustomizationArgs,
      public defaultOutcome: Outcome | null,
      public hints: Hint[],
      public id: string,
      public solution: Solution | null) {}

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
        this.defaultOutcome && this.defaultOutcome.toBackendDict()),
      hints: this.hints.map(hint => hint.toBackendDict()),
      id: this.id,
      solution: this.solution && this.solution.toBackendDict()
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

  createFromBackendDict(backendDict: IInteractionBackendDict): Interaction {
    return new Interaction(
      this.generateAnswerGroupsFromBackend(backendDict.answer_groups),
      backendDict.confirmed_unclassified_answers,
      backendDict.customization_args,
      this.generateOutcomeFromBackend(backendDict.default_outcome),
      this.generateHintsFromBackend(backendDict.hints),
      backendDict.id,
      this.generateSolutionFromBackend(backendDict.solution));
  }

  private generateAnswerGroupsFromBackend(
      answerGroupBackendDicts: IAnswerGroupBackendDict[]): AnswerGroup[] {
    return answerGroupBackendDicts.map(
      backendDict => this.answerGroupFactory.createFromBackendDict(backendDict)
    );
  }

  private generateOutcomeFromBackend(
      outcomeBackendDict: IOutcomeBackendDict): Outcome {
    return outcomeBackendDict ?
      this.outcomeFactory.createFromBackendDict(outcomeBackendDict) : null;
  }

  private generateHintsFromBackend(
      hintBackendDicts: IHintBackendDict[]): Hint[] {
    return hintBackendDicts.map(
      backendDict => this.hintFactory.createFromBackendDict(backendDict));
  }

  private generateSolutionFromBackend(
      solutionBackendDict: ISolutionBackendDict): Solution {
    return solutionBackendDict ?
      this.solutionFactory.createFromBackendDict(solutionBackendDict) : null;
  }
}

angular.module('oppia').factory(
  'InteractionObjectFactory',
  downgradeInjectable(InteractionObjectFactory));
