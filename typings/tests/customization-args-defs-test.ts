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
 * @fileoverview Test for type definiitions in customization-args-defs.ts.
 * These dtslint type tests check that for each interaction, its frontend
 * and backend customization argument interfaces are exactly the same, excluding
 * properties defined in the 'CustomizationArgsBackendDictReplacement'
 * interfaces. The 'CustomizationArgsBackendDictReplacement' interfaces define
 * which backend interface fields should be overwritten to match the frontend
 * interface. This functionaliy is for customization arguments that contain
 * different frontend/backend types as customization argument values. For
 * example, ContinueCustomizationArgsBackendDict contains a
 * SubtitledUnicodeBackendDict value, but it is replaced with a SubtitledUnicode
 * value in its frontend counterpart ContinueCustomizationArgs.
 * Note: there is a regex test in the backend in customization_args_util_test.py
 * that tests that all interaction ids are covered here.
 */

import { IsExact, AssertTrue } from 'conditional-type-checks';
import {
  AlgebraicExpressionInputCustomizationArgs,
  AlgebraicExpressionInputCustomizationArgsBackendDict,
  CodeReplCustomizationArgs,
  CodeReplCustomizationArgsBackendDict,
  ContinueCustomizationArgs,
  ContinueCustomizationArgsBackendDict,
  DragAndDropSortInputCustomizationArgs,
  DragAndDropSortInputCustomizationArgsBackendDict,
  EndExplorationCustomizationArgs,
  EndExplorationCustomizationArgsBackendDict,
  FractionInputCustomizationArgs,
  FractionInputCustomizationArgsBackendDict,
  GraphInputCustomizationArgs,
  GraphInputCustomizationArgsBackendDict,
  ImageClickInputCustomizationArgs,
  ImageClickInputCustomizationArgsBackendDict,
  InteractiveMapCustomizationArgs,
  InteractiveMapCustomizationArgsBackendDict,
  ItemSelectionInputCustomizationArgs,
  ItemSelectionInputCustomizationArgsBackendDict,
  LogicProofCustomizationArgs,
  LogicProofCustomizationArgsBackendDict,
  MathEquationInputCustomizationArgs,
  MathEquationInputCustomizationArgsBackendDict,
  MathExpressionInputCustomizationArgs,
  MathExpressionInputCustomizationArgsBackendDict,
  MultipleChoiceInputCustomizationArgs,
  MultipleChoiceInputCustomizationArgsBackendDict,
  MusicNotesInputCustomizationArgs,
  MusicNotesInputCustomizationArgsBackendDict,
  NumberWithUnitsCustomizationArgs,
  NumberWithUnitsCustomizationArgsBackendDict,
  NumericExpressionInputCustomizationArgs,
  NumericExpressionInputCustomizationArgsBackendDict,
  NumericInputCustomizationArgs,
  NumericInputCustomizationArgsBackendDict,
  PencilCodeEditorCustomizationArgs,
  PencilCodeEditorCustomizationArgsBackendDict,
  SetInputCustomizationArgs,
  SetInputCustomizationArgsBackendDict,
  TextInputCustomizationArgs,
  TextInputCustomizationArgsBackendDict
} from 'interactions/customization-args-defs';
import { SubtitledUnicode } from
  'domain/exploration/SubtitledUnicodeObjectFactory';
import { SubtitledHtml } from 'domain/exploration/SubtitledHtmlObjectFactory';

interface AlgebraicExpressionInputCustomizationArgsBackendDictReplacement {}
type TestAlgebraicExpressionInputCustomizationArgsInterfacesMatch = AssertTrue<
    IsExact<
      AlgebraicExpressionInputCustomizationArgs,
      Omit<
        AlgebraicExpressionInputCustomizationArgsBackendDict,
        keyof AlgebraicExpressionInputCustomizationArgsBackendDictReplacement
      > & AlgebraicExpressionInputCustomizationArgsBackendDictReplacement
    >
>;

interface CodeReplCustomizationArgsBackendDictReplacement {}
type TestCodeReplCustomizationArgsInterfacesMatch = AssertTrue<
    IsExact<
      CodeReplCustomizationArgs,
      Omit<
        CodeReplCustomizationArgsBackendDict,
        keyof CodeReplCustomizationArgsBackendDictReplacement
      > & CodeReplCustomizationArgsBackendDictReplacement
    >
>;

interface ContinueCustomizationArgsBackendDictReplacement {
  buttonText?: {value: SubtitledUnicode};
}
type TestContinueCustomizationArgsInterfacesMatch = AssertTrue<
    IsExact<
      ContinueCustomizationArgs,
      Omit<
        ContinueCustomizationArgsBackendDict,
        keyof ContinueCustomizationArgsBackendDictReplacement
      > & ContinueCustomizationArgsBackendDictReplacement
    >
>;

interface DragAndDropSortInputCustomizationArgsBackendDictReplacement {
  choices?: {value: SubtitledHtml[]};
}
type TestDragAndDropSortInputCustomizationArgsInterfacesMatch = AssertTrue<
    IsExact<
      DragAndDropSortInputCustomizationArgs,
      Omit<
        DragAndDropSortInputCustomizationArgsBackendDict,
        keyof DragAndDropSortInputCustomizationArgsBackendDictReplacement
      > & DragAndDropSortInputCustomizationArgsBackendDictReplacement
    >
>;

interface EndExplorationCustomizationArgsBackendDictReplacement {}
type TestEndExplorationCustomizationArgsInterfacesMatch = AssertTrue<
    IsExact<
      EndExplorationCustomizationArgs,
      Omit<
        EndExplorationCustomizationArgsBackendDict,
        keyof EndExplorationCustomizationArgsBackendDictReplacement
      > & EndExplorationCustomizationArgsBackendDictReplacement
    >
>;

interface FractionInputCustomizationArgsBackendDictReplacement {
  customPlaceholder?: {value: SubtitledUnicode};
}
type TestFractionInputCustomizationArgsInterfacesMatch = AssertTrue<
    IsExact<
      FractionInputCustomizationArgs,
      Omit<
        FractionInputCustomizationArgsBackendDict,
        keyof FractionInputCustomizationArgsBackendDictReplacement
      > & FractionInputCustomizationArgsBackendDictReplacement
    >
>;

interface GraphInputCustomizationArgsBackendDictReplacement {}
type TestGraphInputCustomizationArgsInterfacesMatch = AssertTrue<
    IsExact<
      GraphInputCustomizationArgs,
      Omit<
        GraphInputCustomizationArgsBackendDict,
        keyof GraphInputCustomizationArgsBackendDictReplacement
      > & GraphInputCustomizationArgsBackendDictReplacement
    >
>;

interface ImageClickInputCustomizationArgsBackendDictReplacement {}
type TestImageClickInputCustomizationArgsInterfacesMatch = AssertTrue<
    IsExact<
      ImageClickInputCustomizationArgs,
      Omit<
        ImageClickInputCustomizationArgsBackendDict,
        keyof ImageClickInputCustomizationArgsBackendDictReplacement
      > & ImageClickInputCustomizationArgsBackendDictReplacement
    >
>;

interface InteractiveMapCustomizationArgsBackendDictReplacement {}
type TestInteractiveMapCustomizationArgsInterfacesMatch = AssertTrue<
    IsExact<
      InteractiveMapCustomizationArgs,
      Omit<
        InteractiveMapCustomizationArgsBackendDict,
        keyof InteractiveMapCustomizationArgsBackendDictReplacement
      > & InteractiveMapCustomizationArgsBackendDictReplacement
    >
>;

interface ItemSelectionInputCustomizationArgsBackendDictReplacement {
  choices?: {value: SubtitledHtml[]};
}
type TestItemSelectionInputCustomizationArgsInterfacesMatch = AssertTrue<
    IsExact<
      ItemSelectionInputCustomizationArgs,
      Omit<
        ItemSelectionInputCustomizationArgsBackendDict,
        keyof ItemSelectionInputCustomizationArgsBackendDictReplacement
      > & ItemSelectionInputCustomizationArgsBackendDictReplacement
    >
>;

interface LogicProofCustomizationArgsBackendDictReplacement {}
type TestLogicProofCustomizationArgsInterfacesMatch = AssertTrue<
    IsExact<
      LogicProofCustomizationArgs,
      Omit<
        LogicProofCustomizationArgsBackendDict,
        keyof LogicProofCustomizationArgsBackendDictReplacement
      > & LogicProofCustomizationArgsBackendDictReplacement
    >
>;

interface MathEquationInputCustomizationArgsBackendDictReplacement {}
type TestMathEquationInputCustomizationArgsInterfacesMatch = AssertTrue<
    IsExact<
      MathEquationInputCustomizationArgs,
      Omit<
        MathEquationInputCustomizationArgsBackendDict,
        keyof MathEquationInputCustomizationArgsBackendDictReplacement
      > & MathEquationInputCustomizationArgsBackendDictReplacement
    >
>;

interface MathExpressionInputCustomizationArgsBackendDictReplacement {}
type TestMathExpressionInputCustomizationArgsInterfacesMatch = AssertTrue<
    IsExact<
      MathExpressionInputCustomizationArgs,
      Omit<
        MathExpressionInputCustomizationArgsBackendDict,
        keyof MathExpressionInputCustomizationArgsBackendDictReplacement
      > & MathExpressionInputCustomizationArgsBackendDictReplacement
    >
>;

interface MultipleChoiceInputCustomizationArgsBackendDictReplacement {
  choices?: {value: SubtitledHtml[]};
}
type TestMultipleChoiceInputCustomizationArgsInterfacesMatch = AssertTrue<
    IsExact<
      MultipleChoiceInputCustomizationArgs,
      Omit<
        MultipleChoiceInputCustomizationArgsBackendDict,
        keyof MultipleChoiceInputCustomizationArgsBackendDictReplacement
      > & MultipleChoiceInputCustomizationArgsBackendDictReplacement
    >
>;

interface MusicNotesInputCustomizationArgsBackendDictReplacement {}
type TestMusicNotesInputCustomizationArgsInterfacesMatch = AssertTrue<
    IsExact<
      MusicNotesInputCustomizationArgs,
      Omit<
        MusicNotesInputCustomizationArgsBackendDict,
        keyof MusicNotesInputCustomizationArgsBackendDictReplacement
      > & MusicNotesInputCustomizationArgsBackendDictReplacement
    >
>;

interface NumberWithUnitsCustomizationArgsBackendDictReplacement {}
type TestNumberWithUnitsCustomizationArgsInterfacesMatch = AssertTrue<
    IsExact<
      NumberWithUnitsCustomizationArgs,
      Omit<
        NumberWithUnitsCustomizationArgsBackendDict,
        keyof NumberWithUnitsCustomizationArgsBackendDictReplacement
      > & NumberWithUnitsCustomizationArgsBackendDictReplacement
    >
>;

interface NumericExpressionInputCustomizationArgsBackendDictReplacement {}
type TestNumericExpressionInputCustomizationArgsInterfacesMatch = AssertTrue<
    IsExact<
      NumericExpressionInputCustomizationArgs,
      Omit<
        NumericExpressionInputCustomizationArgsBackendDict,
        keyof NumericExpressionInputCustomizationArgsBackendDictReplacement
      > & NumericExpressionInputCustomizationArgsBackendDictReplacement
    >
>;

interface NumericInputCustomizationArgsBackendDictReplacement {}
type TestNumericInputCustomizationArgsInterfacesMatch = AssertTrue<
    IsExact<
      NumericInputCustomizationArgs,
      Omit<
        NumericInputCustomizationArgsBackendDict,
        keyof NumericInputCustomizationArgsBackendDictReplacement
      > & NumericInputCustomizationArgsBackendDictReplacement
    >
>;

interface PencilCodeEditorCustomizationArgsBackendDictReplacement {}
type TestPencilCodeEditorCustomizationArgsInterfacesMatch = AssertTrue<
    IsExact<
      PencilCodeEditorCustomizationArgs,
      Omit<
        PencilCodeEditorCustomizationArgsBackendDict,
        keyof PencilCodeEditorCustomizationArgsBackendDictReplacement
      > & PencilCodeEditorCustomizationArgsBackendDictReplacement
    >
>;

interface SetInputCustomizationArgsBackendDictReplacement {
  buttonText?: {value: SubtitledUnicode};
}
type TestSetInputCustomizationArgsInterfacesMatch = AssertTrue<
    IsExact<
      SetInputCustomizationArgs,
      Omit<
        SetInputCustomizationArgsBackendDict,
        keyof SetInputCustomizationArgsBackendDictReplacement
      > & SetInputCustomizationArgsBackendDictReplacement
    >
>;

interface TextInputCustomizationArgsBackendDictReplacement {
  placeholder?: {value: SubtitledUnicode};
}
type TestTextInputCustomizationArgsInterfacesMatch = AssertTrue<
    IsExact<
      TextInputCustomizationArgs,
      Omit<
        TextInputCustomizationArgsBackendDict,
        keyof TextInputCustomizationArgsBackendDictReplacement
      > & TextInputCustomizationArgsBackendDictReplacement
    >
>;
