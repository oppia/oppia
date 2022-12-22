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

import { NgModule } from '@angular/core';
import { SharedComponentsModule } from 'components/shared-component.module';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { BlogHomePageRootComponent } from './blog-home-page-root.component';
import { BlogHomePageComponent } from './blog-home-page.component';
import { CommonModule } from '@angular/common';
import { BlogHomePageRoutingModule } from './blog-home-page-routing.module';
import { TagFilterComponent } from './tag-filter/tag-filter.component';
import { StringUtilityPipesModule } from 'filters/string-utility-filters/string-utility-pipes.module';
import { Error404PageModule } from 'pages/error-pages/error-404/error-404-page.module';
import { SharedBlogComponentsModule } from 'pages/blog-dashboard-page/shared-blog-components.module';

@NgModule({
  imports: [
    CommonModule,
    SharedComponentsModule,
    InfiniteScrollModule,
    BlogHomePageRoutingModule,
    FormsModule,
    NgbModule,
    StringUtilityPipesModule,
    TranslateModule,
    ReactiveFormsModule,
    SharedBlogComponentsModule,
    Error404PageModule
  ],
  declarations: [
    BlogHomePageComponent,
    BlogHomePageRootComponent,
    TagFilterComponent
  ],
  entryComponents: [
    BlogHomePageComponent,
    BlogHomePageRootComponent,
    TagFilterComponent
  ]
})
export class BlogHomePageModule {}
