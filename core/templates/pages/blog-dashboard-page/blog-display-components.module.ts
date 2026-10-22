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
 * @fileoverview Module for the blog components that only display blog content.
 * These components are used by the blog display pages (blog home, blog post,
 * blog author profile) and deliberately do not import the blog post editor or
 * the schema-based form editors, so that display-only pages do not pull the
 * CKEditor and CodeMirror bundles into their route chunks.
 */

import {NgModule} from '@angular/core';
import {BlogCardComponent} from 'pages/blog-dashboard-page/blog-card/blog-card.component';
import {BlogDashboardNavbarBreadcrumbComponent} from 'pages/blog-dashboard-page/navbar/navbar-breadcrumb/blog-dashboard-navbar-breadcrumb.component';
import {BlogPostEditorNavbarPreLogoActionComponent} from 'pages/blog-dashboard-page/navbar/navbar-pre-logo-action/blog-post-editor-pre-logo-action.component';
import {CommonModule} from '@angular/common';
import {MatCardModule} from '@angular/material/card';
import {RichTextComponentsModule} from 'rich_text_components/rich-text-components.module';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    MatCardModule,
    RichTextComponentsModule,
    TranslateModule,
  ],
  declarations: [
    BlogDashboardNavbarBreadcrumbComponent,
    BlogCardComponent,
    BlogPostEditorNavbarPreLogoActionComponent,
  ],
  entryComponents: [
    BlogDashboardNavbarBreadcrumbComponent,
    BlogCardComponent,
    BlogPostEditorNavbarPreLogoActionComponent,
  ],
  exports: [
    BlogDashboardNavbarBreadcrumbComponent,
    BlogCardComponent,
    BlogPostEditorNavbarPreLogoActionComponent,
  ],
})
export class BlogDisplayComponentsModule {}
