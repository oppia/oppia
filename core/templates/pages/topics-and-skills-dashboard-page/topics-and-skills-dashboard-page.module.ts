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
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { SharedComponentsModule } from 'components/shared-component.module';
import { OppiaAngularRootComponent } from
  'components/oppia-angular-root.component';
import { platformFeatureInitFactory, PlatformFeatureService } from
  'services/platform-feature.service';
import { RouterModule } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';

import { RequestInterceptor } from 'services/request-interceptor.service';
import { SkillCreationService } from 'components/entity-creation-services/skill-creation.service';
import { SelectTopicsComponent } from './topic-selector/select-topics.component';
import { SkillsListComponent } from './skills-list/skills-list.component';
import { DeleteSkillModalComponent } from './modals/delete-skill-modal.component';
import { UnassignSkillFromTopicsModalComponent } from './modals/unassign-skill-from-topics-modal.component';
import { TopicsListComponent } from './topics-list/topics-list.component';
import { DeleteTopicModalComponent } from './modals/delete-topic-modal.component';
import { AssignSkillToTopicModalComponent } from './modals/assign-skill-to-topic-modal.component';
import { MergeSkillModalComponent } from 'components/skill-selector/merge-skill-modal.component';
import { DynamicContentModule } from 'components/interaction-display/dynamic-content.module';
import { TopicsAndSkillsDashboardPageComponent } from './topics-and-skills-dashboard-page.component';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SmartRouterModule } from 'hybrid-router-module-provider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CreateNewTopicModalComponent } from './modals/create-new-topic-modal.component';
import { ToastrModule } from 'ngx-toastr';
import { MyHammerConfig, toastrConfig } from 'pages/oppia-root/app.module';
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
    DynamicContentModule,
    FormsModule,
    MatProgressSpinnerModule,
    ToastrModule.forRoot(toastrConfig)
  ],
  declarations: [
    SkillsListComponent,
    DeleteSkillModalComponent,
    UnassignSkillFromTopicsModalComponent,
    SelectTopicsComponent,
    AssignSkillToTopicModalComponent,
    MergeSkillModalComponent,
    TopicsListComponent,
    DeleteTopicModalComponent,
    SelectTopicsComponent,
    TopicsAndSkillsDashboardPageComponent,
    CreateNewTopicModalComponent,
    DeleteTopicModalComponent
  ],
  entryComponents: [
    SkillsListComponent,
    DeleteSkillModalComponent,
    UnassignSkillFromTopicsModalComponent,
    SelectTopicsComponent,
    AssignSkillToTopicModalComponent,
    MergeSkillModalComponent,
    TopicsListComponent,
    DeleteTopicModalComponent,
    SelectTopicsComponent,
    TopicsAndSkillsDashboardPageComponent,
    CreateNewTopicModalComponent
  ],
  providers: [
    SkillCreationService,
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
class TopicsAndSkillsDashboardPageModule {
  // Empty placeholder method to satisfy the `Compiler`.
  ngDoBootstrap() {}
}

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { downgradeModule } from '@angular/upgrade/static';

const bootstrapFnAsync = async(extraProviders: StaticProvider[]) => {
  const platformRef = platformBrowserDynamic(extraProviders);
  return platformRef.bootstrapModule(TopicsAndSkillsDashboardPageModule);
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
