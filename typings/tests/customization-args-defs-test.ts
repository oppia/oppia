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
 * @fileoverview Test for type definitions in customization-args-defs.ts.
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
  MathEquationInputCustomizationArgs,
  MathEquationInputCustomizationArgsBackendDict,
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
  RatioExpressionInputCustomizationArgs,
  RatioExpressionInputCustomizationArgsBackendDict,
  SetInputCustomizationArgs,
  SetInputCustomizationArgsBackendDict,
  TextInputCustomizationArgs,
  TextInputCustomizationArgsBackendDict
} from 'interactions/customization-args-defs';
import { SubtitledUnicode } from
  'domain/exploration/SubtitledUnicodeObjectFactory';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';

/**
 * These dtslint type tests check that for each interaction, its frontend
 * and backend customization argument interfaces are exactly the same, excluding
 * specific properties that are replaced. We do this because some customization
 * arguments values contain different frontend/backend types in their values.
 * For example, ContinueCustomizationArgsBackendDict contains a
 * SubtitledUnicodeBackendDict value, but it is replaced with a SubtitledUnicode
 * value in its frontend counterpart ContinueCustomizationArgs.
 * Note: there is a regex test in the backend in customization_args_util_test.py
 * that tests that all interaction ids are covered here.
 */

// This generic type compares the customization argument frontend dict and
// backend dict after replacing properties of the backend dict by properties in
// the Replacements interface.
type IsExactAfterReplacement<BackendDict, Replacements, FrontendDict> = (
  IsExact<
    FrontendDict,
    Omit<BackendDict, keyof Replacements> & Replacements
  >
);


type TestAlgebraicExpressionInputCustomizationArgsInterfacesMatch = AssertTrue<
  IsExactAfterReplacement<
    AlgebraicExpressionInputCustomizationArgsBackendDict,
    {},
    AlgebraicExpressionInputCustomizationArgs
  >
>;

type TestCodeReplCustomizationArgsInterfacesMatch = AssertTrue<
  IsExactAfterReplacement<
    CodeReplCustomizationArgsBackendDict,
    {},
    CodeReplCustomizationArgs
  >
>;

type TestContinueCustomizationArgsInterfacesMatch = AssertTrue<
  IsExactAfterReplacement<
    ContinueCustomizationArgsBackendDict,
    {buttonText: {value: SubtitledUnicode}},
    ContinueCustomizationArgs
  >
>;

type TestDragAndDropSortInputCustomizationArgsInterfacesMatch = AssertTrue<
  IsExactAfterReplacement<
    DragAndDropSortInputCustomizationArgsBackendDict,
    {choices: {value: SubtitledHtml[]}},
    DragAndDropSortInputCustomizationArgs
  >
>;

type TestEndExplorationCustomizationArgsInterfacesMatch = AssertTrue<
  IsExactAfterReplacement<
    EndExplorationCustomizationArgsBackendDict,
    {},
    EndExplorationCustomizationArgs
  >
>;

type TestFractionInputCustomizationArgsInterfacesMatch = AssertTrue<
  IsExactAfterReplacement<
    FractionInputCustomizationArgsBackendDict,
    {customPlaceholder: {value: SubtitledUnicode}},
    FractionInputCustomizationArgs
  >
>;

type TestGraphInputCustomizationArgsInterfacesMatch = AssertTrue<
  IsExactAfterReplacement<
    GraphInputCustomizationArgsBackendDict,
    {},
    GraphInputCustomizationArgs
  >
>;

type TestImageClickInputCustomizationArgsInterfacesMatch = AssertTrue<
  IsExactAfterReplacement<
    ImageClickInputCustomizationArgsBackendDict,
    {},
    ImageClickInputCustomizationArgs
  >
>;

type TestInteractiveMapCustomizationArgsInterfacesMatch = AssertTrue<
  IsExactAfterReplacement<
    InteractiveMapCustomizationArgsBackendDict,
    {},
    InteractiveMapCustomizationArgs
  >
>;

type TestItemSelectionInputCustomizationArgsInterfacesMatch = AssertTrue<
  IsExactAfterReplacement<
    ItemSelectionInputCustomizationArgsBackendDict,
    {choices: {value: SubtitledHtml[]}},
    ItemSelectionInputCustomizationArgs
  >
>;

type TestMathEquationInputCustomizationArgsInterfacesMatch = AssertTrue<
  IsExactAfterReplacement<
    MathEquationInputCustomizationArgsBackendDict,
    {},
    MathEquationInputCustomizationArgs
  >
>;

type TestMultipleChoiceInputCustomizationArgsInterfacesMatch = AssertTrue<
  IsExactAfterReplacement<
    MultipleChoiceInputCustomizationArgsBackendDict,
    {choices: {value: SubtitledHtml[]}},
    MultipleChoiceInputCustomizationArgs
  >
>;

type TestMusicNotesInputCustomizationArgsInterfacesMatch = AssertTrue<
  IsExactAfterReplacement<
    MusicNotesInputCustomizationArgsBackendDict,
    {},
    MusicNotesInputCustomizationArgs
  >
>;

type TestNumberWithUnitsCustomizationArgsInterfacesMatch = AssertTrue<
  IsExactAfterReplacement<
    NumberWithUnitsCustomizationArgsBackendDict,
    {},
    NumberWithUnitsCustomizationArgs
  >
>;

type TestNumericExpressionInputCustomizationArgsInterfacesMatch = AssertTrue<
  IsExactAfterReplacement<
    NumericExpressionInputCustomizationArgsBackendDict,
    {placeholder: {value: SubtitledUnicode}},
    NumericExpressionInputCustomizationArgs
  >
>;

type TestNumericInputCustomizationArgsInterfacesMatch = AssertTrue<
  IsExactAfterReplacement<
    NumericInputCustomizationArgsBackendDict,
    { requireNonnegativeInput: { value: boolean } },
    NumericInputCustomizationArgs
  >
>;

type TestPencilCodeEditorCustomizationArgsInterfacesMatch = AssertTrue<
  IsExactAfterReplacement<
    PencilCodeEditorCustomizationArgsBackendDict,
    {},
    PencilCodeEditorCustomizationArgs
  >
>;

type TestRatioExpressionInputCustomizationArgsInterfacesMatch = AssertTrue<
  IsExactAfterReplacement<
    RatioExpressionInputCustomizationArgsBackendDict,
    {placeholder: {value: SubtitledUnicode}},
    RatioExpressionInputCustomizationArgs
  >
>;

type TestSetInputCustomizationArgsInterfacesMatch = AssertTrue<
  IsExactAfterReplacement<
    SetInputCustomizationArgsBackendDict,
    {buttonText: {value: SubtitledUnicode}},
    SetInputCustomizationArgs
  >
>;

type TestTextInputCustomizationArgsInterfacesMatch = AssertTrue<
  IsExactAfterReplacement<
    TextInputCustomizationArgsBackendDict,
    {placeholder: {value: SubtitledUnicode}},
    TextInputCustomizationArgs
  >
>;
