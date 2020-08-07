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

export interface AlgebraicExpressionInputCustomizationArgs { }

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

export interface ContinueCustomizationArgs {
  buttonText?: {
    value: string;
  };
}

export interface DragAndDropSortInputCustomizationArgs {
  choices?: {
    value: string[];
  };
  allowMultipleItemsInSamePosition: {
    value: boolean;
  }
}

export interface EndExplorationCustomizationArgs {
  recommendedExplorationIds?: {
    value: string[];
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
    value: string;
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

export interface ImageClickInputCustomizationArgs {
  imageAndRegions?: {
    value: ImageWithRegions;
  };
  highlightRegionsOnHover?: {
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

export interface ItemSelectionInputCustomizationArgs {
  choices?: {
    value: string[];
  };
  maxAllowableSelectionCount?: {
    value: number;
  };
  minAllowableSelectionCount?: {
    value: number;
  };
}

export interface LogicCustomizationArgs {
  question?: {
    value: Object;
  };
}

export interface MathEquationInputCustomizationArgs { }

export interface MultipleChoiceInputCustomizationArgs {
  showChoicesInShuffledOrder?: {
    value: string;
  };
  choices?: {
    value: string[];
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

export interface PencilCodeCustomizationArgs {
  initialCode?: {
    value: string;
  };
}

export interface SetInputCustomizationArgs {
  buttonText?: {
    value: string;
  };
}

export interface TextInputCustomizationArgs {
  placeholder?: {
    value: string;
  };
  rows?: {
    value: number;
  };
}


export interface RatioExpressionInputCustomizationArgs {
  placeholder?: {
    value: string;
  };
}

export interface MathExpressionCustomizationArgs { }

export interface NumericExpressionInputCustomizationArgs { }

export interface NumericInputCustomizationArgs { }

export interface NumberWithUnitsCustomizationArgs { }

export interface NumberWithUnitsCustomizationArgs {

}

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
  LogicCustomizationArgs |
  MathEquationInputCustomizationArgs |
  MathExpressionCustomizationArgs |
  MultipleChoiceInputCustomizationArgs |
  MusicNotesInputCustomizationArgs |
  NumberWithUnitsCustomizationArgs |
  NumericExpressionInputCustomizationArgs |
  NumericInputCustomizationArgs |
  PencilCodeCustomizationArgs |
  RatioExpressionInputCustomizationArgs |
  SetInputCustomizationArgs |
  TextInputCustomizationArgs);
