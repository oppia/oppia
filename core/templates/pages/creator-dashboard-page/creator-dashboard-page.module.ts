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
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {ToastrModule} from 'ngx-toastr';
import {TranslateModule} from '@ngx-translate/core';

import {BackgroundBannerModule} from '../../components/common-layout-directives/common-elements/background-banner.module';
import {BaseModule} from '../../base-components/base.module';
import {StringUtilityPipesModule} from '../../filters/string-utility-filters/string-utility-pipes.module';
import {MaterialModule} from '../../modules/material.module';
import {NgBootstrapModule} from '../../modules/ng-boostrap.module';
import {toastrConfig} from '../../pages/oppia-root/app.module';

import {CreatorDashboardPageComponent} from './creator-dashboard-page.component';
import {CreatorDashboardPageRootComponent} from './creator-dashboard-page-root.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    BaseModule,
    BackgroundBannerModule,
    StringUtilityPipesModule,
    MaterialModule,
    NgBootstrapModule,
    ToastrModule.forRoot(toastrConfig),
    TranslateModule,
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
  ],
  entryComponents: [
    CreatorDashboardPageComponent,
    CreatorDashboardPageRootComponent,
  ],
})
export class CreatorDashboardPageModule {}
