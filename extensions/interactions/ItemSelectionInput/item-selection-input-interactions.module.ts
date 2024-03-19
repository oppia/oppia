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
 * @fileoverview Module for the item selection input interaction components.
 */

import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {DynamicContentModule} from 'components/interaction-display/dynamic-content.module';
import {MaterialModule} from 'modules/material.module';
import {FormsModule} from '@angular/forms';
import {InteractiveItemSelectionInputComponent} from './directives/oppia-interactive-item-selection-input.component';
import {ShortResponseItemSelectionInputComponent} from './directives/oppia-short-response-item-selection-input.component';
import {ResponseItemSelectionInputComponent} from './directives/oppia-response-item-selection-input.component';
import {TranslateModule} from '@ngx-translate/core';
import {RichTextComponentsModule} from 'rich_text_components/rich-text-components.module';

@NgModule({
  imports: [
    CommonModule,
    DynamicContentModule,
    FormsModule,
    MaterialModule,
    RichTextComponentsModule,
    TranslateModule,
  ],
  declarations: [
    InteractiveItemSelectionInputComponent,
    ResponseItemSelectionInputComponent,
    ShortResponseItemSelectionInputComponent,
  ],
  entryComponents: [
    InteractiveItemSelectionInputComponent,
    ResponseItemSelectionInputComponent,
    ShortResponseItemSelectionInputComponent,
  ],
  exports: [
    InteractiveItemSelectionInputComponent,
    ResponseItemSelectionInputComponent,
    ShortResponseItemSelectionInputComponent,
  ],
})
export class ItemSelectionInputInteractionModule {}
