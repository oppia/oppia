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
import { BrowserModule } from '@angular/platform-browser';

import { MaterialModule } from 'components/material.module';
import { ShortResponseNumericExpressionInput } from './directives/oppia-short-response-numeric-expression-input.component';
import { ResponseNumericExpressionInput } from './directives/oppia-response-numeric-expression-input.component';
import { InteractiveNumericExpressionInput } from './directives/oppia-interactive-numeric-expression-input.component';


@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    MaterialModule
  ],
  declarations: [
    ResponseNumericExpressionInput,
    ShortResponseNumericExpressionInput,
    InteractiveNumericExpressionInput
  ],
  entryComponents: [
    ResponseNumericExpressionInput,
    ShortResponseNumericExpressionInput,
    InteractiveNumericExpressionInput
  ],
  exports: [
    ResponseNumericExpressionInput,
    ShortResponseNumericExpressionInput,
    InteractiveNumericExpressionInput
  ],
})

export class NumericExpressionInputModule {}
