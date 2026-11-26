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

import {AppConstants} from 'app.constants';
import {Component, Input, ViewEncapsulation} from '@angular/core';
import {CollectionSummary} from 'domain/collection/collection-summary.model';
import {LearnerTopicSummary} from 'domain/topic/learner-topic-summary.model';
import {LearnerExplorationSummary} from 'domain/summary/learner-exploration-summary.model';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {LoaderService} from 'services/loader.service';

@Component({
  selector: 'oppia-home-tab',
  templateUrl: './home-tab.component.html',
  styleUrls: ['./home-tab.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class HomeTabComponent {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() incompleteExplorationsList!: LearnerExplorationSummary[];
  @Input() incompleteCollectionsList!: CollectionSummary[];
  @Input() currentGoals!: LearnerTopicSummary[];
  @Input() goalTopics!: LearnerTopicSummary[];
  @Input() partiallyLearntTopicsList!: LearnerTopicSummary[];
  @Input() untrackedTopics!: Record<string, LearnerTopicSummary[]>;
  currentGoalsLength!: number;
  goalTopicsLength!: number;
  continueWhereYouLeftOffList: LearnerTopicSummary[] = [];
  currentGoalIds: Set<string> = new Set();
  storySummariesWithAvailableNodes: Set<string> = new Set();
  hasMultipleUnfinishedPublished: boolean = false;
  totalLessonCards: number = 0;
  loadedLessonCards: number = 0;
  allCardsLoaded: boolean = false;
  loadingMessage: string = 'Loading';

  constructor(
    private loaderService: LoaderService,
    private platformFeatureService: PlatformFeatureService
  ) {}

  isSerialChapterFeatureLearnerFlagEnabled(): boolean {
    return this.platformFeatureService.status.SerialChapterLaunchLearnerView
      .isEnabled;
  }

  ngOnInit(): void {
    this.loaderService.showLoadingScreen('Loading');
    var allGoals = [...this.currentGoals, ...this.partiallyLearntTopicsList];
    this.currentGoalsLength = this.currentGoals.length;
    this.goalTopicsLength = this.goalTopics.length;
    this.currentGoalIds = new Set(this.currentGoals.map(g => g.id));

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

    // TODO(#18384): Test cases - current lesson is last lesson.
    for (const topic of this.partiallyLearntTopicsList) {
      const storySummaries = topic.getCanonicalStorySummaryDicts();

      for (const story of storySummaries) {
        let publishedNodesCount: number;
        if (this.isSerialChapterFeatureLearnerFlagEnabled()) {
          const publishedNodes = story
            .getAllNodes()
            .filter(node => node.getPublishedStatus());
          publishedNodesCount = publishedNodes.length;
        } else {
          publishedNodesCount = story.getAllNodes().length;
        }

        const completedNodes = story.getCompletedNodeTitles();
        const remainingPublished =
          publishedNodesCount - completedNodes.length - 1;

        if (
          remainingPublished > 0 &&
          remainingPublished < publishedNodesCount
        ) {
          this.storySummariesWithAvailableNodes.add(story.getId());
        }
        if (!this.hasMultipleUnfinishedPublished) {
          this.hasMultipleUnfinishedPublished =
            publishedNodesCount > 1 && remainingPublished > 0;
        }
      }
    }

    this.totalLessonCards =
      (this.incompleteExplorationsList?.length || 0) +
      (this.incompleteCollectionsList?.length || 0) +
      this.partiallyLearntTopicsList.reduce(
        (acc, topic) => acc + topic.getCanonicalStorySummaryDicts().length,
        0
      );
    if (
      this.hasMultipleUnfinishedPublished &&
      this.storySummariesWithAvailableNodes.size > 0
    ) {
      this.totalLessonCards += this.storySummariesWithAvailableNodes.size;
    }

    if (this.totalLessonCards === 0) {
      this.allCardsLoaded = true;
      this.loadingMessage = '';
      this.loaderService.hideLoadingScreen();
    } else {
      setTimeout(() => {
        if (!this.allCardsLoaded) {
          this.allCardsLoaded = true;
          this.loadingMessage = '';
          this.loaderService.hideLoadingScreen();
        }
      }, 10000);
    }
  }

  onLessonLoaded(): void {
    this.loadedLessonCards++;
    if (this.loadedLessonCards >= this.totalLessonCards) {
      this.allCardsLoaded = true;
      this.loadingMessage = '';
      this.loaderService.hideLoadingScreen();
    }
  }

  isNonemptyObject(object: Object): boolean {
    return Object.keys(object).length !== 0;
  }

  isGoalLimitReached(): boolean {
    if (this.goalTopicsLength === 0) {
      return false;
    } else if (this.currentGoalsLength === this.goalTopicsLength) {
      return true;
    }
    return this.currentGoalsLength === AppConstants.MAX_CURRENT_GOALS_COUNT;
  }

  getTotalInProgressLessons(): number {
    const totalStories = this.partiallyLearntTopicsList.reduce((acc, curr) => {
      let availableStories = 0;
      for (let i = 0; i < curr.getCanonicalStorySummaryDicts().length; i++) {
        let currentStory = curr.getCanonicalStorySummaryDicts()[i];
        if (
          currentStory.getAllNodes().length >
          currentStory.getCompletedNodeTitles().length
        ) {
          availableStories++;
        }
      }
      return acc + availableStories;
    }, 0);

    return (
      totalStories +
      (this.incompleteExplorationsList?.length || 0) +
      (this.incompleteCollectionsList?.length || 0)
    );
  }
}
