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
 * @fileoverview Module for the pencil code interaction components.
 */

import 'core-js/es7/reflect';
import 'zone.js';

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { SharedPipesModule } from 'filters/shared-pipes.module';
import { InteractivePencilCodeEditorComponent } from './directives/oppia-interactive-pencil-code-editor.component';
import { ResponsePencilCodeEditorComponent } from './directives/oppia-response-pencil-code-editor.component';
import { ShortResponsePencilCodeEditorComponent } from './directives/oppia-short-response-pencil-code-editor.component';

@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    SharedPipesModule,
    MatButtonModule
  ],
  declarations: [
    InteractivePencilCodeEditorComponent,
    ResponsePencilCodeEditorComponent,
    ShortResponsePencilCodeEditorComponent
  ],
  entryComponents: [
    InteractivePencilCodeEditorComponent,
    ResponsePencilCodeEditorComponent,
    ShortResponsePencilCodeEditorComponent
  ],
  exports: [
    InteractivePencilCodeEditorComponent,
    ResponsePencilCodeEditorComponent,
    ShortResponsePencilCodeEditorComponent
  ],
})

export class PencilCodeEditorInteractionModule { }
