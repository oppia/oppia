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
 * @fileoverview Module for the blog dashboard editing components. The
 * display-only blog components live in BlogDisplayComponentsModule so that
 * blog display pages do not load the blog post editor (and its schema-based
 * form editors, which pull in CKEditor and CodeMirror).
 */

import {NgModule} from '@angular/core';
import {MatTabsModule} from '@angular/material/tabs';
import {MatMenuModule} from '@angular/material/menu';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {BlogPostActionConfirmationModalComponent} from 'pages/blog-dashboard-page/blog-post-action-confirmation/blog-post-action-confirmation.component';
import {BlogDashboardTileComponent} from 'pages/blog-dashboard-page/blog-dashboard-tile/blog-dashboard-tile.component';
import {BlogPostEditorComponent} from 'pages/blog-dashboard-page/blog-post-editor/blog-post-editor.component';
import {UploadBlogPostThumbnailModalComponent} from 'pages/blog-dashboard-page/modal-templates/upload-blog-post-thumbnail-modal.component';
import {BlogCardPreviewModalComponent} from 'pages/blog-dashboard-page/modal-templates/blog-card-preview-modal.component';
import {UploadBlogPostThumbnailComponent} from 'pages/blog-dashboard-page/modal-templates/upload-blog-post-thumbnail.component';
import {BlogDisplayComponentsModule} from 'pages/blog-dashboard-page/blog-display-components.module';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ImageReceiverModule} from 'components/forms/custom-forms-directives/image-receiver.module';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatDividerModule} from '@angular/material/divider';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatTooltipModule} from '@angular/material/tooltip';
import {RichTextComponentsModule} from 'rich_text_components/rich-text-components.module';
import {SharedFormsModule} from 'components/forms/shared-forms.module';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
  imports: [
    BlogDisplayComponentsModule,
    CommonModule,
    FormsModule,
    ImageReceiverModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatButtonToggleModule,
    MatMenuModule,
    MatTabsModule,
    RichTextComponentsModule,
    SharedFormsModule,
    TranslateModule,
  ],
  declarations: [
    BlogDashboardTileComponent,
    BlogPostEditorComponent,
    BlogPostActionConfirmationModalComponent,
    UploadBlogPostThumbnailModalComponent,
    BlogCardPreviewModalComponent,
    UploadBlogPostThumbnailComponent,
  ],
  entryComponents: [
    BlogDashboardTileComponent,
    BlogPostEditorComponent,
    BlogPostActionConfirmationModalComponent,
    UploadBlogPostThumbnailModalComponent,
    BlogCardPreviewModalComponent,
    UploadBlogPostThumbnailComponent,
  ],
  exports: [
    BlogDashboardTileComponent,
    BlogPostEditorComponent,
    BlogPostActionConfirmationModalComponent,
    UploadBlogPostThumbnailModalComponent,
    BlogCardPreviewModalComponent,
    UploadBlogPostThumbnailComponent,
  ],
})
export class SharedBlogComponentsModule {}
