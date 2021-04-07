// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the object componients.
 */
import 'core-js/es7/reflect';
import 'zone.js';

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { AlgebraicExpressionEditorComponent } from './templates/algebraic-expression-editor.component';
import { BooleanEditorComponent } from './templates/boolean-editor.component';
import { CodeStringEditorComponent } from './templates/code-string-editor.component';
import { CoordTwoDimEditorComponent } from './templates/coord-two-dim-editor.component';
import { CustomOskLettersEditorComponent } from './templates/custom-osk-letters-editor.component';
import { DragAndDropPositiveIntEditorComponent } from './templates/drag-and-drop-positive-int-editor.component';
import { FractionEditorComponent } from './templates/fraction-editor.component';
import { FormsModule } from '@angular/forms';


@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    FormsModule,
    LeafletModule
  ],
  declarations: [
    AlgebraicExpressionEditorComponent,
    BooleanEditorComponent,
    CodeStringEditorComponent,
    CoordTwoDimEditorComponent,
    CustomOskLettersEditorComponent,
    DragAndDropPositiveIntEditorComponent,
    FractionEditorComponent
  ],
  entryComponents: [
    AlgebraicExpressionEditorComponent,
    BooleanEditorComponent,
    CodeStringEditorComponent,
    CoordTwoDimEditorComponent,
    CustomOskLettersEditorComponent,
    DragAndDropPositiveIntEditorComponent,
    FractionEditorComponent
  ],
  exports: [
    AlgebraicExpressionEditorComponent,
    BooleanEditorComponent,
    CodeStringEditorComponent,
    CoordTwoDimEditorComponent,
    CustomOskLettersEditorComponent,
    DragAndDropPositiveIntEditorComponent,
    FractionEditorComponent
  ],
})

export class ObjectComponentsModule { }
