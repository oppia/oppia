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

import { Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { SafeResourceUrl } from '@angular/platform-browser';
import { trigger, state, style, transition,
  animate, group } from '@angular/animations';

import { AppConstants } from 'app.constants';
import { LearnerExplorationSummary } from 'domain/summary/learner-exploration-summary.model';
import { CollectionSummary } from 'domain/collection/collection-summary.model';
import { FeedbackThreadSummary } from 'domain/feedback_thread/feedback-thread-summary.model';
import { ProfileSummary } from 'domain/user/profile-summary.model';
import { FeedbackMessageSummary } from 'domain/feedback_message/feedback-message-summary.model';
import { LearnerDashboardBackendApiService } from 'domain/learner_dashboard/learner-dashboard-backend-api.service';
import { LearnerDashboardActivityBackendApiService } from 'domain/learner_dashboard/learner-dashboard-activity-backend-api.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { ThreadStatusDisplayService } from 'pages/exploration-editor-page/feedback-tab/services/thread-status-display.service';
import { SuggestionModalForLearnerDashboardService } from 'pages/learner-dashboard-page/suggestion-modal/suggestion-modal-for-learner-dashboard.service';
import { LearnerDashboardPageConstants } from 'pages/learner-dashboard-page/learner-dashboard-page.constants';
import { AlertsService } from 'services/alerts.service';
import { DeviceInfoService } from 'services/contextual/device-info.service';
import { DateTimeFormatService } from 'services/date-time-format.service';
import { LoaderService } from 'services/loader.service';
import { UserService } from 'services/user.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';


@Component({
  selector: 'oppia-learner-dashboard-page',
  templateUrl: './learner-dashboard-page.component.html',
  styleUrls: [],
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
export class LearnerDashboardPageComponent implements OnInit {
  threadIndex: number;

  EXPLORATIONS_SORT_BY_KEYS_AND_I18N_IDS = (
    LearnerDashboardPageConstants.EXPLORATIONS_SORT_BY_KEYS_AND_I18N_IDS);
  SUBSCRIPTION_SORT_BY_KEYS_AND_I18N_IDS = (
    LearnerDashboardPageConstants.SUBSCRIPTION_SORT_BY_KEYS_AND_I18N_IDS);
  FEEDBACK_THREADS_SORT_BY_KEYS_AND_I18N_IDS = (
    LearnerDashboardPageConstants.FEEDBACK_THREADS_SORT_BY_KEYS_AND_I18N_IDS);
  LEARNER_DASHBOARD_SECTION_I18N_IDS = (
    LearnerDashboardPageConstants.LEARNER_DASHBOARD_SECTION_I18N_IDS);
  LEARNER_DASHBOARD_SUBSECTION_I18N_IDS = (
    LearnerDashboardPageConstants.LEARNER_DASHBOARD_SUBSECTION_I18N_IDS);
  PAGE_SIZE = 8;
  Math = window.Math;
  username: string = '';

  isCurrentExpSortDescending: boolean;
  isCurrentSubscriptionSortDescending: boolean;
  isCurrentFeedbackSortDescending: boolean;
  currentExpSortType: string;
  currentSubscribersSortType: string;
  currentFeedbackThreadsSortType: string;
  startIncompleteExpIndex: number;
  startCompletedExpIndex: number;
  startIncompleteCollectionIndex: number;
  startCompletedCollectionIndex: number;

  completedExplorationsList: LearnerExplorationSummary[];
  completedCollectionsList: CollectionSummary[];
  incompleteExplorationsList: LearnerExplorationSummary[];
  incompleteCollectionsList: CollectionSummary[];
  subscriptionsList: ProfileSummary[];

  numberNonexistentIncompleteExplorations: number;
  numberNonexistentIncompleteCollections: number;
  numberNonexistentCompletedExplorations: number;
  numberNonexistentCompletedCollections: number;
  numberNonexistentExplorationsFromPlaylist: number;
  numberNonexistentCollectionsFromPlaylist: number;
  completedToIncompleteCollections: string[];
  threadSummaries: FeedbackThreadSummary[];
  numberOfUnreadThreads: number;
  explorationPlaylist: LearnerExplorationSummary[];
  collectionPlaylist: CollectionSummary[];
  activeSection: string;
  activeSubsection: string;
  feedbackThreadActive: boolean;

  noExplorationActivity: boolean;
  noCollectionActivity: boolean;
  removeIconIsActive: boolean[];
  noActivity: boolean;
  messageSendingInProgress: boolean;
  profilePictureDataUrl: SafeResourceUrl;
  newMessage: {
    'text': string
  };
  loadingFeedbacks: boolean;
  explorationTitle: string;
  threadStatus: string;
  explorationId: string;
  threadId: string;
  messageSummaries: FeedbackMessageSummary[];
  threadSummary: FeedbackThreadSummary;

  constructor(
    private alertsService: AlertsService,
    private deviceInfoService: DeviceInfoService,
    private dateTimeFormatService: DateTimeFormatService,
    private focusManagerService: FocusManagerService,
    private learnerDashboardBackendApiService:
      LearnerDashboardBackendApiService,
    private learnerDashboardActivityBackendApiService:
      LearnerDashboardActivityBackendApiService,
    private loaderService: LoaderService,
    private suggestionModalForLearnerDashboardService:
      SuggestionModalForLearnerDashboardService,
    private threadStatusDisplayService: ThreadStatusDisplayService,
    private urlInterpolationService: UrlInterpolationService,
    private userService: UserService,
  ) {}

  ngOnInit(): void {
    let userProfileImagePromise =
      this.userService.getProfileImageDataUrlAsync();
    userProfileImagePromise.then(
      dataUrl => {
        this.profilePictureDataUrl =
          decodeURIComponent(dataUrl);
      });

    this.loaderService.showLoadingScreen('Loading');

    let userInfoPromise = this.userService.getUserInfoAsync();
    userInfoPromise.then(userInfo => {
      this.username = userInfo.getUsername();
    });

    let dashboardDataPromise = (
      this.learnerDashboardBackendApiService.fetchLearnerDashboardDataAsync());
    dashboardDataPromise.then(
      responseData => {
        this.isCurrentExpSortDescending = true;
        this.isCurrentSubscriptionSortDescending = true;
        this.isCurrentFeedbackSortDescending = true;
        this.currentExpSortType = (
          LearnerDashboardPageConstants
            .EXPLORATIONS_SORT_BY_KEYS_AND_I18N_IDS.LAST_PLAYED.key);
        this.currentSubscribersSortType = (
          LearnerDashboardPageConstants
            .SUBSCRIPTION_SORT_BY_KEYS_AND_I18N_IDS.USERNAME.key);
        this.currentFeedbackThreadsSortType = (
          LearnerDashboardPageConstants
            .FEEDBACK_THREADS_SORT_BY_KEYS_AND_I18N_IDS.LAST_UPDATED.key);
        this.startIncompleteExpIndex = 0;
        this.startCompletedExpIndex = 0;
        this.startIncompleteCollectionIndex = 0;
        this.startCompletedCollectionIndex = 0;
        this.completedExplorationsList = (
          responseData.completedExplorationsList);
        this.completedCollectionsList = (
          responseData.completedCollectionsList);
        this.incompleteExplorationsList = (
          responseData.incompleteExplorationsList);
        this.incompleteCollectionsList = (
          responseData.incompleteCollectionsList);
        this.subscriptionsList = responseData.subscriptionList;
        this.numberNonexistentIncompleteExplorations = (
          responseData.numberOfNonexistentActivities
            .incompleteExplorations);
        this.numberNonexistentIncompleteCollections = (
          responseData.numberOfNonexistentActivities.incompleteCollections);
        this.numberNonexistentCompletedExplorations = (
          responseData.numberOfNonexistentActivities.completedExplorations);
        this.numberNonexistentCompletedCollections = (
          responseData.numberOfNonexistentActivities.completedCollections);
        this.numberNonexistentExplorationsFromPlaylist = (
          responseData.numberOfNonexistentActivities.explorationPlaylist);
        this.numberNonexistentCollectionsFromPlaylist = (
          responseData.numberOfNonexistentActivities.collectionPlaylist);
        this.completedToIncompleteCollections = (
          responseData.completedToIncompleteCollections);
        this.threadSummaries = responseData.threadSummaries;
        this.numberOfUnreadThreads =
          responseData.numberOfUnreadThreads;
        this.explorationPlaylist = responseData.explorationPlaylist;
        this.collectionPlaylist = responseData.collectionPlaylist;
        this.activeSection = (
          LearnerDashboardPageConstants
            .LEARNER_DASHBOARD_SECTION_I18N_IDS.INCOMPLETE);
        this.activeSubsection = (
          LearnerDashboardPageConstants
            .LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS);
        this.feedbackThreadActive = false;

        this.noExplorationActivity = (
          (this.completedExplorationsList.length === 0) &&
            (this.incompleteExplorationsList.length === 0));
        this.noCollectionActivity = (
          (this.completedCollectionsList.length === 0) &&
            (this.incompleteCollectionsList.length === 0));
        this.noActivity = (
          (this.noExplorationActivity) && (this.noCollectionActivity) &&
          (this.explorationPlaylist.length === 0) &&
          (this.collectionPlaylist.length === 0));
      }, errorResponseStatus => {
        if (
          AppConstants.FATAL_ERROR_CODES.indexOf(errorResponseStatus) !== -1) {
          this.alertsService.addWarning(
            'Failed to get learner dashboard data');
        }
      }
    );

    Promise.all([
      userInfoPromise,
      dashboardDataPromise,
    ]).then(() => {
      setTimeout(() => {
        this.loaderService.hideLoadingScreen();
        // So that focus is applied after the loading screen has dissapeared.
        this.focusManagerService.setFocusWithoutScroll('ourLessonsBtn');
      }, 0);
    }).catch(errorResponse => {
      // This is placed here in order to satisfy Unit tests.
    });

    this.loadingFeedbacks = false;

    this.newMessage = {
      text: ''
    };
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  setActiveSection(newActiveSectionName: string): void {
    this.activeSection = newActiveSectionName;
    if (this.activeSection ===
      LearnerDashboardPageConstants
        .LEARNER_DASHBOARD_SECTION_I18N_IDS.FEEDBACK &&
      this.feedbackThreadActive === true) {
      this.feedbackThreadActive = false;
    }
  }

  setActiveSubsection(newActiveSubsectionName: string): void {
    this.activeSubsection = newActiveSubsectionName;
  }

  getExplorationUrl(explorationId?: string): string {
    return '/explore/' + explorationId;
  }

  getCollectionUrl(collectionId?: string): string {
    return '/collection/' + collectionId;
  }

  checkMobileView(): boolean {
    return this.deviceInfoService.isMobileDevice();
  }

  getVisibleExplorationList(
      startCompletedExpIndex: number): LearnerExplorationSummary[] {
    return this.completedExplorationsList.slice(
      startCompletedExpIndex, Math.min(
        startCompletedExpIndex + this.PAGE_SIZE,
        this.completedExplorationsList.length));
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

  goToPreviousPage(section: string, subsection: string): void {
    if (section === LearnerDashboardPageConstants
      .LEARNER_DASHBOARD_SECTION_I18N_IDS.INCOMPLETE) {
      if (subsection === (
        LearnerDashboardPageConstants
          .LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS)) {
        this.startIncompleteExpIndex = Math.max(
          this.startIncompleteExpIndex - this.PAGE_SIZE, 0);
      } else if (
        subsection === (
          LearnerDashboardPageConstants
            .LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.COLLECTIONS)) {
        this.startIncompleteCollectionIndex = Math.max(
          this.startIncompleteCollectionIndex - this.PAGE_SIZE, 0);
      }
    } else if (
      section === LearnerDashboardPageConstants
        .LEARNER_DASHBOARD_SECTION_I18N_IDS.COMPLETED) {
      if (subsection === (
        LearnerDashboardPageConstants
          .LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS)) {
        this.startCompletedExpIndex = Math.max(
          this.startCompletedExpIndex - this.PAGE_SIZE, 0);
      } else if (
        subsection === (
          LearnerDashboardPageConstants
            .LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.COLLECTIONS)) {
        this.startCompletedCollectionIndex = Math.max(
          this.startCompletedCollectionIndex - this.PAGE_SIZE, 0);
      }
    }
  }

  goToNextPage(section: string, subsection: string): void {
    if (section === LearnerDashboardPageConstants
      .LEARNER_DASHBOARD_SECTION_I18N_IDS.INCOMPLETE) {
      if (subsection === (
        LearnerDashboardPageConstants
          .LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS)) {
        if (this.startIncompleteExpIndex +
          this.PAGE_SIZE <= this.incompleteExplorationsList.length) {
          this.startIncompleteExpIndex += this.PAGE_SIZE;
        }
      } else if (
        subsection === (
          LearnerDashboardPageConstants
            .LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.COLLECTIONS)) {
        if (this.startIncompleteCollectionIndex +
          this.PAGE_SIZE <=
            this.incompleteCollectionsList.length) {
          this.startIncompleteCollectionIndex += this.PAGE_SIZE;
        }
      }
    } else if (
      section === LearnerDashboardPageConstants
        .LEARNER_DASHBOARD_SECTION_I18N_IDS.COMPLETED) {
      if (subsection === (
        LearnerDashboardPageConstants
          .LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS)) {
        if (this.startCompletedExpIndex +
          this.PAGE_SIZE <= this.completedExplorationsList.length) {
          this.startCompletedExpIndex += this.PAGE_SIZE;
        }
      } else if (
        subsection === (
          LearnerDashboardPageConstants
            .LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.COLLECTIONS)) {
        if (this.startCompletedCollectionIndex +
          this.PAGE_SIZE <= this.completedCollectionsList.length) {
          this.startCompletedCollectionIndex += this.PAGE_SIZE;
        }
      }
    }
  }

  setExplorationsSortingOptions(sortType: string): void {
    if (sortType === this.currentExpSortType) {
      this.isCurrentExpSortDescending =
        !this.isCurrentExpSortDescending;
    } else {
      this.currentExpSortType = sortType;
    }
  }

  setSubscriptionSortingOptions(sortType: string): void {
    if (sortType === this.currentSubscribersSortType) {
      this.isCurrentSubscriptionSortDescending = (
        !this.isCurrentSubscriptionSortDescending);
    } else {
      this.currentSubscribersSortType = sortType;
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

  getValueOfExplorationSortKey(): string {
    // 'Last Played' is the default sorting operation
    // so we will return 'default' to SortByPipe when Last Played
    // option is selected in the drop down menu.
    if (this.currentExpSortType ===
      LearnerDashboardPageConstants
        .EXPLORATIONS_SORT_BY_KEYS_AND_I18N_IDS.LAST_PLAYED.key) {
      return 'default';
    } else {
      return this.currentExpSortType;
    }
  }

  getValueOfSubscriptionSortKey(): string {
    // 'Username' is the default sorting operation
    // so we will return 'username' to SortByPipe when Username
    // option is selected in the drop down menu.
    return this.currentSubscribersSortType;
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
    this.loadingFeedbacks = true;
    let threadDataUrl = this.urlInterpolationService.interpolateUrl(
      '/learnerdashboardthreadhandler/<threadId>', {
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

    this.learnerDashboardBackendApiService.onClickThreadAsync(threadDataUrl)
      .then((messageSummaryList) => {
        let messageSummaryDicts = messageSummaryList;
        this.messageSummaries = [];
        for (let index = 0; index < messageSummaryDicts.length; index++) {
          this.messageSummaries.push(
            FeedbackMessageSummary.createFromBackendDict(
              messageSummaryDicts[index]));
        }
        this.loadingFeedbacks = false;
      });
  }

  showAllThreads(): void {
    this.feedbackThreadActive = false;
    this.threadIndex = null;
  }

  addNewMessage(threadId: string, newMessage: string): void {
    let url = this.urlInterpolationService.interpolateUrl(
      '/threadhandler/<threadId>', {
        threadId: threadId
      });
    let payload = {
      updated_status: null,
      updated_subject: null,
      text: newMessage
    };
    this.messageSendingInProgress = true;
    this.learnerDashboardBackendApiService
      .addNewMessageAsync(url, payload).then(() => {
        this.threadSummary = this.threadSummaries[this.threadIndex];
        this.threadSummary.appendNewMessage(
          newMessage, this.username);
        this.messageSendingInProgress = false;
        this.newMessage.text = null;
        let newMessageSummary = (
          FeedbackMessageSummary.createNewMessage(
            this.threadSummary.totalMessageCount, newMessage,
            this.username, String(this.profilePictureDataUrl)));
        this.messageSummaries.push(newMessageSummary);
      });
  }

  showSuggestionModal(
      newContent: string, oldContent: string, description: string): void {
    this.suggestionModalForLearnerDashboardService.showSuggestionModal(
      'edit_exploration_state_content',
      {
        newContent: newContent,
        oldContent: oldContent,
        description: description
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
            .LEARNER_DASHBOARD_SECTION_I18N_IDS.INCOMPLETE) {
          if (subsectionName ===
            LearnerDashboardPageConstants
              .LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS) {
            let index = this.incompleteExplorationsList.findIndex(
              exp => exp.id === activity.id);
            if (index !== -1) {
              this.incompleteExplorationsList.splice(index, 1);
            }
          } else if (subsectionName ===
            LearnerDashboardPageConstants
              .LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.COLLECTIONS) {
            let index = this.incompleteCollectionsList.findIndex(
              collection => collection.id === activity.id);
            if (index !== -1) {
              this.incompleteCollectionsList.splice(index, 1);
            }
          }
        } else if (sectionNameI18nId ===
          LearnerDashboardPageConstants
            .LEARNER_DASHBOARD_SECTION_I18N_IDS.PLAYLIST) {
          if (subsectionName ===
            LearnerDashboardPageConstants
              .LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS) {
            let index = this.explorationPlaylist.findIndex(
              exp => exp.id === activity.id);
            if (index !== -1) {
              this.explorationPlaylist.splice(index, 1);
            }
          } else if (subsectionName ===
            LearnerDashboardPageConstants
              .LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.COLLECTIONS) {
            let index = this.collectionPlaylist.findIndex(
              collection => collection.id === activity.id);
            if (index !== -1) {
              this.collectionPlaylist.splice(index, 1);
            }
          }
        }
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

angular.module('oppia').directive(
  'oppiaLearnerDashboardPage', downgradeComponent(
    {component: LearnerDashboardPageComponent}));
