// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the classrooms page.
 */

import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';
import {ToastrModule} from 'ngx-toastr';

import {SharedComponentsModule} from 'components/shared-component.module';
import {SharedFormsModule} from 'components/forms/shared-forms.module';
import {toastrConfig} from 'pages/oppia-root/app.module';

import {ClassroomsPageAuthGuard} from './classrooms-page-auth.guard';
import {ClassroomsPageRootComponent} from './classrooms-page-root.component';
import {ClassroomsPageComponent} from './classrooms-page.component';
import {ClassroomSummaryTileComponent} from './classroom-tile/classroom-summary-tile.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    SharedComponentsModule,
    SharedFormsModule,
    ToastrModule.forRoot(toastrConfig),
    RouterModule.forChild([
      {
        path: '',
        component: ClassroomsPageRootComponent,
        canActivate: [ClassroomsPageAuthGuard],
      },
    ]),
  ],
  declarations: [
    ClassroomsPageRootComponent,
    ClassroomsPageComponent,
    ClassroomSummaryTileComponent,
  ],
  entryComponents: [
    ClassroomsPageRootComponent,
    ClassroomsPageComponent,
    ClassroomSummaryTileComponent,
  ],
})
export class ClassroomsPageModule {}
