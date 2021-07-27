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
 * @fileoverview Module for the continue extension components.
 */
import 'core-js/es7/reflect';
import 'zone.js';

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InteractiveFractionInputComponent } from './directives/oppia-interactive-fraction-input.component';
import { ResponseFractionInput } from './directives/oppia-response-fraction-input.component';
import { ShortResponseFractionInput } from './directives/oppia-short-response-fraction-input.component';
import { SharedComponentsModule } from 'components/shared-component.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    SharedComponentsModule
  ],
  declarations: [
    InteractiveFractionInputComponent,
    ResponseFractionInput,
    ShortResponseFractionInput

  ],
  entryComponents: [
    InteractiveFractionInputComponent,
    ResponseFractionInput,
    ShortResponseFractionInput
  ],
  exports: [
    InteractiveFractionInputComponent,
    ResponseFractionInput,
    ShortResponseFractionInput
  ],
})

export class FractionInputInteractionModule { }
