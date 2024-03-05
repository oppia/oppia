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

import { NgModule } from '@angular/core';
import { SharedComponentsModule } from 'components/shared-component.module';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { LearnerStorySummaryTileComponent } from 'components/summary-tile/learner-story-summary-tile.component';
import { LearnerTopicGoalsSummaryTileComponent } from 'components/summary-tile/learner-topic-goals-summary-tile.component';
import { ProgressTabComponent } from './progress-tab.component';
import { GoalsTabComponent } from './goals-tab.component';
import { CommunityLessonsTabComponent } from './community-lessons-tab.component';
import { LearnerTopicSummaryTileComponent } from 'components/summary-tile/learner-topic-summary-tile.component';
import { HomeTabComponent } from './home-tab.component';
import { LearnerGroupsTabComponent } from './learner-groups-tab.component';
import { LearnerDashboardPageComponent } from './learner-dashboard-page.component';
import { LearnerDashboardPageRootComponent } from './learner-dashboard-page-root.component';
import { RemoveActivityModalComponent } from 'pages/learner-dashboard-page/modal-templates/remove-activity-modal.component';
import { DeclineInvitationModalComponent } from './modal-templates/decline-invitaiton-modal.component';
import { ViewLearnerGroupInvitationModalComponent } from './modal-templates/view-learner-group-invitation-modal.component';
import { LearnerDashboardSuggestionModalComponent } from './suggestion-modal/learner-dashboard-suggestion-modal.component';
import { ViewLearnerGroupDetailsModalComponent } from './modal-templates/view-learner-group-details-modal.component';
import { toastrConfig } from 'pages/oppia-root/app.module';
import { ToastrModule } from 'ngx-toastr';
import { LearnerDashboardActivityBackendApiService } from
  'domain/learner_dashboard/learner-dashboard-activity-backend-api.service';

@NgModule({
  imports: [
    CommonModule,
    SharedComponentsModule,
    ToastrModule.forRoot(toastrConfig),
    RouterModule.forChild([
      {
        path: '',
        component: LearnerDashboardPageRootComponent,
      },
    ]),

  ],
  declarations: [
    LearnerDashboardPageComponent,
    LearnerDashboardPageRootComponent,
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
    LearnerDashboardActivityBackendApiService
  ]
})
export class LearnerDashboardPageModule {}
