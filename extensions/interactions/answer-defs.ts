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
 * @fileoverview Type definiitions for Answers.
 */

interface IGraphVertex {
  x: number;
  y: number;
  label: string;
}

interface IGraphEdge {
  src: number;
  dst: number;
  weight: number;
}

export interface IUnit {
  unit: string;
  exponent: number;
}

export type IAlgebraicExpressionAnswer = string;

export interface ICodeReplAnswer {
  code: string;
  output: string;
  evaluation: string;
  error: string;
}

export type IContinueAnswer = string;

export type IDragAndDropAnswer = string[][];

export interface IFractionAnswer {
  isNegative: boolean;
  wholeNumber: number;
  numerator: number;
  denominator: number;
}

export interface IGraphAnswer {
  isDirected: boolean;
  isWeighted: boolean;
  isLabeled: boolean;
  vertices: IGraphVertex[];
  edges: IGraphEdge[];
}

export interface IImageClickAnswer {
  clickPosition: [number, number];
  clickedRegions: string[];
}

export type IInteractiveMapAnswer = number[];

export type IItemSelectionAnswer = string[];

export interface ILogicProofAnswer {
  'assumptions_string': string,
  'target_string': string,
  'proof_string': string,
  'correct': boolean,
  'error_category'?: string,
  'error_code'?: string,
  'error_message'?: string,
  'error_line_number'?: number
}

export type IMathEquationAnswer = string;

export interface IMathExpressionAnswer {
  ascii: string;
  latex: string;
}

export type IMultipleChoiceAnswer = number;

export interface IMusicNotesAnswer {
  readableNoteName: string,
  noteDuration: {
    num: number,
    den: number
  }
}

export interface INumberWithUnitsAnswer {
  type: string;
  real: number;
  fraction: IFractionAnswer;
  units: IUnit[];
}

export type INumericInputAnswer = number;

export interface IPencilCodeEditorAnswer {
  code: string;
  output: string;
  evaluation: string;
  error: string;
}

export type ISetInputAnswer = string[];

export type ITextInputAnswer = string;

export type IInteractionAnswer = (
  IAlgebraicExpressionAnswer |
  ICodeReplAnswer |
  IContinueAnswer |
  IDragAndDropAnswer |
  IFractionAnswer |
  IGraphAnswer |
  IImageClickAnswer |
  IInteractiveMapAnswer |
  IItemSelectionAnswer |
  ILogicProofAnswer |
  IMathExpressionAnswer |
  IMultipleChoiceAnswer |
  IMusicNotesAnswer |
  INumberWithUnitsAnswer |
  INumericInputAnswer |
  IPencilCodeEditorAnswer |
  ISetInputAnswer |
  ITextInputAnswer |
  IMathEquationAnswer);
