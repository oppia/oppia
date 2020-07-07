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

import { IGraphAnswer } from 'interactions/answer-defs';

interface ILabeledRegion {
  region: {
    area: number[][];
  };
  label: string;
}

interface IImageWithRegions {
  labeledRegions: ILabeledRegion[];
  imagePath: string;
}

interface IReadableMusicNote {
  readableNoteName: string;
}

export interface IAlgebraicExpressionInputCustomizationArgs { }

export interface ICodeReplCustomizationArgs {
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

export interface IContinueCustomizationArgs {
  buttonText?: {
    value: string;
  };
}

export interface IDragAndDropSortInputCustomizationArgs {
  choices?: {
    value: string[];
  };
  allowMultipleItemsInSamePosition: {
    value: boolean;
  }
}

export interface IEndExplorationCustomizationArgs {
  recommendedExplorationIds?: {
    value: string[];
  };
}

export interface IFractionInputCustomizationArgs {
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

export interface IGraphInputCustomizationArgs {
  graph?: {
    value: IGraphAnswer;
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

export interface IImageClickInputCustomizationArgs {
  imageAndRegions?: {
    value: IImageWithRegions;
  };
  highlightRegionsOnHover?: {
    value: string;
  };
}

export interface IInteractiveMapCustomizationArgs {
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

export interface IItemSelectionInputCustomizationArgs {
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

export interface ILogicCustomizationArgs {
  question?: {
    value: Object;
  };
}

export interface IMathEquationInputCustomizationArgs { }

export interface IMultipleChoiceInputCustomizationArgs {
  showChoicesInShuffledOrder?: {
    value: string;
  };
  choices?: {
    value: string[];
  };
}

export interface IMusicNotesInputCustomizationArgs {
  sequenceToGuess?: {
    value: IReadableMusicNote[];
  };
  initialSequence?: {
    value: IReadableMusicNote[];
  };
}

export interface IPencilCodeCustomizationArgs {
  initialCode?: {
    value: string;
  };
}

export interface ISetInputCustomizationArgs {
  buttonText?: {
    value: string;
  };
}

export interface ITextInputCustomizationArgs {
  placeholder?: {
    value: string;
  };
  rows?: {
    value: number;
  };
}

export interface IMathExpressionCustomizationArgs { }

export interface INumericInputCustomizationArgs { }

export interface INumberWithUnitsCustomizationArgs { }

export interface INumberWithUnitsCustomizationArgs {

}

export type IInteractionCustomizationArgs = (
  IAlgebraicExpressionInputCustomizationArgs |
  ICodeReplCustomizationArgs |
  IContinueCustomizationArgs |
  IDragAndDropSortInputCustomizationArgs |
  IEndExplorationCustomizationArgs |
  IFractionInputCustomizationArgs |
  IGraphInputCustomizationArgs |
  IImageClickInputCustomizationArgs |
  IInteractiveMapCustomizationArgs |
  IItemSelectionInputCustomizationArgs |
  ILogicCustomizationArgs |
  IMathEquationInputCustomizationArgs |
  IMathExpressionCustomizationArgs |
  IMultipleChoiceInputCustomizationArgs |
  IMusicNotesInputCustomizationArgs |
  INumberWithUnitsCustomizationArgs |
  INumericInputCustomizationArgs |
  IPencilCodeCustomizationArgs |
  ISetInputCustomizationArgs |
  ITextInputCustomizationArgs);
