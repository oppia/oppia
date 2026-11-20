// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the contributor dashboard stats page.
 */

import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {SharedComponentsModule} from 'components/shared-component.module';
import {ToastrModule} from 'ngx-toastr';
import {toastrConfig} from 'pages/oppia-root/app.module';

import {ContributorDashboardStatsPageComponent} from './contributor-dashboard-stats-page.component';
import {ContributorDashboardStatsPageRootComponent} from './contributor-dashboard-stats-page-root.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    SharedComponentsModule,
    ToastrModule.forRoot(toastrConfig),
    RouterModule.forChild([
      {
        path: '',
        component: ContributorDashboardStatsPageRootComponent,
      },
    ]),
  ],
  declarations: [
    ContributorDashboardStatsPageComponent,
    ContributorDashboardStatsPageRootComponent,
  ],
  entryComponents: [
    ContributorDashboardStatsPageComponent,
    ContributorDashboardStatsPageRootComponent,
  ],
})
export class ContributorDashboardStatsPageModule {}
