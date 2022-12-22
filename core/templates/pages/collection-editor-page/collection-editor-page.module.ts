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

import { APP_INITIALIZER, NgModule, StaticProvider } from '@angular/core';
import { BrowserModule, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { downgradeComponent } from '@angular/upgrade/static';
import { HttpClientModule } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';
import { RequestInterceptor } from 'services/request-interceptor.service';
import { SharedComponentsModule } from 'components/shared-component.module';
import { OppiaAngularRootComponent } from
  'components/oppia-angular-root.component';

import { CollectionHistoryTabComponent } from
  'pages/collection-editor-page/history-tab/collection-history-tab.component';
import { CollectionNodeEditorComponent } from './editor-tab/collection-node-editor.component';
import { CollectionSettingsTabComponent } from 'pages/collection-editor-page/settings-tab/collection-settings-tab.component';
import { CollectionStatisticsTabComponent } from 'pages/collection-editor-page/statistics-tab/collection-statistics-tab.component';
import { platformFeatureInitFactory, PlatformFeatureService } from 'services/platform-feature.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CollectionDetailsEditorComponent } from './settings-tab/collection-details-editor.component';
import { CollectionPermissionsCardComponent } from './settings-tab/collection-permissions-card.component';
import { CollectionEditorNavbarBreadcrumbComponent } from './navbar/collection-editor-navbar-breadcrumb.component';
import { CollectionEditorNavbarComponent } from './navbar/collection-editor-navbar.component';
import { CollectionNodeCreatorComponent } from './editor-tab/collection-node-creator.component';
import { CollectionEditorTabComponent } from './editor-tab/collection-editor-tab.component';
import { CollectionEditorSaveModalComponent } from './modals/collection-editor-save-modal.component';
import { CollectionEditorPrePublishModalComponent } from './modals/collection-editor-pre-publish-modal.component';
import { ToastrModule } from 'ngx-toastr';
import { MyHammerConfig, toastrConfig } from 'pages/oppia-root/app.module';
import { CollectionEditorPageComponent } from './collection-editor-page.component';
import { SmartRouterModule } from 'hybrid-router-module-provider';
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
    FormsModule,
    ToastrModule.forRoot(toastrConfig)
  ],
  declarations: [
    CollectionNodeCreatorComponent,
    CollectionEditorNavbarBreadcrumbComponent,
    CollectionEditorNavbarComponent,
    CollectionEditorPageComponent,
    CollectionEditorPrePublishModalComponent,
    CollectionEditorSaveModalComponent,
    CollectionEditorTabComponent,
    CollectionDetailsEditorComponent,
    CollectionHistoryTabComponent,
    CollectionNodeEditorComponent,
    CollectionPermissionsCardComponent,
    CollectionSettingsTabComponent,
    CollectionStatisticsTabComponent
  ],
  entryComponents: [
    CollectionNodeCreatorComponent,
    CollectionEditorNavbarBreadcrumbComponent,
    CollectionEditorNavbarComponent,
    CollectionEditorPageComponent,
    CollectionEditorPrePublishModalComponent,
    CollectionEditorSaveModalComponent,
    CollectionEditorTabComponent,
    CollectionDetailsEditorComponent,
    CollectionHistoryTabComponent,
    CollectionNodeEditorComponent,
    CollectionSettingsTabComponent,
    CollectionStatisticsTabComponent,
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
class CollectionEditorPageModule {
  // Empty placeholder method to satisfy the `Compiler`.
  ngDoBootstrap() {}
}

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { downgradeModule } from '@angular/upgrade/static';
import { FormsModule } from '@angular/forms';

const bootstrapFnAsync = async(extraProviders: StaticProvider[]) => {
  const platformRef = platformBrowserDynamic(extraProviders);
  return platformRef.bootstrapModule(CollectionEditorPageModule);
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
