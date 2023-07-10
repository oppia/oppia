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

interface GraphVertex {
  x: number;
  y: number;
  label: string;
}

interface GraphEdge {
  src: number;
  dst: number;
  weight: number;
}

export interface Unit {
  unit: string;
  exponent: number;
}

export type AlgebraicExpressionAnswer = string;

export interface CodeReplAnswer {
  code: string;
  output: string;
  evaluation: string;
  error: string;
}

export type ContinueAnswer = string;

export type DragAndDropAnswer = string[][];

export interface FractionAnswer {
  isNegative: boolean;
  wholeNumber: number;
  numerator: number;
  denominator: number;
}

export interface GraphAnswer {
  isDirected: boolean;
  isWeighted: boolean;
  isLabeled: boolean;
  vertices: GraphVertex[];
  edges: GraphEdge[];
}

export interface ImageClickAnswer {
  clickPosition: [number, number];
  clickedRegions: string[];
}

export type InteractiveMapAnswer = number[];

export type ItemSelectionAnswer = string[];

export type MathEquationAnswer = string;

export type MultipleChoiceAnswer = number;

export interface MusicNotesAnswer {
  readableNoteName: string;
  noteDuration: {
    num: number;
    den: number;
  };
}

export interface NumberWithUnitsAnswer {
  type: string;
  real: number;
  fraction: FractionAnswer;
  units: Unit[];
}

export type NumericExpressionAnswer = string;

export type NumericInputAnswer = number;

export interface PencilCodeEditorAnswer {
  code: string;
  output: string;
  evaluation: string;
  error: string;
}

export type RatioInputAnswer = number[];

export type SetInputAnswer = string[];

export type TextInputAnswer = string;

export type InteractionAnswer = (
  AlgebraicExpressionAnswer |
  CodeReplAnswer |
  ContinueAnswer |
  DragAndDropAnswer |
  FractionAnswer |
  GraphAnswer |
  ImageClickAnswer |
  InteractiveMapAnswer |
  ItemSelectionAnswer |
  MultipleChoiceAnswer |
  MusicNotesAnswer |
  NumericExpressionAnswer |
  NumberWithUnitsAnswer |
  NumericInputAnswer |
  PencilCodeEditorAnswer |
  RatioInputAnswer |
  SetInputAnswer |
  TextInputAnswer |
  MusicNotesAnswer[] |
  MathEquationAnswer);
