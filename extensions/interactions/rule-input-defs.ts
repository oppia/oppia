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
  FractionAnswer,
  NumberWithUnitsAnswer,
  MusicNotesAnswer,
  GraphAnswer } from
  'interactions/answer-defs';

export interface AlgebraicExpressionRuleInputs {
  x: string;
}

export interface CodeReplRuleInputs {
  x: string;
}

export interface ContinueRuleInputs {}

// DragAndDrop interaction has multiple types of inputs based on
// rule type.
export interface DragAndDropCheckEqualityRuleInputs {
  x: string[][];
}

export interface DragAndDropHasElementXAtPositionYRuleInputs {
  x: string;
  y: number;
}

export interface DragAndDropHasElementXBeforeElementYRuleInputs {
  x: string;
  y: string;
}

export type DragAndDropRuleInputs = (
  DragAndDropCheckEqualityRuleInputs |
  DragAndDropHasElementXAtPositionYRuleInputs |
  DragAndDropHasElementXBeforeElementYRuleInputs);

export interface EndExplorationRuleInputs {}

// FractionInput interaction has multiple types of inputs based on
// rule type.
export interface FractionEquivalentRuleInputs {
  f: FractionAnswer;
}

export interface FractionIntegerPartRuleInputs {
  x: number;
}

export type FractionRuleInputs = (
  FractionEquivalentRuleInputs |
  FractionIntegerPartRuleInputs);

// GraphInput interaction has multiple types of inputs based on
// rule type.
export interface GraphPropertyRuleInputs {
  p: string;
}

export interface GraphIsomorphicRuleInputs {
  g: GraphAnswer;
}

export type GraphRuleInputs = (
  GraphPropertyRuleInputs |
  GraphIsomorphicRuleInputs);

export interface ImageClickRuleInputs {
  x: string;
}

export interface InteractiveMapRuleInputs {
  d: number;
  p: number[];
}

export interface ItemSelectionRuleInputs {
  x: string[];
}

export interface LogicProofRuleInputs {
  c: string;
}

// MathEquation interaction has multiple types of inputs based on
// rule type.
export interface MathEquationMatchesExactlyWithRuleInputs {
  x: string;
  y: string;
}

export interface MathEquationIsEquivalentToRuleInputs {
  x: string;
}

export type MathEquationRuleInputs = (
  MathEquationMatchesExactlyWithRuleInputs |
  MathEquationIsEquivalentToRuleInputs);

export interface MathExpressionRuleInputs {
  x: string;
}

export interface MultipleChoiceRuleInputs {
  x: number;
}

// MusicNotes interaction has multiple types of inputs based on
// rule type.
export interface MusicNotesEqualsRuleInputs {
  x: MusicNotesAnswer[];
}

export interface MusicNotesIsLongerThanRuleInputs {
  k: number;
}

export interface MusicNotesHasLengthInclusivelyBetweenRuleInputs {
  a: number;
  b: number;
}

export interface MusicNotesIsEqualToExceptForRuleInputs {
  x: MusicNotesAnswer[];
  k: number;
}

export interface MusicNotesIsTranspositionOfRuleInputs {
  x: MusicNotesAnswer[];
  y: number;
}

export interface MusicNotesIsTranspositionOfExceptForRuleInputs {
  x: MusicNotesAnswer[];
  y: number;
  k: number;
}

export type MusicNotesRuleInputs = (
  MusicNotesEqualsRuleInputs |
  MusicNotesIsLongerThanRuleInputs |
  MusicNotesHasLengthInclusivelyBetweenRuleInputs |
  MusicNotesIsEqualToExceptForRuleInputs |
  MusicNotesIsTranspositionOfRuleInputs |
  MusicNotesIsTranspositionOfExceptForRuleInputs);

export interface NumberWithUnitsRuleInputs {
  f: NumberWithUnitsAnswer;
}

export interface NumericExpressionRuleInputs {
  x: string;
}

// NumericInput interaction has multiple types of inputs based on
// rule type.
export interface NumericInputEqualRuleInputs {
  x: number;
}

export interface NumericInputIsInclusivelyBetweenRuleInputs {
  a: number;
  b: number;
}

export interface NumericInputIsWithinToleranceRuleInputs {
  x: number;
  tol: number;
}

export type NumericInputRuleInputs = (
  NumericInputEqualRuleInputs |
  NumericInputIsInclusivelyBetweenRuleInputs |
  NumericInputIsWithinToleranceRuleInputs);

export interface PencilCodeEditorRuleInputs {
  x: string;
}

// RatioInput interaction has multiple types of inputs based on
// rule type.
export interface RatioInputEqualRulesInputs {
  x: string;
}

export interface RatioInputHasNumberOfTermsEqualToRulesInputs {
  x: number;
}

export type RatioInputRulesInputs = (
  RatioInputEqualRulesInputs |
  RatioInputHasNumberOfTermsEqualToRulesInputs);

export interface SetInputRuleInputs {
  x: string[];
}

export interface TextInputRuleInputs {
  x: string;
}

export type InteractionRuleInputs = (
  AlgebraicExpressionRuleInputs |
  CodeReplRuleInputs |
  ContinueRuleInputs |
  DragAndDropRuleInputs |
  EndExplorationRuleInputs |
  FractionRuleInputs |
  GraphRuleInputs |
  ImageClickRuleInputs |
  InteractiveMapRuleInputs |
  ItemSelectionRuleInputs |
  LogicProofRuleInputs |
  MathEquationRuleInputs |
  MathExpressionRuleInputs |
  MultipleChoiceRuleInputs |
  MusicNotesRuleInputs |
  NumericExpressionRuleInputs |
  NumberWithUnitsRuleInputs |
  NumericInputRuleInputs |
  PencilCodeEditorRuleInputs |
  RatioInputRulesInputs|
  SetInputRuleInputs |
  TextInputRuleInputs);
