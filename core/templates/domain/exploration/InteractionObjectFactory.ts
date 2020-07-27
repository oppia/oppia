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

import { AnswerGroup, AnswerGroupBackendDict, AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { HintBackendDict, Hint, HintObjectFactory } from
  'domain/exploration/HintObjectFactory';
import { OutcomeBackendDict, Outcome, OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { SolutionBackendDict, Solution, SolutionObjectFactory } from
  'domain/exploration/SolutionObjectFactory';
import { InteractionCustomizationArgs } from
  'interactions/customization-args-defs';
import { InteractionAnswer } from 'interactions/answer-defs';

export interface InteractionBackendDict {
  'default_outcome': OutcomeBackendDict;
  'answer_groups': AnswerGroupBackendDict[];
  'confirmed_unclassified_answers': InteractionAnswer[];
  'customization_args': InteractionCustomizationArgs;
  'hints': HintBackendDict[];
  'id': string;
  'solution': SolutionBackendDict;
}

export class Interaction {
  answerGroups: AnswerGroup[];
  confirmedUnclassifiedAnswers: InteractionAnswer[];
  customizationArgs: InteractionCustomizationArgs;
  defaultOutcome: Outcome;
  hints: Hint[];
  id: string;
  solution: Solution;
  constructor(
      answerGroups: AnswerGroup[],
      confirmedUnclassifiedAnswers: InteractionAnswer[],
      customizationArgs: InteractionCustomizationArgs,
      defaultOutcome: Outcome, hints: Hint[], id: string, solution: Solution) {
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

  setAnswerGroups(newValue: AnswerGroup[]): void {
    this.answerGroups = newValue;
  }

  setDefaultOutcome(newValue: Outcome): void {
    this.defaultOutcome = newValue;
  }

  setCustomizationArgs(newValue: InteractionCustomizationArgs): void {
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

  toBackendDict(): InteractionBackendDict {
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

  createFromBackendDict(
      interactionDict: InteractionBackendDict): Interaction {
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

  generateAnswerGroupsFromBackend(
      answerGroupBackendDicts: AnswerGroupBackendDict[]) {
    return answerGroupBackendDicts.map((
        answerGroupBackendDict) => {
      return this.answerGroupFactory.createFromBackendDict(
        answerGroupBackendDict);
    });
  }

  generateHintsFromBackend(hintBackendDicts: HintBackendDict[]) {
    return hintBackendDicts.map((hintBackendDict) => {
      return this.hintFactory.createFromBackendDict(hintBackendDict);
    });
  }

  generateSolutionFromBackend(solutionBackendDict: SolutionBackendDict) {
    return this.solutionFactory.createFromBackendDict(solutionBackendDict);
  }
}

angular.module('oppia').factory(
  'InteractionObjectFactory', downgradeInjectable(
    InteractionObjectFactory));
