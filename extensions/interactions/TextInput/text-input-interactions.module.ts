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
 * @fileoverview Module for the text input interaction components.
 */
import 'core-js/es7/reflect';
import 'zone.js';

import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {SharedFormsModule} from 'components/forms/shared-forms.module';
import {SharedPipesModule} from 'filters/shared-pipes.module';
import {InteractiveTextInputComponent} from './directives/oppia-interactive-text-input.component';
import {ResponseTextInputComponent} from './directives/oppia-response-text-input.component';
import {ShortResponseTextInputComponent} from './directives/oppia-short-response-text-input.component';
import {TranslateModule} from '@ngx-translate/core';
@NgModule({
  imports: [
    CommonModule,
    SharedFormsModule,
    SharedPipesModule,
    TranslateModule,
    FormsModule,
  ],
  declarations: [
    InteractiveTextInputComponent,
    ResponseTextInputComponent,
    ShortResponseTextInputComponent,
  ],
  entryComponents: [
    InteractiveTextInputComponent,
    ResponseTextInputComponent,
    ShortResponseTextInputComponent,
  ],
  exports: [
    InteractiveTextInputComponent,
    ResponseTextInputComponent,
    ShortResponseTextInputComponent,
  ],
})
export class TextInputInteractionModule {}
