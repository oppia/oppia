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
 * @fileoverview Module for the collection player page.
 */

import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {SharedComponentsModule} from 'components/shared-component.module';
import {EmailDashboardPageComponent} from './email-dashboard-page.component';
import {ToastrModule} from 'ngx-toastr';
import {toastrConfig} from 'pages/oppia-root/app.module';
import {EmailDashboardAuthGuard} from './email-dashboard-auth.guard';
import {EmailDashboardPageRootComponent} from './email-dashboard-page-root.component';
import {CommonModule} from '@angular/common';

@NgModule({
  imports: [
    SharedComponentsModule,
    CommonModule,
    ToastrModule.forRoot(toastrConfig),
    RouterModule.forChild([
      {
        path: '',
        component: EmailDashboardPageRootComponent,
        canActivate: [EmailDashboardAuthGuard],
      },
    ]),
  ],
  declarations: [EmailDashboardPageRootComponent, EmailDashboardPageComponent],
  entryComponents: [EmailDashboardPageComponent],
})
export class EmailDashboardPageModule {}
