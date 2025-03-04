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
 * @fileoverview Module for the shared blog-dashboard components.
 */

import {NgModule} from '@angular/core';
import {MatTabsModule} from '@angular/material/tabs';
import {MatMenuModule} from '@angular/material/menu';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {SharedComponentsModule} from 'components/shared-component.module';

import {BlogPostActionConfirmationModalComponent} from 'pages/blog-dashboard-page/blog-post-action-confirmation/blog-post-action-confirmation.component';
import {BlogCardComponent} from 'pages/blog-dashboard-page/blog-card/blog-card.component';
import {BlogDashboardTileComponent} from 'pages/blog-dashboard-page/blog-dashboard-tile/blog-dashboard-tile.component';
import {BlogDashboardNavbarBreadcrumbComponent} from 'pages/blog-dashboard-page/navbar/navbar-breadcrumb/blog-dashboard-navbar-breadcrumb.component';
import {BlogPostEditorComponent} from 'pages/blog-dashboard-page/blog-post-editor/blog-post-editor.component';
import {UploadBlogPostThumbnailModalComponent} from 'pages/blog-dashboard-page/modal-templates/upload-blog-post-thumbnail-modal.component';
import {BlogCardPreviewModalComponent} from 'pages/blog-dashboard-page/modal-templates/blog-card-preview-modal.component';
import {UploadBlogPostThumbnailComponent} from 'pages/blog-dashboard-page/modal-templates/upload-blog-post-thumbnail.component';
import {BlogPostEditorNavbarPreLogoActionComponent} from 'pages/blog-dashboard-page/navbar/navbar-pre-logo-action/blog-post-editor-pre-logo-action.component';
import {CommonModule} from '@angular/common';

@NgModule({
  imports: [
    CommonModule,
    SharedComponentsModule,
    MatTabsModule,
    MatMenuModule,
    MatButtonToggleModule,
  ],
  declarations: [
    BlogDashboardNavbarBreadcrumbComponent,
    BlogCardComponent,
    BlogDashboardTileComponent,
    BlogPostEditorComponent,
    BlogPostActionConfirmationModalComponent,
    UploadBlogPostThumbnailModalComponent,
    BlogCardPreviewModalComponent,
    UploadBlogPostThumbnailComponent,
    BlogPostEditorNavbarPreLogoActionComponent,
  ],
  entryComponents: [
    BlogDashboardNavbarBreadcrumbComponent,
    BlogCardComponent,
    BlogDashboardTileComponent,
    BlogPostEditorComponent,
    BlogPostActionConfirmationModalComponent,
    UploadBlogPostThumbnailModalComponent,
    BlogCardPreviewModalComponent,
    UploadBlogPostThumbnailComponent,
    BlogPostEditorNavbarPreLogoActionComponent,
  ],
  exports: [
    BlogDashboardNavbarBreadcrumbComponent,
    BlogCardComponent,
    BlogDashboardTileComponent,
    BlogPostEditorComponent,
    BlogPostActionConfirmationModalComponent,
    UploadBlogPostThumbnailModalComponent,
    BlogCardPreviewModalComponent,
    UploadBlogPostThumbnailComponent,
    BlogPostEditorNavbarPreLogoActionComponent,
  ],
})
export class SharedBlogComponentsModule {}
