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
 * @fileoverview Module for the topic viewer page.
 */

import { APP_INITIALIZER, NgModule, StaticProvider } from '@angular/core';
import { BrowserModule, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { downgradeComponent } from '@angular/upgrade/static';
import { HttpClientModule } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { platformFeatureInitFactory, PlatformFeatureService } from
  'services/platform-feature.service';
import { RouterModule } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';

import { OppiaAngularRootComponent } from
  'components/oppia-angular-root.component';
import { SharedComponentsModule } from 'components/shared-component.module';
import { TopicViewerNavbarBreadcrumbComponent } from
  // eslint-disable-next-line max-len
  'pages/topic-viewer-page/navbar-breadcrumb/topic-viewer-navbar-breadcrumb.component';
import { RequestInterceptor } from 'services/request-interceptor.service';
import { TopicViewerPageComponent } from
  'pages/topic-viewer-page/topic-viewer-page.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MyHammerConfig, toastrConfig } from 'pages/oppia-root/app.module';
import { PracticeSessionConfirmationModal } from './modals/practice-session-confirmation-modal.component';
import {SmartRouterModule} from 'hybrid-router-module-provider';
import { AppErrorHandlerProvider } from 'pages/oppia-root/app-error-handler';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    // TODO(#13443): Remove smart router module provider once all pages are
    // migrated to angular router.
    SmartRouterModule,
    RouterModule.forRoot([]),
    SharedComponentsModule,
    TopicPlayerViewerCommonModule,
    ToastrModule.forRoot(toastrConfig)
  ],
  declarations: [
    TopicViewerNavbarBreadcrumbComponent,
    TopicViewerPageComponent,
    PracticeSessionConfirmationModal
  ],
  entryComponents: [
    TopicViewerNavbarBreadcrumbComponent,
    TopicViewerPageComponent,
    PracticeSessionConfirmationModal
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
    },
    {
      provide: HAMMER_GESTURE_CONFIG,
      useClass: MyHammerConfig
    },
    AppErrorHandlerProvider,
    {
      provide: APP_BASE_HREF,
      useValue: '/'
    }
  ]
})
class TopicViewerPageModule {
  // Empty placeholder method to satisfy the `Compiler`.
  ngDoBootstrap() {}
}

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { downgradeModule } from '@angular/upgrade/static';
import { ToastrModule } from 'ngx-toastr';
import { TopicPlayerViewerCommonModule } from './topic-viewer-player-common.module';

const bootstrapFnAsync = async(extraProviders: StaticProvider[]) => {
  const platformRef = platformBrowserDynamic(extraProviders);
  return platformRef.bootstrapModule(TopicViewerPageModule);
};
const downgradedModule = downgradeModule(bootstrapFnAsync);

declare var angular: ng.IAngularStatic;

angular.module('oppia').requires.push(downgradedModule);

angular.module('oppia').directive(
  // This directive is the downgraded version of the Angular component to
  // bootstrap the Angular 8.
  'oppiaAngularRoot',
  downgradeComponent({
    component: OppiaAngularRootComponent
  }) as angular.IDirectiveFactory);
