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
  LogicProofCustomizationArgs,
  MathEquationInputCustomizationArgs,
  MultipleChoiceInputCustomizationArgs,
  MultipleChoiceInputCustomizationArgsBackendDict,
  MusicNotesInputCustomizationArgs,
  NumberWithUnitsCustomizationArgs,
  NumericExpressionInputCustomizationArgs,
  NumericInputCustomizationArgs,
  PencilCodeEditorCustomizationArgs,
  RatioExpressionInputCustomizationArgs,
  RatioExpressionInputCustomizationArgsBackendDict,
  SetInputCustomizationArgs,
  SetInputCustomizationArgsBackendDict,
  TextInputCustomizationArgs,
  TextInputCustomizationArgsBackendDict,
  NumericExpressionInputCustomizationArgsBackendDict
} from 'interactions/customization-args-defs';
import {
  SubtitledUnicodeObjectFactory, SubtitledUnicode
} from 'domain/exploration/SubtitledUnicodeObjectFactory';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';


export interface InteractionBackendDict {
  'default_outcome': OutcomeBackendDict;
  'answer_groups': readonly AnswerGroupBackendDict[];
  'confirmed_unclassified_answers': readonly InteractionAnswer[];
  'customization_args': InteractionCustomizationArgsBackendDict;
  'hints': readonly HintBackendDict[];
  'id': string;
  'solution': SolutionBackendDict;
}

export class Interaction {
  answerGroups: AnswerGroup[];
  confirmedUnclassifiedAnswers: readonly InteractionAnswer[];
  customizationArgs: InteractionCustomizationArgs;
  defaultOutcome: Outcome;
  hints: Hint[];
  id: string;
  solution: Solution;
  constructor(
      answerGroups: AnswerGroup[],
      confirmedUnclassifiedAnswers: readonly InteractionAnswer[],
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
        result = value.map(
          element => traverseSchemaAndConvertSubtitledToDicts(element));
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

  /**
   * This function is used to properly set state in Questions. The state in
   * Questions must handle its own WrittenTranslations and RecordedVoiceovers,
   * so it must get all content ids in the state. See
   * question-update.service.ts _updateContentIdsInAssets method for more
   * details.
   * @param {InteractionCustomizationArgs} customizationArgs The customization
   *  arguments to get content ids for.
   * @returns {string[]} List of content ids in customization args.
   */
  static getCustomizationArgContentIds(
      customizationArgs: InteractionCustomizationArgs
  ): string[] {
    const contentIds = [];

    const traverseValueAndRetrieveContentIdsFromSubtitled = (
        value: Object[] | Object
    ): void => {
      if (value instanceof SubtitledUnicode || value instanceof SubtitledHtml) {
        contentIds.push(value.contentId);
      } else if (value instanceof Array) {
        value.forEach(
          element => traverseValueAndRetrieveContentIdsFromSubtitled(element));
      } else if (value instanceof Object) {
        Object.keys(value).forEach(key => {
          traverseValueAndRetrieveContentIdsFromSubtitled(value[key]);
        });
      }
    };

    Object.keys(customizationArgs).forEach(
      caName => traverseValueAndRetrieveContentIdsFromSubtitled(
        customizationArgs[caName].value)
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
        value: choices.value.map(
          subtitledHtmlDict =>
            SubtitledHtml.createFromBackendDict(subtitledHtmlDict))
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
        value: choices.value.map(
          subtitledHtmlDict =>
            SubtitledHtml.createFromBackendDict(subtitledHtmlDict))
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
        value: choices.value.map(
          subtitledHtmlDict =>
            SubtitledHtml.createFromBackendDict(subtitledHtmlDict))
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

  _createFromNumericExpressionInputCustomizationArgsBackendDict(
      caBackendDict: NumericExpressionInputCustomizationArgsBackendDict
  ): NumericExpressionInputCustomizationArgs {
    const { useFractionForDivision, placeholder } = caBackendDict;
    return {
      useFractionForDivision,
      placeholder: {
        value: this.subtitledUnicodeFactory.createFromBackendDict(
          placeholder.value)
      }
    };
  }

  _createFromRatioExpressionInputCustomizationArgsBackendDict(
      caBackendDict: RatioExpressionInputCustomizationArgsBackendDict
  ): RatioExpressionInputCustomizationArgs {
    const { numberOfTerms, placeholder } = caBackendDict;
    return {
      numberOfTerms,
      placeholder: {
        value: this.subtitledUnicodeFactory.createFromBackendDict(
          placeholder.value)
      }
    };
  }

  convertFromCustomizationArgsBackendDict(
      interactionId: string,
      caBackendDict: InteractionCustomizationArgsBackendDict
  ): InteractionCustomizationArgs {
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
        return <LogicProofCustomizationArgs> cloneDeep(caBackendDict);
      case 'MathEquationInput':
        return <MathEquationInputCustomizationArgs> cloneDeep(caBackendDict);
      case 'MultipleChoiceInput':
        return this._createFromIMultipleChoiceInputCustomizationArgsBackendDict(
          <MultipleChoiceInputCustomizationArgsBackendDict> caBackendDict);
      case 'MusicNotesInput':
        return <MusicNotesInputCustomizationArgs> cloneDeep(caBackendDict);
      case 'NumberWithUnits':
        return <NumberWithUnitsCustomizationArgs> cloneDeep(caBackendDict);
      case 'NumericExpressionInput':
        return (
          this._createFromNumericExpressionInputCustomizationArgsBackendDict(
            <NumericExpressionInputCustomizationArgsBackendDict> caBackendDict)
        );
      case 'NumericInput':
        return <NumericInputCustomizationArgs> cloneDeep(caBackendDict);
      case 'PencilCodeEditor':
        return <PencilCodeEditorCustomizationArgs> cloneDeep(caBackendDict);
      case 'RatioExpressionInput':
        return this._createFromRatioExpressionInputCustomizationArgsBackendDict(
          <RatioExpressionInputCustomizationArgsBackendDict> caBackendDict);
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

  createFromBackendDict(interactionDict: InteractionBackendDict): Interaction {
    return new Interaction(
      this.createAnswerGroupsFromBackendDict(
        interactionDict.answer_groups,
        interactionDict.id),
      interactionDict.confirmed_unclassified_answers,
      this.convertFromCustomizationArgsBackendDict(
        interactionDict.id, interactionDict.customization_args),
      interactionDict.default_outcome ? this.createOutcomeFromBackendDict(
        interactionDict.default_outcome) : null,
      this.createHintsFromBackendDict(interactionDict.hints),
      interactionDict.id,
      interactionDict.solution ? this.createSolutionFromBackendDict(
        interactionDict.solution) : null);
  }

  createAnswerGroupsFromBackendDict(
      answerGroupBackendDicts: readonly AnswerGroupBackendDict[],
      interactionId: string
  ): AnswerGroup[] {
    return answerGroupBackendDicts.map((
        answerGroupBackendDict) => {
      return this.answerGroupFactory.createFromBackendDict(
        answerGroupBackendDict, interactionId);
    });
  }

  createHintsFromBackendDict(
      hintBackendDicts: readonly HintBackendDict[]): Hint[] {
    return hintBackendDicts.map((hintBackendDict) => {
      return this.hintFactory.createFromBackendDict(hintBackendDict);
    });
  }

  createOutcomeFromBackendDict(
      outcomeBackendDict: OutcomeBackendDict): Outcome {
    return this.outcomeFactory.createFromBackendDict(outcomeBackendDict);
  }

  createSolutionFromBackendDict(
      solutionBackendDict: SolutionBackendDict): Solution {
    return this.solutionFactory.createFromBackendDict(solutionBackendDict);
  }
}

angular.module('oppia').factory(
  'InteractionObjectFactory',
  downgradeInjectable(InteractionObjectFactory));
