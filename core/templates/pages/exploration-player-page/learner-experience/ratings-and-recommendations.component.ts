// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for ratings and recommendations to be shown
 * on conversation skin.
 */

import { Component, Input, ViewChild } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { CollectionSummary } from 'domain/collection/collection-summary.model';
import { LearnerExplorationSummary } from 'domain/summary/learner-exploration-summary.model';
import { Subscription } from 'rxjs';
import { AlertsService } from 'services/alerts.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { UserService } from 'services/user.service';
import { LearnerViewRatingService } from '../services/learner-view-rating.service';
import { ExplorationPlayerStateService } from './../services/exploration-player-state.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { TopicViewerDomainConstants } from 'domain/topic_viewer/topic-viewer-domain.constants';
import { PlatformFeatureService } from 'services/platform-feature.service';
import { LocalStorageService } from 'services/local-storage.service';
import { StoryViewerBackendApiService } from 'domain/story_viewer/story-viewer-backend-api.service';
import { TopicViewerBackendApiService } from 'domain/topic_viewer/topic-viewer-backend-api.service';
import { ReadOnlyTopic } from 'domain/topic_viewer/read-only-topic-object.factory';
import { ReadOnlyStoryNode } from 'domain/story_viewer/read-only-story-node.model';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { AppConstants } from 'app.constants';
import { SiteAnalyticsService } from 'services/site-analytics.service';

interface ResultActionButton {
  type: string;
  i18nId: string;
  url?: string;
}

export interface QuestionPlayerConfig {
  resultActionButtons: ResultActionButton[];
  skillList: string[];
  skillDescriptions: string[];
  questionCount: number;
  questionPlayerMode?: {
    modeType: string;
    passCutoff: number;
  };
  questionsSortedByDifficulty: boolean;
}

@Component({
  selector: 'oppia-ratings-and-recommendations',
  templateUrl: './ratings-and-recommendations.component.html'
})
export class RatingsAndRecommendationsComponent {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() userIsLoggedIn!: boolean;
  @Input() explorationIsInPreviewMode!: boolean;
  @Input() questionPlayerConfig!: QuestionPlayerConfig;
  @Input() collectionSummary!: CollectionSummary;
  @Input() isRefresherExploration!: boolean;
  @Input() recommendedExplorationSummaries!: LearnerExplorationSummary[];
  @Input() parentExplorationIds!: string[];
  // The below property will be undefined when the current chapter
  // is the last chapter of a story.
  @Input() nextLessonLink!: string | undefined;
  inStoryMode!: boolean;
  // The below properties will be undefined if the exploration is not being
  // played in story mode, i.e. inStoryMode is false.
  storyViewerUrl!: string | undefined;
  nextStoryNodeIconUrl!: string | undefined;
  storyId!: string | undefined;
  collectionId!: string | null;
  userRating!: number;
  nextStoryNode: ReadOnlyStoryNode | null = null;
  practiceQuestionsAreEnabled: boolean = false;
  directiveSubscriptions = new Subscription();
  @ViewChild('feedbackPopOver') feedbackPopOver!: NgbPopover;

  constructor(
    private alertsService: AlertsService,
    private learnerViewRatingService: LearnerViewRatingService,
    private urlService: UrlService,
    private userService: UserService,
    private windowRef: WindowRef,
    private explorationPlayerStateService: ExplorationPlayerStateService,
    private urlInterpolationService: UrlInterpolationService,
    private platformFeatureService: PlatformFeatureService,
    private localStorageService: LocalStorageService,
    private storyViewerBackendApiService: StoryViewerBackendApiService,
    private topicViewerBackendApiService: TopicViewerBackendApiService,
    private assetsBackendApiService: AssetsBackendApiService,
    private siteAnalyticsService: SiteAnalyticsService
  ) {}

  ngOnInit(): void {
    this.inStoryMode = (
      this.explorationPlayerStateService.isInStoryChapterMode());
    if (this.inStoryMode) {
      let topicUrlFragment = this.urlService.getUrlParams().topic_url_fragment;
      let storyUrlFragment = this.urlService.getUrlParams().story_url_fragment;
      let classroomUrlFragment = (
        this.urlService.getUrlParams().classroom_url_fragment);
      let nodeId = this.urlService.getUrlParams().node_id;
      this.storyViewerBackendApiService.fetchStoryDataAsync(
        topicUrlFragment, classroomUrlFragment,
        storyUrlFragment
      ).then((storyData) => {
        this.storyId = storyData.id;
        for (let i = 0; i < storyData.nodes.length; i++) {
          if (
            storyData.nodes[i].id === nodeId && (i + 1) < storyData.nodes.length
          ) {
            this.nextStoryNode = storyData.nodes[i + 1];
            this.nextStoryNodeIconUrl = this.getIconUrl(
              this.storyId, this.nextStoryNode.thumbnailFilename);
            break;
          }
        }
      });
      this.storyViewerUrl = this.urlInterpolationService.interpolateUrl(
        TopicViewerDomainConstants.STORY_VIEWER_URL_TEMPLATE, {
          topic_url_fragment: topicUrlFragment,
          classroom_url_fragment: classroomUrlFragment,
          story_url_fragment: storyUrlFragment
        });

      this.topicViewerBackendApiService.fetchTopicDataAsync(
        topicUrlFragment, classroomUrlFragment
      ).then((topicData: ReadOnlyTopic) => {
        this.practiceQuestionsAreEnabled = (
          topicData.getPracticeTabIsDisplayed());
      });
    }
    this.collectionId = this.urlService.getCollectionIdFromExplorationUrl();

    this.directiveSubscriptions.add(
      this.learnerViewRatingService.onRatingUpdated.subscribe(() => {
        this.userRating = this.learnerViewRatingService.getUserRating();
        this.alertsService.addSuccessMessage('Rating saved!');
      })
    );

    if (!this.questionPlayerConfig) {
      this.learnerViewRatingService.init((userRating) => {
        this.userRating = userRating;
      });
    }
  }

  getIconUrl(storyId: string, thumbnailFilename: string): string {
    return this.assetsBackendApiService.getThumbnailUrlForPreview(
      AppConstants.ENTITY_TYPE.STORY, storyId, thumbnailFilename);
  }

  togglePopover(): void {
    this.feedbackPopOver.toggle();
  }

  closePopover(): void {
    this.feedbackPopOver.close();
  }

  submitUserRating(ratingValue: number): void {
    this.learnerViewRatingService.submitUserRating(ratingValue);
  }

  signIn(srcElement: string): void {
    this.siteAnalyticsService.registerNewSignupEvent(srcElement);
    this.userService.getLoginUrlAsync().then((loginUrl) => {
      if (loginUrl) {
        (
          this.windowRef.nativeWindow as {location: string | Location}
        ).location = loginUrl;
      } else {
        this.windowRef.nativeWindow.location.reload();
      }
    });
  }

  hideSignUpSection(): void {
    this.localStorageService
      .updateEndChapterSignUpSectionHiddenPreference('true');
  }

  isSignUpSectionHidden(): boolean {
    return this.localStorageService
      .getEndChapterSignUpSectionHiddenPreference() === 'true';
  }

  isEndChapterFeatureEnabled(): boolean {
    return this.platformFeatureService.status.EndChapterCelebration.isEnabled;
  }
}

angular.module('oppia').directive('oppiaRatingsAndRecommendations',
  downgradeComponent({
    component: RatingsAndRecommendationsComponent
  }) as angular.IDirectiveFactory);
