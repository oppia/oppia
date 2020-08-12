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
 * @fileoverview Type definiitions for Customization Args.
 */

import { GraphAnswer } from 'interactions/answer-defs';

import { SubtitledHtmlBackendDict, SubtitledHtml } from
  'domain/exploration/SubtitledHtmlObjectFactory';
import { SubtitledUnicodeBackendDict, SubtitledUnicode } from
  'domain/exploration/SubtitledUnicodeObjectFactory';


interface LabeledRegion {
  region: {
    area: number[][];
  };
  label: string;
}

interface ImageWithRegions {
  labeledRegions: LabeledRegion[];
  imagePath: string;
}

interface ReadableMusicNote {
  readableNoteName: string;
}

export interface AlgebraicExpressionInputCustomizationArgs {
  customOskLetters: {
    value: string[];
  };
}
interface AlgebraicExpressionInputCustomizationArgsBackendDict {
  customOskLetters: {
    value: string[];
  };
}


interface CodeReplCustomizationArgsBackendDict {
  language?: {
    value: string;
  };
  placeholder?: {
    value: string;
  };
  preCode?: {
    value: string;
  };
  postCode?: {
    value: string;
  };
}
export interface CodeReplCustomizationArgs {
  language?: {
    value: string;
  };
  placeholder?: {
    value: string;
  };
  preCode?: {
    value: string;
  };
  postCode?: {
    value: string;
  };
}


export interface ContinueCustomizationArgsBackendDict {
  buttonText?: {
    value: SubtitledUnicodeBackendDict;
  };
}
export interface ContinueCustomizationArgs {
  buttonText?: {
    value: SubtitledUnicode;
  };
}


export interface DragAndDropSortInputCustomizationArgsBackendDict {
  choices?: {
    value: SubtitledHtmlBackendDict[];
  };
  allowMultipleItemsInSamePosition: {
    value: boolean;
  }
}
export interface DragAndDropSortInputCustomizationArgs {
  choices?: {
    value: SubtitledHtml[];
  };
  allowMultipleItemsInSamePosition: {
    value: boolean;
  }
}


interface EndExplorationCustomizationArgsBackendDict {
  recommendedExplorationIds?: {
    value: string[];
  };
}
export interface EndExplorationCustomizationArgs {
  recommendedExplorationIds?: {
    value: string[];
  };
}


export interface FractionInputCustomizationArgsBackendDict {
  requireSimplestForm?: {
    value: string;
  };
  allowImproperFraction?: {
    value: string;
  };
  allowNonzeroIntegerPart?: {
    value: string;
  };
  customPlaceholder?: {
    value: SubtitledUnicodeBackendDict;
  };
}
export interface FractionInputCustomizationArgs {
  requireSimplestForm?: {
    value: string;
  };
  allowImproperFraction?: {
    value: string;
  };
  allowNonzeroIntegerPart?: {
    value: string;
  };
  customPlaceholder?: {
    value: SubtitledUnicode;
  };
}


interface GraphInputCustomizationArgsBackendDict {
  graph?: {
    value: GraphAnswer;
  };
  canAddVertex: {
    value: boolean;
  };
  canDeleteVertex: {
    value: boolean;
  };
  canEditVertexLabel: {
    value: boolean;
  };
  canMoveVertex: {
    value: boolean;
  };
  canAddEdge: {
    value: boolean;
  };
  canDeleteEdge: {
    value: boolean;
  };
  canEditEdgeWeight: {
    value: boolean;
  };
}
export interface GraphInputCustomizationArgs {
  graph?: {
    value: GraphAnswer;
  };
  canAddVertex: {
    value: boolean;
  };
  canDeleteVertex: {
    value: boolean;
  };
  canEditVertexLabel: {
    value: boolean;
  };
  canMoveVertex: {
    value: boolean;
  };
  canAddEdge: {
    value: boolean;
  };
  canDeleteEdge: {
    value: boolean;
  };
  canEditEdgeWeight: {
    value: boolean;
  };
}


interface ImageClickInputCustomizationArgsBackendDict {
  imageAndRegions?: {
    value: ImageWithRegions;
  };
  highlightRegionsOnHover?: {
    value: string;
  };
}
export interface ImageClickInputCustomizationArgs {
  imageAndRegions?: {
    value: ImageWithRegions;
  };
  highlightRegionsOnHover?: {
    value: string;
  };
}


interface InteractiveMapCustomizationArgsBackendDict {
  latitude?: {
    value: number;
  };
  longitude?: {
    value: number;
  };
  zoom?: {
    value: string;
  };
}
export interface InteractiveMapCustomizationArgs {
  latitude?: {
    value: number;
  };
  longitude?: {
    value: number;
  };
  zoom?: {
    value: string;
  };
}


export interface ItemSelectionInputCustomizationArgsBackendDict {
  choices?: {
    value: SubtitledHtmlBackendDict[];
  };
  maxAllowableSelectionCount?: {
    value: number;
  };
  minAllowableSelectionCount?: {
    value: number;
  };
}
export interface ItemSelectionInputCustomizationArgs {
  choices?: {
    value: SubtitledHtml[];
  };
  maxAllowableSelectionCount?: {
    value: number;
  };
  minAllowableSelectionCount?: {
    value: number;
  };
}


interface LogicProofCustomizationArgsBackendDict {
  question?: {
    value: Object;
  };
}
export interface LogicProofCustomizationArgs {
  question?: {
    value: Object;
  };
}


interface MathEquationInputCustomizationArgsBackendDict {
  customOskLetters: {
    value: string[];
  };
}
export interface MathEquationInputCustomizationArgs {
  customOskLetters: {
    value: string[];
  };
}


export interface MultipleChoiceInputCustomizationArgsBackendDict {
  showChoicesInShuffledOrder?: {
    value: string;
  };
  choices?: {
    value: SubtitledHtmlBackendDict[];
  };
}
export interface MultipleChoiceInputCustomizationArgs {
  showChoicesInShuffledOrder?: {
    value: string;
  };
  choices?: {
    value: SubtitledHtml[];
  };
}


interface MusicNotesInputCustomizationArgsBackendDict {
  sequenceToGuess?: {
    value: ReadableMusicNote[];
  };
  initialSequence?: {
    value: ReadableMusicNote[];
  };
}
export interface MusicNotesInputCustomizationArgs {
  sequenceToGuess?: {
    value: ReadableMusicNote[];
  };
  initialSequence?: {
    value: ReadableMusicNote[];
  };
}


interface PencilCodeEditorCustomizationArgsBackendDict {
  initialCode?: {
    value: string;
  };
}
export interface PencilCodeEditorCustomizationArgs {
  initialCode?: {
    value: string;
  };
}

interface RationExpressionInputCustomizationArgsBackendDict {
  placeholder?: {
    value: string;
  };
}
export interface RationExpressionInputCustomizationArgs {
  placeholder?: {
    value: string;
  };
}


export interface SetInputCustomizationArgsBackendDict {
  buttonText?: {
    value: SubtitledUnicodeBackendDict;
  };
}
export interface SetInputCustomizationArgs {
  buttonText?: {
    value: SubtitledUnicode;
  };
}


export interface TextInputCustomizationArgsBackendDict {
  placeholder?: {
    value: SubtitledUnicodeBackendDict;
  };
  rows?: {
    value: number;
  };
}
export interface TextInputCustomizationArgs {
  placeholder?: {
    value: SubtitledUnicode;
  };
  rows?: {
    value: number;
  };
}


interface MathExpressionInputCustomizationArgsBackendDict { }
export interface MathExpressionInputCustomizationArgs { }


interface NumericExpressionInputCustomizationArgsBackendDict { }
export interface NumericExpressionInputCustomizationArgs { }


interface NumericInputCustomizationArgsBackendDict { }
export interface NumericInputCustomizationArgs { }


interface NumberWithUnitsCustomizationArgsBackendDict { }
export interface NumberWithUnitsCustomizationArgs { }


export type InteractionCustomizationArgsBackendDict = (
  AlgebraicExpressionInputCustomizationArgsBackendDict |
  CodeReplCustomizationArgsBackendDict |
  ContinueCustomizationArgsBackendDict |
  DragAndDropSortInputCustomizationArgsBackendDict |
  EndExplorationCustomizationArgsBackendDict |
  FractionInputCustomizationArgsBackendDict |
  GraphInputCustomizationArgsBackendDict |
  ImageClickInputCustomizationArgsBackendDict |
  InteractiveMapCustomizationArgsBackendDict |
  ItemSelectionInputCustomizationArgsBackendDict |
  LogicProofCustomizationArgsBackendDict |
  MathEquationInputCustomizationArgsBackendDict |
  MathExpressionInputCustomizationArgsBackendDict |
  MultipleChoiceInputCustomizationArgsBackendDict |
  MusicNotesInputCustomizationArgsBackendDict |
  NumberWithUnitsCustomizationArgsBackendDict |
  NumericExpressionInputCustomizationArgsBackendDict |
  NumericInputCustomizationArgsBackendDict |
  PencilCodeEditorCustomizationArgsBackendDict |
  RationExpressionInputCustomizationArgsBackendDict |
  SetInputCustomizationArgsBackendDict |
  TextInputCustomizationArgsBackendDict);

export type InteractionCustomizationArgs = (
  AlgebraicExpressionInputCustomizationArgs |
  CodeReplCustomizationArgs |
  ContinueCustomizationArgs |
  DragAndDropSortInputCustomizationArgs |
  EndExplorationCustomizationArgs |
  FractionInputCustomizationArgs |
  GraphInputCustomizationArgs |
  ImageClickInputCustomizationArgs |
  InteractiveMapCustomizationArgs |
  ItemSelectionInputCustomizationArgs |
  LogicProofCustomizationArgs |
  MathEquationInputCustomizationArgs |
  MathExpressionInputCustomizationArgs |
  MultipleChoiceInputCustomizationArgs |
  MusicNotesInputCustomizationArgs |
  NumberWithUnitsCustomizationArgs |
  NumericExpressionInputCustomizationArgs |
  NumericInputCustomizationArgs |
  PencilCodeEditorCustomizationArgs |
  RationExpressionInputCustomizationArgs |
  SetInputCustomizationArgs |
  TextInputCustomizationArgs);
