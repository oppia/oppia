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
import {StateResponsesComponent} from '../state-editor/state-responses-editor/state-responses.component';
import {CommonModule} from '@angular/common';
import {TranslateModule} from '@ngx-translate/core';
import {AddAnswerGroupModalModule} from 'components/shared_parts/add-answer-group-modal.module';
import {AnswerGroupEditorModule} from 'components/shared_parts/answer-group-editor.module';
import {DeleteAnswerGroupModalModule} from 'components/shared_parts/delete-answer-group-modal.module';
import {FormsModule} from '@angular/forms';
import {NgbModalModule, NgbTooltipModule} from '@ng-bootstrap/ng-bootstrap';
import {ResponseHeaderModule} from 'components/shared_parts/response-header.module';
import {ParameterizeRuleDescriptionPipe} from 'filters/parameterize-rule-description.pipe';
import {WrapTextWithEllipsisPipe} from 'filters/string-utility-filters/wrap-text-with-ellipsis.pipe';

@NgModule({
  imports: [
    CommonModule,
    DragDropModule,
    TranslateModule,
    AddAnswerGroupModalModule,
    AnswerGroupEditorModule,
    DeleteAnswerGroupModalModule,
    FormsModule,
    NgbModalModule,
    NgbTooltipModule,
    ResponseHeaderModule,
  ],
  declarations: [StateResponsesComponent],
  // StateResponsesComponent injects these pipes rather than only using them in
  // its template, so they must be provided for dependency injection.
  providers: [ParameterizeRuleDescriptionPipe, WrapTextWithEllipsisPipe],
  exports: [StateResponsesComponent],
})
export class StateResponsesModule {}
