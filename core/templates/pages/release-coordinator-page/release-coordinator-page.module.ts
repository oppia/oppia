// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the release-coordinator page.
 */

import { APP_INITIALIZER, NgModule, StaticProvider } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { downgradeComponent } from '@angular/upgrade/static';
import { HttpClientModule } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { RequestInterceptor } from 'services/request-interceptor.service';
import { SharedComponentsModule } from 'components/shared-component.module';
import { ReleaseCoordinatorNavbarComponent } from 'pages/release-coordinator-page/navbar/release-coordinator-navbar.component';
import { ReleaseCoordinatorPageComponent } from './release-coordinator-page.component';
import { OppiaAngularRootComponent } from 'components/oppia-angular-root.component';
import { JobsTabComponent } from 'pages/release-coordinator-page/jobs-tab/jobs-tab.component';
import { platformFeatureInitFactory, PlatformFeatureService } from 'services/platform-feature.service';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    SharedComponentsModule
  ],
  declarations: [
    OppiaAngularRootComponent,
    JobsTabComponent,
    ReleaseCoordinatorNavbarComponent,
    ReleaseCoordinatorPageComponent
  ],
  entryComponents: [
    OppiaAngularRootComponent,
    JobsTabComponent,
    ReleaseCoordinatorNavbarComponent,
    ReleaseCoordinatorPageComponent
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
  ]
})
class ReleaseCoordinatorPageModule {
  // Empty placeholder method to satisfy the `Compiler`.
  ngDoBootstrap() {}
}

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { downgradeModule } from '@angular/upgrade/static';

const bootstrapFnAsync = async(extraProviders: StaticProvider[]) => {
  const platformRef = platformBrowserDynamic(extraProviders);
  return platformRef.bootstrapModule(ReleaseCoordinatorPageModule);
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
