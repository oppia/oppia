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

import {
  Component,
  EventEmitter,
  Input,
  Output,
  ChangeDetectorRef,
} from '@angular/core';
import {AppConstants} from 'app.constants';
import {CollectionSummary} from 'domain/collection/collection-summary.model';
import {LearnerTopicSummary} from 'domain/topic/learner-topic-summary.model';
import {LearnerExplorationSummary} from 'domain/summary/learner-exploration-summary.model';
import {LearnerDashboardPageConstants} from 'pages/learner-dashboard-page/learner-dashboard-page.constants';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {Subscription} from 'rxjs';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {LoaderService} from 'services/loader.service';
import {LearnerDashboardBackendApiService} from 'domain/learner_dashboard/learner-dashboard-backend-api.service';

import './home-tab.component.css';

@Component({
  selector: 'oppia-home-tab',
  templateUrl: './home-tab.component.html',
  styleUrls: ['./home-tab.component.css'],
})
export class HomeTabComponent {
  @Output() setActiveSection: EventEmitter<string> = new EventEmitter();
  @Input() incompleteExplorationsList: LearnerExplorationSummary[] = [];
  @Input() incompleteCollectionsList: CollectionSummary[] = [];
  @Input() currentGoals: LearnerTopicSummary[] = [];
  @Input() goalTopics: LearnerTopicSummary[] = [];
  @Input() partiallyLearntTopicsList: LearnerTopicSummary[] = [];
  @Input() untrackedTopics: Record<string, LearnerTopicSummary[]> = {};
  @Input() username!: string;
  @Input() redesignFeatureFlag!: boolean;
  @Input() totalLessonsInPlaylists: (
    | LearnerExplorationSummary
    | CollectionSummary
  )[] = [];

  currentGoalsLength!: number;
  classroomUrlFragment!: string;
  goalTopicsLength!: number;
  width!: number;
  CLASSROOM_LINK_URL_TEMPLATE: string = '/learn/<classroom_url_fragment>';
  displayCollections: boolean = false;
  nextIncompleteNodeTitles: string[] = [];
  widthConst: number = 233;
  continueWhereYouLeftOffList: LearnerTopicSummary[] = [];
  windowIsNarrow: boolean = false;
  directiveSubscriptions = new Subscription();
  currentGoalIds: Set<string> = new Set();
  storySummariesWithAvailableNodes: Set<string> = new Set();
  communityLibraryUrl =
    '/' + AppConstants.PAGES_REGISTERED_WITH_FRONTEND.LIBRARY_INDEX.ROUTE;
  hasMultipleUnfinishedPublished: boolean = false;
  totalLessonCards: number = 0;
  loadedLessonCards: number = 0;
  allCardsLoaded: boolean = false;
  loadingMessage: string = 'Loading';

  constructor(
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private loaderService: LoaderService,
    private windowDimensionService: WindowDimensionsService,
    private urlInterpolationService: UrlInterpolationService,
    private siteAnalyticsService: SiteAnalyticsService,
    private platformFeatureService: PlatformFeatureService,
    private learnerDashboardBackendApiService: LearnerDashboardBackendApiService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  isSerialChapterFeatureLearnerFlagEnabled(): boolean {
    return this.platformFeatureService.status.SerialChapterLaunchLearnerView
      .isEnabled;
  }

  ngOnInit(): void {
    this.loaderService.showLoadingScreen('Loading');
    this.loadedLessonCards = 0;

    const topicsPromise =
      this.learnerDashboardBackendApiService.fetchLearnerDashboardTopicsAndStoriesDataAsync();
    const collectionsPromise =
      this.learnerDashboardBackendApiService.fetchLearnerDashboardCollectionsDataAsync();
    const explorationsPromise =
      this.learnerDashboardBackendApiService.fetchLearnerDashboardExplorationsDataAsync();

    Promise.all([topicsPromise, collectionsPromise, explorationsPromise]).then(
      ([topicsData, collectionsData, explorationsData]) => {
        try {
          this.currentGoals = topicsData.topicsToLearnList;
          this.goalTopics = topicsData.allTopicsList;
          this.partiallyLearntTopicsList = topicsData.partiallyLearntTopicsList;
          this.untrackedTopics = topicsData.untrackedTopics;
          this.incompleteCollectionsList =
            collectionsData.incompleteCollectionsList;
          this.incompleteExplorationsList =
            explorationsData.incompleteExplorationsList;

          this.totalLessonsInPlaylists = [
            ...this.incompleteExplorationsList,
            ...this.incompleteCollectionsList,
          ];

          this.width = this.widthConst * (this.currentGoals?.length || 0);
          var allGoals = [
            ...(this.currentGoals || []),
            ...(this.partiallyLearntTopicsList || []),
          ];
          this.currentGoalsLength = this.currentGoals?.length || 0;
          this.goalTopicsLength = this.goalTopics?.length || 0;
          this.currentGoalIds = new Set(this.currentGoals?.map(g => g.id));

          this.continueWhereYouLeftOffList = [];

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

          if (this.partiallyLearntTopicsList) {
            for (const topic of this.partiallyLearntTopicsList) {
              const storySummaries = topic.getCanonicalStorySummaryDicts();
              if (storySummaries) {
                for (const story of storySummaries) {
                  let publishedNodesCount: number = 0;
                  if (this.isSerialChapterFeatureLearnerFlagEnabled()) {
                    const publishedNodes = story
                      .getAllNodes()
                      .filter(n => n.getPublishedStatus());
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
            }
          }

          this.totalLessonCards = 0;
          if (this.getTotalInProgressLessons() > 0) {
            this.totalLessonCards +=
              (this.incompleteExplorationsList?.length || 0) +
              (this.incompleteCollectionsList?.length || 0) +
              (this.partiallyLearntTopicsList?.reduce(
                (acc, topic) =>
                  acc + (topic.getCanonicalStorySummaryDicts()?.length || 0),
                0
              ) || 0);

            if (
              this.hasMultipleUnfinishedPublished &&
              this.storySummariesWithAvailableNodes.size > 0
            ) {
              this.totalLessonCards +=
                this.storySummariesWithAvailableNodes.size;
            }
          }

          if (
            this.isNonemptyObject(this.untrackedTopics) &&
            !this.isGoalLimitReached()
          ) {
            this.totalLessonCards += this.totalLessonsInPlaylists?.length || 0;
          }
        } catch (e) {
          console.error('Error processing dashboard data: ', e);
        } finally {
          setTimeout(() => {
            this.allCardsLoaded = true;
            this.changeDetectorRef.detectChanges();
            this.loaderService.hideLoadingScreen();
          }, 1000);
        }
      },
      error => {
        console.error('Error fetching dashboard data: ', error);
        setTimeout(() => {
          this.allCardsLoaded = true;
          this.changeDetectorRef.detectChanges();
          this.loaderService.hideLoadingScreen();
        }, 1000);
      }
    );

    this.windowIsNarrow = this.windowDimensionService.isWindowNarrow();
    this.directiveSubscriptions.add(
      this.windowDimensionService.getResizeEvent().subscribe(() => {
        this.windowIsNarrow = this.windowDimensionService.isWindowNarrow();
      })
    );
  }

  onLessonLoaded(): void {
    this.loadedLessonCards++;
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

  isNonemptyObject(object: Object | undefined | null): boolean {
    return !!object && Object.keys(object).length !== 0;
  }

  getClassroomLink(classroomUrlFragment: string): string {
    this.classroomUrlFragment = classroomUrlFragment;
    return this.urlInterpolationService.interpolateUrl(
      this.CLASSROOM_LINK_URL_TEMPLATE,
      {
        classroom_url_fragment: this.classroomUrlFragment,
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
    if (length >= 3) {
      return 662;
    }
    return (length + 1) * 164;
  }

  changeActiveSection(): void {
    this.setActiveSection.emit(
      LearnerDashboardPageConstants.LEARNER_DASHBOARD_SECTION_I18N_IDS.GOALS
    );
  }

  registerClassroomInProgressLessonEvent(
    classroomName: string,
    topicName: string
  ): void {
    this.siteAnalyticsService.registerInProgressClassroomLessonEngagedWithEvent(
      classroomName,
      topicName
    );
  }

  registerNewClassroomLessonEvent(
    classroomName: string,
    topicName: string
  ): void {
    this.siteAnalyticsService.registerNewClassroomLessonEngagedWithEvent(
      classroomName,
      topicName
    );
  }

  getTotalInProgressLessons(): number {
    const totalStories =
      this.partiallyLearntTopicsList?.reduce((acc, curr) => {
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
      }, 0) || 0;

    return (
      totalStories +
      (this.incompleteExplorationsList?.length || 0) +
      (this.incompleteCollectionsList?.length || 0)
    );
  }
}
