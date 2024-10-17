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
 * @fileoverview Module for the story viewer page.
 */

import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {InteractionExtensionsModule} from 'interactions/interactions.module';
import {SharedComponentsModule} from 'components/shared-component.module';
import {RouterModule} from '@angular/router';
import {SubtopicPreviewTab} from './subtopic-editor/subtopic-preview-tab.component';
import {ChangeSubtopicAssignmentModalComponent} from './modal-templates/change-subtopic-assignment-modal.component';
import {TopicPreviewTabComponent} from './preview-tab/topic-preview-tab.component';
import {TopicEditorNavbarBreadcrumbComponent} from './navbar/topic-editor-navbar-breadcrumb.component';
import {toastrConfig} from 'pages/oppia-root/app.module';
import {CreateNewSubtopicModalComponent} from 'pages/topic-editor-page/modal-templates/create-new-subtopic-modal.component';
import {DeleteStoryModalComponent} from './modal-templates/delete-story-modal.component';
import {TopicEditorSendMailComponent} from './modal-templates/topic-editor-send-mail-modal.component';
import {TopicEditorSaveModalComponent} from './modal-templates/topic-editor-save-modal.component';
import {TopicEditorNavbarComponent} from './navbar/topic-editor-navbar.component';
import {TopicQuestionsTabComponent} from './questions-tab/topic-questions-tab.component';
import {RearrangeSkillsInSubtopicsModalComponent} from './modal-templates/rearrange-skills-in-subtopics-modal.component';
import {CreateNewStoryModalComponent} from './modal-templates/create-new-story-modal.component';
import {TopicEditorStoriesListComponent} from './editor-tab/topic-editor-stories-list.component';
import {TopicEditorTabComponent} from './editor-tab/topic-editor-tab.directive';
import {TopicEditorPageComponent} from './topic-editor-page.component';
import {SubtopicEditorTabComponent} from './subtopic-editor/subtopic-editor-tab.component';
import {ToastrModule} from 'ngx-toastr';
import {TopicEditorPageRootComponent} from './topic-editor-page-root.component';
import {TopicEditorAuthGuard} from './topic-editor-auth.guard';
import {TopicPlayerViewerCommonModule} from 'pages/topic-viewer-page/topic-viewer-player-common.module';
import {StoryCreationBackendApiService} from 'components/entity-creation-services/story-creation-backend-api.service';
import {EntityCreationService} from './services/entity-creation.service';
import {CreateNewSkillModalService} from './services/create-new-skill-modal.service';

@NgModule({
  imports: [
    InteractionExtensionsModule,
    SharedComponentsModule,
    CommonModule,
    ReactiveFormsModule,
    TopicPlayerViewerCommonModule,
    ToastrModule.forRoot(toastrConfig),
    RouterModule.forChild([
      {
        path: '',
        component: TopicEditorPageRootComponent,
        canActivate: [TopicEditorAuthGuard],
      },
    ]),
  ],
  declarations: [
    ChangeSubtopicAssignmentModalComponent,
    RearrangeSkillsInSubtopicsModalComponent,
    SubtopicPreviewTab,
    TopicPreviewTabComponent,
    TopicEditorNavbarBreadcrumbComponent,
    CreateNewSubtopicModalComponent,
    CreateNewStoryModalComponent,
    DeleteStoryModalComponent,
    TopicEditorSendMailComponent,
    TopicEditorSaveModalComponent,
    TopicEditorNavbarComponent,
    TopicQuestionsTabComponent,
    TopicEditorStoriesListComponent,
    TopicEditorTabComponent,
    TopicEditorPageComponent,
    TopicEditorPageRootComponent,
    SubtopicEditorTabComponent,
  ],
  entryComponents: [
    ChangeSubtopicAssignmentModalComponent,
    RearrangeSkillsInSubtopicsModalComponent,
    SubtopicPreviewTab,
    TopicPreviewTabComponent,
    TopicEditorNavbarBreadcrumbComponent,
    CreateNewSubtopicModalComponent,
    CreateNewStoryModalComponent,
    DeleteStoryModalComponent,
    TopicEditorSendMailComponent,
    TopicEditorSaveModalComponent,
    TopicEditorNavbarComponent,
    TopicQuestionsTabComponent,
    TopicEditorStoriesListComponent,
    TopicEditorTabComponent,
    TopicEditorPageComponent,
    SubtopicEditorTabComponent,
  ],
  providers: [
    StoryCreationBackendApiService,
    EntityCreationService,
    CreateNewSkillModalService,
  ],
})
export class TopicEditorPageModule {}
