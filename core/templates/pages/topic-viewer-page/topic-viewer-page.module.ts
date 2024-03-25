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
 * @fileoverview Module for the topic viewer page.
 */

import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {SharedComponentsModule} from 'components/shared-component.module';
import {
  TopicViewerNavbarBreadcrumbComponent,
  // eslint-disable-next-line max-len
} from 'pages/topic-viewer-page/navbar-breadcrumb/topic-viewer-navbar-breadcrumb.component';
import {TopicViewerPageComponent} from 'pages/topic-viewer-page/topic-viewer-page.component';
import {toastrConfig} from 'pages/oppia-root/app.module';
import {PracticeSessionConfirmationModal} from './modals/practice-session-confirmation-modal.component';
import {ToastrModule} from 'ngx-toastr';
import {TopicViewerPageRootComponent} from './topic-viewer-page-root.component';
import {TopicViewerAccessGuard} from './topic-viewer-page-auth.guard';
import {TopicPlayerViewerCommonModule} from 'pages/topic-viewer-page/topic-viewer-player-common.module';

@NgModule({
  imports: [
    SharedComponentsModule,
    CommonModule,
    TopicPlayerViewerCommonModule,
    ToastrModule.forRoot(toastrConfig),
    RouterModule.forChild([
      {
        path: '',
        component: TopicViewerPageRootComponent,
        canActivate: [TopicViewerAccessGuard],
      },
    ]),
  ],
  declarations: [
    TopicViewerPageRootComponent,
    TopicViewerNavbarBreadcrumbComponent,
    TopicViewerPageComponent,
    PracticeSessionConfirmationModal,
  ],
  entryComponents: [
    TopicViewerNavbarBreadcrumbComponent,
    TopicViewerPageComponent,
    PracticeSessionConfirmationModal,
  ],
})
export class TopicViewerPageModule {}
