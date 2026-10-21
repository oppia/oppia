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
 * @fileoverview Module for the profile page.
 */

import {NgModule} from '@angular/core';
import {ProfilePageNavbarComponent} from 'pages/profile-page/profile-page-navbar.component';
import {ProfilePageComponent} from './profile-page.component';
import {NgbPopoverModule} from '@ng-bootstrap/ng-bootstrap';
import {ProfilePageRootComponent} from './profile-page-root.component';
import {CommonModule} from '@angular/common';
import {ProfilePageRoutingModule} from './profile-page-routing.module';
import {Error404PageModule} from 'pages/error-pages/error-404/error-404-page.module';
import {RouterModule} from '@angular/router';

import {BackgroundBannerModule} from 'components/common-layout-directives/common-elements/background-banner.module';
import {BaseModule} from 'base-components/base.module';
import {ExplorationSummaryTileModule} from 'components/shared_parts/exploration-summary-tile.module';
import {MaterialModule} from 'modules/material.module';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {StringUtilityPipesModule} from 'filters/string-utility-filters/string-utility-pipes.module';
import {TranslateModule} from '@ngx-translate/core';
@NgModule({
  imports: [
    TranslateModule,
    StringUtilityPipesModule,
    NgbModule,
    MaterialModule,
    ExplorationSummaryTileModule,
    BaseModule,
    BackgroundBannerModule,
    CommonModule,
    NgbPopoverModule,
    RouterModule,
    ProfilePageRoutingModule,
    Error404PageModule,
  ],
  declarations: [
    ProfilePageNavbarComponent,
    ProfilePageComponent,
    ProfilePageRootComponent,
  ],
  entryComponents: [
    ProfilePageNavbarComponent,
    ProfilePageComponent,
    ProfilePageRootComponent,
  ],
})
export class ProfilePageModule {}
