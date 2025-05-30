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
 * @fileoverview Module for the topic editor page.
 */

import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
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
import {TopicEditorTabComponent} from './editor-tab/topic-editor-tab.component';
import {TopicEditorPageComponent} from './topic-editor-page.component';
import {SubtopicEditorTabComponent} from './subtopic-editor/subtopic-editor-tab.component';
import {ToastrModule} from 'ngx-toastr';
import {TopicEditorPageRootComponent} from './topic-editor-page-root.component';
import {TopicEditorAuthGuard} from './topic-editor-auth.guard';
import {TopicPlayerViewerCommonModule} from 'pages/topic-viewer-page/topic-viewer-player-common.module';
import {StoryCreationBackendApiService} from 'components/entity-creation-services/story-creation-backend-api.service';
import {EntityCreationService} from './services/entity-creation.service';
import {CreateNewSkillModalService} from './services/create-new-skill-modal.service';
import {ContextService} from 'services/context.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {ImageUploadHelperService} from 'services/image-upload-helper.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {PageTitleService} from 'services/page-title.service';
import {TopicsAndSkillsDashboardBackendApiService} from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import {TopicEditorStateService} from './services/topic-editor-state.service';
import {TopicEditorRoutingService} from './services/topic-editor-routing.service';
import {TopicUpdateService} from 'domain/topic/topic-update.service';
import {UndoRedoService} from 'domain/editor/undo_redo/undo-redo.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {SubtopicValidationService} from './services/subtopic-validation.service';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {ImageLocalStorageService} from 'services/image-local-storage.service';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {StoryEditorStateService} from 'pages/story-editor-page/services/story-editor-state.service';
import {AlertsService} from 'services/alerts.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {ExtractImageFilenamesFromModelService} from '../exploration-player-page/services/extract-image-filenames-from-model.service';
import {SkillBackendApiService} from 'domain/skill/skill-backend-api.service';
import {TopicRightsBackendApiService} from 'domain/topic/topic-rights-backend-api.service';
import {UrlService} from 'services/contextual/url.service';
import {QuestionsListService} from 'services/questions-list.service';
import {QuestionBackendApiService} from 'domain/question/question-backend-api.service';
import {BottomNavbarStatusService} from 'services/bottom-navbar-status.service';
import {LoaderService} from 'services/loader.service';
import {PreventPageUnloadEventService} from 'services/prevent-page-unload-event.service';
import {RteHelperService} from 'services/rte-helper.service';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
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
    TopicEditorPageRootComponent,
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
    RteHelperService,
    StoryCreationBackendApiService,
    EntityCreationService,
    CreateNewSkillModalService,
    SubtopicValidationService,
    ContextService,
    FocusManagerService,
    ImageUploadHelperService,
    PageTitleService,
    TopicsAndSkillsDashboardBackendApiService,
    TopicEditorStateService,
    TopicEditorRoutingService,
    TopicUpdateService,
    UndoRedoService,
    UrlInterpolationService,
    WindowDimensionsService,
    NgbModal,
    WindowRef,
    PlatformFeatureService,
    ImageLocalStorageService,
    NgbActiveModal,
    StoryEditorStateService,
    AlertsService,
    AssetsBackendApiService,
    ExtractImageFilenamesFromModelService,
    SkillBackendApiService,
    TopicRightsBackendApiService,
    UrlService,
    QuestionsListService,
    QuestionBackendApiService,
    BottomNavbarStatusService,
    LoaderService,
    PreventPageUnloadEventService,
  ],
})
export class TopicEditorPageModule {}
