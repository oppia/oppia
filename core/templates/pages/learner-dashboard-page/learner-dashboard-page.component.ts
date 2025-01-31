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
 * @fileoverview Component for the learner dashboard.
 */

import {Component, OnInit, OnDestroy} from '@angular/core';
import {
  trigger,
  state,
  style,
  transition,
  animate,
  group,
} from '@angular/animations';
import {TranslateService} from '@ngx-translate/core';
import {Subscription} from 'rxjs';

import {AppConstants} from 'app.constants';
import {LearnerExplorationSummary} from 'domain/summary/learner-exploration-summary.model';
import {CollectionSummary} from 'domain/collection/collection-summary.model';
import {ProfileSummary} from 'domain/user/profile-summary.model';
import {
  LearnerDashboardBackendApiService,
  SubtopicMasterySummaryBackendDict,
} from 'domain/learner_dashboard/learner-dashboard-backend-api.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {ThreadStatusDisplayService} from 'pages/exploration-editor-page/feedback-tab/services/thread-status-display.service';
import {SuggestionModalForLearnerDashboardService} from 'pages/learner-dashboard-page/suggestion-modal/suggestion-modal-for-learner-dashboard.service';
import {LearnerDashboardPageConstants} from 'pages/learner-dashboard-page/learner-dashboard-page.constants';
import {AlertsService} from 'services/alerts.service';
import {DateTimeFormatService} from 'services/date-time-format.service';
import {LoaderService} from 'services/loader.service';
import {UserService} from 'services/user.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {StorySummary} from 'domain/story/story-summary.model';
import {LearnerTopicSummary} from 'domain/topic/learner-topic-summary.model';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {PageTitleService} from 'services/page-title.service';
import {LearnerGroupBackendApiService} from 'domain/learner_group/learner-group-backend-api.service';
import {UrlService} from 'services/contextual/url.service';
import {PlatformFeatureService} from 'services/platform-feature.service';

import './learner-dashboard-page.component.css';

@Component({
  selector: 'oppia-learner-dashboard-page',
  templateUrl: './learner-dashboard-page.component.html',
  styleUrls: ['./learner-dashboard-page.component.css'],
  animations: [
    trigger('slideInOut', [
      state(
        'true',
        style({
          'max-height': '500px',
          opacity: '1',
          visibility: 'visible',
        })
      ),
      state(
        'false',
        style({
          'max-height': '0px',
          opacity: '0',
          visibility: 'hidden',
        })
      ),
      transition('true => false', [
        group([
          animate(
            '500ms ease-in-out',
            style({
              opacity: '0',
            })
          ),
          animate(
            '500ms ease-in-out',
            style({
              'max-height': '0px',
            })
          ),
          animate(
            '500ms ease-in-out',
            style({
              visibility: 'hidden',
            })
          ),
        ]),
      ]),
      transition('false => true', [
        group([
          animate(
            '500ms ease-in-out',
            style({
              visibility: 'visible',
            })
          ),
          animate(
            '500ms ease-in-out',
            style({
              'max-height': '500px',
            })
          ),
          animate(
            '500ms ease-in-out',
            style({
              opacity: '1',
            })
          ),
        ]),
      ]),
    ]),
  ],
})
export class LearnerDashboardPageComponent implements OnInit, OnDestroy {
  LEARNER_DASHBOARD_SECTION_I18N_IDS =
    LearnerDashboardPageConstants.LEARNER_DASHBOARD_SECTION_I18N_IDS;

  LEARNER_DASHBOARD_SUBSECTION_I18N_IDS =
    LearnerDashboardPageConstants.LEARNER_DASHBOARD_SUBSECTION_I18N_IDS;

  username: string = '';
  PAGES_REGISTERED_WITH_FRONTEND = AppConstants.PAGES_REGISTERED_WITH_FRONTEND;

  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1

  completedExplorationsList!: LearnerExplorationSummary[];
  completedCollectionsList!: CollectionSummary[];
  completedStoriesList!: StorySummary[];
  learntTopicsList!: LearnerTopicSummary[];
  partiallyLearntTopicsList!: LearnerTopicSummary[];
  incompleteExplorationsList!: LearnerExplorationSummary[];
  incompleteCollectionsList!: CollectionSummary[];
  topicsToLearn!: LearnerTopicSummary[];
  allTopics!: LearnerTopicSummary[];
  untrackedTopics!: Record<string, LearnerTopicSummary[]>;
  subscriptionsList!: ProfileSummary[];

  completedToIncompleteCollections!: string[];
  learntToPartiallyLearntTopics!: string[];
  numberOfUnreadThreads!: number;
  explorationPlaylist!: LearnerExplorationSummary[];
  collectionPlaylist!: CollectionSummary[];
  activeSection!: string;
  activeSubsection!: string;

  profilePicturePngDataUrl!: string;
  profilePictureWebpDataUrl!: string;

  explorationTitle!: string;
  explorationId!: string;
  communityLibraryUrl =
    '/' + AppConstants.PAGES_REGISTERED_WITH_FRONTEND.LIBRARY_INDEX.ROUTE;

  communityLessonsDataLoaded: boolean = false;
  loadingIndicatorIsShown: boolean = false;
  homeImageUrl: string = '';
  todolistImageUrl: string = '';
  progressImageUrl: string = '';
  windowIsNarrow: boolean = false;
  directiveSubscriptions = new Subscription();
  LEARNER_GROUP_FEATURE_IS_ENABLED: boolean = false;
  totalLessonsInPlaylists: (LearnerExplorationSummary | CollectionSummary)[] =
    [];
  subtopicMasteries: Record<string, SubtopicMasterySummaryBackendDict> = {};

  constructor(
    private alertsService: AlertsService,
    private windowDimensionService: WindowDimensionsService,
    private dateTimeFormatService: DateTimeFormatService,
    private focusManagerService: FocusManagerService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private learnerDashboardBackendApiService: LearnerDashboardBackendApiService,
    private loaderService: LoaderService,
    private suggestionModalForLearnerDashboardService: SuggestionModalForLearnerDashboardService,
    private threadStatusDisplayService: ThreadStatusDisplayService,
    private urlInterpolationService: UrlInterpolationService,
    private userService: UserService,
    private translateService: TranslateService,
    private pageTitleService: PageTitleService,
    private learnerGroupBackendApiService: LearnerGroupBackendApiService,
    private urlService: UrlService,
    private platFeatService: PlatformFeatureService
  ) {}

  ngOnInit(): void {
    this.loaderService.showLoadingScreen('Loading');

    let userInfoPromise = this.userService.getUserInfoAsync();
    userInfoPromise.then(userInfo => {
      const username = userInfo.getUsername();
      if (username) {
        this.username = username;
        [this.profilePicturePngDataUrl, this.profilePictureWebpDataUrl] =
          this.userService.getProfileImageDataUrl(username);
      } else {
        this.profilePictureWebpDataUrl =
          this.urlInterpolationService.getStaticImageUrl(
            AppConstants.DEFAULT_PROFILE_IMAGE_WEBP_PATH
          );
        this.profilePicturePngDataUrl =
          this.urlInterpolationService.getStaticImageUrl(
            AppConstants.DEFAULT_PROFILE_IMAGE_PNG_PATH
          );
      }
    });
    this.homeImageUrl = this.getStaticImageUrl('/learner_dashboard/home.svg');
    this.todolistImageUrl = this.getStaticImageUrl(
      '/learner_dashboard/todolist.svg'
    );
    this.progressImageUrl = this.getStaticImageUrl(
      '/learner_dashboard/progress.svg'
    );

    let dashboardTopicAndStoriesDataPromise =
      this.learnerDashboardBackendApiService.fetchLearnerDashboardTopicsAndStoriesDataAsync();
    dashboardTopicAndStoriesDataPromise.then(
      responseData => {
        this.completedStoriesList = responseData.completedStoriesList;
        this.learntTopicsList = responseData.learntTopicsList;
        this.partiallyLearntTopicsList = responseData.partiallyLearntTopicsList;
        this.topicsToLearn = responseData.topicsToLearnList;
        this.untrackedTopics = responseData.untrackedTopics;
        this.allTopics = responseData.allTopicsList;
        this.learntToPartiallyLearntTopics =
          responseData.learntToPartiallyLearntTopics;
        this.activeSection =
          LearnerDashboardPageConstants.LEARNER_DASHBOARD_SECTION_I18N_IDS.HOME;
        this.activeSubsection =
          LearnerDashboardPageConstants.LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.SKILL_PROFICIENCY;
        if (this.urlService.getUrlParams().active_tab === 'learner-groups') {
          this.activeSection =
            LearnerDashboardPageConstants.LEARNER_DASHBOARD_SECTION_I18N_IDS.LEARNER_GROUPS;
        }

        return this.getSubtopicMasteryData();
      },
      errorResponseStatus => {
        if (
          AppConstants.FATAL_ERROR_CODES.indexOf(errorResponseStatus) !== -1
        ) {
          this.alertsService.addWarning(
            'Failed to get learner dashboard topics and stories data'
          );
        }
      }
    );

    let learnerGroupFeatureIsEnabledPromise =
      this.learnerGroupBackendApiService.isLearnerGroupFeatureEnabledAsync();
    learnerGroupFeatureIsEnabledPromise.then(featureIsEnabled => {
      this.LEARNER_GROUP_FEATURE_IS_ENABLED = featureIsEnabled;
    });

    let dashboardCollectionsDataPromise =
      this.learnerDashboardBackendApiService.fetchLearnerDashboardCollectionsDataAsync();
    dashboardCollectionsDataPromise.then(
      responseData => {
        this.completedCollectionsList = responseData.completedCollectionsList;
        this.incompleteCollectionsList = responseData.incompleteCollectionsList;
        this.completedToIncompleteCollections =
          responseData.completedToIncompleteCollections;
        this.collectionPlaylist = responseData.collectionPlaylist;
      },
      errorResponseStatus => {
        if (
          AppConstants.FATAL_ERROR_CODES.indexOf(errorResponseStatus) !== -1
        ) {
          this.alertsService.addWarning(
            'Failed to get learner dashboard collections data'
          );
        }
      }
    );

    let dashboardExplorationsDataPromise =
      this.learnerDashboardBackendApiService.fetchLearnerDashboardExplorationsDataAsync();
    dashboardExplorationsDataPromise.then(
      responseData => {
        this.completedExplorationsList = responseData.completedExplorationsList;
        this.incompleteExplorationsList =
          responseData.incompleteExplorationsList;
        this.subscriptionsList = responseData.subscriptionList;
        this.explorationPlaylist = responseData.explorationPlaylist;
      },
      errorResponseStatus => {
        if (
          AppConstants.FATAL_ERROR_CODES.indexOf(errorResponseStatus) !== -1
        ) {
          this.alertsService.addWarning(
            'Failed to get learner dashboard explorations data'
          );
        }
      }
    );

    Promise.all([
      userInfoPromise,
      dashboardCollectionsDataPromise,
      dashboardExplorationsDataPromise,
      dashboardTopicAndStoriesDataPromise,
      learnerGroupFeatureIsEnabledPromise,
    ])
      .then(() => {
        setTimeout(() => {
          this.loaderService.hideLoadingScreen();
          this.communityLessonsDataLoaded = true;
          this.totalLessonsInPlaylists = [
            ...this.explorationPlaylist,
            ...this.collectionPlaylist,
          ];
          // So that focus is applied after the loading screen has dissapeared.
          this.focusManagerService.setFocusWithoutScroll('ourLessonsBtn');
        }, 0);
      })
      .catch(errorResponse => {
        // This is placed here in order to satisfy Unit tests.
      });

    this.windowIsNarrow = this.windowDimensionService.isWindowNarrow();
    this.directiveSubscriptions.add(
      this.windowDimensionService.getResizeEvent().subscribe(() => {
        this.windowIsNarrow = this.windowDimensionService.isWindowNarrow();
      })
    );
    this.directiveSubscriptions.add(
      this.translateService.onLangChange.subscribe(() => {
        this.setPageTitle();
      })
    );
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }

  getauthorPicturePngDataUrl(username: string): string {
    let [pngImageUrl, _] = this.userService.getProfileImageDataUrl(username);
    return pngImageUrl;
  }

  getauthorPictureWebpDataUrl(username: string): string {
    let [_, webpImageUrl] = this.userService.getProfileImageDataUrl(username);
    return webpImageUrl;
  }

  setPageTitle(): void {
    let translatedTitle = this.translateService.instant(
      'I18N_LEARNER_DASHBOARD_PAGE_TITLE'
    );
    this.pageTitleService.setDocumentTitle(translatedTitle);
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  setActiveSection(newActiveSectionName: string): void {
    this.activeSection = newActiveSectionName;
    if (
      this.activeSection ===
      LearnerDashboardPageConstants.LEARNER_DASHBOARD_SECTION_I18N_IDS
        .COMMUNITY_LESSONS
    ) {
      this.loaderService.showLoadingScreen('Loading');
      let dashboardCollectionsDataPromise =
        this.learnerDashboardBackendApiService.fetchLearnerDashboardCollectionsDataAsync();
      dashboardCollectionsDataPromise.then(
        responseData => {
          this.completedCollectionsList = responseData.completedCollectionsList;
          this.incompleteCollectionsList =
            responseData.incompleteCollectionsList;
          this.completedToIncompleteCollections =
            responseData.completedToIncompleteCollections;
          this.collectionPlaylist = responseData.collectionPlaylist;
        },
        errorResponseStatus => {
          if (
            AppConstants.FATAL_ERROR_CODES.indexOf(errorResponseStatus) !== -1
          ) {
            this.alertsService.addWarning(
              'Failed to get learner dashboard collections data'
            );
          }
        }
      );

      let dashboardExplorationsDataPromise =
        this.learnerDashboardBackendApiService.fetchLearnerDashboardExplorationsDataAsync();
      dashboardExplorationsDataPromise.then(
        responseData => {
          this.completedExplorationsList =
            responseData.completedExplorationsList;
          this.incompleteExplorationsList =
            responseData.incompleteExplorationsList;
          this.subscriptionsList = responseData.subscriptionList;
          this.explorationPlaylist = responseData.explorationPlaylist;
        },
        errorResponseStatus => {
          if (
            AppConstants.FATAL_ERROR_CODES.indexOf(errorResponseStatus) !== -1
          ) {
            this.alertsService.addWarning(
              'Failed to get learner dashboard explorations data'
            );
          }
        }
      );
      Promise.all([
        dashboardCollectionsDataPromise,
        dashboardExplorationsDataPromise,
      ])
        .then(() => {
          setTimeout(() => {
            this.loaderService.hideLoadingScreen();
            this.communityLessonsDataLoaded = true;
            // So that focus is applied after the loading screen has dissapeared.
            this.focusManagerService.setFocusWithoutScroll('ourLessonsBtn');
          }, 0);
        })
        .catch(errorResponse => {
          // This is placed here in order to satisfy Unit tests.
        });
    }
  }

  setActiveSubsection(newActiveSubsectionName: string): void {
    this.activeSubsection = newActiveSubsectionName;
    if (
      this.activeSubsection ===
      LearnerDashboardPageConstants.LEARNER_DASHBOARD_SUBSECTION_I18N_IDS
        .LESSONS
    ) {
      this.loaderService.showLoadingScreen('Loading');
      let dashboardCollectionsDataPromise =
        this.learnerDashboardBackendApiService.fetchLearnerDashboardCollectionsDataAsync();
      dashboardCollectionsDataPromise.then(
        responseData => {
          this.completedCollectionsList = responseData.completedCollectionsList;
          this.incompleteCollectionsList =
            responseData.incompleteCollectionsList;
          this.completedToIncompleteCollections =
            responseData.completedToIncompleteCollections;
          this.collectionPlaylist = responseData.collectionPlaylist;
        },
        errorResponseStatus => {
          if (
            AppConstants.FATAL_ERROR_CODES.indexOf(errorResponseStatus) !== -1
          ) {
            this.alertsService.addWarning(
              'Failed to get learner dashboard collections data'
            );
          }
        }
      );

      let dashboardExplorationsDataPromise =
        this.learnerDashboardBackendApiService.fetchLearnerDashboardExplorationsDataAsync();
      dashboardExplorationsDataPromise.then(
        responseData => {
          this.completedExplorationsList =
            responseData.completedExplorationsList;
          this.incompleteExplorationsList =
            responseData.incompleteExplorationsList;
          this.subscriptionsList = responseData.subscriptionList;
          this.explorationPlaylist = responseData.explorationPlaylist;
        },
        errorResponseStatus => {
          if (
            AppConstants.FATAL_ERROR_CODES.indexOf(errorResponseStatus) !== -1
          ) {
            this.alertsService.addWarning(
              'Failed to get learner dashboard explorations data'
            );
          }
        }
      );
      Promise.all([
        dashboardCollectionsDataPromise,
        dashboardExplorationsDataPromise,
      ])
        .then(() => {
          setTimeout(() => {
            this.loaderService.hideLoadingScreen();
            this.communityLessonsDataLoaded = true;
            // So that focus is applied after the loading screen has dissapeared.
            this.focusManagerService.setFocusWithoutScroll('ourLessonsBtn');
          }, 0);
        })
        .catch(errorResponse => {
          // This is placed here in order to satisfy Unit tests.
        });
    }
  }

  showUsernamePopover(subscriberUsername: string): string {
    // The popover on the subscription card is only shown if the length
    // of the subscriber username is greater than 10 and the user hovers
    // over the truncated username.
    if (subscriberUsername.length > 10) {
      return 'mouseenter';
    } else {
      return 'none';
    }
  }

  showSuggestionModal(
    newContent: string,
    oldContent: string,
    description: string
  ): void {
    this.suggestionModalForLearnerDashboardService.showSuggestionModal(
      'edit_exploration_state_content',
      {
        newContent: newContent,
        oldContent: oldContent,
        description: description,
      }
    );
  }

  getLabelClass(status: string): string {
    return this.threadStatusDisplayService.getLabelClass(status);
  }

  getHumanReadableStatus(status: string): string {
    return this.threadStatusDisplayService.getHumanReadableStatus(status);
  }

  getLocaleAbbreviatedDatetimeString(millisSinceEpoch: number): string {
    return this.dateTimeFormatService.getLocaleAbbreviatedDatetimeString(
      millisSinceEpoch
    );
  }

  decodePngURIData(base64ImageData: string): string {
    return decodeURIComponent(base64ImageData);
  }

  isShowRedesignedLearnerDashboardActive(): boolean {
    return this.platFeatService.status.ShowRedesignedLearnerDashboard.isEnabled;
  }

  getDashboardTabHeading(): string {
    switch (this.activeSection) {
      case LearnerDashboardPageConstants.LEARNER_DASHBOARD_SECTION_I18N_IDS
        .HOME:
        return 'I18N_LEARNER_DASHBOARD_HOME_SECTION_HEADING';
      case LearnerDashboardPageConstants.LEARNER_DASHBOARD_SECTION_I18N_IDS
        .PROGRESS:
        return 'I18N_LEARNER_DASHBOARD_PROGRESS_SECTION_HEADING';
      case LearnerDashboardPageConstants.LEARNER_DASHBOARD_SECTION_I18N_IDS
        .GOALS:
        return 'I18N_LEARNER_DASHBOARD_GOALS_SECTION_HEADING';
      default:
        return `No valid I18N key for heading of ${this.activeSection}`;
    }
  }

  async getSubtopicMasteryData(): Promise<void> {
    this.subtopicMasteries =
      await this.learnerDashboardBackendApiService.fetchSubtopicMastery([
        ...this.partiallyLearntTopicsList.map(topic => topic.id),
        ...this.learntTopicsList.map(topic => topic.id),
      ]);
  }
}
