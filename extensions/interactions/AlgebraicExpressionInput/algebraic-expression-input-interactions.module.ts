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
 * @fileoverview Module for the AlgebraicExpressionInput extension components.
 */

import 'core-js/es7/reflect';
import 'zone.js';

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AlgebraicExpressionInputInteractionComponent } from './directives/oppia-interactive-algebraic-expression-input.component';
import { ResponseAlgebraicExpressionInputComponent } from './directives/oppia-response-algebraic-expression-input.component';
import { ShortResponseAlgebraicExpressionInputComponent } from './directives/oppia-short-response-algebraic-expression-input.component';


@NgModule({
  imports: [
    CommonModule,
  ],
  declarations: [
    AlgebraicExpressionInputInteractionComponent,
    ResponseAlgebraicExpressionInputComponent,
    ShortResponseAlgebraicExpressionInputComponent
  ],
  entryComponents: [
    AlgebraicExpressionInputInteractionComponent,
    ResponseAlgebraicExpressionInputComponent,
    ShortResponseAlgebraicExpressionInputComponent
  ],
  exports: [
    AlgebraicExpressionInputInteractionComponent,
    ResponseAlgebraicExpressionInputComponent,
    ShortResponseAlgebraicExpressionInputComponent
  ],
})

export class AlgebraicExpressionInputExtensionsModule { }
