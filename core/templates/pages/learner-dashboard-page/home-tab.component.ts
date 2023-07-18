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
 * @fileoverview Component for home tab in the Learner Dashboard page.
 */

import { AppConstants } from 'app.constants';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LearnerTopicSummary } from 'domain/topic/learner-topic-summary.model';
import { LearnerDashboardPageConstants } from 'pages/learner-dashboard-page/learner-dashboard-page.constants';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { Subscription } from 'rxjs';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';

import './home-tab.component.css';

 @Component({
   selector: 'oppia-home-tab',
   templateUrl: './home-tab.component.html',
   styleUrls: ['./home-tab.component.css']
 })
export class HomeTabComponent {
  @Output() setActiveSection: EventEmitter<string> = new EventEmitter();
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() currentGoals!: LearnerTopicSummary[];
  @Input() goalTopics!: LearnerTopicSummary[];
  @Input() partiallyLearntTopicsList!: LearnerTopicSummary[];
  @Input() untrackedTopics!: Record<string, LearnerTopicSummary[]>;
  @Input() username!: string;
  currentGoalsLength!: number;
  classroomUrlFragment!: string;
  goalTopicsLength!: number;
  width!: number;
  CLASSROOM_LINK_URL_TEMPLATE: string = '/learn/<classroom_url_fragment>';
  nextIncompleteNodeTitles: string[] = [];
  widthConst: number = 233;
  continueWhereYouLeftOffList: LearnerTopicSummary[] = [];
  windowIsNarrow: boolean = false;
  directiveSubscriptions = new Subscription();

  constructor(
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private windowDimensionService: WindowDimensionsService,
    private urlInterpolationService: UrlInterpolationService,
  ) {}

  ngOnInit(): void {
    this.width = this.widthConst * (this.currentGoals.length);
    var allGoals = [...this.currentGoals, ...this.partiallyLearntTopicsList];
    this.currentGoalsLength = this.currentGoals.length;
    this.goalTopicsLength = this.goalTopics.length;
    if (allGoals.length !== 0) {
      var allGoalIds = [];
      for (var goal of allGoals) {
        allGoalIds.push(goal.id);
      }
      var uniqueGoalIds = Array.from(new Set(allGoalIds));
      for (var uniqueGoalId of uniqueGoalIds) {
        var index = allGoalIds.indexOf(uniqueGoalId);
        this.continueWhereYouLeftOffList.push(allGoals[index]);
      }
    }
    this.windowIsNarrow = this.windowDimensionService.isWindowNarrow();
    this.directiveSubscriptions.add(
      this.windowDimensionService.getResizeEvent().subscribe(() => {
        this.windowIsNarrow = this.windowDimensionService.isWindowNarrow();
      }));
  }

  getTimeOfDay(): string {
    let time = new Date().getHours();

    if (time <= 12) {
      return 'I18N_LEARNER_DASHBOARD_MORNING_GREETING';
    } else if (time <= 18) {
      return 'I18N_LEARNER_DASHBOARD_AFTERNOON_GREETING';
    }
    return 'I18N_LEARNER_DASHBOARD_EVENING_GREETING';
  }

  isNonemptyObject(object: Object): boolean {
    return Object.keys(object).length !== 0;
  }

  getClassroomLink(classroomUrlFragment: string): string {
    this.classroomUrlFragment = classroomUrlFragment;
    return this.urlInterpolationService.interpolateUrl(
      this.CLASSROOM_LINK_URL_TEMPLATE, {
        classroom_url_fragment: this.classroomUrlFragment
      }
    );
  }

  isGoalLimitReached(): boolean {
    if (this.goalTopicsLength === 0) {
      return false;
    } else if (this.currentGoalsLength === this.goalTopicsLength) {
      return true;
    }
    return this.currentGoalsLength === AppConstants.MAX_CURRENT_GOALS_COUNT;
  }

  getWidth(length: number): number {
    /**
     * If there are 3 or more topics for each untrackedTopic, the total
     * width of the section will be 662px in mobile view to enable scrolling.
    */
    if (length >= 3) {
      return 662;
    }
    /**
     * If there less than 3 topics for each untrackedTopic, the total
     * width of the section will be calculated by multiplying the addition of
     * number of topics and one classroom card with 164px in mobile view to
     * enable scrolling.
    */
    return (length + 1) * 164;
  }

  changeActiveSection(): void {
    this.setActiveSection.emit(
      LearnerDashboardPageConstants.LEARNER_DASHBOARD_SECTION_I18N_IDS.GOALS);
  }
}
