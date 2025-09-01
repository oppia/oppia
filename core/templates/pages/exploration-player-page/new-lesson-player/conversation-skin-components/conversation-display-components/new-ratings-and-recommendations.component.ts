// Copyright 2025 The Oppia Authors. All Rights Reserved.
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

import {Component, Input, OnDestroy, OnInit, Optional} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {CollectionSummary} from 'domain/collection/collection-summary.model';
import {LearnerExplorationSummary} from 'domain/summary/learner-exploration-summary.model';
import {Subscription} from 'rxjs';
import {AlertsService} from 'services/alerts.service';
import {UrlService} from 'services/contextual/url.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {UserService} from 'services/user.service';
import {LearnerViewRatingService} from '../../../services/learner-view-rating.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {TopicViewerDomainConstants} from 'domain/topic_viewer/topic-viewer-domain.constants';
import {LocalStorageService} from 'services/local-storage.service';
import {StoryViewerBackendApiService} from 'domain/story_viewer/story-viewer-backend-api.service';
import {TopicViewerBackendApiService} from 'domain/topic_viewer/topic-viewer-backend-api.service';
import {ReadOnlyTopic} from 'domain/topic_viewer/read-only-topic.model';
import {ReadOnlyStoryNode} from 'domain/story_viewer/read-only-story-node.model';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {AppConstants} from 'app.constants';
import {ExplorationModeService} from 'pages/exploration-player-page/services/exploration-mode.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {ConversationFlowService} from 'pages/exploration-player-page/services/conversation-flow.service';

import './new-ratings-and-recommendations.component.css';
import {
  MatBottomSheet,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import {LessonFeedbackModalComponent} from '../../sidebar-components/lesson-feedback-modal.component';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {CustomizableThankYouModalComponent} from '../../sidebar-components/customizable-thank-you-modal.component';

const MOBILE_SCREEN_BREAKPOINT = 480;

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
  selector: 'oppia-new-ratings-and-recommendations',
  templateUrl: './new-ratings-and-recommendations.component.html',
  styleUrls: ['./new-ratings-and-recommendations.component.css'],
})
export class NewRatingsAndRecommendationsComponent
  implements OnInit, OnDestroy
{
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() userIsLoggedIn!: boolean;
  @Input() explorationIsInPreviewMode!: boolean;
  @Input() questionPlayerConfig!: QuestionPlayerConfig;
  @Input() collectionSummary!: CollectionSummary;
  @Input() recommendedExplorationSummaries!: LearnerExplorationSummary[];

  // TODO(#22780): Remove these variable and related code.
  isRefresherExploration!: boolean;
  parentExplorationIds!: string[];

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

  constructor(
    private alertsService: AlertsService,
    private learnerViewRatingService: LearnerViewRatingService,
    private urlService: UrlService,
    private userService: UserService,
    @Optional() private ngbModal: NgbModal,
    @Optional() private bottomSheet: MatBottomSheet,
    private windowDimensionsService: WindowDimensionsService,
    private windowRef: WindowRef,
    private conversationFlowService: ConversationFlowService,
    private urlInterpolationService: UrlInterpolationService,
    private localStorageService: LocalStorageService,
    private storyViewerBackendApiService: StoryViewerBackendApiService,
    private topicViewerBackendApiService: TopicViewerBackendApiService,
    private assetsBackendApiService: AssetsBackendApiService,
    private siteAnalyticsService: SiteAnalyticsService,
    private explorationModeService: ExplorationModeService
  ) {}

  ngOnInit(): void {
    this.inStoryMode = this.explorationModeService.isInStoryChapterMode();
    if (this.inStoryMode) {
      let topicUrlFragment = this.urlService.getUrlParams().topic_url_fragment;
      let storyUrlFragment = this.urlService.getUrlParams().story_url_fragment;
      let classroomUrlFragment =
        this.urlService.getUrlParams().classroom_url_fragment;
      let nodeId = this.urlService.getUrlParams().node_id;
      this.storyViewerBackendApiService
        .fetchStoryDataAsync(
          topicUrlFragment,
          classroomUrlFragment,
          storyUrlFragment
        )
        .then(storyData => {
          this.storyId = storyData.id;
          storyData.nodes.forEach((node: ReadOnlyStoryNode, i: number) => {
            if (node.id === nodeId && i + 1 < storyData.nodes.length) {
              this.nextStoryNode = storyData.nodes[i + 1];
              this.nextStoryNodeIconUrl = this.getIconUrl(
                this.storyId as string,
                this.nextStoryNode.thumbnailFilename
              );
            }
          });
        });
      this.storyViewerUrl = this.urlInterpolationService.interpolateUrl(
        TopicViewerDomainConstants.STORY_VIEWER_URL_TEMPLATE,
        {
          topic_url_fragment: topicUrlFragment,
          classroom_url_fragment: classroomUrlFragment,
          story_url_fragment: storyUrlFragment,
        }
      );

      this.topicViewerBackendApiService
        .fetchTopicDataAsync(topicUrlFragment, classroomUrlFragment)
        .then((topicData: ReadOnlyTopic) => {
          this.practiceQuestionsAreEnabled =
            topicData.getPracticeTabIsDisplayed();
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
      this.learnerViewRatingService.init(userRating => {
        this.userRating = userRating;
      });
    }
  }

  getIconUrl(storyId: string, thumbnailFilename: string): string {
    return this.assetsBackendApiService.getThumbnailUrlForPreview(
      AppConstants.ENTITY_TYPE.STORY,
      storyId,
      thumbnailFilename
    );
  }

  isMobileScreenSize(): boolean {
    return this.windowDimensionsService.getWidth() < MOBILE_SCREEN_BREAKPOINT;
  }

  showFeedbackModal():
    | NgbModalRef
    | MatBottomSheetRef<LessonFeedbackModalComponent> {
    if (this.isMobileScreenSize()) {
      const bottomSheetRef = this.bottomSheet.open(
        LessonFeedbackModalComponent,
        {
          disableClose: true,
        }
      );
      bottomSheetRef.afterDismissed().subscribe(result => {
        if (result !== 'cancel') {
          this.showThankYouModal('I18N_PLAYER_THANK_FEEDBACK');
        }
      });
      return bottomSheetRef;
    } else {
      const modalRef = this.ngbModal.open(LessonFeedbackModalComponent, {
        backdrop: 'static',
      });

      modalRef.result.then(
        () => {
          this.showThankYouModal('I18N_PLAYER_THANK_FEEDBACK');
        },
        () => {}
      );
      return modalRef;
    }
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }

  showThankYouModal(
    i18nKey: string
  ): NgbModalRef | MatBottomSheetRef<CustomizableThankYouModalComponent> {
    if (this.isMobileScreenSize()) {
      const bottomSheetRef = this.bottomSheet.open(
        CustomizableThankYouModalComponent,
        {
          data: {
            modalMessageI18nKey: i18nKey,
          },
        }
      );
      return bottomSheetRef;
    } else {
      const modalRef = this.ngbModal.open(CustomizableThankYouModalComponent, {
        backdrop: true,
      });

      modalRef.componentInstance.modalMessageI18nKey = i18nKey;
      return modalRef;
    }
  }

  submitUserRating(ratingValue: number): void {
    this.learnerViewRatingService.submitUserRating(ratingValue);
  }

  signIn(srcElement: string): void {
    this.siteAnalyticsService.registerNewSignupEvent(srcElement);
    this.userService.getLoginUrlAsync().then(loginUrl => {
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
    this.localStorageService.updateEndChapterSignUpSectionHiddenPreference(
      'true'
    );
  }

  getIsRefresherExploration(): boolean {
    return this.conversationFlowService.getIsRefresherExploration();
  }

  getParentExplorationIds(): string[] {
    return this.conversationFlowService.getParentExplorationIds();
  }

  isSignUpSectionHidden(): boolean {
    return (
      this.localStorageService.getEndChapterSignUpSectionHiddenPreference() ===
      'true'
    );
  }
}
