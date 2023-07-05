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
 * @fileoverview Component for progress tab in the Learner Dashboard page.
 */

import { OnInit } from '@angular/core';
import { Component, Input, EventEmitter, Output } from '@angular/core';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { StorySummary } from 'domain/story/story-summary.model';
import { LearnerTopicSummary } from 'domain/topic/learner-topic-summary.model';
import { LearnerDashboardPageConstants } from './learner-dashboard-page.constants';
import { LearnerDashboardBackendApiService, SubtopicMasterySummaryBackendDict } from 'domain/learner_dashboard/learner-dashboard-backend-api.service';
import { Subscription } from 'rxjs';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';


 @Component({
   selector: 'oppia-progress-tab',
   templateUrl: './progress-tab.component.html'
 })
export class ProgressTabComponent implements OnInit {
  @Output() setActiveSection: EventEmitter<string> = new EventEmitter();
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() completedStoriesList!: StorySummary[];
  @Input() partiallyLearntTopicsList!: LearnerTopicSummary[];
  @Input() activeSubsection!: string;
  @Input() learntTopicsList!: LearnerTopicSummary[];
  displaySkills!: boolean[];
  width!: number;
  topicsInSkillProficiency: LearnerTopicSummary[] = [];
  emptySkillProficiency: boolean = true;
  widthConst: number = 233;
  subtopicMastery: Record<string, SubtopicMasterySummaryBackendDict> = {};
  topicIdsInSkillProficiency: string[] = [];
  goldBadgeImageUrl: string = '';
  bronzeBadgeImageUrl: string = '';
  silverBadgeImageUrl: string = '';
  emptyBadgeImageUrl: string = '';
  topicMastery: [number, LearnerTopicSummary][] = [];
  LEARNER_DASHBOARD_SUBSECTION_I18N_IDS = (
    LearnerDashboardPageConstants.LEARNER_DASHBOARD_SUBSECTION_I18N_IDS);

  windowIsNarrow: boolean = false;
  directiveSubscriptions = new Subscription();

  constructor(
    private windowDimensionService: WindowDimensionsService,
    private urlInterpolationService: UrlInterpolationService,
    private learnerDashboardBackendApiService: LearnerDashboardBackendApiService
  ) {}

  async ngOnInit(): Promise<void> {
    this.width = this.widthConst * (this.completedStoriesList.length);
    this.topicsInSkillProficiency.push(
      ...this.partiallyLearntTopicsList, ...this.learntTopicsList);
    let topic: LearnerTopicSummary;
    for (topic of this.topicsInSkillProficiency) {
      this.topicIdsInSkillProficiency.push(topic.id);
    }
    this.goldBadgeImageUrl = this.getStaticImageUrl(
      '/learner_dashboard/gold.png');
    this.bronzeBadgeImageUrl = this.getStaticImageUrl(
      '/learner_dashboard/bronze.png');
    this.silverBadgeImageUrl = this.getStaticImageUrl(
      '/learner_dashboard/silver.png');
    this.emptyBadgeImageUrl = this.getStaticImageUrl(
      '/learner_dashboard/empty_badge.png');
    if (this.topicsInSkillProficiency.length !== 0) {
      this.subtopicMastery = await (
        this.learnerDashboardBackendApiService.fetchSubtopicMastery(
          this.topicIdsInSkillProficiency));
    }
    this.displaySkills = new Array(
      this.topicsInSkillProficiency.length).fill(false);
    let atLeastOnetopicHasPracticeTabEnabled = false;
    for (topic of this.topicsInSkillProficiency) {
      if (topic.practiceTabIsDisplayed === true) {
        atLeastOnetopicHasPracticeTabEnabled = true;
        break;
      }
    }
    if (atLeastOnetopicHasPracticeTabEnabled === true &&
      this.topicsInSkillProficiency.length !== 0) {
      this.emptySkillProficiency = false;
    }
    this.getTopicMastery();

    this.windowIsNarrow = this.windowDimensionService.isWindowNarrow();
    this.directiveSubscriptions.add(
      this.windowDimensionService.getResizeEvent().subscribe(() => {
        this.windowIsNarrow = this.windowDimensionService.isWindowNarrow();
      }));
  }

  showSkills(index: number): void {
    this.displaySkills[index] = !this.displaySkills[index];
    this.width = this.widthConst * (this.completedStoriesList.length);
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  getTopicMastery(): void {
    let keyArr = Object.keys(this.subtopicMastery);
    for (let i = 0; i < keyArr.length; i++) {
      let valArr = Object.values(this.subtopicMastery[
        this.topicsInSkillProficiency[i].id]);
      let sum = valArr.reduce((a, b) => a + b, 0);
      let arrLength = this.topicsInSkillProficiency[i].subtopics.length;
      this.topicMastery.push(
        [Math.floor(sum / arrLength * 100),
          this.topicsInSkillProficiency[i]]);
    }
    this.topicMastery = this.topicMastery.sort(
      function(a, b) {
        return b[0] - a[0];
      });
  }

  calculateCircularProgress(i: number): string {
    let degree = (90 + (360 * (this.topicMastery[i][0])) / 100);
    let cssStyle = (
      `linear-gradient(${degree}deg, transparent 50%, #CCCCCC 50%)` +
      ', linear-gradient(90deg, #CCCCCC 50%, transparent 50%)');
    if (this.topicMastery[i][0] > 50) {
      degree = 3.6 * (this.topicMastery[i][0] - 50) - 90;
      cssStyle = (
        'linear-gradient(270deg, #00645C 50%, transparent 50%), ' +
        `linear-gradient(${degree}deg, #00645C 50%, #CCCCCC 50%)`);
    }
    return cssStyle;
  }

  changeActiveSection(): void {
    this.setActiveSection.emit(
      LearnerDashboardPageConstants.LEARNER_DASHBOARD_SECTION_I18N_IDS.GOALS);
  }
}
