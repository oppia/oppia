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
 * @fileoverview Module for the story viewer page.
 */

import {NgModule} from '@angular/core';
import {StoryViewerNavbarBreadcrumbComponent} from './navbar-breadcrumb/story-viewer-navbar-breadcrumb.component';
import {StoryViewerNavbarPreLogoActionComponent} from './navbar-pre-logo-action/story-viewer-navbar-pre-logo-action.component';
import {StoryViewerPageComponent} from './story-viewer-page.component';
import {StoryViewerPageRootComponent} from './story-viewer-page-root.component';
import {CommonModule} from '@angular/common';
import {StoryViewerPageRoutingModule} from './story-viewer-page-routing.module';

import {AttributionGuideModule} from 'components/shared_parts/attribution-guide.module';
import {BackgroundBannerModule} from 'components/common-layout-directives/common-elements/background-banner.module';
import {BaseModule} from 'base-components/base.module';
import {MaterialModule} from 'modules/material.module';
import {TranslateModule} from '@ngx-translate/core';
@NgModule({
  imports: [
    TranslateModule,
    MaterialModule,
    BaseModule,
    BackgroundBannerModule,
    AttributionGuideModule,
    CommonModule,
    StoryViewerPageRoutingModule,
  ],
  declarations: [
    StoryViewerNavbarBreadcrumbComponent,
    StoryViewerNavbarPreLogoActionComponent,
    StoryViewerPageComponent,
    StoryViewerPageRootComponent,
  ],
  entryComponents: [
    StoryViewerNavbarBreadcrumbComponent,
    StoryViewerNavbarPreLogoActionComponent,
    StoryViewerPageComponent,
    StoryViewerPageRootComponent,
  ],
})
export class StoryViewerPageModule {}
