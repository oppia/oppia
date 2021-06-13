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
 * @fileoverview Module for the admin page.
 */

import { APP_INITIALIZER, NgModule, StaticProvider } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { downgradeComponent } from '@angular/upgrade/static';
import { HttpClientModule } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { RequestInterceptor } from 'services/request-interceptor.service';
import { SharedComponentsModule } from 'components/shared-component.module';
import { AdminFeaturesTabComponent } from
  'pages/admin-page/features-tab/admin-features-tab.component';
import { AdminNavbarComponent } from './navbar/admin-navbar.component';
import { AdminDevModeActivitiesTabComponent } from './activities-tab/admin-dev-mode-activities-tab.component';
import { OppiaAngularRootComponent } from
  'components/oppia-angular-root.component';
import { OppiaAdminProdModeActivitiesTabComponent } from
  './activities-tab/admin-prod-mode-activities-tab.component';
import { platformFeatureInitFactory, PlatformFeatureService } from
  'services/platform-feature.service';
import { RolesAndActionsVisualizerComponent } from './roles-tab/roles-and-actions-visualizer.component';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    SharedComponentsModule
  ],
  declarations: [
    OppiaAdminProdModeActivitiesTabComponent,
    OppiaAngularRootComponent,
    AdminFeaturesTabComponent,
    AdminNavbarComponent,
    AdminDevModeActivitiesTabComponent,
    RolesAndActionsVisualizerComponent
  ],
  entryComponents: [
    OppiaAdminProdModeActivitiesTabComponent,
    OppiaAngularRootComponent,
    AdminFeaturesTabComponent,
    AdminNavbarComponent,
    AdminDevModeActivitiesTabComponent,
    RolesAndActionsVisualizerComponent
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
class AdminPageModule {
  // Empty placeholder method to satisfy the `Compiler`.
  ngDoBootstrap() {}
}

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { downgradeModule } from '@angular/upgrade/static';

const bootstrapFnAsync = async(extraProviders: StaticProvider[]) => {
  const platformRef = platformBrowserDynamic(extraProviders);
  return platformRef.bootstrapModule(AdminPageModule);
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
