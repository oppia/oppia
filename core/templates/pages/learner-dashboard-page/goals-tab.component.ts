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
import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import {LearnerTopicSummary} from 'domain/topic/learner-topic-summary.model';
import {LearnerDashboardActivityBackendApiService} from 'domain/learner_dashboard/learner-dashboard-activity-backend-api.service';
import {LearnerDashboardActivityIds} from 'domain/learner_dashboard/learner-dashboard-activity-ids.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {ClassroomDomainConstants} from 'domain/classroom/classroom-domain.constants';
import {LearnerDashboardPageConstants} from './learner-dashboard-page.constants';
import {DeviceInfoService} from 'services/contextual/device-info.service';
import {Subscription} from 'rxjs';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {AddGoalsModalComponent} from './add-goals-modal/add-goals-modal.component';
import './goals-tab.component.css';

@Component({
  selector: 'oppia-goals-tab',
  templateUrl: './goals-tab.component.html',
  styleUrls: ['./goals-tab.component.css'],
})
export class GoalsTabComponent implements OnInit {
  constructor(
    private windowDimensionService: WindowDimensionsService,
    private urlInterpolationService: UrlInterpolationService,
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
  @Input() learnerDashboardRedesignFeatureFlag!: boolean;
  // Child dropdown is undefined because initially it is in closed state using
  // the following property: {'static' = false}.
  @ViewChild('dropdown', {static: false}) dropdownRef: ElementRef | undefined;
  learnerDashboardActivityIds!: LearnerDashboardActivityIds;
  MAX_CURRENT_GOALS_LENGTH!: number;
  currentGoalsStoryIsShown!: boolean[];
  showThreeDotsDropdown!: boolean[];
  pawImageUrl: string = '';
  bookImageUrl: string = '';
  starImageUrl: string = '';
  topicBelongToCurrentGoals: boolean[] = [];
  topicIdsInCompletedGoals: string[] = [];
  topicIdsInCurrentGoals: string[] = [];
  topicIdsInEditGoals: string[] = [];
  topicIdsInPartiallyLearntTopics: string[] = [];
  checkedTopics: Set<string> = new Set();
  completedTopics: Set<string> = new Set();
  topicToIndexMapping = {
    CURRENT: 0,
    COMPLETED: 1,
    NEITHER: 2,
  };

  indexOfSelectedTopic: number = -1;
  activityType: string = AppConstants.ACTIVITY_TYPE_LEARN_TOPIC;
  editGoalsTopicPageUrl: string[] = [];
  completedGoalsTopicPageUrl: string[] = [];
  editGoalsTopicClassification: number[] = [];
  editGoalsTopicBelongToLearntToPartiallyLearntTopic: boolean[] = [];
  windowIsNarrow: boolean = false;
  directiveSubscriptions = new Subscription();

  ngOnInit(): void {
    this.MAX_CURRENT_GOALS_LENGTH = AppConstants.MAX_CURRENT_GOALS_COUNT;
    this.currentGoalsStoryIsShown = [];
    this.showThreeDotsDropdown = [];
    this.currentGoalsStoryIsShown[0] = true;
    this.pawImageUrl = this.getStaticImageUrl('/learner_dashboard/paw.svg');
    this.bookImageUrl = this.getStaticImageUrl(
      '/learner_dashboard/book_icon.png'
    );
    this.starImageUrl = this.getStaticImageUrl('/learner_dashboard/star.svg');
    let topic: LearnerTopicSummary;

    for (topic of this.currentGoals) {
      this.topicIdsInCurrentGoals.push(topic.id);
      this.checkedTopics.add(topic.id);
    }
    for (topic of this.completedGoals) {
      this.topicIdsInCompletedGoals.push(topic.id);
      this.completedGoalsTopicPageUrl.push(
        this.getTopicPageUrl(topic.urlFragment, topic.classroomUrlFragment)
      );
      this.completedTopics.add(topic.id);
    }
    for (topic of this.editGoals) {
      this.topicIdsInEditGoals.push(topic.id);
      this.editGoalsTopicPageUrl.push(
        this.getTopicPageUrl(topic.urlFragment, topic.classroomUrlFragment)
      );
      this.editGoalsTopicClassification.push(
        this.getTopicClassification(topic.id)
      );
      this.editGoalsTopicBelongToLearntToPartiallyLearntTopic.push(
        this.doesTopicBelongToLearntToPartiallyLearntTopics(topic.name)
      );
    }
    for (topic of this.partiallyLearntTopicsList) {
      this.topicIdsInPartiallyLearntTopics.push(topic.id);
    }
    this.windowIsNarrow = this.windowDimensionService.isWindowNarrow();
    this.directiveSubscriptions.add(
      this.windowDimensionService.getResizeEvent().subscribe(() => {
        this.windowIsNarrow = this.windowDimensionService.isWindowNarrow();
      })
    );
  }

  getTopicPageUrl(
    topicUrlFragment: string,
    classroomUrlFragment: string
  ): string {
    return this.urlInterpolationService.interpolateUrl(
      ClassroomDomainConstants.TOPIC_VIEWER_URL_TEMPLATE,
      {
        topic_url_fragment: topicUrlFragment,
        classroom_url_fragment: classroomUrlFragment,
      }
    );
  }

  getTopicClassification(topicId: string): number {
    if (this.topicIdsInCurrentGoals.includes(topicId)) {
      return this.topicToIndexMapping.CURRENT;
    } else if (this.topicIdsInCompletedGoals.includes(topicId)) {
      return this.topicToIndexMapping.COMPLETED;
    } else {
      return this.topicToIndexMapping.NEITHER;
    }
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  doesTopicBelongToLearntToPartiallyLearntTopics(topicName: string): boolean {
    if (this.learntToPartiallyLearntTopics.includes(topicName)) {
      return true;
    }
    return false;
  }

  toggleStory(index: number): void {
    this.currentGoalsStoryIsShown[index] =
      !this.currentGoalsStoryIsShown[index];
  }

  async addToLearnerGoals(
    topic: LearnerTopicSummary,
    topicId: string,
    index: number
  ): Promise<void> {
    var activityId = topicId;
    var activityType = AppConstants.ACTIVITY_TYPE_LEARN_TOPIC;
    if (!this.topicIdsInCurrentGoals.includes(activityId)) {
      var isSuccessfullyAdded =
        await this.learnerDashboardActivityBackendApiService.addToLearnerGoals(
          activityId,
          activityType
        );
      if (
        isSuccessfullyAdded &&
        this.topicIdsInCurrentGoals.length < this.MAX_CURRENT_GOALS_LENGTH &&
        !this.topicIdsInCompletedGoals.includes(activityId)
      ) {
        this.currentGoalsStoryIsShown.push(false);
        this.currentGoals.push(topic);
        this.topicIdsInCurrentGoals.push(activityId);
        this.editGoalsTopicClassification.splice(
          index,
          1,
          this.getTopicClassification(topic.id)
        );
        if (this.untrackedTopics[topic.classroomUrlFragment]) {
          let indexInNewTopics = this.untrackedTopics[
            topic.classroomUrlFragment
          ].findIndex(topic => topic.id === topicId);
          if (indexInNewTopics !== -1) {
            this.untrackedTopics[topic.classroomUrlFragment].splice(
              indexInNewTopics,
              1
            );
            if (this.untrackedTopics[topic.classroomUrlFragment].length === 0) {
              delete this.untrackedTopics[topic.classroomUrlFragment];
            }
          }
        }
      }
    } else {
      const goalIndex = this.topicIdsInCurrentGoals.indexOf(activityId);
      this.removeFromLearnerGoals(topic, topicId, topic.name, goalIndex);
    }
  }

  toggleThreeDotsDropdown(index: number): void {
    this.showThreeDotsDropdown[index] = !this.showThreeDotsDropdown[index];
    if (this.indexOfSelectedTopic !== index) {
      this.indexOfSelectedTopic = index;
    } else {
      this.indexOfSelectedTopic = -1;
    }
    return;
  }

  /**
   * Close dropdown when outside elements are clicked
   * @param event mouse click event
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const targetElement = event.target as HTMLElement;
    for (let i = 0; i < this.currentGoals.length; i++) {
      if (targetElement && this.showThreeDotsDropdown[i]) {
        this.showThreeDotsDropdown[i] = false;
      }
    }
  }

  removeFromLearnerGoals(
    topic: LearnerTopicSummary,
    topicId: string,
    topicName: string,
    index: number
  ): void {
    var activityId = topicId;
    var activityTitle = topicName;
    this.learnerDashboardActivityBackendApiService
      .removeActivityModalAsync(
        LearnerDashboardPageConstants.LEARNER_DASHBOARD_SECTION_I18N_IDS
          .CURRENT_GOALS,
        LearnerDashboardPageConstants.LEARNER_DASHBOARD_SUBSECTION_I18N_IDS
          .LEARN_TOPIC,
        activityId,
        activityTitle
      )
      .then(() => {
        this.currentGoalsStoryIsShown.splice(index, 1);
        this.currentGoals.splice(index, 1);
        this.topicIdsInCurrentGoals.splice(index, 1);
        let indexOfTopic = this.topicIdsInEditGoals.indexOf(topicId);
        this.editGoalsTopicClassification.splice(
          indexOfTopic,
          1,
          this.getTopicClassification(topicId)
        );
        if (
          !this.topicIdsInCompletedGoals.includes(topicId) &&
          !this.topicIdsInCurrentGoals.includes(topicId) &&
          !this.topicIdsInPartiallyLearntTopics.includes(topicId)
        ) {
          if (this.untrackedTopics[topic.classroomUrlFragment]) {
            this.untrackedTopics[topic.classroomUrlFragment].push(topic);
          } else {
            this.untrackedTopics[topic.classroomUrlFragment] = [topic];
          }
        }
      });
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
