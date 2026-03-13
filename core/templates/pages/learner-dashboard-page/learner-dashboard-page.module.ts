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

import {NgModule} from '@angular/core';
import {SharedComponentsModule} from 'components/shared-component.module';
import {RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';

import {LessonCardModule} from 'components/summary-tile/lesson-card.module';
import {CardDisplayComponent} from './card-display/card-display.component';
import {ClassroomButtonComponent} from './classroom-button/classroom-button.component';
import {ContentToggleButtonComponent} from './content-toggle-button/content-toggle-button.component';
import {GoalListComponent} from './goal-list/goal-list.component';
import {SkillCardModule} from './skill-card/skill-card.module';
import {LearnerStorySummaryTileComponent} from 'components/summary-tile/learner-story-summary-tile.component';
import {LearnerTopicGoalsSummaryTileComponent} from 'components/summary-tile/learner-topic-goals-summary-tile.component';
import {OldProgressTabComponent} from './old-progress-tab.component';
import {GoalsTabComponent} from './goals-tab.component';
import {ProgressTabComponent} from './progress-tab.component';
import {LearnerTopicSummaryTileComponent} from 'components/summary-tile/learner-topic-summary-tile.component';
import {HomeTabComponent} from './home-tab.component';
import {LearnerGroupsTabComponent} from './learner-groups-tab.component';
import {LearnerDashboardPageComponent} from './learner-dashboard-page.component';
import {LearnerDashboardPageRootComponent} from './learner-dashboard-page-root.component';
import {RemoveActivityModalComponent} from 'pages/learner-dashboard-page/modal-templates/remove-activity-modal.component';
import {DeclineInvitationModalComponent} from './modal-templates/decline-invitaiton-modal.component';
import {ViewLearnerGroupInvitationModalComponent} from './modal-templates/view-learner-group-invitation-modal.component';
import {LearnerDashboardSuggestionModalComponent} from './suggestion-modal/learner-dashboard-suggestion-modal.component';
import {ViewLearnerGroupDetailsModalComponent} from './modal-templates/view-learner-group-details-modal.component';
import {toastrConfig} from 'pages/oppia-root/app.module';
import {ToastrModule} from 'ngx-toastr';
import {LearnerDashboardActivityBackendApiService} from 'domain/learner_dashboard/learner-dashboard-activity-backend-api.service';
import {AddGoalsModalComponent} from './add-goals-modal/add-goals-modal.component';
import {MatDialogModule} from '@angular/material/dialog';
import {NgCircleProgressModule} from 'ng-circle-progress';
@NgModule({
  imports: [
    CommonModule,
    SharedComponentsModule,
    LessonCardModule,
    MatDialogModule,
    SkillCardModule,
    ToastrModule.forRoot(toastrConfig),
    RouterModule.forChild([
      {
        path: '',
        component: LearnerDashboardPageRootComponent,
      },
    ]),
    NgCircleProgressModule.forRoot({
      radius: 16,
      outerStrokeWidth: 2,
      innerStrokeWidth: 2,
      space: -2,
      innerStrokeColor: '#e7e8ea',
      outerStrokeColor: '#00645c',
      showBackground: false,
      showSubtitle: false,
      titleFontSize: '11',
      titleColor: '#00645c',
    }),
  ],
  declarations: [
    AddGoalsModalComponent,
    CardDisplayComponent,
    ClassroomButtonComponent,
    ContentToggleButtonComponent,
    GoalListComponent,
    LearnerDashboardPageComponent,
    LearnerDashboardPageRootComponent,
    LearnerStorySummaryTileComponent,
    LearnerTopicGoalsSummaryTileComponent,
    OldProgressTabComponent,
    GoalsTabComponent,
    HomeTabComponent,
    LearnerGroupsTabComponent,
    LearnerTopicSummaryTileComponent,
    ProgressTabComponent,
    RemoveActivityModalComponent,
    LearnerDashboardSuggestionModalComponent,
    DeclineInvitationModalComponent,
    ViewLearnerGroupInvitationModalComponent,
    ViewLearnerGroupDetailsModalComponent,
  ],
  entryComponents: [
    AddGoalsModalComponent,
    CardDisplayComponent,
    ClassroomButtonComponent,
    ContentToggleButtonComponent,
    GoalListComponent,
    LearnerDashboardPageComponent,
    LearnerStorySummaryTileComponent,
    LearnerTopicGoalsSummaryTileComponent,
    OldProgressTabComponent,
    GoalsTabComponent,
    HomeTabComponent,
    LearnerGroupsTabComponent,
    LearnerTopicSummaryTileComponent,
    ProgressTabComponent,
    RemoveActivityModalComponent,
    LearnerDashboardSuggestionModalComponent,
    DeclineInvitationModalComponent,
    ViewLearnerGroupInvitationModalComponent,
    ViewLearnerGroupDetailsModalComponent,
  ],
  providers: [LearnerDashboardActivityBackendApiService],
})
export class LearnerDashboardPageModule {}
