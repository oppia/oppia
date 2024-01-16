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
 * @fileoverview Component for the feedback Updates page.
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { trigger, state, style, transition,
  animate, group } from '@angular/animations';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { AppConstants } from 'app.constants';
import { FeedbackThreadSummary, FeedbackThreadSummaryBackendDict } from 'domain/feedback_thread/feedback-thread-summary.model';
import { FeedbackMessageSummary } from 'domain/feedback_message/feedback-message-summary.model';
import { FeedbackUpdatesBackendApiService } from 'domain/feedback_updates/feedback-updates-backend-api.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { ThreadStatusDisplayService } from 'pages/exploration-editor-page/feedback-tab/services/thread-status-display.service';
import { FeedbackUpdatesPageConstants } from 'pages/feedback-updates-page/feedback-updates-page.constants';
import { AlertsService } from 'services/alerts.service';
import { DateTimeFormatService } from 'services/date-time-format.service';
import { LoaderService } from 'services/loader.service';
import { UserService } from 'services/user.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { PageTitleService } from 'services/page-title.service';
import { UrlService } from 'services/contextual/url.service';

import './feedback-updates-page.component.css';

@Component({
  selector: 'oppia-feedback-updates-page',
  templateUrl: './feedback-updates-page.component.html',
  styleUrls: ['./feedback-updates-page.component.css'],
  animations: [
    trigger('slideInOut', [
      state('true', style({
        'max-height': '500px', opacity: '1', visibility: 'visible'
      })),
      state('false', style({
        'max-height': '0px', opacity: '0', visibility: 'hidden'
      })),
      transition('true => false', [group([
        animate('500ms ease-in-out', style({
          opacity: '0'
        })),
        animate('500ms ease-in-out', style({
          'max-height': '0px'
        })),
        animate('500ms ease-in-out', style({
          visibility: 'hidden'
        }))
      ]
      )]),
      transition('false => true', [group([
        animate('500ms ease-in-out', style({
          visibility: 'visible'
        })),
        animate('500ms ease-in-out', style({
          'max-height': '500px'
        })),
        animate('500ms ease-in-out', style({
          opacity: '1'
        }))
      ]
      )])
    ])
  ]
})
export class FeedbackUpdatesPageComponent implements OnInit, OnDestroy {
  FEEDBACK_THREADS_SORT_BY_KEYS_AND_I18N_IDS = (
    FeedbackUpdatesPageConstants.FEEDBACK_THREADS_SORT_BY_KEYS_AND_I18N_IDS);

  username: string = '';
  PAGES_REGISTERED_WITH_FRONTEND = (
    AppConstants.PAGES_REGISTERED_WITH_FRONTEND);

  DEFAULT_CLASSROOM_URL_FRAGMENT = AppConstants.DEFAULT_CLASSROOM_URL_FRAGMENT;

  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  threadIndex!: number;
  isCurrentFeedbackSortDescending!: boolean;
  currentFeedbackThreadsSortType!: string;
  threadSummaries: FeedbackThreadSummary[] = [];
  numberOfUnreadThreads!: number;
  feedbackThreadActive!: boolean;
  paginatedThreadsList: FeedbackThreadSummaryBackendDict[][] = [];

  messageSendingInProgress!: boolean;
  profilePicturePngDataUrl!: string;
  profilePictureWebpDataUrl!: string;
  newMessage!: {
    'text': string | null;
  };

  loadingFeedback!: boolean;
  explorationTitle!: string;
  threadStatus!: string;
  explorationId!: string;
  threadId!: string;
  messageSummaries!: FeedbackMessageSummary[];
  threadSummary!: FeedbackThreadSummary;
  communityLibraryUrl = (
    '/' + AppConstants.PAGES_REGISTERED_WITH_FRONTEND.LIBRARY_INDEX.ROUTE);

  loadingIndicatorIsShown: boolean = false;
  homeImageUrl: string = '';
  todolistImageUrl: string = '';
  progressImageUrl: string = '';
  windowIsNarrow: boolean = false;
  directiveSubscriptions = new Subscription();

  constructor(
    private alertsService: AlertsService,
    private windowDimensionService: WindowDimensionsService,
    private dateTimeFormatService: DateTimeFormatService,
    private focusManagerService: FocusManagerService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private feedbackUpdatesBackendApiService:
      FeedbackUpdatesBackendApiService,
    private loaderService: LoaderService,
    private threadStatusDisplayService: ThreadStatusDisplayService,
    private urlInterpolationService: UrlInterpolationService,
    private userService: UserService,
    private translateService: TranslateService,
    private pageTitleService: PageTitleService,
    private urlService: UrlService
  ) {}

  ngOnInit(): void {
    this.loaderService.showLoadingScreen('Loading');

    let userInfoPromise = this.userService.getUserInfoAsync();
    userInfoPromise.then(userInfo => {
      const username = userInfo.getUsername();
      if (username) {
        this.username = username;
        [this.profilePicturePngDataUrl, this.profilePictureWebpDataUrl] = (
          this.userService.getProfileImageDataUrl(username));
      } else {
        this.profilePictureWebpDataUrl = (
          this.urlInterpolationService.getStaticImageUrl(
            AppConstants.DEFAULT_PROFILE_IMAGE_WEBP_PATH));
        this.profilePicturePngDataUrl = (
          this.urlInterpolationService.getStaticImageUrl(
            AppConstants.DEFAULT_PROFILE_IMAGE_PNG_PATH));
      }
    });

    this.fetchFeedbackUpdates();

    Promise.all([
      userInfoPromise,
    ]).then(() => {
      setTimeout(() => {
        this.loaderService.hideLoadingScreen();
        // This focus is applied after the loading screen has disappeared.
        this.focusManagerService.setFocusWithoutScroll('ourLessonsBtn');
      }, 0);
    }).catch(errorResponse => {
      // This is placed here in order to satisfy Unit tests.
    });

    this.loadingFeedback = false;

    this.newMessage = {
      text: ''
    };

    this.windowIsNarrow = this.windowDimensionService.isWindowNarrow();
    this.directiveSubscriptions.add(
      this.windowDimensionService.getResizeEvent().subscribe(() => {
        this.windowIsNarrow = this.windowDimensionService.isWindowNarrow();
      }));
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
    let [pngImageUrl, _] = this.userService.getProfileImageDataUrl(
      username);
    return pngImageUrl;
  }

  getauthorPictureWebpDataUrl(username: string): string {
    let [_, webpImageUrl] = this.userService.getProfileImageDataUrl(
      username);
    return webpImageUrl;
  }

  setPageTitle(): void {
    let translatedTitle = this.translateService.instant(
      'I18N_FEEDBACK_UPDATES_PAGE_TITLE');
    this.pageTitleService.setDocumentTitle(translatedTitle);
  }

  fetchFeedbackUpdates(): void {
    this.loadingIndicatorIsShown = true;
    let dashboardFeedbackUpdatesDataPromise = (
      this.feedbackUpdatesBackendApiService
        .fetchFeedbackUpdatesDataAsync(
          this.paginatedThreadsList));
    dashboardFeedbackUpdatesDataPromise.then(
      responseData => {
        this.isCurrentFeedbackSortDescending = true;
        this.currentFeedbackThreadsSortType = (
          FeedbackUpdatesPageConstants
            .FEEDBACK_THREADS_SORT_BY_KEYS_AND_I18N_IDS.LAST_UPDATED.key);
        this.threadSummaries = [
          ... this.threadSummaries,
          ... responseData.threadSummaries];
        this.paginatedThreadsList = responseData.paginatedThreadsList;
        this.numberOfUnreadThreads =
          responseData.numberOfUnreadThreads;
        this.feedbackThreadActive = false;
        this.loadingIndicatorIsShown = false;
      }, errorResponseStatus => {
        this.loadingIndicatorIsShown = false;
        if (
          AppConstants.FATAL_ERROR_CODES.indexOf(errorResponseStatus) !== -1) {
          this.alertsService.addWarning(
            'Failed to get feedback updates data');
        }
      }
    );
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
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

  setFeedbackSortingOptions(sortType: string): void {
    if (sortType === this.currentFeedbackThreadsSortType) {
      this.isCurrentFeedbackSortDescending = (
        !this.isCurrentFeedbackSortDescending);
    } else {
      this.currentFeedbackThreadsSortType = sortType;
    }
  }

  getValueOfFeedbackThreadSortKey(): string {
    // 'Last Updated' is the default sorting operation
    // so we will return 'lastUpdatedMsecs' to SortByPipe when Last Updated
    // option is selected in the drop down menu.
    return this.currentFeedbackThreadsSortType;
  }

  onClickThread(
      threadStatus: string, explorationId: string,
      threadId: string, explorationTitle: string): void {
    this.loadingFeedback = true;
    let threadDataUrl = this.urlInterpolationService.interpolateUrl(
      '/feedbackupdatesthreadhandler/<threadId>', {
        threadId: threadId
      });
    this.explorationTitle = explorationTitle;
    this.feedbackThreadActive = true;
    this.threadStatus = threadStatus;
    this.explorationId = explorationId;
    this.threadId = threadId;

    for (let index = 0; index < this.threadSummaries.length; index++) {
      if (this.threadSummaries[index].threadId === threadId) {
        this.threadIndex = index;
        let threadSummary = this.threadSummaries[index];
        if (!threadSummary.lastMessageIsRead) {
          this.numberOfUnreadThreads -= 1;
        }
        threadSummary.markTheLastTwoMessagesAsRead();
      }
    }

    this.feedbackUpdatesBackendApiService.onClickThreadAsync(threadDataUrl)
      .then((messageSummaryList) => {
        let messageSummaryDicts = messageSummaryList;
        this.messageSummaries = [];
        for (let index = 0; index < messageSummaryDicts.length; index++) {
          this.messageSummaries.push(
            FeedbackMessageSummary.createFromBackendDict(
              messageSummaryDicts[index]));
        }
        this.loadingFeedback = false;
      });
  }

  showAllThreads(): void {
    this.feedbackThreadActive = false;
  }

  addNewMessage(threadId: string, newMessage: string): void {
    let url = this.urlInterpolationService.interpolateUrl(
      '/threadhandler/<threadId>', {
        threadId: threadId
      });
    let payload = {
      updated_status: false,
      updated_subject: null,
      text: newMessage
    };
    this.messageSendingInProgress = true;
    this.feedbackUpdatesBackendApiService
      .addNewMessageAsync(url, payload).then(() => {
        this.threadSummary = this.threadSummaries[this.threadIndex];
        this.threadSummary.appendNewMessage(
          newMessage, this.username);
        this.messageSendingInProgress = false;
        this.newMessage.text = null;
        let newMessageSummary = (
          FeedbackMessageSummary.createNewMessage(
            this.threadSummary.totalMessageCount, newMessage,
            this.username));
        this.messageSummaries.push(newMessageSummary);
      });
  }

  getLabelClass(status: string): string {
    return this.threadStatusDisplayService.getLabelClass(status);
  }

  getHumanReadableStatus(status: string): string {
    return this.threadStatusDisplayService.getHumanReadableStatus(status);
  }

  getLocaleAbbreviatedDatetimeString(millisSinceEpoch: number): string {
    return this.dateTimeFormatService.getLocaleAbbreviatedDatetimeString(
      millisSinceEpoch);
  }

  decodePngURIData(base64ImageData: string): string {
    return decodeURIComponent(base64ImageData);
  }
}

angular.module('oppia').directive('oppiaFeedbackUpdatesPage',
  downgradeComponent({
    component: FeedbackUpdatesPageComponent
  }) as angular.IDirectiveFactory);
