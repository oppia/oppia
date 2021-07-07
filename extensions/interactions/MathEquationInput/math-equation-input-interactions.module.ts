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
 * @fileoverview Module for the numeric expression extension components.
 */
import 'core-js/es7/reflect';
import 'zone.js';

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MaterialModule } from 'modules/material.module';
import { InteractiveMathEquationInput } from './directives/oppia-interactive-math-equation-input.component';
import { ResponseMathEquationInput } from './directives/oppia-response-math-equation-input.component';
import { ShortResponseMathEquationInput } from './directives/oppia-short-response-math-equation-input.component';

@NgModule({
  imports: [
    CommonModule,
    MaterialModule
  ],
  declarations: [
    InteractiveMathEquationInput,
    ResponseMathEquationInput,
    ShortResponseMathEquationInput
  ],
  entryComponents: [
    InteractiveMathEquationInput,
    ResponseMathEquationInput,
    ShortResponseMathEquationInput
  ],
  exports: [
    InteractiveMathEquationInput,
    ResponseMathEquationInput,
    ShortResponseMathEquationInput
  ],
})

export class MathEquationInputModule {}
