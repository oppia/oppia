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
 * @fileoverview Module for the maintenance page.
 */

import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';

import {SharedComponentsModule} from 'components/shared-component.module';
import {MaintenancePageComponent} from 'pages/maintenance-page/maintenance-page.component';
import {ToastrModule} from 'ngx-toastr';
import {toastrConfig} from 'pages/oppia-root/app.module';
import {MaintenancePageRootComponent} from './maintenance-page-root.component';
import {CommonModule} from '@angular/common';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    RouterModule.forRoot([]),
    SharedComponentsModule,
    ToastrModule.forRoot(toastrConfig),
    RouterModule.forChild([
      {
        path: '',
        component: MaintenancePageRootComponent,
      },
    ]),
  ],
  declarations: [MaintenancePageComponent, MaintenancePageRootComponent],
  entryComponents: [MaintenancePageComponent],
  bootstrap: [MaintenancePageComponent],
})
export class MaintenancePageModule {}
