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
import {} from '@angular/upgrade/static';
import {Injectable} from '@angular/core';

import cloneDeep from 'lodash/cloneDeep';

import {
  AnswerGroup,
  AnswerGroupBackendDict,
  AnswerGroupObjectFactory,
} from 'domain/exploration/AnswerGroupObjectFactory';
import {HintBackendDict, Hint} from 'domain/exploration/hint-object.model';
import {
  OutcomeBackendDict,
  Outcome,
  OutcomeObjectFactory,
} from 'domain/exploration/OutcomeObjectFactory';
import {
  SolutionBackendDict,
  Solution,
  SolutionObjectFactory,
} from 'domain/exploration/SolutionObjectFactory';
import {InteractionAnswer} from 'interactions/answer-defs';
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
  MathEquationInputCustomizationArgs,
  MultipleChoiceInputCustomizationArgs,
  MultipleChoiceInputCustomizationArgsBackendDict,
  MusicNotesInputCustomizationArgs,
  NumberWithUnitsCustomizationArgs,
  NumericExpressionInputCustomizationArgs,
  NumericInputCustomizationArgsBackendDict,
  NumericInputCustomizationArgs,
  PencilCodeEditorCustomizationArgs,
  RatioExpressionInputCustomizationArgs,
  RatioExpressionInputCustomizationArgsBackendDict,
  SetInputCustomizationArgs,
  SetInputCustomizationArgsBackendDict,
  TextInputCustomizationArgs,
  TextInputCustomizationArgsBackendDict,
  NumericExpressionInputCustomizationArgsBackendDict,
} from 'interactions/customization-args-defs';
import {
  SubtitledUnicodeObjectFactory,
  SubtitledUnicode,
} from 'domain/exploration/SubtitledUnicodeObjectFactory';
import {SubtitledHtml} from 'domain/exploration/subtitled-html.model';
import {BaseTranslatableObject} from 'domain/objects/BaseTranslatableObject.model';

export interface InteractionBackendDict {
  // A null 'default_outcome' indicates that this interaction is
  // an EndExploration interaction.
  default_outcome: OutcomeBackendDict | null;
  answer_groups: readonly AnswerGroupBackendDict[];
  confirmed_unclassified_answers: readonly InteractionAnswer[];
  customization_args: InteractionCustomizationArgsBackendDict;
  hints: readonly HintBackendDict[];
  // Id is null until populated from the backend,
  id: string | null;
  // A null 'solution' indicates that this Interaction does not have a hint
  // or there is a hint, but no solution. A new interaction is initialised with
  // null 'solution' and stays null until the first hint with solution is added.
  solution: SolutionBackendDict | null;
}

export class Interaction extends BaseTranslatableObject {
  answerGroups: AnswerGroup[];
  confirmedUnclassifiedAnswers: readonly InteractionAnswer[];
  customizationArgs: InteractionCustomizationArgs;
  defaultOutcome: Outcome | null;
  hints: Hint[];
  id: string | null;
  solution: Solution | null;
  currentAnswer: InteractionAnswer | null = null;
  submitClicked = false;
  constructor(
    answerGroups: AnswerGroup[],
    confirmedUnclassifiedAnswers: readonly InteractionAnswer[],
    customizationArgs: InteractionCustomizationArgs,
    defaultOutcome: Outcome | null,
    hints: Hint[],
    id: string | null,
    solution: Solution | null
  ) {
    super();
    this.answerGroups = answerGroups;
    this.confirmedUnclassifiedAnswers = confirmedUnclassifiedAnswers;
    this.customizationArgs = customizationArgs;
    this.defaultOutcome = defaultOutcome;
    this.hints = hints;
    this.id = id;
    this.solution = solution;
  }

  getTranslatableFields(): (SubtitledUnicode | SubtitledHtml)[] {
    return Interaction.getCustomizationArgContents(this.customizationArgs);
  }

  getTranslatableObjects(): BaseTranslatableObject[] {
    let translatableObjects: BaseTranslatableObject[] = [
      ...this.answerGroups,
      ...this.hints,
    ];

    if (this.defaultOutcome) {
      translatableObjects.push(this.defaultOutcome);
    }

    if (this.solution) {
      translatableObjects.push(this.solution);
    }
    return translatableObjects;
  }

  getContentIdToHtml(): {[contentId: string]: string} {
    let contentIdToHtml = {};
    let answerGroupsContentIdToHtml = {};
    let outcomeContentIdToHtml = {};

    for (let answerGroup of this.answerGroups) {
      Object.assign(
        answerGroupsContentIdToHtml,
        answerGroupsContentIdToHtml,
        answerGroup.getContentIdToHtml()
      );
    }

    if (this.defaultOutcome) {
      outcomeContentIdToHtml = this.defaultOutcome.getContentIdToHtml();
    }

    return Object.assign(
      contentIdToHtml,
      answerGroupsContentIdToHtml,
      outcomeContentIdToHtml
    );
  }

  getContentIdForMatchingHtml(contentHtml: string): string | undefined {
    let contentIdToHtml = this.getContentIdToHtml();
    for (let contentId in contentIdToHtml) {
      let retrievedHtml = contentIdToHtml[contentId];

      if (retrievedHtml === contentHtml) {
        return contentId;
      }
    }
    return undefined;
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
    this.confirmedUnclassifiedAnswers = cloneDeep(
      otherInteraction.confirmedUnclassifiedAnswers
    );
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
      if (value instanceof SubtitledUnicode || value instanceof SubtitledHtml) {
        return value.toBackendDict();
      } else if (value instanceof Array) {
        return value.map(element =>
          traverseSchemaAndConvertSubtitledToDicts(element)
        );
      } else if (value instanceof Object) {
        type KeyOfValue = keyof typeof value;
        let _result: Record<KeyOfValue, Object> = {};
        let keys = Object.keys(value) as KeyOfValue[];
        keys.forEach(key => {
          _result[key] = traverseSchemaAndConvertSubtitledToDicts(value[key]);
        });
        return _result as Object;
      }

      return value;
    };

    const customizationArgsBackendDict: Record<string, Object> = {};
    Object.entries(customizationArgs).forEach(([caName, caValue]) => {
      customizationArgsBackendDict[caName] = {
        value: traverseSchemaAndConvertSubtitledToDicts(caValue.value),
      };
    });

    return customizationArgsBackendDict;
  }

  static getCustomizationArgContents(
    customizationArgs: InteractionCustomizationArgs
  ): (SubtitledUnicode | SubtitledHtml)[] {
    const contents: (SubtitledUnicode | SubtitledHtml)[] = [];

    const traverseValueAndRetrieveContentIdsFromSubtitled = (
      value: Object[] | Object
    ): void => {
      if (value instanceof SubtitledUnicode || value instanceof SubtitledHtml) {
        contents.push(value);
      } else if (value instanceof Array) {
        value.forEach(element =>
          traverseValueAndRetrieveContentIdsFromSubtitled(element)
        );
      } else if (value instanceof Object) {
        type KeyOfValue = keyof typeof value;
        const keys = Object.keys(value) as KeyOfValue[];
        keys.forEach(key => {
          traverseValueAndRetrieveContentIdsFromSubtitled(value[key]);
        });
      }
    };

    if (customizationArgs) {
      Object.values(customizationArgs).forEach(caValue => {
        traverseValueAndRetrieveContentIdsFromSubtitled(caValue.value);
      });
    }

    return contents;
  }

  toBackendDict(): InteractionBackendDict {
    return {
      answer_groups: this.answerGroups.map(function (answerGroup) {
        return answerGroup.toBackendDict();
      }),
      confirmed_unclassified_answers: this.confirmedUnclassifiedAnswers,
      customization_args: Interaction.convertCustomizationArgsToBackendDict(
        this.customizationArgs
      ),
      default_outcome: this.defaultOutcome
        ? this.defaultOutcome.toBackendDict()
        : null,
      hints: this.hints.map(function (hint) {
        return hint.toBackendDict();
      }),
      id: this.id,
      solution: this.solution ? this.solution.toBackendDict() : null,
    };
  }
}

@Injectable({
  providedIn: 'root',
})
export class InteractionObjectFactory {
  constructor(
    private answerGroupFactory: AnswerGroupObjectFactory,
    private solutionFactory: SolutionObjectFactory,
    private outcomeFactory: OutcomeObjectFactory,
    private subtitledUnicodeFactory: SubtitledUnicodeObjectFactory
  ) {}

  _createFromContinueCustomizationArgsBackendDict(
    caBackendDict: ContinueCustomizationArgsBackendDict
  ): ContinueCustomizationArgs {
    const {buttonText} = caBackendDict;
    return {
      buttonText: {
        value: this.subtitledUnicodeFactory.createFromBackendDict(
          buttonText.value
        ),
      },
    };
  }

  _createFromDragAndDropSortInputCustomizationArgsBackendDict(
    caBackendDict: DragAndDropSortInputCustomizationArgsBackendDict
  ): DragAndDropSortInputCustomizationArgs {
    const {choices, allowMultipleItemsInSamePosition} = caBackendDict;
    return {
      allowMultipleItemsInSamePosition,
      choices: {
        value: choices.value.map(subtitledHtmlDict =>
          SubtitledHtml.createFromBackendDict(subtitledHtmlDict)
        ),
      },
    };
  }

  _createFromFractionInputCustomizationArgsBackendDict(
    caBackendDict: FractionInputCustomizationArgsBackendDict
  ): FractionInputCustomizationArgs {
    const {
      requireSimplestForm,
      allowImproperFraction,
      allowNonzeroIntegerPart,
      customPlaceholder,
    } = caBackendDict;
    return {
      requireSimplestForm,
      allowImproperFraction,
      allowNonzeroIntegerPart,
      customPlaceholder: {
        value: this.subtitledUnicodeFactory.createFromBackendDict(
          customPlaceholder.value
        ),
      },
    };
  }

  _createFromItemSelectionInputCustomizationArgsBackendDict(
    caBackendDict: ItemSelectionInputCustomizationArgsBackendDict
  ): ItemSelectionInputCustomizationArgs {
    const {choices, maxAllowableSelectionCount, minAllowableSelectionCount} =
      caBackendDict;
    return {
      minAllowableSelectionCount,
      maxAllowableSelectionCount,
      choices: {
        value: choices.value.map(subtitledHtmlDict =>
          SubtitledHtml.createFromBackendDict(subtitledHtmlDict)
        ),
      },
    };
  }

  _createFromIMultipleChoiceInputCustomizationArgsBackendDict(
    caBackendDict: MultipleChoiceInputCustomizationArgsBackendDict
  ): MultipleChoiceInputCustomizationArgs {
    const {choices, showChoicesInShuffledOrder} = caBackendDict;
    return {
      showChoicesInShuffledOrder,
      choices: {
        value: choices.value.map(subtitledHtmlDict =>
          SubtitledHtml.createFromBackendDict(subtitledHtmlDict)
        ),
      },
    };
  }

  _createFromSetInputCustomizationArgsBackendDict(
    caBackendDict: SetInputCustomizationArgsBackendDict
  ): SetInputCustomizationArgs {
    const {buttonText} = caBackendDict;
    return {
      buttonText: {
        value: this.subtitledUnicodeFactory.createFromBackendDict(
          buttonText.value
        ),
      },
    };
  }

  _createFromTextInputCustomizationArgsBackendDict(
    caBackendDict: TextInputCustomizationArgsBackendDict
  ): TextInputCustomizationArgs {
    const {rows, placeholder} = caBackendDict;
    return {
      rows,
      placeholder: {
        value: this.subtitledUnicodeFactory.createFromBackendDict(
          placeholder.value
        ),
      },
      catchMisspellings: {
        value: false,
      },
    };
  }

  _createFromNumericExpressionInputCustomizationArgsBackendDict(
    caBackendDict: NumericExpressionInputCustomizationArgsBackendDict
  ): NumericExpressionInputCustomizationArgs {
    const {useFractionForDivision, placeholder} = caBackendDict;
    return {
      useFractionForDivision,
      placeholder: {
        value: this.subtitledUnicodeFactory.createFromBackendDict(
          placeholder.value
        ),
      },
    };
  }

  _createFromRatioExpressionInputCustomizationArgsBackendDict(
    caBackendDict: RatioExpressionInputCustomizationArgsBackendDict
  ): RatioExpressionInputCustomizationArgs {
    const {numberOfTerms, placeholder} = caBackendDict;
    return {
      numberOfTerms,
      placeholder: {
        value: this.subtitledUnicodeFactory.createFromBackendDict(
          placeholder.value
        ),
      },
    };
  }

  _createFromNumericInputCustomizationArgsBackendDict(
    caBackendDict: NumericInputCustomizationArgsBackendDict
  ): NumericInputCustomizationArgs {
    const {requireNonnegativeInput} = caBackendDict;
    return {requireNonnegativeInput};
  }

  convertFromCustomizationArgsBackendDict(
    interactionId: string | null,
    caBackendDict: InteractionCustomizationArgsBackendDict
  ): InteractionCustomizationArgs {
    if (interactionId === null) {
      return {};
    }
    switch (interactionId) {
      case 'AlgebraicExpressionInput':
        return cloneDeep(
          caBackendDict as AlgebraicExpressionInputCustomizationArgs
        );
      case 'CodeRepl':
        return cloneDeep(caBackendDict as CodeReplCustomizationArgs);
      case 'Continue':
        return this._createFromContinueCustomizationArgsBackendDict(
          caBackendDict as ContinueCustomizationArgsBackendDict
        );
      case 'DragAndDropSortInput':
        return this._createFromDragAndDropSortInputCustomizationArgsBackendDict(
          caBackendDict as DragAndDropSortInputCustomizationArgsBackendDict
        );
      case 'EndExploration':
        return cloneDeep(caBackendDict as EndExplorationCustomizationArgs);
      case 'FractionInput':
        return this._createFromFractionInputCustomizationArgsBackendDict(
          caBackendDict as FractionInputCustomizationArgsBackendDict
        );
      case 'GraphInput':
        return cloneDeep(caBackendDict as GraphInputCustomizationArgs);
      case 'ImageClickInput':
        return cloneDeep(caBackendDict as ImageClickInputCustomizationArgs);
      case 'InteractiveMap':
        return cloneDeep(caBackendDict as InteractiveMapCustomizationArgs);
      case 'ItemSelectionInput':
        return this._createFromItemSelectionInputCustomizationArgsBackendDict(
          caBackendDict as ItemSelectionInputCustomizationArgsBackendDict
        );
      case 'MathEquationInput':
        return cloneDeep(caBackendDict as MathEquationInputCustomizationArgs);
      case 'MultipleChoiceInput':
        return this._createFromIMultipleChoiceInputCustomizationArgsBackendDict(
          caBackendDict as MultipleChoiceInputCustomizationArgsBackendDict
        );
      case 'MusicNotesInput':
        return cloneDeep(caBackendDict as MusicNotesInputCustomizationArgs);
      case 'NumberWithUnits':
        return cloneDeep(caBackendDict as NumberWithUnitsCustomizationArgs);
      case 'NumericExpressionInput':
        return this._createFromNumericExpressionInputCustomizationArgsBackendDict(
          caBackendDict as NumericExpressionInputCustomizationArgsBackendDict
        );
      case 'NumericInput':
        return this._createFromNumericInputCustomizationArgsBackendDict(
          caBackendDict as NumericInputCustomizationArgsBackendDict
        );
      case 'PencilCodeEditor':
        return cloneDeep(caBackendDict as PencilCodeEditorCustomizationArgs);
      case 'RatioExpressionInput':
        return this._createFromRatioExpressionInputCustomizationArgsBackendDict(
          caBackendDict as RatioExpressionInputCustomizationArgsBackendDict
        );
      case 'SetInput':
        return this._createFromSetInputCustomizationArgsBackendDict(
          caBackendDict as SetInputCustomizationArgsBackendDict
        );
      case 'TextInput':
        return this._createFromTextInputCustomizationArgsBackendDict(
          caBackendDict as TextInputCustomizationArgsBackendDict
        );
      default:
        throw new Error(`Unrecognized interaction id ${interactionId}`);
    }
  }

  createFromBackendDict(interactionDict: InteractionBackendDict): Interaction {
    return new Interaction(
      interactionDict.id
        ? this.createAnswerGroupsFromBackendDict(
            interactionDict.answer_groups,
            interactionDict.id
          )
        : [],
      interactionDict.confirmed_unclassified_answers,
      this.convertFromCustomizationArgsBackendDict(
        interactionDict.id,
        interactionDict.customization_args
      ),
      interactionDict.default_outcome
        ? this.createOutcomeFromBackendDict(interactionDict.default_outcome)
        : null,
      this.createHintsFromBackendDict(interactionDict.hints),
      interactionDict.id,
      interactionDict.solution
        ? this.createSolutionFromBackendDict(interactionDict.solution)
        : null
    );
  }

  createAnswerGroupsFromBackendDict(
    answerGroupBackendDicts: readonly AnswerGroupBackendDict[],
    interactionId: string
  ): AnswerGroup[] {
    return answerGroupBackendDicts.map(answerGroupBackendDict => {
      return this.answerGroupFactory.createFromBackendDict(
        answerGroupBackendDict,
        interactionId
      );
    });
  }

  createHintsFromBackendDict(
    hintBackendDicts: readonly HintBackendDict[]
  ): Hint[] {
    return hintBackendDicts.map(hintBackendDict => {
      return Hint.createFromBackendDict(hintBackendDict);
    });
  }

  createOutcomeFromBackendDict(
    outcomeBackendDict: OutcomeBackendDict
  ): Outcome {
    return this.outcomeFactory.createFromBackendDict(outcomeBackendDict);
  }

  createSolutionFromBackendDict(
    solutionBackendDict: SolutionBackendDict
  ): Solution {
    return this.solutionFactory.createFromBackendDict(solutionBackendDict);
  }
}
