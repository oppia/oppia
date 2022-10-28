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
import { BrowserModule, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { downgradeComponent } from '@angular/upgrade/static';
import { HttpClientModule } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { RequestInterceptor } from 'services/request-interceptor.service';
import { SharedComponentsModule } from 'components/shared-component.module';
import { RouterModule } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';

import { LearnerStorySummaryTileComponent } from 'components/summary-tile/learner-story-summary-tile.component';
import { LearnerTopicGoalsSummaryTileComponent } from 'components/summary-tile/learner-topic-goals-summary-tile.component';
import { ProgressTabComponent } from './progress-tab.component';
import { GoalsTabComponent } from './goals-tab.component';
import { CommunityLessonsTabComponent } from './community-lessons-tab.component';
import { LearnerTopicSummaryTileComponent } from 'components/summary-tile/learner-topic-summary-tile.component';
import { HomeTabComponent } from './home-tab.component';
import { LearnerGroupsTabComponent } from './learner-groups-tab.component';
import { LearnerDashboardPageComponent } from './learner-dashboard-page.component';
import { OppiaAngularRootComponent } from 'components/oppia-angular-root.component';
import { platformFeatureInitFactory, PlatformFeatureService } from 'services/platform-feature.service';
import { RemoveActivityModalComponent } from 'pages/learner-dashboard-page/modal-templates/remove-activity-modal.component';
import { DeclineInvitationModalComponent } from './modal-templates/decline-invitaiton-modal.component';
import { ViewLearnerGroupInvitationModalComponent } from './modal-templates/view-learner-group-invitation-modal.component';
import { LearnerDashboardSuggestionModalComponent } from './suggestion-modal/learner-dashboard-suggestion-modal.component';
import { ViewLearnerGroupDetailsModalComponent } from './modal-templates/view-learner-group-details-modal.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MyHammerConfig, toastrConfig } from 'pages/oppia-root/app.module';

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
    LearnerDashboardPageComponent,
    LearnerStorySummaryTileComponent,
    LearnerTopicGoalsSummaryTileComponent,
    ProgressTabComponent,
    GoalsTabComponent,
    HomeTabComponent,
    LearnerGroupsTabComponent,
    LearnerTopicSummaryTileComponent,
    CommunityLessonsTabComponent,
    RemoveActivityModalComponent,
    LearnerDashboardSuggestionModalComponent,
    DeclineInvitationModalComponent,
    ViewLearnerGroupInvitationModalComponent,
    ViewLearnerGroupDetailsModalComponent
  ],
  entryComponents: [
    LearnerDashboardPageComponent,
    LearnerStorySummaryTileComponent,
    LearnerTopicGoalsSummaryTileComponent,
    ProgressTabComponent,
    GoalsTabComponent,
    HomeTabComponent,
    LearnerGroupsTabComponent,
    LearnerTopicSummaryTileComponent,
    CommunityLessonsTabComponent,
    RemoveActivityModalComponent,
    LearnerDashboardSuggestionModalComponent,
    DeclineInvitationModalComponent,
    ViewLearnerGroupInvitationModalComponent,
    ViewLearnerGroupDetailsModalComponent
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
class LearnerDashboardPageModule {
  // Empty placeholder method to satisfy the `Compiler`.
  ngDoBootstrap() {}
}

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { downgradeModule } from '@angular/upgrade/static';
import { ToastrModule } from 'ngx-toastr';
import { SmartRouterModule } from 'hybrid-router-module-provider';
import { AppErrorHandlerProvider } from 'pages/oppia-root/app-error-handler';

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
