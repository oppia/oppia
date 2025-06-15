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
 * @fileoverview Module for the review tests page.
 */

import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {InteractionExtensionsModule} from 'interactions/interactions.module';
import {SharedComponentsModule} from 'components/shared-component.module';
import {toastrConfig} from 'pages/oppia-root/app.module';
import {ReviewTestPageRootComponent} from './review-test-page-root.component';
import {ReviewTestAuthGuard} from './review-test-auth.guard';
import {ToastrModule} from 'ngx-toastr';

@NgModule({
  imports: [
    InteractionExtensionsModule,
    SharedComponentsModule,
    ToastrModule.forRoot(toastrConfig),
    RouterModule.forChild([
      {
        path: '',
        component: ReviewTestPageRootComponent,
        canActivate: [ReviewTestAuthGuard],
      },
    ]),
  ],
  declarations: [ReviewTestPageRootComponent],
})
export class ReviewTestPageModule {}
