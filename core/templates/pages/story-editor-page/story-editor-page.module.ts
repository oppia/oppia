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
 * @fileoverview Module for the story editor page.
 */

import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {RouterModule} from '@angular/router';
import {StaleTabInfoModalModule} from 'components/shared_parts/stale-tab-info-modal.module';
import {UnsavedChangesStatusInfoModalModule} from 'components/shared_parts/unsaved-changes-status-info-modal.module';
import {ToastrModule} from 'ngx-toastr';
import {StoryEditorSaveModalComponent} from './modal-templates/story-editor-save-modal.component';
import {StoryEditorUnpublishModalComponent} from './modal-templates/story-editor-unpublish-modal.component';
import {DraftChapterConfirmationModalComponent} from './modal-templates/draft-chapter-confirmation-modal.component';
import {StoryPreviewTabComponent} from './story-preview-tab/story-preview-tab.component';
import {StoryNodeEditorComponent} from './editor-tab/story-node-editor.component';
import {ChapterEditorTabComponent} from './chapter-editor/chapter-editor-tab.component';
import {StoryEditorComponent} from './editor-tab/story-editor.component';
import {StoryEditorPageComponent} from './story-editor-page.component';
import {DeleteChapterModalComponent} from './modal-templates/delete-chapter-modal.component';
import {EditArcModalComponent} from './modal-templates/edit-arc-modal.component';
import {NewChapterTitleModalComponent} from './modal-templates/new-chapter-title-modal.component';
import {StoryEditorPageAuthGuard} from './story-editor-page-auth.guard';
import {StoryEditorPageRootComponent} from './story-editor-page-root.component';
import {StoryEditorNavbarComponent} from './navbar/story-editor-navbar.component';
import {StoryEditorNavbarBreadcrumbComponent} from './navbar/story-editor-navbar-breadcrumb.component';
import {toastrConfig} from 'pages/oppia-root/app.module';
import {BaseModule} from 'base-components/base.module';
import {CommonElementsModule} from 'components/common-layout-directives/common-elements/common-elements.module';
import {CommonModule} from '@angular/common';
import {DirectivesModule} from 'directives/directives.module';
import {FormsModule} from '@angular/forms';
import {MatCardModule} from '@angular/material/card';
import {MatTooltipModule} from '@angular/material/tooltip';
import {
  NgbDropdownModule,
  NgbModalModule,
  NgbTooltipModule,
} from '@ng-bootstrap/ng-bootstrap';
import {PreviewThumbnailModule} from 'components/shared_parts/preview-thumbnail.module';
import {RichTextComponentsModule} from 'rich_text_components/rich-text-components.module';
import {SavePendingChangesModalModule} from 'components/shared_parts/save-pending-changes-modal.module';
import {SelectSkillModalModule} from 'components/shared_parts/select-skill-modal.module';
import {SharedFormsModule} from 'components/forms/shared-forms.module';
import {ThumbnailUploaderModule} from 'components/shared_parts/thumbnail-uploader.module';
import {TranslateModule} from '@ngx-translate/core';
import {UrlFragmentEditorModule} from 'components/shared_parts/url-fragment-editor.module';
@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    UrlFragmentEditorModule,
    UnsavedChangesStatusInfoModalModule,
    TranslateModule,
    ThumbnailUploaderModule,
    StaleTabInfoModalModule,
    SharedFormsModule,
    SelectSkillModalModule,
    SavePendingChangesModalModule,
    RichTextComponentsModule,
    PreviewThumbnailModule,
    NgbDropdownModule,
    NgbModalModule,
    NgbTooltipModule,
    MatCardModule,
    MatTooltipModule,
    FormsModule,
    DirectivesModule,
    CommonModule,
    CommonElementsModule,
    DragDropModule,
    BaseModule,
    ToastrModule.forRoot(toastrConfig),
    RouterModule.forChild([
      {
        path: '',
        component: StoryEditorPageRootComponent,
        canActivate: [StoryEditorPageAuthGuard],
      },
    ]),
  ],
  declarations: [
    StoryEditorSaveModalComponent,
    StoryEditorUnpublishModalComponent,
    DraftChapterConfirmationModalComponent,
    StoryNodeEditorComponent,
    StoryPreviewTabComponent,
    ChapterEditorTabComponent,
    StoryEditorComponent,
    NewChapterTitleModalComponent,
    EditArcModalComponent,
    StoryEditorPageComponent,
    DeleteChapterModalComponent,
    StoryEditorPageRootComponent,
    StoryEditorNavbarBreadcrumbComponent,
    StoryEditorNavbarComponent,
  ],
  entryComponents: [
    StoryEditorSaveModalComponent,
    StoryEditorUnpublishModalComponent,
    DraftChapterConfirmationModalComponent,
    StoryNodeEditorComponent,
    StoryPreviewTabComponent,
    ChapterEditorTabComponent,
    StoryEditorComponent,
    NewChapterTitleModalComponent,
    EditArcModalComponent,
    StoryEditorPageComponent,
    DeleteChapterModalComponent,
    StoryEditorNavbarBreadcrumbComponent,
    StoryEditorNavbarComponent,
  ],
})
export class StoryEditorPageModule {}
