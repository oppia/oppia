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
 * @fileoverview Module for the learner dashboard page.
 */

import { APP_INITIALIZER, NgModule, StaticProvider } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { downgradeComponent } from '@angular/upgrade/static';
import { HttpClientModule } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { RequestInterceptor } from 'services/request-interceptor.service';
import { SharedComponentsModule } from 'components/shared-component.module';

import { LearnerStorySummaryTileComponent } from 'components/summary-tile/learner-story-summary-tile.component';
import { ProgressTabComponent } from './new-learner-dashboard/progress-tab.component';
import { GoalsTabComponent } from './new-learner-dashboard-page/goals-tab.component';
import { CommunityLessonsTabComponent } from './new-learner-dashboard/community-lessons-tab.component';
import { LearnerTopicSummaryTileComponent } from 'components/summary-tile/learner-topic-summary-tile.component';
import { HomeTabComponent } from './new-learner-dashboard-page/home-tab.component';
import { LearnerDashboardPageComponent } from './learner-dashboard-page.component';
import { OppiaAngularRootComponent } from 'components/oppia-angular-root.component';
import { platformFeatureInitFactory, PlatformFeatureService } from 'services/platform-feature.service';
import { RemoveActivityModalComponent } from 'pages/learner-dashboard-page/modal-templates/remove-activity-modal.component';
import { LearnerDashboardSuggestionModalComponent } from './suggestion-modal/learner-dashboard-suggestion-modal.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HybridRouterModuleProvider } from 'hybrid-router-module-provider';

// Config for ToastrModule (helps in flashing messages and alerts).
const toastrConfig = {
  allowHtml: false,
  iconClasses: {
    error: 'toast-error',
    info: 'toast-info',
    success: 'toast-success',
    warning: 'toast-warning'
  },
  positionClass: 'toast-bottom-right',
  messageClass: 'toast-message',
  progressBar: false,
  tapToDismiss: true,
  titleClass: 'toast-title'
};

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    // TODO(#13443): Remove hybrid router module provider once all pages are
    // migrated to angular router.
    HybridRouterModuleProvider.provide(),
    SharedComponentsModule,
    ToastrModule.forRoot(toastrConfig)
  ],
  declarations: [
    LearnerDashboardPageComponent,
    LearnerStorySummaryTileComponent,
    ProgressTabComponent,
    GoalsTabComponent,
    HomeTabComponent,
    LearnerTopicSummaryTileComponent,
    CommunityLessonsTabComponent,
    RemoveActivityModalComponent,
    LearnerDashboardSuggestionModalComponent
  ],
  entryComponents: [
    LearnerDashboardPageComponent,
    LearnerStorySummaryTileComponent,
    ProgressTabComponent,
    GoalsTabComponent,
    HomeTabComponent,
    LearnerTopicSummaryTileComponent,
    CommunityLessonsTabComponent,
    RemoveActivityModalComponent,
    LearnerDashboardSuggestionModalComponent
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
class LearnerDashboardPageModule {
  // Empty placeholder method to satisfy the `Compiler`.
  ngDoBootstrap() {}
}

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { downgradeModule } from '@angular/upgrade/static';
import { ToastrModule } from 'ngx-toastr';

const bootstrapFnAsync = async(extraProviders: StaticProvider[]) => {
  const platformRef = platformBrowserDynamic(extraProviders);
  return platformRef.bootstrapModule(LearnerDashboardPageModule);
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
