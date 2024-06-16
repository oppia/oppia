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
import {RouterModule} from '@angular/router';

import {SharedComponentsModule} from 'components/shared-component.module';
import {SubtopicViewerNavbarBreadcrumbComponent} from './navbar-breadcrumb/subtopic-viewer-navbar-breadcrumb.component';
import {SubtopicViewerPageComponent} from './subtopic-viewer-page.component';
import {SubtopicViewerNavbarPreLogoActionComponent} from './navbar-pre-logo-action/subtopic-viewer-navbar-pre-logo-action.component';
import {toastrConfig} from 'pages/oppia-root/app.module';
import {SubtopicViewerRootComponent} from './subtopic-viewer-page-root.component';
import {SubtopicViewerAuthGuard} from './subtopic-viewer-auth.guard';
import {CommonModule} from '@angular/common';
import {ToastrModule} from 'ngx-toastr';

@NgModule({
  imports: [
    CommonModule,
    SharedComponentsModule,
    ToastrModule.forRoot(toastrConfig),
    RouterModule.forChild([
      {
        path: '',
        component: SubtopicViewerRootComponent,
        canActivate: [SubtopicViewerAuthGuard],
      },
    ]),
  ],
  declarations: [
    SubtopicViewerNavbarBreadcrumbComponent,
    SubtopicViewerPageComponent,
    SubtopicViewerRootComponent,
    SubtopicViewerNavbarPreLogoActionComponent,
  ],
  entryComponents: [
    SubtopicViewerNavbarBreadcrumbComponent,
    SubtopicViewerPageComponent,
    SubtopicViewerNavbarPreLogoActionComponent,
    SubtopicViewerNavbarBreadcrumbComponent,
  ],
})
export class SubtopicViewerPageModule {}
