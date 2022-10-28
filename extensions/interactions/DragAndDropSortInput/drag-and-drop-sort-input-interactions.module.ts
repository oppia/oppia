// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the item drag and drop sort input interaction
 * components.
 */

import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { NgModule } from '@angular/core';
import { DynamicContentModule } from 'components/interaction-display/dynamic-content.module';
import { MaterialModule } from 'modules/material.module';
import { FormsModule } from '@angular/forms';
import { InteractiveDragAndDropSortInputComponent } from './directives/oppia-interactive-drag-and-drop-sort-input.component';
import { ShortResponseDragAndDropSortInputComponent } from './directives/oppia-short-response-drag-and-drop-sort-input.component';
import { ResponseDragAndDropSortInputComponent } from './directives/oppia-response-drag-and-drop-sort-input.component';
import { TranslateModule } from '@ngx-translate/core';
import {MatIconModule, MatIconRegistry} from '@angular/material/icon';
import { RichTextComponentsModule } from 'rich_text_components/rich-text-components.module';

@NgModule({
  imports: [
    CommonModule,
    DragDropModule,
    DynamicContentModule,
    MatIconModule,
    FormsModule,
    MaterialModule,
    RichTextComponentsModule,
    TranslateModule,
  ],
  declarations: [
    InteractiveDragAndDropSortInputComponent,
    ResponseDragAndDropSortInputComponent,
    ShortResponseDragAndDropSortInputComponent,
  ],
  entryComponents: [
    InteractiveDragAndDropSortInputComponent,
    ResponseDragAndDropSortInputComponent,
    ShortResponseDragAndDropSortInputComponent,
  ],
  exports: [
    InteractiveDragAndDropSortInputComponent,
    ResponseDragAndDropSortInputComponent,
    ShortResponseDragAndDropSortInputComponent,
  ],
  providers: [MatIconRegistry],
})

export class DragAndDropSortInputInteractionModule { }
