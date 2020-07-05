// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Type definiitions for Rule inputs.
 */

import {
  IFractionAnswer,
  INumberWithUnitsAnswer,
  IMusicNotesAnswer,
  IGraphAnswer } from
  'interactions/answer-defs';

export interface IAlgebraicExpressionRuleInputs {
  x: string;
}

export interface ICodeReplRuleInputs {
  x: string;
}

export interface IContinueRuleInputs {}

// DragAndDrop interaction has multiple types of inputs based on
// rule type.
export interface IDragAndDropCheckEqualityRuleInputs {
  x: string[][];
}

export interface IDragAndDropHasElementXAtPositionYRuleInputs {
  x: string;
  y: number;
}

export interface IDragAndDropHasElementXBeforeElementYRuleInputs {
  x: string;
  y: string;
}

export type IDragAndDropRuleInputs = (
  IDragAndDropCheckEqualityRuleInputs |
  IDragAndDropHasElementXAtPositionYRuleInputs |
  IDragAndDropHasElementXBeforeElementYRuleInputs);

export interface IEndExplorationRuleInputs {}

// FractionInput interaction has multiple types of inputs based on
// rule type.
export interface IFractionEquivalentRuleInputs {
  f: IFractionAnswer;
}

export interface IFractionIntegerPartRuleInputs {
  x: number;
}

export type IFractionRuleInputs = (
  IFractionEquivalentRuleInputs |
  IFractionIntegerPartRuleInputs);

// GraphInput interaction has multiple types of inputs based on
// rule type.
export interface IGraphPropertyRuleInputs {
  p: string;
}

export interface IGraphIsomorphicRuleInputs {
  g: IGraphAnswer;
}

export type IGraphRuleInputs = (
  IGraphPropertyRuleInputs |
  IGraphIsomorphicRuleInputs);

export interface IImageClickRuleInputs {
  x: string;
}

export interface IInteractiveMapRuleInputs {
  d: number;
  p: number[];
}

export interface IItemSelectionRuleInputs {
  x: string[];
}

export interface ILogicProofRuleInputs {
  c: string;
}

// MathEquation interaction has multiple types of inputs based on
// rule type.
export interface IMathEquationMatchesExactlyWithRuleInputs {
  x: string;
  y: string;
}

export interface IMathEquationIsEquivalentToRuleInputs {
  x: string;
}

export type IMathEquationRuleInputs = (
  IMathEquationMatchesExactlyWithRuleInputs |
  IMathEquationIsEquivalentToRuleInputs);

export interface IMathExpressionRuleInputs {
  x: string;
}

export interface IMultipleChoiceRuleInputs {
  x: number;
}

// MusicNotes interaction has multiple types of inputs based on
// rule type.
export interface IMusicNotesEqualsRuleInputs {
  x: IMusicNotesAnswer[];
}

export interface IMusicNotesIsLongerThanRuleInputs {
  k: number;
}

export interface IMusicNotesHasLengthInclusivelyBetweenRuleInputs {
  a: number;
  b: number;
}

export interface IMusicNotesIsEqualToExceptForRuleInputs {
  x: IMusicNotesAnswer[];
  k: number;
}

export interface IMusicNotesIsTranspositionOfRuleInputs {
  x: IMusicNotesAnswer[];
  y: number;
}

export interface IMusicNotesIsTranspositionOfExceptForRuleInputs {
  x: IMusicNotesAnswer[];
  y: number;
  k: number;
}

export type IMusicNotesRuleInputs = (
  IMusicNotesEqualsRuleInputs |
  IMusicNotesIsLongerThanRuleInputs |
  IMusicNotesHasLengthInclusivelyBetweenRuleInputs |
  IMusicNotesIsEqualToExceptForRuleInputs |
  IMusicNotesIsTranspositionOfRuleInputs |
  IMusicNotesIsTranspositionOfExceptForRuleInputs);

export interface INumberWithUnitsRuleInputs {
  f: INumberWithUnitsAnswer;
}

// NumericInput interaction has multiple types of inputs based on
// rule type.
export interface INumericInputEqualRuleInputs {
  x: number;
}

export interface INumericInputIsInclusivelyBetweenRuleInputs {
  a: number;
  b: number;
}

export interface INumericInputIsWithinToleranceRuleInputs {
  x: number;
  tol: number;
}

export type INumericInputRuleInputs = (
  INumericInputEqualRuleInputs |
  INumericInputIsInclusivelyBetweenRuleInputs |
  INumericInputIsWithinToleranceRuleInputs);

export interface IPencilCodeEditorRuleInputs {
  x: string;
}

export interface ISetInputRuleInputs {
  x: string[];
}

export interface ITextInputRuleInputs {
  x: string;
}

export type IInteractionRuleInputs = (
  IAlgebraicExpressionRuleInputs |
  ICodeReplRuleInputs |
  IContinueRuleInputs |
  IDragAndDropRuleInputs |
  IEndExplorationRuleInputs |
  IFractionRuleInputs |
  IGraphRuleInputs |
  IImageClickRuleInputs |
  IInteractiveMapRuleInputs |
  IItemSelectionRuleInputs |
  ILogicProofRuleInputs |
  IMathEquationRuleInputs |
  IMathExpressionRuleInputs |
  IMultipleChoiceRuleInputs |
  IMusicNotesRuleInputs |
  INumberWithUnitsRuleInputs |
  INumericInputRuleInputs |
  IPencilCodeEditorRuleInputs |
  ISetInputRuleInputs |
  ITextInputRuleInputs);
