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

import { SubtitledHtmlBackendDict, SubtitledHtml } from
  'domain/exploration/SubtitledHtmlObjectFactory';
import { SubtitledUnicodeBackendDict, SubtitledUnicode } from
  'domain/exploration/SubtitledUnicodeObjectFactory';

interface ILabeledRegion {
  region: {
    area: number[][];
  };
  label: string;
}

export interface IImageWithRegions {
  labeledRegions: ILabeledRegion[];
  imagePath: string;
}

export interface IReadableMusicNote {
  readableNoteName: string;
}


interface AlgebraicExpressionInputCustomizationArgsBackendDict { }
export interface AlgebraicExpressionInputCustomizationArgs { }
type AlgebraicExpressionInputCustomizationArgsBackendDictValue = (
  AlgebraicExpressionInputCustomizationArgsBackendDict[
    keyof AlgebraicExpressionInputCustomizationArgsBackendDict]['value']);
type AlgebraicExpressionInputCustomizationArgsValue = (
  AlgebraicExpressionInputCustomizationArgs[
    keyof AlgebraicExpressionInputCustomizationArgs]['value']);
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
type CodeReplCustomizationArgsBackendDictValue = (
  CodeReplCustomizationArgsBackendDict[
    keyof CodeReplCustomizationArgsBackendDict]['value']);
type CodeReplCustomizationArgsValue = (
  CodeReplCustomizationArgs[
    keyof CodeReplCustomizationArgs]['value']);


interface ContinueCustomizationArgsBackendDict {
  buttonText?: {
    value: SubtitledUnicodeBackendDict;
  };
}
export interface ContinueCustomizationArgs {
  buttonText?: {
    value: SubtitledUnicode;
  };
}
type ContinueCustomizationArgsBackendDictValue = (
  ContinueCustomizationArgsBackendDict[
    keyof ContinueCustomizationArgsBackendDict]['value']);
type ContinueCustomizationArgsValue = (
  ContinueCustomizationArgs[
    keyof ContinueCustomizationArgs]['value']);


interface DragAndDropSortInputCustomizationArgsBackendDict {
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
type DragAndDropSortInputCustomizationArgsBackendDictValue = (
  DragAndDropSortInputCustomizationArgsBackendDict[
    keyof DragAndDropSortInputCustomizationArgsBackendDict]['value']);
type DragAndDropSortInputCustomizationArgsValue = (
  DragAndDropSortInputCustomizationArgs[
    keyof DragAndDropSortInputCustomizationArgs]['value']);


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
type EndExplorationCustomizationArgsBackendDictValue = (
  EndExplorationCustomizationArgsBackendDict[
    keyof EndExplorationCustomizationArgsBackendDict]['value']);
type EndExplorationCustomizationArgsValue = (
  EndExplorationCustomizationArgs[
    keyof EndExplorationCustomizationArgs]['value']);


interface FractionInputCustomizationArgsBackendDict {
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
type FractionInputCustomizationArgsBackendDictValue = (
  FractionInputCustomizationArgsBackendDict[
    keyof FractionInputCustomizationArgsBackendDict]['value']);
type FractionInputCustomizationArgsValue = (
  FractionInputCustomizationArgs[
    keyof FractionInputCustomizationArgs]['value']);


interface GraphInputCustomizationArgsBackendDict {
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
export interface GraphInputCustomizationArgs {
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
type GraphInputCustomizationArgsBackendDictValue = (
  GraphInputCustomizationArgsBackendDict[
    keyof GraphInputCustomizationArgsBackendDict]['value']);
type GraphInputCustomizationArgsValue = (
  GraphInputCustomizationArgs[
    keyof GraphInputCustomizationArgs]['value']);


interface ImageClickInputCustomizationArgsBackendDict {
  imageAndRegions?: {
    value: IImageWithRegions;
  };
  highlightRegionsOnHover?: {
    value: string;
  };
}
export interface ImageClickInputCustomizationArgs {
  imageAndRegions?: {
    value: IImageWithRegions;
  };
  highlightRegionsOnHover?: {
    value: string;
  };
}
type ImageClickInputCustomizationArgsBackendDictValue = (
  ImageClickInputCustomizationArgsBackendDict[
    keyof ImageClickInputCustomizationArgsBackendDict]['value']);
type ImageClickInputCustomizationArgsValue = (
  ImageClickInputCustomizationArgs[
    keyof ImageClickInputCustomizationArgs]['value']);


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
type InteractiveMapCustomizationArgsBackendDictValue = (
  InteractiveMapCustomizationArgsBackendDict[
    keyof InteractiveMapCustomizationArgsBackendDict]['value']);
type InteractiveMapCustomizationArgsValue = (
  InteractiveMapCustomizationArgs[
    keyof InteractiveMapCustomizationArgs]['value']);


interface ItemSelectionInputCustomizationArgsBackendDict {
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
type ItemSelectionInputCustomizationArgsBackendDictValue = (
  ItemSelectionInputCustomizationArgsBackendDict[
    keyof ItemSelectionInputCustomizationArgsBackendDict]['value']);
type ItemSelectionInputCustomizationArgsValue = (
  ItemSelectionInputCustomizationArgs[
    keyof ItemSelectionInputCustomizationArgs]['value']);


interface LogicCustomizationArgsBackendDict {
  question?: {
    value: Object;
  };
}
export interface LogicCustomizationArgs {
  question?: {
    value: Object;
  };
}
type LogicCustomizationArgsBackendDictValue = (
  LogicCustomizationArgsBackendDict[
    keyof LogicCustomizationArgsBackendDict]['value']);
type LogicCustomizationArgsValue = (
  LogicCustomizationArgs[
    keyof LogicCustomizationArgs]['value']);


interface MathEquationInputCustomizationArgsBackendDict { }
export interface MathEquationInputCustomizationArgs { }
type MathEquationInputCustomizationArgsBackendDictValue = (
  MathEquationInputCustomizationArgsBackendDict[
    keyof MathEquationInputCustomizationArgsBackendDict]['value']);
type MathEquationInputCustomizationArgsValue = (
  MathEquationInputCustomizationArgs[
    keyof MathEquationInputCustomizationArgs]['value']);

interface MultipleChoiceInputCustomizationArgsBackendDict {
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
type MultipleChoiceInputCustomizationArgsBackendDictValue = (
  MultipleChoiceInputCustomizationArgsBackendDict[
    keyof MultipleChoiceInputCustomizationArgsBackendDict]['value']);
type MultipleChoiceInputCustomizationArgsValue = (
  MultipleChoiceInputCustomizationArgs[
    keyof MultipleChoiceInputCustomizationArgs]['value']);


interface MusicNotesInputCustomizationArgsBackendDict {
  sequenceToGuess?: {
    value: IReadableMusicNote[];
  };
  initialSequence?: {
    value: IReadableMusicNote[];
  };
}
export interface MusicNotesInputCustomizationArgs {
  sequenceToGuess?: {
    value: IReadableMusicNote[];
  };
  initialSequence?: {
    value: IReadableMusicNote[];
  };
}
type MusicNotesInputCustomizationArgsBackendDictValue = (
  MusicNotesInputCustomizationArgsBackendDict[
    keyof MusicNotesInputCustomizationArgsBackendDict]['value']);
type MusicNotesInputCustomizationArgsValue = (
  MusicNotesInputCustomizationArgs[
    keyof MusicNotesInputCustomizationArgs]['value']);


interface PencilCodeCustomizationArgsBackendDict {
  initialCode?: {
    value: string;
  };
}
export interface PencilCodeCustomizationArgs {
  initialCode?: {
    value: string;
  };
}
type PencilCodeCustomizationArgsBackendDictValue = (
  PencilCodeCustomizationArgsBackendDict[
    keyof PencilCodeCustomizationArgsBackendDict]['value']);
type PencilCodeCustomizationArgsValue = (
  PencilCodeCustomizationArgs[
    keyof PencilCodeCustomizationArgs]['value']);


interface SetInputCustomizationArgsBackendDict {
  buttonText?: {
    value: SubtitledUnicodeBackendDict;
  };
}
export interface SetInputCustomizationArgs {
  buttonText?: {
    value: SubtitledUnicode;
  };
}
type SetInputCustomizationArgsBackendDictValue = (
  SetInputCustomizationArgsBackendDict[
    keyof SetInputCustomizationArgsBackendDict]['value']);
type SetInputCustomizationArgsValue = (
  SetInputCustomizationArgs[
    keyof SetInputCustomizationArgs]['value']);


interface TextInputCustomizationArgsBackendDict {
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
type TextInputCustomizationArgsBackendDictValue = (
  TextInputCustomizationArgsBackendDict[
    keyof TextInputCustomizationArgsBackendDict]['value']);
type TextInputCustomizationArgsValue = (
  TextInputCustomizationArgs[
    keyof TextInputCustomizationArgs]['value']);


interface MathExpressionCustomizationArgsBackendDict { }
export interface MathExpressionCustomizationArgs { }
type MathExpressionCustomizationArgsBackendDictValue = (
  MathExpressionCustomizationArgsBackendDict[
    keyof MathExpressionCustomizationArgsBackendDict]['value']);
type MathExpressionCustomizationArgsValue = (
  MathExpressionCustomizationArgs[
    keyof MathExpressionCustomizationArgs]['value']);

interface NumericExpressionInputCustomizationArgsBackendDict { }
export interface NumericExpressionInputCustomizationArgs { }
type NumericExpressionInputCustomizationArgsBackendDictValue = (
  NumericExpressionInputCustomizationArgsBackendDict[
    keyof NumericExpressionInputCustomizationArgsBackendDict]['value']);
type NumericExpressionInputCustomizationArgsValue = (
  MathExpressionCustomizationArgs[
    keyof NumericExpressionInputCustomizationArgs]['value']);

interface NumericInputCustomizationArgsBackendDict { }
export interface NumericInputCustomizationArgs { }
type NumericInputCustomizationArgsBackendDictValue = (
  NumericInputCustomizationArgsBackendDict[
    keyof NumericInputCustomizationArgsBackendDict]['value']);
type NumericInputCustomizationArgsValue = (
  NumericInputCustomizationArgs[
    keyof NumericInputCustomizationArgs]['value']);

interface NumberWithUnitsCustomizationArgsBackendDict { }
export interface NumberWithUnitsCustomizationArgs { }
type NumberWithUnitsCustomizationArgsBackendDictValue = (
  NumberWithUnitsCustomizationArgsBackendDict[
    keyof NumberWithUnitsCustomizationArgsBackendDict]['value']);
type NumberWithUnitsCustomizationArgsValue = (
  NumberWithUnitsCustomizationArgs[
    keyof NumberWithUnitsCustomizationArgs]['value']);

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
  LogicCustomizationArgsBackendDict |
  MathEquationInputCustomizationArgsBackendDict |
  MathExpressionCustomizationArgsBackendDict |
  MultipleChoiceInputCustomizationArgsBackendDict |
  MusicNotesInputCustomizationArgsBackendDict |
  NumberWithUnitsCustomizationArgsBackendDict |
  NumericExpressionInputCustomizationArgsBackendDict |
  NumericInputCustomizationArgsBackendDict |
  PencilCodeCustomizationArgsBackendDict |
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
  MathExpressionCustomizationArgs |
  InteractiveMapCustomizationArgs |
  ItemSelectionInputCustomizationArgs |
  LogicCustomizationArgs |
  MathEquationInputCustomizationArgs |
  MultipleChoiceInputCustomizationArgs |
  MusicNotesInputCustomizationArgs |
  NumberWithUnitsCustomizationArgs |
  NumericExpressionInputCustomizationArgs |
  NumericInputCustomizationArgs |
  PencilCodeCustomizationArgs |
  SetInputCustomizationArgs |
  TextInputCustomizationArgs);

export type InteractionCustomizationArgsBackendDictValue = (
  AlgebraicExpressionInputCustomizationArgsBackendDictValue |
  CodeReplCustomizationArgsBackendDictValue |
  ContinueCustomizationArgsBackendDictValue |
  DragAndDropSortInputCustomizationArgsBackendDictValue |
  EndExplorationCustomizationArgsBackendDictValue |
  FractionInputCustomizationArgsBackendDictValue |
  GraphInputCustomizationArgsBackendDictValue |
  ImageClickInputCustomizationArgsBackendDictValue |
  InteractiveMapCustomizationArgsBackendDictValue |
  ItemSelectionInputCustomizationArgsBackendDictValue |
  LogicCustomizationArgsBackendDictValue |
  MathEquationInputCustomizationArgsBackendDictValue |
  MathExpressionCustomizationArgsBackendDictValue |
  MultipleChoiceInputCustomizationArgsBackendDictValue |
  MusicNotesInputCustomizationArgsBackendDictValue |
  NumberWithUnitsCustomizationArgsBackendDictValue |
  NumericExpressionInputCustomizationArgsBackendDictValue |
  NumericInputCustomizationArgsBackendDictValue |
  PencilCodeCustomizationArgsBackendDictValue |
  SetInputCustomizationArgsBackendDictValue |
  TextInputCustomizationArgsBackendDictValue);

export type InteractionCustomizationArgsValue = (
  AlgebraicExpressionInputCustomizationArgsValue |
  CodeReplCustomizationArgsValue |
  ContinueCustomizationArgsValue |
  DragAndDropSortInputCustomizationArgsValue |
  EndExplorationCustomizationArgsValue |
  FractionInputCustomizationArgsValue |
  GraphInputCustomizationArgsValue |
  ImageClickInputCustomizationArgsValue |
  MathExpressionCustomizationArgsValue |
  InteractiveMapCustomizationArgsValue |
  ItemSelectionInputCustomizationArgsValue |
  LogicCustomizationArgsValue |
  MathEquationInputCustomizationArgsValue |
  MultipleChoiceInputCustomizationArgsValue |
  MusicNotesInputCustomizationArgsValue |
  NumberWithUnitsCustomizationArgsValue |
  NumericExpressionInputCustomizationArgsValue |
  NumericInputCustomizationArgsValue |
  PencilCodeCustomizationArgsValue |
  SetInputCustomizationArgsValue |
  TextInputCustomizationArgsValue);
