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
import {SharedComponentsModule} from 'components/shared-component.module';
import {InteractionExtensionsModule} from 'interactions/interactions.module';
import {SkillEditorNavbarBreadcrumbComponent} from 'pages/skill-editor-page/navbar/skill-editor-navbar-breadcrumb.component';
import {DeleteMisconceptionModalComponent} from './modal-templates/delete-misconception-modal.component';
import {SkillDescriptionEditorComponent} from './editor-tab/skill-description-editor/skill-description-editor.component';
import {SkillPrerequisiteSkillsEditorComponent} from './editor-tab/skill-prerequisite-skills-editor/skill-prerequisite-skills-editor.component';
import {WorkedExampleEditorComponent} from './editor-tab/skill-concept-card-editor/worked-example-editor.component';
import {MisconceptionEditorComponent} from './editor-tab/skill-misconceptions-editor/misconception-editor.component';
import {DeleteWorkedExampleComponent} from './modal-templates/delete-worked-example-modal.component';
import {AddWorkedExampleModalComponent} from './modal-templates/add-worked-example.component';
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
import {toastrConfig} from 'pages/lightweight-oppia-root/app.module';
import {SkillEditorAccessGuard} from './skill-editor-access.guard';
import {SkillEditorPageRootComponent} from './skill-editor-page-root.component';
import {SkillEditorStalenessDetectionService} from './services/skill-editor-staleness-detection.service';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    DragDropModule,
    InteractionExtensionsModule,
    SharedComponentsModule,
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
    WorkedExampleEditorComponent,
    MisconceptionEditorComponent,
    AddWorkedExampleModalComponent,
    DeleteWorkedExampleComponent,
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
    WorkedExampleEditorComponent,
    MisconceptionEditorComponent,
    AddWorkedExampleModalComponent,
    DeleteWorkedExampleComponent,
    SkillRubricsEditorComponent,
    AddMisconceptionModalComponent,
    SkillMisconceptionsEditorComponent,
    SkillQuestionsTabComponent,
    SkillPreviewTabComponent,
    SkillEditorMainTabComponent,
    SkillEditorPageComponent,
  ],
  providers: [SkillEditorStalenessDetectionService],
})
export class SkillEditorPageModule {}
