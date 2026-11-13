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
 * @fileoverview Auto-generated granular module for one shared component.
 * Each component lives in its own module so pages import only what they use.
 */

import {NgModule} from '@angular/core';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {StateHintsEditorComponent} from '../state-editor/state-hints-editor/state-hints-editor.component';
import {CommonModule} from '@angular/common';
import {TranslateModule} from '@ngx-translate/core';
import {AddHintModalModule} from 'components/shared_parts/add-hint-modal.module';
import {DeleteHintModalModule} from 'components/shared_parts/delete-hint-modal.module';
import {DeleteLastHintModalModule} from 'components/shared_parts/delete-last-hint-modal.module';
import {HintEditorModule} from 'components/shared_parts/hint-editor.module';
import {MatCardModule} from '@angular/material/card';
import {ResponseHeaderModule} from 'components/shared_parts/response-header.module';

@NgModule({
  imports: [
    CommonModule,
    DragDropModule,
    TranslateModule,
    AddHintModalModule,
    DeleteHintModalModule,
    DeleteLastHintModalModule,
    HintEditorModule,
    MatCardModule,
    ResponseHeaderModule,
  ],
  declarations: [StateHintsEditorComponent],
  exports: [StateHintsEditorComponent],
})
export class StateHintsEditorModule {}
