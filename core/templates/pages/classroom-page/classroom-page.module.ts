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
 * @fileoverview Module for the classroom page.
 */

import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';

import {BackgroundBannerModule} from 'components/common-layout-directives/common-elements/background-banner.module';
import {BaseModule} from 'base-components/base.module';
import {ClassroomPageComponent} from './classroom-page.component';
import {ClassroomPageRootComponent} from './classroom-page-root.component';
import {ClassroomPageRoutingModule} from './classroom-page-routing.module';
import {RichTextComponentsModule} from 'rich_text_components/rich-text-components.module';
import {SearchBarModule} from 'pages/library-page/search-bar/search-bar.module';
import {StringUtilityPipesModule} from 'filters/string-utility-filters/string-utility-pipes.module';
import {SummaryTilesModule} from 'components/summary-tile/summary-tile.module';
import {Error404PageModule} from 'pages/error-pages/error-404/error-404-page.module';

@NgModule({
  imports: [
    BackgroundBannerModule,
    BaseModule,
    CommonModule,
    ClassroomPageRoutingModule,
    FormsModule,
    RichTextComponentsModule,
    SearchBarModule,
    StringUtilityPipesModule,
    SummaryTilesModule,
    TranslateModule,
    Error404PageModule,
  ],
  declarations: [ClassroomPageComponent, ClassroomPageRootComponent],
  entryComponents: [ClassroomPageComponent, ClassroomPageRootComponent],
})
export class ClassroomPageModule {}
