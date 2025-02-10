// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the create learner group page.
 */

import {NgModule} from '@angular/core';
import {ToastrModule} from 'ngx-toastr';
import {toastrConfig} from 'pages/oppia-root/app.module';
import {SharedComponentsModule} from 'components/shared-component.module';
import {RouterModule} from '@angular/router';

import {CreateLearnerGroupPageComponent} from './create-learner-group-page.component';
import {CreateLearnerGroupPageRootComponent} from './create-learner-group-page-root.component';
import {CreateLearnerGroupPageAuthGuard} from './create-learner-group-page-auth.guard';
import {SharedLearnerGroupComponentsModule} from 'pages/learner-group-pages/shared-learner-group-component.module';

@NgModule({
  imports: [
    SharedComponentsModule,
    ToastrModule.forRoot(toastrConfig),
    SharedLearnerGroupComponentsModule,
    RouterModule.forChild([
      {
        path: '',
        component: CreateLearnerGroupPageRootComponent,
        canActivate: [CreateLearnerGroupPageAuthGuard],
      },
    ]),
  ],
  declarations: [
    CreateLearnerGroupPageRootComponent,
    CreateLearnerGroupPageComponent,
  ],
  entryComponents: [CreateLearnerGroupPageComponent],
})
export class CreateLearnerGroupPageModule {}
