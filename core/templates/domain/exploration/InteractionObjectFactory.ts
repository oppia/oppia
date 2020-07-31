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
import { InteractionAnswer } from 'interactions/answer-defs';
import {
  AlgebraicExpressionInputCustomizationArgs,
  CodeReplCustomizationArgs,
  ContinueCustomizationArgs,
  ContinueCustomizationArgsBackendDict,
  DragAndDropSortInputCustomizationArgs,
  DragAndDropSortInputCustomizationArgsBackendDict,
  EndExplorationCustomizationArgs,
  FractionInputCustomizationArgs,
  FractionInputCustomizationArgsBackendDict,
  GraphInputCustomizationArgs,
  ImageClickInputCustomizationArgs,
  InteractionCustomizationArgs,
  InteractionCustomizationArgsBackendDict,
  InteractiveMapCustomizationArgs,
  ItemSelectionInputCustomizationArgs,
  ItemSelectionInputCustomizationArgsBackendDict,
  LogicCustomizationArgs,
  MathEquationInputCustomizationArgs,
  MathExpressionCustomizationArgs,
  MultipleChoiceInputCustomizationArgs,
  MultipleChoiceInputCustomizationArgsBackendDict,
  MusicNotesInputCustomizationArgs,
  NumberWithUnitsCustomizationArgs,
  NumericExpressionInputCustomizationArgs,
  NumericInputCustomizationArgs,
  PencilCodeCustomizationArgs,
  SetInputCustomizationArgs,
  SetInputCustomizationArgsBackendDict,
  TextInputCustomizationArgs,
  TextInputCustomizationArgsBackendDict
} from 'interactions/customization-args-defs';
import {
  SubtitledUnicodeObjectFactory, SubtitledUnicode
} from 'domain/exploration/SubtitledUnicodeObjectFactory';
import {
  SubtitledHtmlObjectFactory, SubtitledHtml
} from 'domain/exploration/SubtitledHtmlObjectFactory';


export interface InteractionBackendDict {
  'default_outcome': OutcomeBackendDict;
  'answer_groups': AnswerGroupBackendDict[];
  'confirmed_unclassified_answers': InteractionAnswer[];
  'customization_args': InteractionCustomizationArgsBackendDict;
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

  static convertCustomizationArgsToBackendDict(
      customizationArgs: InteractionCustomizationArgs
  ): InteractionCustomizationArgsBackendDict {
    const traverseSchemaAndConvertSubtitledToDicts = (
        value: Object[] | Object
    ): Object[] | Object => {
      let result: Object[] | Object;

      if (value instanceof SubtitledUnicode || value instanceof SubtitledHtml) {
        result = value.toBackendDict();
      } else if (value instanceof Array) {
        result = value.map(element =>
          traverseSchemaAndConvertSubtitledToDicts(element));
      } else if (value instanceof Object) {
        result = {};
        Object.keys(value).forEach(key => {
          result[key] = traverseSchemaAndConvertSubtitledToDicts(value[key]);
        });
      }

      return result || value;
    };

    const customizationArgsBackendDict:
      InteractionCustomizationArgsBackendDict = {};
    Object.keys(customizationArgs).forEach(caName => {
      customizationArgsBackendDict[caName] = {
        value: traverseSchemaAndConvertSubtitledToDicts(
          customizationArgs[caName].value)
      };
    });

    return customizationArgsBackendDict;
  }

  static getCustomizationArgContentIds(
      customizationArgs: InteractionCustomizationArgs
  ): string[] {
    const contentIds = [];

    const traverseValueAndRetrieveContentIdsFromSubtitled = (
        value: Object[] | Object
    ): void => {
      if (value instanceof SubtitledUnicode || value instanceof SubtitledHtml) {
        contentIds.push(value.getContentId());
      } else if (value instanceof Array) {
        value.forEach(element =>
          traverseValueAndRetrieveContentIdsFromSubtitled(element));
      } else if (value instanceof Object) {
        Object.keys(value).forEach(key => {
          traverseValueAndRetrieveContentIdsFromSubtitled(value[key]);
        });
      }
    };

    Object.keys(customizationArgs).forEach(caName =>
      traverseValueAndRetrieveContentIdsFromSubtitled(
        customizationArgs[caName])
    );

    return contentIds;
  }

  toBackendDict(): InteractionBackendDict {
    return {
      answer_groups: this.answerGroups.map(function(answerGroup) {
        return answerGroup.toBackendDict();
      }),
      confirmed_unclassified_answers: this.confirmedUnclassifiedAnswers,
      customization_args: Interaction.convertCustomizationArgsToBackendDict(
        this.customizationArgs),
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
      private outcomeFactory: OutcomeObjectFactory,
      private subtitledHtmlFactory: SubtitledHtmlObjectFactory,
      private subtitledUnicodeFactory: SubtitledUnicodeObjectFactory,
  ) {}

  _createFromContinueCustomizationArgsBackendDict(
      caBackendDict: ContinueCustomizationArgsBackendDict
  ): ContinueCustomizationArgs {
    const { buttonText } = caBackendDict;
    return {
      buttonText: {
        value: this.subtitledUnicodeFactory.createFromBackendDict(
          buttonText.value)
      }
    };
  }

  _createFromDragAndDropSortInputCustomizationArgsBackendDict(
      caBackendDict: DragAndDropSortInputCustomizationArgsBackendDict
  ): DragAndDropSortInputCustomizationArgs {
    const { choices, allowMultipleItemsInSamePosition } = caBackendDict;
    return {
      allowMultipleItemsInSamePosition,
      choices: {
        value: choices.value.map(subtitledHtmlDict =>
          this.subtitledHtmlFactory.createFromBackendDict(subtitledHtmlDict))
      }
    };
  }

  _createFromFractionInputCustomizationArgsBackendDict(
      caBackendDict: FractionInputCustomizationArgsBackendDict
  ): FractionInputCustomizationArgs {
    const {
      requireSimplestForm, allowImproperFraction, allowNonzeroIntegerPart,
      customPlaceholder
    } = caBackendDict;
    return {
      requireSimplestForm, allowImproperFraction, allowNonzeroIntegerPart,
      customPlaceholder: {
        value: this.subtitledUnicodeFactory.createFromBackendDict(
          customPlaceholder.value)
      }
    };
  }

  _createFromItemSelectionInputCustomizationArgsBackendDict(
      caBackendDict: ItemSelectionInputCustomizationArgsBackendDict
  ): ItemSelectionInputCustomizationArgs {
    const {
      choices, maxAllowableSelectionCount, minAllowableSelectionCount
    } = caBackendDict;
    return {
      minAllowableSelectionCount,
      maxAllowableSelectionCount,
      choices: {
        value: choices.value.map(subtitledHtmlDict =>
          this.subtitledHtmlFactory.createFromBackendDict(subtitledHtmlDict))
      }
    };
  }

  _createFromIMultipleChoiceInputCustomizationArgsBackendDict(
      caBackendDict: MultipleChoiceInputCustomizationArgsBackendDict
  ): MultipleChoiceInputCustomizationArgs {
    const {
      choices, showChoicesInShuffledOrder
    } = caBackendDict;
    return {
      showChoicesInShuffledOrder,
      choices: {
        value: choices.value.map(subtitledHtmlDict =>
          this.subtitledHtmlFactory.createFromBackendDict(subtitledHtmlDict))
      }
    };
  }

  _createFromSetInputCustomizationArgsBackendDict(
      caBackendDict: SetInputCustomizationArgsBackendDict
  ): SetInputCustomizationArgs {
    const { buttonText } = caBackendDict;
    return {
      buttonText: {
        value: this.subtitledUnicodeFactory.createFromBackendDict(
          buttonText.value)
      }
    };
  }

  _createFromTextInputCustomizationArgsBackendDict(
      caBackendDict: TextInputCustomizationArgsBackendDict
  ): TextInputCustomizationArgs {
    const { rows, placeholder } = caBackendDict;
    return {
      rows,
      placeholder: {
        value: this.subtitledUnicodeFactory.createFromBackendDict(
          placeholder.value)
      }
    };
  }

  convertFromCustomizationArgsBackendDict(
      interactionId: string,
      caBackendDict: InteractionCustomizationArgsBackendDict
  ) : InteractionCustomizationArgs {
    if (interactionId === null) {
      return {};
    }
    switch (interactionId) {
      case 'AlgebraicExpressionInput':
        return (
          <AlgebraicExpressionInputCustomizationArgs> cloneDeep(caBackendDict));
      case 'CodeRepl':
        return <CodeReplCustomizationArgs> cloneDeep(caBackendDict);
      case 'Continue':
        return this._createFromContinueCustomizationArgsBackendDict(
          <ContinueCustomizationArgsBackendDict> caBackendDict);
      case 'DragAndDropSortInput':
        return this._createFromDragAndDropSortInputCustomizationArgsBackendDict(
          <DragAndDropSortInputCustomizationArgsBackendDict> caBackendDict);
      case 'EndExploration':
        return <EndExplorationCustomizationArgs> cloneDeep(caBackendDict);
      case 'FractionInput':
        return this._createFromFractionInputCustomizationArgsBackendDict(
          <FractionInputCustomizationArgsBackendDict> caBackendDict);
      case 'GraphInput':
        return (
          <GraphInputCustomizationArgs> cloneDeep(caBackendDict));
      case 'ImageClickInput':
        return <ImageClickInputCustomizationArgs> cloneDeep(caBackendDict);
      case 'InteractiveMap':
        return <InteractiveMapCustomizationArgs> cloneDeep(caBackendDict);
      case 'ItemSelectionInput':
        return this._createFromItemSelectionInputCustomizationArgsBackendDict(
          <ItemSelectionInputCustomizationArgsBackendDict> caBackendDict);
      case 'LogicProof':
        return <LogicCustomizationArgs> cloneDeep(caBackendDict);
      case 'MathEquationInput':
        return <MathEquationInputCustomizationArgs> cloneDeep(caBackendDict);
      case 'MathExpression':
        return <MathExpressionCustomizationArgs> cloneDeep(caBackendDict);
      case 'MultipleChoiceInput':
        return this._createFromIMultipleChoiceInputCustomizationArgsBackendDict(
          <MultipleChoiceInputCustomizationArgsBackendDict> caBackendDict);
      case 'MusicNotesInput':
        return <MusicNotesInputCustomizationArgs> cloneDeep(caBackendDict);
      case 'NumberWithUnits':
        return <NumberWithUnitsCustomizationArgs> cloneDeep(caBackendDict);
      case 'NumericExpressionInput':
        return (
          <NumericExpressionInputCustomizationArgs> cloneDeep(caBackendDict));
      case 'NumericInput':
        return <NumericInputCustomizationArgs> cloneDeep(caBackendDict);
      case 'PencilCodeEditor':
        return <PencilCodeCustomizationArgs> cloneDeep(caBackendDict);
      case 'SetInput':
        return this._createFromSetInputCustomizationArgsBackendDict(
          <SetInputCustomizationArgsBackendDict> caBackendDict);
      case 'TextInput':
        return this._createFromTextInputCustomizationArgsBackendDict(
          <TextInputCustomizationArgsBackendDict> caBackendDict);
      default:
        throw new Error(`Unrecognized interaction id ${interactionId}`);
    }
  }

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
      this.convertFromCustomizationArgsBackendDict(
        interactionDict.id,
        interactionDict.customization_args),
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
  'InteractionObjectFactory',
  downgradeInjectable(InteractionObjectFactory));
