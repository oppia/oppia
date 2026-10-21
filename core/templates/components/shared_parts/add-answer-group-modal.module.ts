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
import {AddAnswerGroupModalComponent} from '../../pages/exploration-editor-page/editor-tab/templates/modal-templates/add-answer-group-modal.component';
import {CommonModule} from '@angular/common';
import {TranslateModule} from '@ngx-translate/core';
import {FormsModule} from '@angular/forms';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {OutcomeDestinationEditorModule} from 'components/shared_parts/outcome-destination-editor.module';
import {OutcomeFeedbackEditorModule} from 'components/shared_parts/outcome-feedback-editor.module';
import {OutcomeIfStuckDestinationEditorModule} from 'components/shared_parts/outcome-if-stuck-destination-editor.module';
import {QuestionMisconceptionEditorModule} from 'components/shared_parts/question-misconception-editor.module';
import {RuleEditorModule} from 'components/shared_parts/rule-editor.module';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    FormsModule,
    NgbModule,
    OutcomeDestinationEditorModule,
    OutcomeFeedbackEditorModule,
    OutcomeIfStuckDestinationEditorModule,
    QuestionMisconceptionEditorModule,
    RuleEditorModule,
  ],
  declarations: [AddAnswerGroupModalComponent],
  exports: [AddAnswerGroupModalComponent],
})
export class AddAnswerGroupModalModule {}
