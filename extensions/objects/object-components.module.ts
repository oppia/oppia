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
 * @fileoverview Module for the object components.
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
import { FilepathEditorComponent } from './templates/filepath-editor.component';
import { GraphInputInteractionModule } from 'interactions/GraphInput/graph-input-interactions.module';
import { GraphEditorComponent } from './templates/graph-editor.component';
import { SharedFormsModule } from 'components/forms/shared-forms.module';
import { HtmlEditorComponent } from './templates/html-editor.component';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { ImageWithRegionsEditorComponent } from './templates/image-with-regions-editor.component';
import { ImageWithRegionsResetConfirmationModalComponent } from './templates/image-with-regions-reset-confirmation.component';


@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    FormsModule,
    LeafletModule,
    SharedFormsModule,
    GraphInputInteractionModule,
    NgbModalModule
  ],
  declarations: [
    AlgebraicExpressionEditorComponent,
    BooleanEditorComponent,
    CodeStringEditorComponent,
    CoordTwoDimEditorComponent,
    CustomOskLettersEditorComponent,
    DragAndDropPositiveIntEditorComponent,
    FilepathEditorComponent,
    FractionEditorComponent,
    GraphEditorComponent,
    HtmlEditorComponent,
    ImageWithRegionsEditorComponent,
    ImageWithRegionsResetConfirmationModalComponent
  ],
  entryComponents: [
    AlgebraicExpressionEditorComponent,
    BooleanEditorComponent,
    CodeStringEditorComponent,
    CoordTwoDimEditorComponent,
    CustomOskLettersEditorComponent,
    DragAndDropPositiveIntEditorComponent,
    FilepathEditorComponent,
    FractionEditorComponent,
    GraphEditorComponent,
    HtmlEditorComponent,
    ImageWithRegionsEditorComponent,
    ImageWithRegionsResetConfirmationModalComponent
  ],
  exports: [
    AlgebraicExpressionEditorComponent,
    BooleanEditorComponent,
    CodeStringEditorComponent,
    CoordTwoDimEditorComponent,
    CustomOskLettersEditorComponent,
    DragAndDropPositiveIntEditorComponent,
    FilepathEditorComponent,
    FractionEditorComponent,
    GraphEditorComponent,
    HtmlEditorComponent,
    ImageWithRegionsEditorComponent,
    ImageWithRegionsResetConfirmationModalComponent
  ],
})

export class ObjectComponentsModule { }
