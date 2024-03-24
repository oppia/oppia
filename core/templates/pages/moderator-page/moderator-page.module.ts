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
 * @fileoverview Module for the moderator page.
 */

import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';
import {ToastrModule} from 'ngx-toastr';
import {SharedComponentsModule} from 'components/shared-component.module';
import {NgbNavModule} from '@ng-bootstrap/ng-bootstrap';
import {ModeratorPageComponent} from './moderator-page.component';
import {toastrConfig} from 'pages/oppia-root/app.module';
import {ModeratorPageRootComponent} from './moderator-page-root.component';
import {ModeratorAuthGuard} from './moderator-auth.guard';

@NgModule({
  imports: [
    CommonModule,
    SharedComponentsModule,
    NgbNavModule,
    ToastrModule.forRoot(toastrConfig),
    RouterModule.forChild([
      {
        path: '',
        component: ModeratorPageRootComponent,
        canActivate: [ModeratorAuthGuard],
      },
    ]),
  ],
  declarations: [ModeratorPageComponent, ModeratorPageRootComponent],
  entryComponents: [ModeratorPageComponent],
})
export class ModeratorPageModule {}
