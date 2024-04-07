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
import {HttpClientModule} from '@angular/common/http';
import {RouterModule} from '@angular/router';
import { ToastrModule } from 'ngx-toastr';

import {SharedComponentsModule} from 'components/shared-component.module';
import {SubtopicViewerNavbarBreadcrumbComponent} from './navbar-breadcrumb/subtopic-viewer-navbar-breadcrumb.component';
import {SubtopicViewerPageComponent} from './subtopic-viewer-page.component';
import {SubtopicViewerNavbarPreLogoActionComponent} from './navbar-pre-logo-action/subtopic-viewer-navbar-pre-logo-action.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {toastrConfig} from 'pages/oppia-root/app.module';
import {SmartRouterModule} from 'hybrid-router-module-provider';
import { SubtopicViewerPageRootComponent } from './subtopic-viewer-page-root.component';
import { SubtopicViewerAuthGuard } from './subtopic-viewer-auth-guard';

@NgModule({
  imports: [
    BrowserAnimationsModule,
    HttpClientModule,
    // TODO(#13443): Remove smart router module provider once all pages are
    // migrated to angular router.
    SmartRouterModule,
    RouterModule.forRoot([]),
    SharedComponentsModule,
    ToastrModule.forRoot(toastrConfig),
    RouterModule.forChild([
      {
        path: '',
        component: SubtopicViewerPageRootComponent,
        canActivate: [SubtopicViewerAuthGuard],
      },
    ]),
  ],
  declarations: [
    SubtopicViewerNavbarBreadcrumbComponent,
    SubtopicViewerPageComponent,
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
