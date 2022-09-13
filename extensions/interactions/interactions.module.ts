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
 * @fileoverview Module for the interaction extension components.
 */
import 'core-js/es7/reflect';
import 'zone.js';

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { AlgebraicExpressionInputExtensionsModule } from './AlgebraicExpressionInput/algebraic-expression-input-interactions.module';
import { ContinueExtensionsModule } from './Continue/continue-interactions.module';
import { EndExplorationExtensionsModule } from './EndExploration/end-exploration-interactions.module';
import { DragAndDropSortInputInteractionModule } from './DragAndDropSortInput/drag-and-drop-sort-input-interactions.module';
import { FractionInputInteractionModule } from './FractionInput/fraction-input-interactions.module';
import { GraphInputInteractionModule } from './GraphInput/graph-input-interactions.module';
import { ImageClickInputInteractionModule } from './ImageClickInput/image-click-input-interactions.module';
import { ItemSelectionInputInteractionModule } from './ItemSelectionInput/item-selection-input-interactions.module';
import { CodeReplInteractionModule } from './CodeRepl/code-repl-interactions.module';
import { NumberWithUnitsInteractionModule } from './NumberWithUnits/number-with-units-interactions.module';
import { NumericExpressionInputModule } from './NumericExpressionInput/numeric-expression-input-interactions.module';
import { NumericInputModule } from './NumericInput/numeric-input-interactions.module';
import { MathEquationInputModule } from './MathEquationInput/math-equation-input-interactions.module';
import { InteractiveMapInteractionModule } from './InteractiveMap/interactive-map-interactions.module';
import { MultipleChoiceInputInteractionModule } from './MultipleChoiceInput/multiple-choice-input-interactions.module';
import { MusicNotesInputModule } from './MusicNotesInput/music-notes-input-interactions.module';
import { SetInputInteractionModule } from './SetInput/set-input-interactions.module';
import { TextInputInteractionModule } from './TextInput/text-input-interactions.module';
import { RatioExpressionInputInteractionModule } from './RatioExpressionInput/ratio-expression-input-interactions.module';
import { TranslateModule } from '@ngx-translate/core';
import { PencilCodeEditorModule } from './PencilCodeEditor/pencil-code-editor-interactions.module';

@NgModule({
  imports: [
    CommonModule,
    AlgebraicExpressionInputExtensionsModule,
    CodeReplInteractionModule,
    ContinueExtensionsModule,
    EndExplorationExtensionsModule,
    DragAndDropSortInputInteractionModule,
    FractionInputInteractionModule,
    GraphInputInteractionModule,
    ImageClickInputInteractionModule,
    ItemSelectionInputInteractionModule,
    NumberWithUnitsInteractionModule,
    NumericExpressionInputModule,
    NumericInputModule,
    MathEquationInputModule,
    MusicNotesInputModule,
    PencilCodeEditorModule,
    InteractiveMapInteractionModule,
    MultipleChoiceInputInteractionModule,
    RatioExpressionInputInteractionModule,
    SetInputInteractionModule,
    TextInputInteractionModule,
    TranslateModule
  ],
  declarations: [],
  entryComponents: [],
  exports: [
    AlgebraicExpressionInputExtensionsModule,
    CodeReplInteractionModule,
    ContinueExtensionsModule,
    EndExplorationExtensionsModule,
    DragAndDropSortInputInteractionModule,
    FractionInputInteractionModule,
    GraphInputInteractionModule,
    ImageClickInputInteractionModule,
    ItemSelectionInputInteractionModule,
    NumberWithUnitsInteractionModule,
    NumericExpressionInputModule,
    PencilCodeEditorModule,
    NumericInputModule,
    MathEquationInputModule,
    MusicNotesInputModule,
    InteractiveMapInteractionModule,
    MultipleChoiceInputInteractionModule,
    RatioExpressionInputInteractionModule,
    SetInputInteractionModule,
    TextInputInteractionModule,
  ],
})
export class InteractionExtensionsModule { }
