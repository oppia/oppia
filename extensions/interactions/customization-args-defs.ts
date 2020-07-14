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
import { IImageWithRegions } from
  // eslint-disable-next-line max-len
  'extensions/interactions/ImageClickInput/directives/oppia-interactive-image-click-input.directive';
import { ISubtitledHtmlBackendDict, SubtitledHtml } from
  'domain/exploration/SubtitledHtmlObjectFactory';
import { ISubtitledUnicodeBackendDict, SubtitledUnicode } from
  'domain/exploration/SubtitledUnicodeObjectFactory';

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

export interface IAlgebraicExpressionInputCustomizationArgsBackendDict { }
export interface IAlgebraicExpressionInputCustomizationArgs extends
  IAlgebraicExpressionInputCustomizationArgsBackendDict { }


export interface ICodeReplCustomizationArgsBackendDict {
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
export interface ICodeReplCustomizationArgs extends
    ICodeReplCustomizationArgsBackendDict { }


export interface IContinueCustomizationArgsBackendDict {
  buttonText?: {
    value: ISubtitledUnicodeBackendDict;
  };
}
export interface IContinueCustomizationArgs extends
    Omit<IContinueCustomizationArgsBackendDict, 'buttonText'> {
  buttonText?: {
    value: SubtitledUnicode;
  };
}


export interface IDragAndDropSortInputCustomizationArgsBackendDict {
  choices?: {
    value: ISubtitledHtmlBackendDict[];
  };
  allowMultipleItemsInSamePosition: {
    value: boolean;
  }
}
export interface IDragAndDropSortInputCustomizationArgs extends
    Omit<IDragAndDropSortInputCustomizationArgsBackendDict, 'choices'> {
      choices?: {
    value: SubtitledHtml[];
  };
}


export interface IEndExplorationCustomizationArgsBackendDict {
  recommendedExplorationIds?: {
    value: string[];
  };
}
export interface IEndExplorationCustomizationArgs extends
  IEndExplorationCustomizationArgsBackendDict { }


export interface IFractionInputCustomizationArgsBackendDict {
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
    value: ISubtitledUnicodeBackendDict;
  };
}
export interface IFractionInputCustomizationArgs extends
    Omit<IFractionInputCustomizationArgsBackendDict, 'customPlaceholder'> {
  customPlaceholder?: {
    value: SubtitledUnicode;
  };
}


export interface IGraphInputCustomizationArgsBackendDict {
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
export interface IGraphInputCustomizationArgs extends
  IGraphInputCustomizationArgsBackendDict { }


export interface IImageClickInputCustomizationArgsBackendDict {
  imageAndRegions?: {
    value: IImageWithRegions;
  };
  highlightRegionsOnHover?: {
    value: string;
  };
}
export interface IImageClickInputCustomizationArgs extends
  IImageClickInputCustomizationArgsBackendDict { }


export interface IInteractiveMapCustomizationArgsBackendDict {
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
export interface IInteractiveMapCustomizationArgs extends
  IInteractiveMapCustomizationArgsBackendDict { }


export interface IItemSelectionInputCustomizationArgsBackendDict {
  choices?: {
    value: ISubtitledHtmlBackendDict[];
  };
  maxAllowableSelectionCount?: {
    value: number;
  };
  minAllowableSelectionCount?: {
    value: number;
  };
}
export interface IItemSelectionInputCustomizationArgs extends
    Omit<IItemSelectionInputCustomizationArgsBackendDict, 'choices'> {
  choices?: {
    value: SubtitledHtml[];
  };
}


export interface ILogicCustomizationArgsBackendDict {
  question?: {
    value: Object;
  };
}
export interface ILogicCustomizationArgs extends
  ILogicCustomizationArgsBackendDict { }


export interface IMathEquationInputCustomizationArgsBackendDict { }
export interface IMathEquationInputCustomizationArgs extends
  IMathEquationInputCustomizationArgsBackendDict { }


export interface IMultipleChoiceInputCustomizationArgsBackendDict {
  showChoicesInShuffledOrder?: {
    value: string;
  };
  choices?: {
    value: ISubtitledHtmlBackendDict[];
  };
}
export interface IMultipleChoiceInputCustomizationArgs extends
    Omit<IMultipleChoiceInputCustomizationArgsBackendDict, 'choices'> {
  choices?: {
    value: SubtitledHtml[];
  };
}


export interface IMusicNotesInputCustomizationArgsBackendDict {
  sequenceToGuess?: {
    value: IReadableMusicNote[];
  };
  initialSequence?: {
    value: IReadableMusicNote[];
  };
}
export interface IMusicNotesInputCustomizationArgs extends
  IMusicNotesInputCustomizationArgsBackendDict { }


export interface IPencilCodeCustomizationArgsBackendDict {
  initialCode?: {
    value: string;
  };
}
export interface IPencilCodeCustomizationArgs extends
  IPencilCodeCustomizationArgsBackendDict { }


export interface ISetInputCustomizationArgsBackendDict {
  buttonText?: {
    value: ISubtitledUnicodeBackendDict;
  };
}
export interface ISetInputCustomizationArgs extends
    Omit<ISetInputCustomizationArgsBackendDict, 'buttonText'> {
  buttonText?: {
    value: SubtitledUnicode;
  };
}


export interface ITextInputCustomizationArgsBackendDict {
  placeholder?: {
    value: ISubtitledUnicodeBackendDict;
  };
  rows?: {
    value: number;
  };
}
export interface ITextInputCustomizationArgs extends
    Omit<ITextInputCustomizationArgsBackendDict, 'placeholder'> {
  placeholder?: {
    value: SubtitledUnicode;
  };
}


export interface IMathExpressionCustomizationArgsBackendDict { }
export interface IMathExpressionCustomizationArgs extends
  IMathExpressionCustomizationArgsBackendDict { }

export interface INumericInputCustomizationArgsBackendDict { }
export interface INumericInputCustomizationArgs extends
  INumericInputCustomizationArgsBackendDict { }

export interface INumberWithUnitsCustomizationArgsBackendDict { }
export interface INumberWithUnitsCustomizationArgs extends
  INumberWithUnitsCustomizationArgsBackendDict { }


export type IInteractionCustomizationArgsBackendDict = (
  IAlgebraicExpressionInputCustomizationArgsBackendDict |
  ICodeReplCustomizationArgsBackendDict |
  IContinueCustomizationArgsBackendDict |
  IDragAndDropSortInputCustomizationArgsBackendDict |
  IEndExplorationCustomizationArgsBackendDict |
  IFractionInputCustomizationArgsBackendDict |
  IGraphInputCustomizationArgsBackendDict |
  IImageClickInputCustomizationArgsBackendDict |
  IInteractiveMapCustomizationArgsBackendDict |
  IItemSelectionInputCustomizationArgsBackendDict |
  ILogicCustomizationArgsBackendDict |
  IMathEquationInputCustomizationArgsBackendDict |
  IMultipleChoiceInputCustomizationArgsBackendDict |
  IMusicNotesInputCustomizationArgsBackendDict |
  IPencilCodeCustomizationArgsBackendDict |
  ISetInputCustomizationArgsBackendDict |
  ITextInputCustomizationArgsBackendDict |
  IMathExpressionCustomizationArgsBackendDict |
  INumericInputCustomizationArgsBackendDict |
  INumberWithUnitsCustomizationArgsBackendDict);

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
