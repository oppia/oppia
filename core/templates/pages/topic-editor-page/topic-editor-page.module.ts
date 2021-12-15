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

import { APP_INITIALIZER, NgModule, StaticProvider } from '@angular/core';
import { BrowserModule, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { downgradeComponent } from '@angular/upgrade/static';
import { HttpClientModule } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { InteractionExtensionsModule } from 'interactions/interactions.module';
import { RequestInterceptor } from 'services/request-interceptor.service';
import { SharedComponentsModule } from 'components/shared-component.module';
import { OppiaAngularRootComponent } from
  'components/oppia-angular-root.component';
import { platformFeatureInitFactory, PlatformFeatureService } from
  'services/platform-feature.service';

import { StoriesListComponent } from
  'pages/topic-viewer-page/stories-list/topic-viewer-stories-list.component';
import { SubtopicsListComponent } from
  'pages/topic-viewer-page/subtopics-list/subtopics-list.component';
import { SubtopicPreviewTab } from './subtopic-editor/subtopic-preview-tab.component';
import { TopicPreviewTabComponent } from './preview-tab/topic-preview-tab.component';
import { TopicEditorNavbarBreadcrumbComponent } from './navbar/topic-editor-navbar-breadcrumb.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MyHammerConfig, toastrConfig } from 'pages/oppia-root/app.module';
import { CreateNewSubtopicModalComponent } from 'pages/topic-editor-page/modal-templates/create-new-subtopic-modal.component';
import { TopicEditorSaveModalComponent } from './modal-templates/topic-editor-save-modal.component';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    InteractionExtensionsModule,
    SharedComponentsModule,
    ToastrModule.forRoot(toastrConfig)
  ],
  declarations: [
    StoriesListComponent,
    SubtopicsListComponent,
    SubtopicPreviewTab,
    TopicPreviewTabComponent,
    TopicEditorNavbarBreadcrumbComponent,
    CreateNewSubtopicModalComponent,
    TopicEditorSaveModalComponent
  ],
  entryComponents: [
    StoriesListComponent,
    SubtopicsListComponent,
    SubtopicPreviewTab,
    TopicPreviewTabComponent,
    TopicEditorNavbarBreadcrumbComponent,
    CreateNewSubtopicModalComponent,
    TopicEditorSaveModalComponent
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
    }
  ]
})
class TopicEditorPageModule {
  // Empty placeholder method to satisfy the `Compiler`.
  ngDoBootstrap() {}
}

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { downgradeModule } from '@angular/upgrade/static';
import { ToastrModule } from 'ngx-toastr';

const bootstrapFnAsync = async(extraProviders: StaticProvider[]) => {
  const platformRef = platformBrowserDynamic(extraProviders);
  return platformRef.bootstrapModule(TopicEditorPageModule);
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
