// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the skill editor page.
 */

import {ToastrModule} from 'ngx-toastr';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {RouterModule} from '@angular/router';
import {InteractionExtensionsModule} from 'interactions/interactions.module';
import {SkillEditorNavbarBreadcrumbComponent} from 'pages/skill-editor-page/navbar/skill-editor-navbar-breadcrumb.component';
import {DeleteMisconceptionModalComponent} from './modal-templates/delete-misconception-modal.component';
import {SkillDescriptionEditorComponent} from './editor-tab/skill-description-editor/skill-description-editor.component';
import {SkillPrerequisiteSkillsEditorComponent} from './editor-tab/skill-prerequisite-skills-editor/skill-prerequisite-skills-editor.component';
import {MisconceptionEditorComponent} from './editor-tab/skill-misconceptions-editor/misconception-editor.component';
import {SkillRubricsEditorComponent} from './editor-tab/skill-rubrics-editor/skill-rubrics-editor.component';
import {AddMisconceptionModalComponent} from './modal-templates/add-misconception-modal.component';
import {SkillEditorSaveModalComponent} from './modal-templates/skill-editor-save-modal.component';
import {SkillMisconceptionsEditorComponent} from './editor-tab/skill-misconceptions-editor/skill-misconceptions-editor.component';
import {SkillPreviewModalComponent} from './editor-tab/skill-preview-modal.component';
import {SkillConceptCardEditorComponent} from './editor-tab/skill-concept-card-editor/skill-concept-card-editor.component';
import {SkillEditorNavabarComponent} from './navbar/skill-editor-navbar.component';
import {SkillQuestionsTabComponent} from './questions-tab/skill-questions-tab.component';
import {SkillPreviewTabComponent} from './skill-preview-tab/skill-preview-tab.component';
import {SkillEditorMainTabComponent} from './editor-tab/skill-editor-main-tab.component';
import {SkillEditorPageComponent} from './skill-editor-page.component';
import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {SkillEditorAccessGuard} from './skill-editor-access.guard';
import {SkillEditorPageRootComponent} from './skill-editor-page-root.component';
import {SkillEditorStalenessDetectionService} from './services/skill-editor-staleness-detection.service';
import {RteHelperService} from 'services/rte-helper.service';
import {toastrConfig} from 'pages/oppia-root/app.module';

import {BaseModule} from 'base-components/base.module';
import {CommonElementsModule} from 'components/common-layout-directives/common-elements/common-elements.module';
import {CommonModule} from '@angular/common';
import {ConfirmQuestionExitModalModule} from 'components/shared_parts/confirm-question-exit-modal.module';
import {RteHelperModalModule} from 'components/shared_parts/rte-helper-modal.module';
import {StaleTabInfoModalModule} from 'components/shared_parts/stale-tab-info-modal.module';
import {UnsavedChangesStatusInfoModalModule} from 'components/shared_parts/unsaved-changes-status-info-modal.module';
import {DirectivesModule} from 'directives/directives.module';
import {FormsModule} from '@angular/forms';
import {MaterialModule} from 'modules/material.module';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {QuestionsListModule} from 'components/shared_parts/questions-list.module';
import {ReviewMaterialEditorModule} from 'components/shared_parts/review-material-editor.module';
import {RichTextComponentsModule} from 'rich_text_components/rich-text-components.module';
import {RubricsEditorModule} from 'components/shared_parts/rubrics-editor.module';
import {SavePendingChangesModalModule} from 'components/shared_parts/save-pending-changes-modal.module';
import {SelectSkillModalModule} from 'components/shared_parts/select-skill-modal.module';
import {SharedFormsModule} from 'components/forms/shared-forms.module';
import {SummaryListHeaderModule} from 'components/shared_parts/summary-list-header.module';
import {SupplementalCardModule} from 'components/shared_parts/supplemental-card.module';
import {TutorCardModule} from 'components/shared_parts/tutor-card.module';
@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    UnsavedChangesStatusInfoModalModule,
    TutorCardModule,
    SupplementalCardModule,
    SummaryListHeaderModule,
    StaleTabInfoModalModule,
    SharedFormsModule,
    SelectSkillModalModule,
    SavePendingChangesModalModule,
    RubricsEditorModule,
    RteHelperModalModule,
    RichTextComponentsModule,
    ReviewMaterialEditorModule,
    QuestionsListModule,
    NgbModule,
    MaterialModule,
    FormsModule,
    DirectivesModule,
    ConfirmQuestionExitModalModule,
    CommonModule,
    CommonElementsModule,
    BaseModule,
    DragDropModule,
    InteractionExtensionsModule,
    ToastrModule.forRoot(toastrConfig),
    RouterModule.forChild([
      {
        path: '',
        component: SkillEditorPageRootComponent,
        canActivate: [SkillEditorAccessGuard],
      },
    ]),
  ],
  declarations: [
    DeleteMisconceptionModalComponent,
    SkillConceptCardEditorComponent,
    SkillEditorPageRootComponent,
    SkillEditorNavabarComponent,
    SkillEditorNavbarBreadcrumbComponent,
    SkillDescriptionEditorComponent,
    SkillPrerequisiteSkillsEditorComponent,
    SkillPreviewModalComponent,
    SkillEditorSaveModalComponent,
    MisconceptionEditorComponent,
    SkillRubricsEditorComponent,
    AddMisconceptionModalComponent,
    SkillMisconceptionsEditorComponent,
    SkillQuestionsTabComponent,
    SkillPreviewTabComponent,
    SkillEditorMainTabComponent,
    SkillEditorPageComponent,
  ],
  entryComponents: [
    DeleteMisconceptionModalComponent,
    SkillConceptCardEditorComponent,
    SkillEditorNavabarComponent,
    SkillEditorNavbarBreadcrumbComponent,
    SkillDescriptionEditorComponent,
    SkillPrerequisiteSkillsEditorComponent,
    SkillPreviewModalComponent,
    SkillEditorSaveModalComponent,
    MisconceptionEditorComponent,
    SkillRubricsEditorComponent,
    AddMisconceptionModalComponent,
    SkillMisconceptionsEditorComponent,
    SkillQuestionsTabComponent,
    SkillPreviewTabComponent,
    SkillEditorMainTabComponent,
    SkillEditorPageComponent,
  ],
  providers: [SkillEditorStalenessDetectionService, RteHelperService],
})
export class SkillEditorPageModule {}
