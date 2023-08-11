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
 * @fileoverview Module for the story editor page.
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
import { platformFeatureInitFactory, PlatformFeatureService } from
  'services/platform-feature.service';
import { StoryEditorNavbarComponent } from './navbar/story-editor-navbar.component';
import { StoryEditorNavbarBreadcrumbComponent } from './navbar/story-editor-navbar-breadcrumb.component';
import { StoryEditorSaveModalComponent } from './modal-templates/story-editor-save-modal.component';
import { StoryEditorUnpublishModalComponent } from './modal-templates/story-editor-unpublish-modal.component';
import { DraftChapterConfirmationModalComponent } from './modal-templates/draft-chapter-confirmation-modal.component';
import { StoryPreviewTabComponent } from './story-preview-tab/story-preview-tab.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MyHammerConfig, toastrConfig } from 'pages/oppia-root/app.module';
import { SmartRouterModule } from 'hybrid-router-module-provider';
import { AppErrorHandlerProvider } from 'pages/oppia-root/app-error-handler';
import { StoryNodeEditorComponent } from './editor-tab/story-node-editor.component';
import { ChapterEditorTabComponent } from './chapter-editor/chapter-editor-tab.component';
import { StoryEditorComponent } from './editor-tab/story-editor.component';
import { StoryEditorPageComponent } from './story-editor-page.component';
import { DeleteChapterModalComponent } from './modal-templates/delete-chapter-modal.component';
import { NewChapterTitleModalComponent } from './modal-templates/new-chapter-title-modal.component';

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
    ToastrModule.forRoot(toastrConfig)
  ],
  declarations: [
    StoryEditorNavbarBreadcrumbComponent,
    StoryEditorSaveModalComponent,
    StoryEditorUnpublishModalComponent,
    DraftChapterConfirmationModalComponent,
    StoryEditorNavbarComponent,
    StoryNodeEditorComponent,
    StoryPreviewTabComponent,
    ChapterEditorTabComponent,
    StoryEditorComponent,
    NewChapterTitleModalComponent,
    StoryEditorPageComponent,
    DeleteChapterModalComponent
  ],
  entryComponents: [
    StoryEditorNavbarBreadcrumbComponent,
    StoryEditorSaveModalComponent,
    StoryEditorUnpublishModalComponent,
    DraftChapterConfirmationModalComponent,
    StoryEditorNavbarComponent,
    StoryNodeEditorComponent,
    StoryPreviewTabComponent,
    ChapterEditorTabComponent,
    StoryEditorComponent,
    NewChapterTitleModalComponent,
    StoryEditorPageComponent,
    DeleteChapterModalComponent
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
class StoryEditorPageModule {
  // Empty placeholder method to satisfy the `Compiler`.
  ngDoBootstrap() {}
}

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { downgradeModule } from '@angular/upgrade/static';
import { ToastrModule } from 'ngx-toastr';

const bootstrapFnAsync = async(extraProviders: StaticProvider[]) => {
  const platformRef = platformBrowserDynamic(extraProviders);
  return platformRef.bootstrapModule(StoryEditorPageModule);
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
