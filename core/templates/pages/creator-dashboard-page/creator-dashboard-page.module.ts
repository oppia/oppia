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
 * @fileoverview Module for the creator dashboard page.
 */

import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {SharedComponentsModule} from 'components/shared-component.module';
import {FormsModule} from '@angular/forms';
import {ToastrModule} from 'ngx-toastr';
import {InteractionExtensionsModule} from 'interactions/interactions.module';
import {toastrConfig} from 'pages/oppia-root/app.module';
import {CreatorDashboardPageComponent} from './creator-dashboard-page.component';
import {CreatorDashboardPageRootComponent} from './creator-dashboard-page-root.component';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {CreatorStatsReportModalComponent} from './modal-templates/creator-stats-report-modal.component';

@NgModule({
  imports: [
    InteractionExtensionsModule,
    SharedComponentsModule,
    FormsModule,
    ToastrModule.forRoot(toastrConfig),
    NgbModule,
    RouterModule.forChild([
      {
        path: '',
        component: CreatorDashboardPageRootComponent,
      },
    ]),
  ],
  declarations: [
    CreatorDashboardPageComponent,
    CreatorDashboardPageRootComponent,
    CreatorStatsReportModalComponent,
  ],
  entryComponents: [
    CreatorDashboardPageComponent,
    CreatorStatsReportModalComponent,
  ],
})
export class CreatorDashboardPageModule {}
