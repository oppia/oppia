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
 * @fileoverview Module for the library page.
 */

import { APP_INITIALIZER, NgModule, StaticProvider } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { downgradeComponent } from '@angular/upgrade/static';
import { HttpClientModule } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RequestInterceptor } from 'services/request-interceptor.service';
import { SharedComponentsModule } from 'components/shared-component.module';
import { OppiaAngularRootComponent } from
  'components/oppia-angular-root.component';
import { platformFeatureInitFactory, PlatformFeatureService } from
  'services/platform-feature.service';
import { LearnerPlaylistModalComponent } from 'pages/learner-dashboard-page/modal-templates/learner-playlist-modal.component';
import { SearchBarComponent } from 'pages/library-page/search-bar/search-bar.component';
import { LibraryFooterComponent } from 'pages/library-page/library-footer/library-footer.component';
import { ActivityTilesInfinityGridComponent } from 'pages/library-page/search-results/activity-tiles-infinity-grid.component';
import { SearchResultsComponent } from 'pages/library-page/search-results/search-results.component';
import { RouterModule } from '@angular/router';
import { LibraryPageComponent } from 'pages/library-page/library-page.component';
@NgModule({
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    SharedComponentsModule,
    RouterModule.forRoot([])
  ],
  declarations: [
    OppiaAngularRootComponent,
    LearnerPlaylistModalComponent,
    SearchBarComponent,
    LibraryFooterComponent,
    ActivityTilesInfinityGridComponent,
    SearchResultsComponent,
    LibraryPageComponent
  ],
  entryComponents: [
    OppiaAngularRootComponent,
    LearnerPlaylistModalComponent,
    SearchBarComponent,
    LibraryFooterComponent,
    ActivityTilesInfinityGridComponent,
    SearchResultsComponent,
    LibraryPageComponent
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
class LibraryPageModule {
  // Empty placeholder method to satisfy the `Compiler`.
  ngDoBootstrap() {}
}

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { downgradeModule } from '@angular/upgrade/static';

const bootstrapFnAsync = async(extraProviders: StaticProvider[]) => {
  const platformRef = platformBrowserDynamic(extraProviders);
  return platformRef.bootstrapModule(LibraryPageModule);
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
