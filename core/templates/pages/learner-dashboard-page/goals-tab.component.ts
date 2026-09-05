// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for goals tab in the Learner Dashboard page.
 */

import {AppConstants} from 'app.constants';
import {Component, Input, OnInit, ViewEncapsulation} from '@angular/core';
import {LearnerTopicSummary} from 'domain/topic/learner-topic-summary.model';
import {LearnerDashboardActivityBackendApiService} from 'domain/learner_dashboard/learner-dashboard-activity-backend-api.service';
import {LearnerDashboardActivityIds} from 'domain/learner_dashboard/learner-dashboard-activity-ids.model';
import {LearnerDashboardPageConstants} from './learner-dashboard-page.constants';
import {DeviceInfoService} from 'services/contextual/device-info.service';
import {Subscription} from 'rxjs';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {AddGoalsModalComponent} from './add-goals-modal/add-goals-modal.component';

@Component({
  selector: 'oppia-goals-tab',
  templateUrl: './goals-tab.component.html',
  styleUrls: ['./goals-tab.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class GoalsTabComponent implements OnInit {
  constructor(
    private windowDimensionService: WindowDimensionsService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private learnerDashboardActivityBackendApiService: LearnerDashboardActivityBackendApiService,
    private deviceInfoService: DeviceInfoService,
    private dialog: MatDialog
  ) {}

  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() currentGoals!: LearnerTopicSummary[];
  @Input() editGoals!: LearnerTopicSummary[];
  @Input() completedGoals!: LearnerTopicSummary[];
  @Input() untrackedTopics!: Record<string, LearnerTopicSummary[]>;
  @Input() partiallyLearntTopicsList!: LearnerTopicSummary[];
  @Input() learntToPartiallyLearntTopics!: string[];
  learnerDashboardActivityIds!: LearnerDashboardActivityIds;
  MAX_CURRENT_GOALS_LENGTH!: number;
  topicBelongToCurrentGoals: boolean[] = [];
  checkedTopics: Set<string> = new Set();
  completedTopics: Set<string> = new Set();
  topicToIndexMapping = {
    CURRENT: 0,
    COMPLETED: 1,
    NEITHER: 2,
  };

  activityType: string = AppConstants.ACTIVITY_TYPE_LEARN_TOPIC;
  windowIsNarrow: boolean = false;
  directiveSubscriptions = new Subscription();

  ngOnInit(): void {
    this.MAX_CURRENT_GOALS_LENGTH = AppConstants.MAX_CURRENT_GOALS_COUNT;
    let topic: LearnerTopicSummary;

    for (topic of this.currentGoals) {
      this.checkedTopics.add(topic.id);
    }
    for (topic of this.completedGoals) {
      this.completedTopics.add(topic.id);
    }
    this.windowIsNarrow = this.windowDimensionService.isWindowNarrow();
    this.directiveSubscriptions.add(
      this.windowDimensionService.getResizeEvent().subscribe(() => {
        this.windowIsNarrow = this.windowDimensionService.isWindowNarrow();
      })
    );
  }

  // TODO(#18384): Change how current goals is being modified with event emitter, currently directly modfiying parent input (original implementation).
  openModal(): void {
    const dialogConfig = new MatDialogConfig();
    const allTopics: {[id: string]: string} = this.editGoals.reduce(
      (obj: {[id: string]: string}, item) => ((obj[item.id] = item.name), obj),
      {} as {[id: string]: string}
    );
    dialogConfig.data = {
      checkedTopics: this.checkedTopics,
      completedTopics: this.completedTopics,
      topics: allTopics,
    };

    dialogConfig.panelClass = 'oppia-learner-dash-goals-modal';
    const dialogRef = this.dialog.open(AddGoalsModalComponent, dialogConfig);

    const allTopicSummarys: {[id: string]: LearnerTopicSummary} =
      this.editGoals.reduce(
        (obj: {[id: string]: LearnerTopicSummary}, item) => (
          (obj[item.id] = item), obj
        ),
        {} as {[id: string]: LearnerTopicSummary}
      );
    dialogRef.afterClosed().subscribe(async newGoalTopics => {
      if (newGoalTopics) {
        for (const topicId of newGoalTopics) {
          if (!this.checkedTopics.has(topicId)) {
            await this.learnerDashboardActivityBackendApiService.addToLearnerGoals(
              topicId,
              AppConstants.ACTIVITY_TYPE_LEARN_TOPIC
            );
            this.currentGoals.push(allTopicSummarys[topicId]);
          }
        }
        const removedIds: Set<string> = new Set();
        for (const topicId of this.checkedTopics) {
          if (!newGoalTopics.has(topicId)) {
            await this.learnerDashboardActivityBackendApiService.removeActivityModalAsync(
              LearnerDashboardPageConstants.LEARNER_DASHBOARD_SECTION_I18N_IDS
                .CURRENT_GOALS,
              LearnerDashboardPageConstants
                .LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.LEARN_TOPIC,
              topicId,
              allTopics[topicId]
            );
            removedIds.add(topicId);
          }
        }
        this.checkedTopics = new Set(newGoalTopics);
        this.currentGoals.forEach((g, index) => {
          if (removedIds.has(g.id)) {
            this.currentGoals.splice(index, 1);
          }
        });
      }
    });
  }

  async removeGoal(topicId: string, topicName: string): Promise<void> {
    await this.learnerDashboardActivityBackendApiService.removeActivityModalAsync(
      LearnerDashboardPageConstants.LEARNER_DASHBOARD_SECTION_I18N_IDS
        .CURRENT_GOALS,
      LearnerDashboardPageConstants.LEARNER_DASHBOARD_SUBSECTION_I18N_IDS
        .LEARN_TOPIC,
      topicId,
      topicName
    );

    for (let i = 0; i < this.currentGoals.length; i++) {
      if (this.currentGoals[i].id === topicId) {
        this.currentGoals.splice(i, 1);
        this.checkedTopics.delete(topicId);
        break;
      }
    }
  }
}
