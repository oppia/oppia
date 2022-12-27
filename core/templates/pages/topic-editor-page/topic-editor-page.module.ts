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
import { RouterModule } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';
import { SubtopicPreviewTab } from './subtopic-editor/subtopic-preview-tab.component';
import { ChangeSubtopicAssignmentModalComponent } from './modal-templates/change-subtopic-assignment-modal.component';
import { TopicPreviewTabComponent } from './preview-tab/topic-preview-tab.component';
import { TopicEditorNavbarBreadcrumbComponent } from './navbar/topic-editor-navbar-breadcrumb.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MyHammerConfig, toastrConfig } from 'pages/oppia-root/app.module';
import { CreateNewSubtopicModalComponent } from 'pages/topic-editor-page/modal-templates/create-new-subtopic-modal.component';
import { DeleteStoryModalComponent } from './modal-templates/delete-story-modal.component';
import { TopicEditorSendMailComponent } from './modal-templates/topic-editor-send-mail-modal.component';
import { TopicEditorSaveModalComponent } from './modal-templates/topic-editor-save-modal.component';
import { SmartRouterModule } from 'hybrid-router-module-provider';
import { AppErrorHandlerProvider } from 'pages/oppia-root/app-error-handler';
import { TopicEditorNavbarComponent } from './navbar/topic-editor-navbar.component';
import { TopicQuestionsTabComponent } from './questions-tab/topic-questions-tab.component';
import { RearrangeSkillsInSubtopicsModalComponent } from './modal-templates/rearrange-skills-in-subtopics-modal.component';
import { CreateNewStoryModalComponent } from './modal-templates/create-new-story-modal.component';
import { TopicEditorStoriesListComponent } from './editor-tab/topic-editor-stories-list.component';
import { TopicEditorTabComponent } from './editor-tab/topic-editor-tab.directive';
import { TopicEditorPageComponent } from './topic-editor-page.component';
import { SubtopicEditorTabComponent } from './subtopic-editor/subtopic-editor-tab.component';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    // TODO(#13443): Remove smart router module provider once all pages are
    // migrated to angular router.
    SmartRouterModule,
    RouterModule.forRoot([]),
    InteractionExtensionsModule,
    SharedComponentsModule,
    TopicPlayerViewerCommonModule,
    ToastrModule.forRoot(toastrConfig)
  ],
  declarations: [
    ChangeSubtopicAssignmentModalComponent,
    RearrangeSkillsInSubtopicsModalComponent,
    SubtopicPreviewTab,
    TopicPreviewTabComponent,
    TopicEditorNavbarBreadcrumbComponent,
    CreateNewSubtopicModalComponent,
    CreateNewStoryModalComponent,
    DeleteStoryModalComponent,
    TopicEditorSendMailComponent,
    TopicEditorSaveModalComponent,
    TopicEditorNavbarComponent,
    TopicQuestionsTabComponent,
    TopicEditorStoriesListComponent,
    TopicEditorTabComponent,
    TopicEditorPageComponent,
    SubtopicEditorTabComponent
  ],
  entryComponents: [
    ChangeSubtopicAssignmentModalComponent,
    RearrangeSkillsInSubtopicsModalComponent,
    SubtopicPreviewTab,
    TopicPreviewTabComponent,
    TopicEditorNavbarBreadcrumbComponent,
    CreateNewSubtopicModalComponent,
    CreateNewStoryModalComponent,
    DeleteStoryModalComponent,
    TopicEditorSendMailComponent,
    TopicEditorSaveModalComponent,
    TopicEditorNavbarComponent,
    TopicQuestionsTabComponent,
    TopicEditorStoriesListComponent,
    TopicEditorTabComponent,
    TopicEditorPageComponent,
    SubtopicEditorTabComponent
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
class TopicEditorPageModule {
  // Empty placeholder method to satisfy the `Compiler`.
  ngDoBootstrap() {}
}

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { downgradeModule } from '@angular/upgrade/static';
import { ToastrModule } from 'ngx-toastr';
import { TopicPlayerViewerCommonModule } from 'pages/topic-viewer-page/topic-viewer-player-common.module';

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
