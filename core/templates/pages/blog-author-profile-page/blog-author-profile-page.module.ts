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
 * @fileoverview Module for the blog home page.
 */

import {NgModule} from '@angular/core';
import {InfiniteScrollModule} from 'ngx-infinite-scroll';
import {FormsModule} from '@angular/forms';
import {ReactiveFormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';
import {NgbPaginationModule} from '@ng-bootstrap/ng-bootstrap';

import {BlogAuthorProfilePageRootComponent} from './blog-author-profile-page-root.component';
import {BlogAuthorProfilePageComponent} from './blog-author-profile-page.component';
import {CommonModule} from '@angular/common';
import {MatMenuModule} from '@angular/material/menu';
import {BlogAuthorProfilePageRoutingModule} from './blog-author-profile-page-routing.module';
import {StringUtilityPipesModule} from 'filters/string-utility-filters/string-utility-pipes.module';
import {Error404PageModule} from 'pages/error-pages/error-404/error-404-page.module';
import {BlogDisplayComponentsModule} from 'pages/blog-dashboard-page/blog-display-components.module';

import {BaseModule} from 'base-components/base.module';
import {MatCardModule} from '@angular/material/card';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
@NgModule({
  imports: [
    MatCardModule,
    MatProgressSpinnerModule,
    BaseModule,
    CommonModule,
    InfiniteScrollModule,
    BlogAuthorProfilePageRoutingModule,
    FormsModule,
    NgbPaginationModule,
    MatMenuModule,
    StringUtilityPipesModule,
    TranslateModule,
    ReactiveFormsModule,
    Error404PageModule,
    BlogDisplayComponentsModule,
  ],
  declarations: [
    BlogAuthorProfilePageComponent,
    BlogAuthorProfilePageRootComponent,
  ],
  entryComponents: [
    BlogAuthorProfilePageComponent,
    BlogAuthorProfilePageRootComponent,
  ],
})
export class BlogAuthorProfilePageModule {}
