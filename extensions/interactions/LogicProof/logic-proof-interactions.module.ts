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
 * @fileoverview Module for the Logic proof interaction components.
 */
import 'core-js/es7/reflect';
import 'zone.js';

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { InteractiveLogicProofComponent } from './directives/oppia-interactive-logic-proof.component';
import { SharedPipesModule } from 'filters/shared-pipes.module';
import { CodeMirrorModule } from 'components/code-mirror/codemirror.module';
import { ResponseLogicProofComponent } from './directives/oppia-response-logic-proof.component';
import { ShortResponseLogicProofComponent } from './directives/oppia-short-response-logic-proof.component';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    SharedPipesModule,
    CodeMirrorModule,
    TranslateModule
  ],
  declarations: [
    InteractiveLogicProofComponent,
    ResponseLogicProofComponent,
    ShortResponseLogicProofComponent
  ],
  entryComponents: [
    InteractiveLogicProofComponent,
    ResponseLogicProofComponent,
    ShortResponseLogicProofComponent
  ],
  exports: [
    InteractiveLogicProofComponent,
    ResponseLogicProofComponent,
    ShortResponseLogicProofComponent
  ],
})

export class LogicProofInteractionModule { }
