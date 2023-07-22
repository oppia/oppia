// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for new-home tab in the Learner Dashboard page.
 */

import { Component, Input } from '@angular/core';
import { LearnerTopicSummary } from 'domain/topic/learner-topic-summary.model';
import { LearnerDashboardPageConstants } from 'pages/learner-dashboard-page/learner-dashboard-page.constants';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { Subscription } from 'rxjs';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { StorySummary } from 'domain/story/story-summary.model';
import { LearnerExplorationSummary } from 'domain/summary/learner-exploration-summary.model';
import { CollectionSummary } from 'domain/collection/collection-summary.model';
import { LearnerDashboardActivityBackendApiService } from 'domain/learner_dashboard/learner-dashboard-activity-backend-api.service';
import { ChapterProgressSummary } from 'domain/exploration/chapter-progress-summary.model';
import { ReadOnlyExplorationBackendApiService } from 'domain/exploration/read-only-exploration-backend-api.service';

import './new-home-tab.component.css';

interface storySummaryTile {
  topicName: string;
  storySummary: StorySummary;
  markTileAsGoal: boolean;
  learnerGroupTitle: string;
}
 @Component({
   selector: 'oppia-new-home-tab',
   templateUrl: './new-home-tab.component.html',
   styleUrls: ['./new-home-tab.component.css']
 })
export class NewHomeTabComponent {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() currentGoals!: LearnerTopicSummary[];
  @Input() goalTopics!: LearnerTopicSummary[];
  @Input() partiallyLearntTopicsList!: LearnerTopicSummary[];
  @Input() untrackedTopics!: Record<string, LearnerTopicSummary[]>;
  @Input() username!: string;
  @Input() explorationPlaylist!: LearnerExplorationSummary[];
  @Input() incompleteExplorationsList!: LearnerExplorationSummary[];
  @Input() completedExplorationsList!: LearnerExplorationSummary[];
  @Input() collectionPlaylist!: CollectionSummary[];
  @Input() storyIdToLearnerGroupsTitleMap!: Map<string, string[]>;
  @Input() learnerGroupFeatureIsEnable: boolean = false;

  carouselClassname: string = 'home-tab';
  currentGoalsLength!: number;
  classroomUrlFragment!: string;
  goalTopicsLength!: number;
  noPlaylistActivity: boolean = false;
  showMoreInPlaylistSection: boolean = false;
  CLASSROOM_LINK_URL_TEMPLATE: string = '/learn/<classroom_url_fragment>';
  nextIncompleteNodeTitles: string[] = [];
  widthConst: number = 233;
  continueWhereYouLeftOffList: LearnerTopicSummary[] = [];
  windowIsNarrow: boolean = false;
  storyInProgress: storySummaryTile[] = [];
  storyInRecommended: storySummaryTile[] = [];
  expIds: string[] = [];
  completedExpIds: string[] = [];
  explorationToProgressMap: Map<string, number> = new Map();
  totalExploration: LearnerExplorationSummary[] = [];
  storyExplorationProgressList: (
    LearnerExplorationSummary | storySummaryTile)[] = [];


  totalLessonsInPlaylist: (
      LearnerExplorationSummary | CollectionSummary)[] = [];

  directiveSubscriptions = new Subscription();

  constructor(
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private learnerDashboardActivityBackendApiService:
    LearnerDashboardActivityBackendApiService,
    private windowDimensionService: WindowDimensionsService,
    private urlInterpolationService: UrlInterpolationService,
    private readOnlyExplorationBackendApiService:
    ReadOnlyExplorationBackendApiService,
  ) {}

  ngOnInit(): void {
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
    if (this.currentGoals.length !== 0) {
      var currentGoalsIds = [];
      for (var goal of this.currentGoals) {
        currentGoalsIds.push(goal.id);
      }
    }
    for (var topicSummaryTile of this.continueWhereYouLeftOffList) {
      for (var storySummary of topicSummaryTile.canonicalStorySummaryDicts) {
        let stotyNodeCount = storySummary.getNodeTitles().length;
        let storyCompletedNodeCount =
        storySummary.getCompletedNodeTitles().length;

        let storyProgress = Math.floor(
          (storyCompletedNodeCount / stotyNodeCount) * 100);
        let topicId = topicSummaryTile.id;
        var storyData: storySummaryTile = {
          topicName: topicSummaryTile.name,
          storySummary: storySummary,
          markTileAsGoal: currentGoalsIds?.includes(topicId) ? true : false,
          learnerGroupTitle: ''
        };
        if (this.storyIdToLearnerGroupsTitleMap.has(storySummary.getId())) {
          let learnerGroupsTitle =
          this.storyIdToLearnerGroupsTitleMap.get(storySummary.getId());
          storyData.learnerGroupTitle = learnerGroupsTitle ?
          learnerGroupsTitle[0] : '';
        }
        if (storyProgress !== 0) {
          this.storyInProgress.push(storyData);
        } else {
          this.storyInRecommended.push(storyData);
        }
      }
    }

    this.noPlaylistActivity = (
      (this.explorationPlaylist.length === 0) &&
    (this.collectionPlaylist.length === 0));
    this.totalLessonsInPlaylist.push(
      ...this.explorationPlaylist, ...this.collectionPlaylist);

    this.totalExploration.push(
      ...this.explorationPlaylist, ...this.incompleteExplorationsList);
    this.storyExplorationProgressList.push(
      ...this.storyInProgress, ...this.incompleteExplorationsList);

    for (var exp of this.completedExplorationsList) {
      this.completedExpIds.push(exp.id);
    }
    if (this.totalExploration.length !== 0) {
      let expIds: string[] = [];
      for (var exp of this.totalExploration) {
        expIds.push(exp.id);
      }

      this.readOnlyExplorationBackendApiService.
        fetchProgressInExplorationsOrChapters(
          expIds
        ).then(explorationsProgressSummary => {
          let explorationsProgress = explorationsProgressSummary;

          if (explorationsProgress.length !== 0) {
            for (let i = 0; i < expIds.length; i++) {
              let progress =
          this.calculateExplorationProgress(explorationsProgress[i], expIds[i]);
              this.explorationToProgressMap.set(
                expIds[i], Math.floor(progress));
            }
          }
        });
    }

    this.windowIsNarrow = this.windowDimensionService.isWindowNarrow();
    this.directiveSubscriptions.add(
      this.windowDimensionService.getResizeEvent().subscribe(() => {
        this.windowIsNarrow = this.windowDimensionService.isWindowNarrow();
      }));
  }

  getTileType(
      tile: LearnerExplorationSummary | CollectionSummary |
    storySummaryTile): string {
    if (tile instanceof LearnerExplorationSummary) {
      return 'exploration';
    } else if (tile instanceof CollectionSummary) {
      return 'collection';
    }
    return 'story';
  }

  calculateExplorationProgress(
      explorationProgress: ChapterProgressSummary, expId: string): number {
    let totalCheckpoints = explorationProgress.totalCheckpoints;
    let visitedCheckpoints = explorationProgress.visitedCheckpoints;
    if (this.completedExpIds.includes(expId)) {
      return 100;
    }
    if (visitedCheckpoints === 1 && totalCheckpoints === 1) {
      return 0;
    }
    let progress = (visitedCheckpoints / totalCheckpoints) * 100;
    return progress;
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

  openRemoveActivityModal(
      sectionNameI18nId: string, subsectionName: string,
      activity: LearnerExplorationSummary | CollectionSummary): void {
    this.learnerDashboardActivityBackendApiService.removeActivityModalAsync(
      sectionNameI18nId, subsectionName,
      activity.id, activity.title)
      .then(() => {
        if (sectionNameI18nId ===
        LearnerDashboardPageConstants
          .LEARNER_DASHBOARD_SECTION_I18N_IDS.PLAYLIST) {
          if (subsectionName ===
          LearnerDashboardPageConstants
            .LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS) {
            let index = this.totalLessonsInPlaylist.findIndex(
              exp => exp.id === activity.id);
            if (index !== -1) {
              this.totalLessonsInPlaylist.splice(index, 1);
            }
          } else if (subsectionName ===
          LearnerDashboardPageConstants
            .LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.COLLECTIONS) {
            let index = this.totalLessonsInPlaylist.findIndex(
              collection => collection.id === activity.id);
            if (index !== -1) {
              this.totalLessonsInPlaylist.splice(index, 1);
            }
          }
        }
        this.noPlaylistActivity = (
          (this.totalLessonsInPlaylist.length === 0));
      });
  }
}
