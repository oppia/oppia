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
 * @fileoverview Module for the shared pipes.
 */

import 'core-js/es7/reflect';
import 'zone.js';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { LimitToPipe } from './limit-to.pipe';
import { StringUtilityPipesModule } from 'filters/string-utility-filters/string-utility-pipes.module';
import { ParameterizeRuleDescriptionPipe } from './parameterize-rule-description.pipe';
import { ConvertToPlainTextPipe } from './string-utility-filters/convert-to-plain-text.pipe';
import { ReplaceInputsWithEllipsesPipe } from './string-utility-filters/replace-inputs-with-ellipses.pipe';
import { TruncatePipe } from './string-utility-filters/truncate.pipe';
import { WrapTextWithEllipsisPipe } from './string-utility-filters/wrap-text-with-ellipsis.pipe';
import { FormatTimePipe } from './format-timer.pipe';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    StringUtilityPipesModule,
  ],
  providers: [
    ReplaceInputsWithEllipsesPipe,
    ParameterizeRuleDescriptionPipe,
    ConvertToPlainTextPipe,
    TruncatePipe,
    WrapTextWithEllipsisPipe,
  ],
  declarations: [
    LimitToPipe,
    FormatTimePipe
  ],
  exports: [
    LimitToPipe,
    StringUtilityPipesModule,
    FormatTimePipe
  ],
})

export class SharedPipesModule { }
