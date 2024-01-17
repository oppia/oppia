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
 * @fileoverview Module for the blog-admin page.
 */

import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SharedComponentsModule } from 'components/shared-component.module';
import { BlogAdminNavbarComponent } from 'pages/blog-admin-page/navbar/blog-admin-navbar.component';
import { ToastrModule } from 'ngx-toastr';
import { toastrConfig } from 'pages/oppia-root/app.module';
import { AdminBlogAdminCommonModule } from 'pages/admin-page/admin-blog-admin-common.module';
import { BlogAdminPageComponent } from './blog-admin-page.component';
import { BlogAdminPageRootComponent } from './blog-admin-page-root.component';
import { BlogAdminAuthGuard } from './blog-admin-auth.guard';

@NgModule({
  imports: [
    FormsModule,
    MatCardModule,
    CommonModule,
    ReactiveFormsModule,
    SharedComponentsModule,
    AdminBlogAdminCommonModule,
    ToastrModule.forRoot(toastrConfig),
    RouterModule.forChild([
      {
        path: '',
        component: BlogAdminPageRootComponent,
        canActivate: [BlogAdminAuthGuard],
      },
    ]),
  ],
  declarations: [
    BlogAdminNavbarComponent,
    BlogAdminPageComponent,
    BlogAdminPageRootComponent
  ],
  entryComponents: [
    BlogAdminNavbarComponent,
    BlogAdminPageComponent
  ],
})
export class BlogAdminPageModule {}
