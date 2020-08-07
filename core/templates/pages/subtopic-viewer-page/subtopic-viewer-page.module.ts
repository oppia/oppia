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

import 'core-js/es7/reflect';
import 'zone.js';

import 'third-party-imports/ng-animate.import';
import 'third-party-imports/ng-sanitize.import';
import 'third-party-imports/ng-toastr.import';
import 'third-party-imports/ng-touch.import';
import 'third-party-imports/translation-libs.import';

import 'angular-ui-sortable';
import uiValidate from 'angular-ui-validate';

angular.module('oppia', [
  'headroom', 'ngAnimate',
  require('angular-cookies'), 'ngMaterial',
  'ngSanitize', 'ngTouch', 'pascalprecht.translate',
  'toastr', 'ui.bootstrap', 'ui.sortable', uiValidate
]);

import { NgModule, StaticProvider } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { downgradeComponent } from '@angular/upgrade/static';
import { HttpClientModule } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { RequestInterceptor } from 'services/request-interceptor.service';
import { SharedComponentsModule } from 'components/shared-component.module';
import { OppiaAngularRootComponent } from
  'components/oppia-angular-root.component';
import { SubtopicViewerNavbarBreadcrumbComponent } from
  // eslint-disable-next-line max-len
  'pages/subtopic-viewer-page/navbar-breadcrumb/subtopic-viewer-navbar-breadcrumb.component';


import { SubtopicViewerDomainConstants } from
  'domain/subtopic_viewer/subtopic-viewer-domain.constants';

@NgModule({
  imports: [
    BrowserModule,
    HttpClientModule,
    SharedComponentsModule
  ],
  declarations: [
    OppiaAngularRootComponent,
    SubtopicViewerNavbarBreadcrumbComponent
  ],
  entryComponents: [
    OppiaAngularRootComponent,
    SubtopicViewerNavbarBreadcrumbComponent
  ],
  providers: [
    SubtopicViewerDomainConstants,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: RequestInterceptor,
      multi: true
    }
  ]
})
class SubtopicViewerPageModule {
  // Empty placeholder method to satisfy the `Compiler`.
  ngDoBootstrap() {}
}

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { downgradeModule } from '@angular/upgrade/static';

const bootstrapFn = (extraProviders: StaticProvider[]) => {
  const platformRef = platformBrowserDynamic(extraProviders);
  return platformRef.bootstrapModule(SubtopicViewerPageModule);
};
const downgradedModule = downgradeModule(bootstrapFn);

declare var angular: ng.IAngularStatic;

angular.module('oppia').requires.push(downgradedModule);

angular.module('oppia').directive(
  // This directive is the downgraded version of the Angular component to
  // bootstrap the Angular 8.
  'oppiaAngularRoot',
  downgradeComponent({
    component: OppiaAngularRootComponent
  }) as angular.IDirectiveFactory);
