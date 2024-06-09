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
//remove anything related to browser etc
import {RouterModule} from '@angular/router';

import {SharedComponentsModule} from 'components/shared-component.module';
import {ToastrModule } from 'ngx-toastr';
import {StoryEditorNavbarComponent} from './navbar/story-editor-navbar.component';
import {StoryEditorNavbarBreadcrumbComponent} from './navbar/story-editor-navbar-breadcrumb.component';
import {StoryEditorSaveModalComponent} from './modal-templates/story-editor-save-modal.component';
import {StoryEditorUnpublishModalComponent} from './modal-templates/story-editor-unpublish-modal.component';
import {DraftChapterConfirmationModalComponent} from './modal-templates/draft-chapter-confirmation-modal.component';
import {StoryPreviewTabComponent} from './story-preview-tab/story-preview-tab.component';
import {StoryNodeEditorComponent} from './editor-tab/story-node-editor.component';
import {ChapterEditorTabComponent} from './chapter-editor/chapter-editor-tab.component';
import {StoryEditorComponent} from './editor-tab/story-editor.component';
import {StoryEditorPageComponent} from './story-editor-page.component';
import {DeleteChapterModalComponent} from './modal-templates/delete-chapter-modal.component';
import {NewChapterTitleModalComponent} from './modal-templates/new-chapter-title-modal.component';
import {StoryEditorPageAuthGuard} from './story-editor-page-auth.guard';
import {StoryEditorPageRootComponent} from './story-editor-page-root.component';
import {toastrConfig} from 'pages/lightweight-oppia-root/app.module';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';

@NgModule({
  imports: [
    SharedComponentsModule,
    ToastrModule.forRoot(toastrConfig),
    FormsModule,
    //FormsModule ??
    RouterModule.forChild([
      {
        path: '',
        component: StoryEditorPageRootComponent,
        canActivate: [StoryEditorPageAuthGuard],
      },
    ]),

  ],
  declarations: [    
    StoryEditorPageRootComponent,
    StoryEditorNavbarBreadcrumbComponent,
    StoryEditorSaveModalComponent,
    StoryEditorUnpublishModalComponent,
    DraftChapterConfirmationModalComponent,
    StoryEditorNavbarComponent,
    StoryNodeEditorComponent,
    StoryPreviewTabComponent,
    ChapterEditorTabComponent,
    StoryEditorComponent,
    NewChapterTitleModalComponent,
    StoryEditorPageComponent,
    DeleteChapterModalComponent,
  ],
  entryComponents: [
    StoryEditorNavbarBreadcrumbComponent,
    StoryEditorSaveModalComponent,
    StoryEditorUnpublishModalComponent,
    DraftChapterConfirmationModalComponent,
    StoryEditorNavbarComponent,
    StoryNodeEditorComponent,
    StoryPreviewTabComponent,
    ChapterEditorTabComponent,
    StoryEditorComponent,
    NewChapterTitleModalComponent,
    StoryEditorPageComponent,
    DeleteChapterModalComponent,
  ],
})

export class StoryEditorPageModule {}

