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
 * @fileoverview Module for the collection editor page.
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

import { AppConstants } from 'app.constants';
import { CollectionDomainConstants } from
  'domain/collection/collection-domain.constants';
import { CollectionEditorPageConstants } from
  'pages/collection-editor-page/collection-editor-page.constants';
import { EditorDomainConstants } from
  'domain/editor/editor-domain.constants';
import { InteractionsExtensionsConstants } from
  'interactions/interactions-extension.constants';
import { ObjectsDomainConstants } from
  'domain/objects/objects-domain.constants';
import { ServicesConstants } from 'services/services.constants';

import { CollectionHistoryTabComponent } from
  'pages/collection-editor-page/history-tab/collection-history-tab.component';
import { CollectionDetailsEditor } from
  // eslint-disable-next-line max-len
  'pages/collection-editor-page/settings-tab/collection-details-editor.directive';
import { CollectionPermissionsCard } from
  // eslint-disable-next-line max-len
  'pages/collection-editor-page/settings-tab/collection-permissions-card.directive';
import { CollectionSettingsTabComponent } from
  'pages/collection-editor-page/settings-tab/collection-settings-tab.component';
import { CollectionStatisticsTabComponent } from
  // eslint-disable-next-line max-len
  'pages/collection-editor-page/statistics-tab/collection-statistics-tab.component';

@NgModule({
  imports: [
    BrowserModule,
    HttpClientModule,
    SharedComponentsModule
  ],
  declarations: [
    OppiaAngularRootComponent,
    CollectionHistoryTabComponent,
    CollectionSettingsTabComponent,
    CollectionStatisticsTabComponent,
    CollectionDetailsEditor,
    CollectionPermissionsCard
  ],
  entryComponents: [
    OppiaAngularRootComponent,
    CollectionHistoryTabComponent,
    CollectionSettingsTabComponent,
    CollectionStatisticsTabComponent,
  ],
  providers: [
    AppConstants,
    CollectionDomainConstants,
    EditorDomainConstants,
    InteractionsExtensionsConstants,
    ObjectsDomainConstants,
    ServicesConstants,
    CollectionEditorPageConstants,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: RequestInterceptor,
      multi: true
    }
  ]
})
class CollectionEditorPageModule {
  // Empty placeholder method to satisfy the `Compiler`.
  ngDoBootstrap() {}
}

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { downgradeModule } from '@angular/upgrade/static';

const bootstrapFn = (extraProviders: StaticProvider[]) => {
  const platformRef = platformBrowserDynamic(extraProviders);
  return platformRef.bootstrapModule(CollectionEditorPageModule);
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
