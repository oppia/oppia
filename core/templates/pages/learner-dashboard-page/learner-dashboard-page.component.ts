// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the creator dashboard.
 */
import { FeedbackMessageSummary } from 'domain/feedback_message/feedback-message-summary.model';

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

require('pages/learner-dashboard-page/learner-dashboard-page.constants.ajs.ts');

angular.module('oppia').component('learnerDashboardPage', {
  template: require('./learner-dashboard-page.component.html'),
  controller: [
    '$http', '$q', '$rootScope', '$scope', '$uibModal',
    'AlertsService', 'DateTimeFormatService', 'DeviceInfoService',
    'LearnerDashboardBackendApiService', 'LoaderService',
    'SuggestionModalForLearnerDashboardService',
    'ThreadStatusDisplayService', 'UrlInterpolationService',
    'UserService', 'ACTIVITY_TYPE_COLLECTION',
    'ACTIVITY_TYPE_EXPLORATION', 'EXPLORATIONS_SORT_BY_KEYS_AND_I18N_IDS',
    'FATAL_ERROR_CODES', 'FEEDBACK_THREADS_SORT_BY_KEYS_AND_I18N_IDS',
    'LEARNER_DASHBOARD_SECTION_I18N_IDS',
    'LEARNER_DASHBOARD_SUBSECTION_I18N_IDS',
    'SUBSCRIPTION_SORT_BY_KEYS_AND_I18N_IDS',
    function(
        $http, $q, $rootScope, $scope, $uibModal,
        AlertsService, DateTimeFormatService, DeviceInfoService,
        LearnerDashboardBackendApiService, LoaderService,
        SuggestionModalForLearnerDashboardService,
        ThreadStatusDisplayService, UrlInterpolationService,
        UserService, ACTIVITY_TYPE_COLLECTION,
        ACTIVITY_TYPE_EXPLORATION, EXPLORATIONS_SORT_BY_KEYS_AND_I18N_IDS,
        FATAL_ERROR_CODES, FEEDBACK_THREADS_SORT_BY_KEYS_AND_I18N_IDS,
        LEARNER_DASHBOARD_SECTION_I18N_IDS,
        LEARNER_DASHBOARD_SUBSECTION_I18N_IDS,
        SUBSCRIPTION_SORT_BY_KEYS_AND_I18N_IDS) {
      var ctrl = this;
      var threadIndex = null;

      const DRAG_DELAY_MOBILE_MSEC = 1000;
      const DRAG_DELAY_DESKTOP_MSEC = 0;

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
        }
      };

      ctrl.setSubscriptionSortingOptions = function(sortType) {
        if (sortType === ctrl.currentSubscribersSortType) {
          ctrl.isCurrentSubscriptionSortDescending = (
            !ctrl.isCurrentSubscriptionSortDescending);
        } else {
          ctrl.currentSubscribersSortType = sortType;
        }
      };

      ctrl.setFeedbackSortingOptions = function(sortType) {
        if (sortType === ctrl.currentFeedbackThreadsSortType) {
          ctrl.isCurrentFeedbackSortDescending = (
            !ctrl.isCurrentFeedbackSortDescending);
        } else {
          ctrl.currentFeedbackThreadsSortType = sortType;
        }
      };

      ctrl.getValueOfExplorationSortKey = function(exploration) {
        // This function is passed as a custom comparator function to
        // `orderBy`, so that special cases can be handled while sorting
        // explorations.
        if (ctrl.currentExpSortType ===
            EXPLORATIONS_SORT_BY_KEYS_AND_I18N_IDS.LAST_PLAYED.key) {
          return null;
        } else {
          return exploration[ctrl.currentExpSortType];
        }
      };

      ctrl.getValueOfSubscriptionSortKey = function(subscription) {
        // This function is passed as a custom comparator function to
        // `orderBy`, so that special cases can be handled while sorting
        // subscriptions.
        var value = subscription[ctrl.currentSubscribersSortType];
        if (ctrl.currentSubscribersSortType ===
            SUBSCRIPTION_SORT_BY_KEYS_AND_I18N_IDS.IMPACT.key) {
          value = (value || 0);
        }
        return value;
      };

      var getPlaylistSortableOptions = function(activityType) {
        return {
          'ui-floating': 'auto',
          delay: ctrl.checkMobileView() ?
            DRAG_DELAY_MOBILE_MSEC : DRAG_DELAY_DESKTOP_MSEC,
          start: function(e, ui) {
            ui.placeholder.height(ui.item.height());
            $scope.$apply();
          },
          sort: function(e, ui) {
            // Making top : 0px to avoid irregular change in position.
            ui.helper.css(
              // This throws "Unnecessarily quoted property 'top' found". We
              // need to manually suppress this warning as the 'top' is a css
              // property and we cannot pass it without using quotes around it.
              /* eslint-disable-next-line quote-props */
              {'top': '0 px'});
          },
          update: function(e, ui) {
            var insertExpInLearnerPlaylistUrl = (
              UrlInterpolationService.interpolateUrl((
                '/learnerplaylistactivityhandler/<activityType>/' +
                '<activityId>'), {
                activityType: activityType,
                activityId: (
                  ctrl.explorationPlaylist[ui.item.sortable.index].id)
              }));

            $http.post(insertExpInLearnerPlaylistUrl, {
              index: ui.item.sortable.dropindex
            });
            $scope.$apply();
          },
          stop: function(e, ui) {
            $scope.$apply();
          },
          axis: 'y'
        };
      };

      ctrl.onClickThread = function(
          threadStatus, explorationId, threadId, explorationTitle) {
        ctrl.loadingFeedbacks = true;
        var threadDataUrl = UrlInterpolationService.interpolateUrl(
          '/learnerdashboardthreadhandler/<threadId>', {
            threadId: threadId
          });
        ctrl.explorationTitle = explorationTitle;
        ctrl.feedbackThreadActive = true;
        ctrl.threadStatus = threadStatus;
        ctrl.explorationId = explorationId;
        ctrl.threadId = threadId;

        for (var index = 0; index < ctrl.threadSummaries.length; index++) {
          if (ctrl.threadSummaries[index].threadId === threadId) {
            threadIndex = index;
            var threadSummary = ctrl.threadSummaries[index];
            if (!threadSummary.lastMessageIsRead) {
              ctrl.numberOfUnreadThreads -= 1;
            }
            threadSummary.markTheLastTwoMessagesAsRead();
          }
        }

        $http.get(threadDataUrl).then(function(response) {
          var messageSummaryDicts = response.data.message_summary_list;
          ctrl.messageSummaries = [];
          for (index = 0; index < messageSummaryDicts.length; index++) {
            ctrl.messageSummaries.push(
              FeedbackMessageSummary.createFromBackendDict(
                messageSummaryDicts[index]));
          }
          ctrl.loadingFeedbacks = false;
        });
      };

      ctrl.showAllThreads = function() {
        ctrl.feedbackThreadActive = false;
        threadIndex = null;
      };

      ctrl.addNewMessage = function(threadId, newMessage) {
        var url = UrlInterpolationService.interpolateUrl(
          '/threadhandler/<threadId>', {
            threadId: threadId
          });
        var payload = {
          updated_status: null,
          updated_subject: null,
          text: newMessage
        };
        ctrl.messageSendingInProgress = true;
        $http.post(url, payload).then(function() {
          ctrl.threadSummary = ctrl.threadSummaries[threadIndex];
          ctrl.threadSummary.appendNewMessage(
            newMessage, ctrl.username);
          ctrl.messageSendingInProgress = false;
          ctrl.newMessage.text = null;
          var newMessageSummary = (
            FeedbackMessageSummary.createNewMessage(
              ctrl.threadSummary.totalMessageCount, newMessage,
              ctrl.username, ctrl.profilePictureDataUrl));
          ctrl.messageSummaries.push(newMessageSummary);
        });
      };

      ctrl.showSuggestionModal = function(
          newContent, oldContent, description) {
        SuggestionModalForLearnerDashboardService.showSuggestionModal(
          'edit_exploration_state_content',
          {
            newContent: newContent,
            oldContent: oldContent,
            description: description
          }
        );
      };

      ctrl.openRemoveActivityModal = function(
          sectionNameI18nId, subsectionName, activity) {
        $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/learner-dashboard-page/modal-templates/' +
            'remove-activity-from-learner-dashboard-modal.template.html'),
          backdrop: 'static',
          resolve: {
            sectionNameI18nId: function() {
              return sectionNameI18nId;
            },
            subsectionName: function() {
              return subsectionName;
            },
            activity: function() {
              return activity;
            }
          },
          controller: 'RemoveActivityFromLearnerDashboardModalController'
        }).result.then(function() {
          if (sectionNameI18nId ===
              LEARNER_DASHBOARD_SECTION_I18N_IDS.INCOMPLETE) {
            if (subsectionName ===
                LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS) {
              var index = ctrl.incompleteExplorationsList.findIndex(
                exp => exp.id === activity.id);
              if (index !== -1) {
                ctrl.incompleteExplorationsList.splice(index, 1);
              }
            } else if (subsectionName ===
                      LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.COLLECTIONS) {
              var index = ctrl.incompleteCollectionsList.findIndex(
                collection => collection.id === activity.id);
              if (index !== -1) {
                ctrl.incompleteCollectionsList.splice(index, 1);
              }
            }
          } else if (sectionNameI18nId ===
                    LEARNER_DASHBOARD_SECTION_I18N_IDS.PLAYLIST) {
            if (subsectionName ===
                LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS) {
              var index = ctrl.explorationPlaylist.findIndex(
                exp => exp.id === activity.id);
              if (index !== -1) {
                ctrl.explorationPlaylist.splice(index, 1);
              }
            } else if (subsectionName ===
                      LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.COLLECTIONS) {
              var index = ctrl.collectionPlaylist.findIndex(
                collection => collection.id === activity.id);
              if (index !== -1) {
                ctrl.collectionPlaylist.splice(index, 1);
              }
            }
          }
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
        });

        ctrl.loadingFeedbacks = false;

        ctrl.newMessage = {
          text: ''
        };

        ctrl.collectionPlaylistSortableOptions = getPlaylistSortableOptions(
          ACTIVITY_TYPE_COLLECTION);
        ctrl.explorationPlaylistSortableOptions = (
          getPlaylistSortableOptions(ACTIVITY_TYPE_EXPLORATION));
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
