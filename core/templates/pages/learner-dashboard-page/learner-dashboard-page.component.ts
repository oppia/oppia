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

<<<<<<< HEAD
import { Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { SafeResourceUrl } from '@angular/platform-browser';

import { AppConstants } from 'app.constants';
import { LearnerExplorationSummary } from 'domain/summary/learner-exploration-summary.model';
import { CollectionSummary } from 'domain/collection/collection-summary.model';
import { FeedbackThreadSummary } from 'domain/feedback_thread/feedback-thread-summary.model';
import { ProfileSummary } from 'domain/user/profile-summary.model';
import { FeedbackMessageSummary } from 'domain/feedback_message/feedback-message-summary.model';
import { LearnerDashboardBackendApiService } from 'domain/learner_dashboard/learner-dashboard-backend-api.service';
import { LearnerPlaylistBackendApiService } from 'domain/learner_dashboard/learner-playlist-backend-api.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { ThreadStatusDisplayService } from 'pages/exploration-editor-page/feedback-tab/services/thread-status-display.service';
import { SuggestionModalForLearnerDashboardService } from 'pages/learner-dashboard-page/suggestion-modal/suggestion-modal-for-learner-dashboard.service.ts';
import { LearnerDashboardPageConstants } from 'pages/learner-dashboard-page/learner-dashboard-page.constants';
import { AlertsService } from 'services/alerts.service';
import { DeviceInfoService } from 'services/contextual/device-info.service';
import { DateTimeFormatService } from 'services/date-time-format.service';
import { LoaderService } from 'services/loader.service';
import { PngSanitizerService } from 'services/png-sanitizer.service';
import { UserService } from 'services/user.service';


@Component({
  selector: 'learner-dashboard-page',
  templateUrl: './learner-dashboard-page.component.html',
  styleUrls: [],
  animations: [

  ],


  // .animation('.menu-sub-section', function() {
  //   var NG_HIDE_CLASS = 'ng-hide';
  //   return {
  //     beforeAddClass: function(element, className, done) {
  //       if (className === NG_HIDE_CLASS) {
  //         element.slideUp(done);
  //       }
  //     },
  //     removeClass: function(element, className, done) {
  //       if (className === NG_HIDE_CLASS) {
  //         element.hide().slideDown(done);
  //       }
  //     }
  //   };
  // });
  // encapsulation: ViewEncapsulation.None.
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
  profilePictureDataUrl: string;
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
    private learnerDashboardBackendApiService:
      LearnerDashboardBackendApiService,
    private urlInterpolationService: UrlInterpolationService,
    private threadStatusDisplayService: ThreadStatusDisplayService,
    private suggestionModalForLearnerDashboardService:
      SuggestionModalForLearnerDashboardService,
    private alertsService: AlertsService,
    private deviceInfoService: DeviceInfoService,
    private dateTimeFormatService: DateTimeFormatService,
    private loaderService: LoaderService,
    private learnerPlaylistBackendApiService:
      LearnerPlaylistBackendApiService,
    private userService: UserService,
    private pngSanitizerService: PngSanitizerService
  ) {}

  ngOnInit(): void {
    this.userService.getProfileImageDataUrlAsync().then(
      dataUrl => {
        this.profilePictureDataUrl =
          JSON.stringify(this.pngSanitizerService.getTrustedPngResourceUrl(dataUrl));
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
      }, errorResponse => {
        if (
          AppConstants.FATAL_ERROR_CODES.indexOf(errorResponse.status) !== -1) {
          this.alertsService.addWarning(
            'Failed to get learner dashboard data');
=======
require(
  'components/common-layout-directives/common-elements/' +
  'background-banner.component.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'loading-dots.component.ts');
require('components/summary-tile/collection-summary-tile.directive.ts');
require('components/summary-tile/exploration-summary-tile.directive.ts');
require('filters/string-utility-filters/truncate.filter.ts');
require(
  'pages/learner-dashboard-page/modal-templates/' +
  'remove-activity-from-learner-dashboard-modal.controller.ts');

require('directives/angular-html-bind.directive.ts');
require('domain/learner_dashboard/learner-dashboard-backend-api.service.ts');
require(
  'pages/exploration-editor-page/feedback-tab/services/' +
  'thread-status-display.service.ts');
require(
  'pages/learner-dashboard-page/suggestion-modal/' +
  'suggestion-modal-for-learner-dashboard.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('services/alerts.service.ts');
require('services/date-time-format.service.ts');
require('services/user.service.ts');
require('services/stateful/focus-manager.service.ts');
require('pages/learner-dashboard-page/learner-dashboard-page.constants.ajs.ts');

angular.module('oppia').component('learnerDashboardPage', {
  template: require('./learner-dashboard-page.component.html'),
  controller: [
    '$http', '$q', '$rootScope', '$timeout', '$uibModal', '$window',
    'AlertsService', 'DateTimeFormatService', 'DeviceInfoService',
    'FocusManagerService',
    'LearnerDashboardBackendApiService', 'LoaderService',
    'SuggestionModalForLearnerDashboardService',
    'ThreadStatusDisplayService', 'UrlInterpolationService',
    'UserService', 'EXPLORATIONS_SORT_BY_KEYS_AND_I18N_IDS',
    'FATAL_ERROR_CODES', 'FEEDBACK_THREADS_SORT_BY_KEYS_AND_I18N_IDS',
    'LEARNER_DASHBOARD_SECTION_I18N_IDS',
    'LEARNER_DASHBOARD_SUBSECTION_I18N_IDS',
    'SUBSCRIPTION_SORT_BY_KEYS_AND_I18N_IDS',
    function(
        $http, $q, $rootScope, $timeout, $uibModal, $window,
        AlertsService, DateTimeFormatService, DeviceInfoService,
        FocusManagerService,
        LearnerDashboardBackendApiService, LoaderService,
        SuggestionModalForLearnerDashboardService,
        ThreadStatusDisplayService, UrlInterpolationService,
        UserService, EXPLORATIONS_SORT_BY_KEYS_AND_I18N_IDS,
        FATAL_ERROR_CODES, FEEDBACK_THREADS_SORT_BY_KEYS_AND_I18N_IDS,
        LEARNER_DASHBOARD_SECTION_I18N_IDS,
        LEARNER_DASHBOARD_SUBSECTION_I18N_IDS,
        SUBSCRIPTION_SORT_BY_KEYS_AND_I18N_IDS) {
      var ctrl = this;
      var threadIndex = null;

      ctrl.setActiveSection = function(newActiveSectionName) {
        ctrl.activeSection = newActiveSectionName;
        if (ctrl.activeSection ===
          LEARNER_DASHBOARD_SECTION_I18N_IDS.FEEDBACK &&
          ctrl.feedbackThreadActive === true) {
          ctrl.feedbackThreadActive = false;
        }
      };

      ctrl.setActiveSubsection = function(newActiveSubsectionName) {
        ctrl.activeSubsection = newActiveSubsectionName;
      };

      ctrl.getExplorationUrl = function(explorationId) {
        return '/explore/' + explorationId;
      };

      ctrl.getCollectionUrl = function(collectionId) {
        return '/collection/' + collectionId;
      };

      ctrl.checkMobileView = function() {
        return DeviceInfoService.isMobileDevice();
      };

      ctrl.getVisibleExplorationList = function(startCompletedExpIndex) {
        return ctrl.completedExplorationsList.slice(
          startCompletedExpIndex, Math.min(
            startCompletedExpIndex + ctrl.PAGE_SIZE,
            ctrl.completedExplorationsList.length));
      };

      ctrl.showUsernamePopover = function(subscriberUsername) {
        // The popover on the subscription card is only shown if the length
        // of the subscriber username is greater than 10 and the user hovers
        // over the truncated username.
        if (subscriberUsername.length > 10) {
          return 'mouseenter';
        } else {
          return 'none';
        }
      };

      ctrl.goToPreviousPage = function(section, subsection) {
        if (section === LEARNER_DASHBOARD_SECTION_I18N_IDS.INCOMPLETE) {
          if (subsection === (
            LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS)) {
            ctrl.startIncompleteExpIndex = Math.max(
              ctrl.startIncompleteExpIndex - ctrl.PAGE_SIZE, 0);
          } else if (
            subsection === (
              LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.COLLECTIONS)) {
            ctrl.startIncompleteCollectionIndex = Math.max(
              ctrl.startIncompleteCollectionIndex - ctrl.PAGE_SIZE, 0);
          }
        } else if (
          section === LEARNER_DASHBOARD_SECTION_I18N_IDS.COMPLETED) {
          if (subsection === (
            LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS)) {
            ctrl.startCompletedExpIndex = Math.max(
              ctrl.startCompletedExpIndex - ctrl.PAGE_SIZE, 0);
          } else if (
            subsection === (
              LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.COLLECTIONS)) {
            ctrl.startCompletedCollectionIndex = Math.max(
              ctrl.startCompletedCollectionIndex - ctrl.PAGE_SIZE, 0);
          }
        }
      };

      ctrl.goToNextPage = function(section, subsection) {
        if (section === LEARNER_DASHBOARD_SECTION_I18N_IDS.INCOMPLETE) {
          if (subsection === (
            LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS)) {
            if (ctrl.startIncompleteExpIndex +
              ctrl.PAGE_SIZE <= ctrl.incompleteExplorationsList.length) {
              ctrl.startIncompleteExpIndex += ctrl.PAGE_SIZE;
            }
          } else if (
            subsection === (
              LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.COLLECTIONS)) {
            if (ctrl.startIncompleteCollectionIndex +
              ctrl.PAGE_SIZE <=
                ctrl.incompleteCollectionsList.length) {
              ctrl.startIncompleteCollectionIndex += ctrl.PAGE_SIZE;
            }
          }
        } else if (
          section === LEARNER_DASHBOARD_SECTION_I18N_IDS.COMPLETED) {
          if (subsection === (
            LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS)) {
            if (ctrl.startCompletedExpIndex +
              ctrl.PAGE_SIZE <= ctrl.completedExplorationsList.length) {
              ctrl.startCompletedExpIndex += ctrl.PAGE_SIZE;
            }
          } else if (
            subsection === (
              LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.COLLECTIONS)) {
            if (ctrl.startCompletedCollectionIndex +
              ctrl.PAGE_SIZE <= ctrl.completedCollectionsList.length) {
              ctrl.startCompletedCollectionIndex += ctrl.PAGE_SIZE;
            }
          }
        }
      };

      ctrl.setExplorationsSortingOptions = function(sortType) {
        if (sortType === ctrl.currentExpSortType) {
          ctrl.isCurrentExpSortDescending =
            !ctrl.isCurrentExpSortDescending;
        } else {
          ctrl.currentExpSortType = sortType;
>>>>>>> upstream/develop
        }
      }
    );


    Promise.all([userInfoPromise, dashboardDataPromise]).then(() => {
      this.loaderService.hideLoadingScreen();
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

  getExplorationUrl(explorationId: string): string {
    return '/explore/' + explorationId;
  }

  getCollectionUrl(collectionId: string): string {
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
            this.username, this.profilePictureDataUrl));
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
      activity: LearnerExplorationSummary): void {
    this.learnerPlaylistBackendApiService.removeActivityModal(
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
<<<<<<< HEAD
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

  getTrustedSvgResourceUrl(base64ImageData: string): SafeResourceUrl {
    return this.pngSanitizerService.getTrustedPngResourceUrl(base64ImageData);
  }
}

angular.module('oppia').directive(
  'learnerDashboardPage', downgradeComponent(
    {component: LearnerDashboardPageComponent}));
// Dont forget animations.
=======
        }, () => {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        });
      };

      ctrl.getLabelClass = function(status) {
        return ThreadStatusDisplayService.getLabelClass(status);
      };
      ctrl.getHumanReadableStatus = function(status) {
        return ThreadStatusDisplayService.getHumanReadableStatus(status);
      };
      ctrl.getLocaleAbbreviatedDatetimeString = function(millisSinceEpoch) {
        return DateTimeFormatService.getLocaleAbbreviatedDatetimeString(
          millisSinceEpoch);
      };

      ctrl.addFocusWithoutScroll = function(label) {
        FocusManagerService.setFocus(label);
        $timeout(function() {
          $window.scrollTo(0, 0);
        }, 5);
      };

      ctrl.$onInit = function() {
        ctrl.EXPLORATIONS_SORT_BY_KEYS_AND_I18N_IDS = (
          EXPLORATIONS_SORT_BY_KEYS_AND_I18N_IDS);
        ctrl.SUBSCRIPTION_SORT_BY_KEYS_AND_I18N_IDS = (
          SUBSCRIPTION_SORT_BY_KEYS_AND_I18N_IDS);
        ctrl.FEEDBACK_THREADS_SORT_BY_KEYS_AND_I18N_IDS = (
          FEEDBACK_THREADS_SORT_BY_KEYS_AND_I18N_IDS);
        ctrl.LEARNER_DASHBOARD_SECTION_I18N_IDS = (
          LEARNER_DASHBOARD_SECTION_I18N_IDS);
        ctrl.LEARNER_DASHBOARD_SUBSECTION_I18N_IDS = (
          LEARNER_DASHBOARD_SUBSECTION_I18N_IDS);
        ctrl.getStaticImageUrl = function(imagePath) {
          return UrlInterpolationService.getStaticImageUrl(imagePath);
        };
        ctrl.PAGE_SIZE = 8;
        ctrl.Math = window.Math;
        UserService.getProfileImageDataUrlAsync().then(
          function(dataUrl) {
            ctrl.profilePictureDataUrl = dataUrl;
            // TODO(#8521): Remove the use of $rootScope.$apply()
            // once the controller is migrated to angular.
            $rootScope.$applyAsync();
          });

        LoaderService.showLoadingScreen('Loading');
        ctrl.username = '';
        var userInfoPromise = UserService.getUserInfoAsync();
        userInfoPromise.then(function(userInfo) {
          ctrl.username = userInfo.getUsername();
          // TODO(#8521): Remove the use of $rootScope.$apply()
          // once the controller is migrated to angular.
          $rootScope.$applyAsync();
        });

        var dashboardDataPromise = (
          LearnerDashboardBackendApiService.fetchLearnerDashboardDataAsync());
        dashboardDataPromise.then(
          function(responseData) {
            ctrl.isCurrentExpSortDescending = true;
            ctrl.isCurrentSubscriptionSortDescending = true;
            ctrl.isCurrentFeedbackSortDescending = true;
            ctrl.currentExpSortType = (
              EXPLORATIONS_SORT_BY_KEYS_AND_I18N_IDS.LAST_PLAYED.key);
            ctrl.currentSubscribersSortType = (
              SUBSCRIPTION_SORT_BY_KEYS_AND_I18N_IDS.USERNAME.key);
            ctrl.currentFeedbackThreadsSortType = (
              FEEDBACK_THREADS_SORT_BY_KEYS_AND_I18N_IDS.LAST_UPDATED.key);
            ctrl.startIncompleteExpIndex = 0;
            ctrl.startCompletedExpIndex = 0;
            ctrl.startIncompleteCollectionIndex = 0;
            ctrl.startCompletedCollectionIndex = 0;
            ctrl.completedExplorationsList = (
              responseData.completedExplorationsList);
            ctrl.completedCollectionsList = (
              responseData.completedCollectionsList);
            ctrl.incompleteExplorationsList = (
              responseData.incompleteExplorationsList);
            ctrl.incompleteCollectionsList = (
              responseData.incompleteCollectionsList);
            ctrl.subscriptionsList = responseData.subscriptionList;
            ctrl.numberNonexistentIncompleteExplorations = (
              responseData.numberOfNonexistentActivities
                .incompleteExplorations);
            ctrl.numberNonexistentIncompleteCollections = (
              responseData.numberOfNonexistentActivities.incompleteCollections);
            ctrl.numberNonexistentCompletedExplorations = (
              responseData.numberOfNonexistentActivities.completedExplorations);
            ctrl.numberNonexistentCompletedCollections = (
              responseData.numberOfNonexistentActivities.completedCollections);
            ctrl.numberNonexistentExplorationsFromPlaylist = (
              responseData.numberOfNonexistentActivities.explorationPlaylist);
            ctrl.numberNonexistentCollectionsFromPlaylist = (
              responseData.numberOfNonexistentActivities.collectionPlaylist);
            ctrl.completedToIncompleteCollections = (
              responseData.completedToIncompleteCollections);
            ctrl.threadSummaries = responseData.threadSummaries;
            ctrl.numberOfUnreadThreads =
              responseData.numberOfUnreadThreads;
            ctrl.explorationPlaylist = responseData.explorationPlaylist;
            ctrl.collectionPlaylist = responseData.collectionPlaylist;
            ctrl.activeSection =
              LEARNER_DASHBOARD_SECTION_I18N_IDS.INCOMPLETE;
            ctrl.activeSubsection = (
              LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS);
            ctrl.feedbackThreadActive = false;

            ctrl.noExplorationActivity = (
              (ctrl.completedExplorationsList.length === 0) &&
                (ctrl.incompleteExplorationsList.length === 0));
            ctrl.noCollectionActivity = (
              (ctrl.completedCollectionsList.length === 0) &&
                (ctrl.incompleteCollectionsList.length === 0));
            ctrl.noActivity = (
              (ctrl.noExplorationActivity) && (ctrl.noCollectionActivity) &&
              (ctrl.explorationPlaylist.length === 0) &&
              (ctrl.collectionPlaylist.length === 0));
          },
          function(errorResponse) {
            if (FATAL_ERROR_CODES.indexOf(errorResponse.status) !== -1) {
              AlertsService.addWarning(
                'Failed to get learner dashboard data');
            }
          }
        );

        $q.all([userInfoPromise, dashboardDataPromise]).then(function() {
          LoaderService.hideLoadingScreen();
          // The $timeout is required because at execution time,
          // the element may not be present in the DOM yet.Thus it ensure
          // that the element is visible before focussing.
          $timeout(() => {
            ctrl.addFocusWithoutScroll('ourLessonsBtn');
          }, 0);
        });

        ctrl.loadingFeedbacks = false;

        ctrl.newMessage = {
          text: ''
        };
      };
    }
  ]
}).animation('.menu-sub-section', function() {
  var NG_HIDE_CLASS = 'ng-hide';
  return {
    beforeAddClass: function(element, className, done) {
      if (className === NG_HIDE_CLASS) {
        element.slideUp(done);
      }
    },
    removeClass: function(element, className, done) {
      if (className === NG_HIDE_CLASS) {
        element.hide().slideDown(done);
      }
    }
  };
});
>>>>>>> upstream/develop
