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

import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { RequestInterceptor } from 'services/request-interceptor.service';
import { SharedComponentsModule } from 'components/shared-component.module';
import { OppiaAngularRootComponent } from
  'components/oppia-angular-root.component';
import { platformFeatureInitFactory, PlatformFeatureService } from
  'services/platform-feature.service';
import { StoryViewerNavbarBreadcrumbComponent } from './navbar-breadcrumb/story-viewer-navbar-breadcrumb.component';
import { StoryViewerNavbarPreLogoActionComponent } from './navbar-pre-logo-action/story-viewer-navbar-pre-logo-action.component';
import { StoryViewerPageComponent } from './story-viewer-page.component';
import { StoryViewerPageRootComponent } from './story-viewer-page-root.component';

@NgModule({
  imports: [
    BrowserModule,
    HttpClientModule,
    SharedComponentsModule
  ],
  declarations: [
    OppiaAngularRootComponent,
    StoryViewerNavbarBreadcrumbComponent,
    StoryViewerNavbarPreLogoActionComponent,
    StoryViewerPageComponent,
    StoryViewerPageRootComponent
  ],
  entryComponents: [
    OppiaAngularRootComponent,
    StoryViewerNavbarBreadcrumbComponent,
    StoryViewerNavbarPreLogoActionComponent,
    StoryViewerPageComponent,
    StoryViewerPageRootComponent
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: RequestInterceptor,
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: platformFeatureInitFactory,
      deps: [PlatformFeatureService],
      multi: true
    }
  ],
  bootstrap: [StoryViewerPageRootComponent]
})
export class StoryViewerPageModule {}
