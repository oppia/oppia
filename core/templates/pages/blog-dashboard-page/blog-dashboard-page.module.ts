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
 * @fileoverview Module for the blog-dashboard page.
 */

import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SharedComponentsModule } from 'components/shared-component.module';
import { RouterModule } from '@angular/router';
import { BlogDashboardPageComponent } from 'pages/blog-dashboard-page/blog-dashboard-page.component';
import { SharedBlogComponentsModule } from 'pages/blog-dashboard-page/shared-blog-components.module';
import { NgModule } from '@angular/core';
import { ToastrModule } from 'ngx-toastr';
import { toastrConfig } from 'pages/oppia-root/app.module';
import { BlogDashboardPageRootComponent } from './blog-dashboard-page-root.component';
import { BlogAuthorDetailsEditorComponent } from './modal-templates/author-detail-editor-modal.component';
import { BlogDashboardPageAuthGuard } from './blog-dashboard-page-auth.guard';

@NgModule({
  imports: [
    SharedComponentsModule,
    SharedBlogComponentsModule,
    MatTabsModule,
    MatMenuModule,
    MatTooltipModule,
    ToastrModule.forRoot(toastrConfig),
    RouterModule.forChild([
      {
        path: '',
        component: BlogDashboardPageRootComponent,
        canActivate: [BlogDashboardPageAuthGuard]
      }
    ]),
    MatButtonToggleModule,
  ],
  declarations: [
    BlogDashboardPageComponent,
    BlogAuthorDetailsEditorComponent,
    BlogDashboardPageRootComponent
  ],
  entryComponents: [
    BlogDashboardPageComponent,
    BlogAuthorDetailsEditorComponent

  ],
})
export class BlogDashboardPageModule {}
