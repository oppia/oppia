// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Controllers for the creator dashboard.
 */

oppia.constant('LEARNER_DASHBOARD_SECTIONS', {
  INCOMPLETE: 'I18N_LEARNER_DASHBOARD_INCOMPLETE_SECTION',
  COMPLETED: 'I18N_LEARNER_DASHBOARD_COMPLETED_SECTION',
  SUBSCRIPTIONS: 'I18N_LEARNER_DASHBOARD_SUBSCRIPTIONS_SECTION',
  FEEDBACK: 'I18N_LEARNER_DASHBOARD_FEEDBACK_SECTION'
});

oppia.constant('LEARNER_DASHBOARD_SUBSECTIONS', {
  EXPLORATIONS: 'I18N_DASHBOARD_EXPLORATIONS',
  COLLECTIONS: 'I18N_DASHBOARD_COLLECTIONS'
});

oppia.constant('EXPLORATIONS_SORT_BY_KEYS', {
  LAST_PLAYED: 'last_played',
  TITLE: 'title',
  CATEGORY: 'category'
});

oppia.constant('SUBSCRIPTION_SORT_BY_KEYS', {
  USERNAME: 'subscriber_username',
  IMPACT: 'subscriber_impact'
});

oppia.constant('FEEDBACK_THREADS_SORT_BY_KEYS', {
  LAST_UPDATED: 'last_updated',
  EXPLORATION: 'exploration'
});

oppia.constant('HUMAN_READABLE_EXPLORATIONS_SORT_BY_KEYS', {
  LAST_PLAYED: 'I18N_LEARNER_DASHBOARD_EXPLORATIONS_SORT_BY_LAST_PLAYED',
  TITLE: 'I18N_DASHBOARD_EXPLORATIONS_SORT_BY_TITLE ',
  CATEGORY: 'I18N_DASHBOARD_EXPLORATIONS_SORT_BY_CATEGORY'
});

oppia.constant('HUMAN_READABLE_SUBSCRIPTION_SORT_BY_KEYS', {
  USERNAME: 'Username',
  IMPACT: 'Impact'
});

oppia.constant('HUMAN_READABLE_FEEDBACK_THREADS_SORT_BY_KEYS', {
  LAST_UPDATED: 'I18N_DASHBOARD_EXPLORATIONS_SORT_BY_LAST_UPDATED',
  EXPLORATION: 'I18N_DASHBOARD_TABLE_HEADING_EXPLORATION'
});

oppia.controller('LearnerDashboard', [
  '$scope', '$rootScope', '$window', '$http', '$modal',
  'EXPLORATIONS_SORT_BY_KEYS', 'SUBSCRIPTION_SORT_BY_KEYS',
  'HUMAN_READABLE_EXPLORATIONS_SORT_BY_KEYS', 'FATAL_ERROR_CODES',
  'HUMAN_READABLE_SUBSCRIPTION_SORT_BY_KEYS',
  'LearnerDashboardBackendApiService', 'UrlInterpolationService',
  'LEARNER_DASHBOARD_SECTIONS', 'LEARNER_DASHBOARD_SUBSECTIONS',
  'threadStatusDisplayService', 'oppiaDatetimeFormatter',
  'FEEDBACK_THREADS_SORT_BY_KEYS',
  'HUMAN_READABLE_FEEDBACK_THREADS_SORT_BY_KEYS',
  function(
      $scope, $rootScope, $window, $http, $modal, EXPLORATIONS_SORT_BY_KEYS,
      SUBSCRIPTION_SORT_BY_KEYS, HUMAN_READABLE_EXPLORATIONS_SORT_BY_KEYS, 
      FATAL_ERROR_CODES, HUMAN_READABLE_SUBSCRIPTION_SORT_BY_KEYS,
      LearnerDashboardBackendApiService, UrlInterpolationService,
      LEARNER_DASHBOARD_SECTIONS, LEARNER_DASHBOARD_SUBSECTIONS,
      threadStatusDisplayService, oppiaDatetimeFormatter,
      FEEDBACK_THREADS_SORT_BY_KEYS,
      HUMAN_READABLE_FEEDBACK_THREADS_SORT_BY_KEYS) {
    $scope.EXPLORATIONS_SORT_BY_KEYS = EXPLORATIONS_SORT_BY_KEYS;
    $scope.SUBSCRIPTION_SORT_BY_KEYS = SUBSCRIPTION_SORT_BY_KEYS;
    $scope.FEEDBACK_THREADS_SORT_BY_KEYS = FEEDBACK_THREADS_SORT_BY_KEYS;
    $scope.HUMAN_READABLE_EXPLORATIONS_SORT_BY_KEYS = (
      HUMAN_READABLE_EXPLORATIONS_SORT_BY_KEYS);
    $scope.HUMAN_READABLE_SUBSCRIPTION_SORT_BY_KEYS = (
      HUMAN_READABLE_SUBSCRIPTION_SORT_BY_KEYS);
    $scope.HUMAN_READABLE_FEEDBACK_THREADS_SORT_BY_KEYS = (
      HUMAN_READABLE_FEEDBACK_THREADS_SORT_BY_KEYS);
    $scope.LEARNER_DASHBOARD_SECTIONS = LEARNER_DASHBOARD_SECTIONS;
    $scope.LEARNER_DASHBOARD_SUBSECTIONS = LEARNER_DASHBOARD_SUBSECTIONS;
    $scope.getStaticImageUrl = UrlInterpolationService.getStaticImageUrl;
    $scope.PAGE_SIZE = 8;
    $scope.Math = window.Math;
    $scope.newMessage = '';

    $scope.getLabelClass = threadStatusDisplayService.getLabelClass;
    $scope.getHumanReadableStatus = (
      threadStatusDisplayService.getHumanReadableStatus);
    $scope.getLocaleAbbreviatedDatetimeString = (
      oppiaDatetimeFormatter.getLocaleAbbreviatedDatetimeString);

    $scope.setActiveSection = function(newActiveSectionName) {
      $scope.activeSection = newActiveSectionName;
    };

    $scope.setActiveSubSection = function(newActiveSubSectionName) {
      $scope.activeSubSection = newActiveSubSectionName;
    };

    $scope.getExplorationUrl = function(explorationId) {
      return '/explore/' + explorationId;
    };

    $scope.getCollectionUrl = function(collectionId) {
      return '/collection/' + collectionId;
    };

    $scope.checkMobileView = function() {
      return ($window.innerWidth < 500);
    };

    $scope.showUsernamePopover = function(subscriberUsername) {
      // The popover on the subscription card is only shown if the length of
      // the subscriber username is greater than 10 and the user hovers over
      // the truncated username.
      if (subscriberUsername.length > 10) {
        return 'mouseenter';
      } else {
        return 'none';
      }
    };

    $scope.goToPreviousPage = function(section, subsection) {
      if (section === LEARNER_DASHBOARD_SECTIONS.INCOMPLETE) {
        if (subsection === LEARNER_DASHBOARD_SUBSECTIONS.EXPLORATIONS) {
          $scope.startIncompleteExpIndex = Math.max(
            $scope.startIncompleteExpIndex - $scope.PAGE_SIZE, 0);
        } else if (subsection === LEARNER_DASHBOARD_SUBSECTIONS.COLLECTIONS) {
          $scope.startIncompleteCollectionIndex = Math.max(
            $scope.startIncompleteCollectionIndex - $scope.PAGE_SIZE, 0);
        }
      } else if (section === LEARNER_DASHBOARD_SECTIONS.COMPLETED) {
        if (subsection === LEARNER_DASHBOARD_SUBSECTIONS.EXPLORATIONS) {
          $scope.startCompletedExpIndex = Math.max(
            $scope.startCompletedExpIndex - $scope.PAGE_SIZE, 0);
        } else if (subsection === LEARNER_DASHBOARD_SUBSECTIONS.COLLECTIONS) {
          $scope.startCompletedCollectionIndex = Math.max(
            $scope.startCompletedCollectionIndex - $scope.PAGE_SIZE, 0);
        }
      }
    };

    $scope.goToNextPage = function(section, subsection) {
      if (section === LEARNER_DASHBOARD_SECTIONS.INCOMPLETE) {
        if (subsection === LEARNER_DASHBOARD_SUBSECTIONS.EXPLORATIONS) {
          if ($scope.startIncompleteExpIndex +
            $scope.PAGE_SIZE <= $scope.incompleteExplorationsList.length) {
            $scope.startIncompleteExpIndex += $scope.PAGE_SIZE;
          }
        } else if (subsection === LEARNER_DASHBOARD_SUBSECTIONS.COLLECTIONS) {
          if ($scope.startIncompleteCollectionIndex +
            $scope.PAGE_SIZE <= $scope.startIncompleteCollectionIndex.length) {
            $scope.startIncompleteCollectionIndex += $scope.PAGE_SIZE;
          }
        }
      } else if (section === LEARNER_DASHBOARD_SECTIONS.COMPLETED) {
        if (subsection === LEARNER_DASHBOARD_SUBSECTIONS.EXPLORATIONS) {
          if ($scope.startCompletedExpIndex +
            $scope.PAGE_SIZE <= $scope.startCompletedExpIndex.length) {
            $scope.startCompletedExpIndex += $scope.PAGE_SIZE;
          }
        } else if (subsection === LEARNER_DASHBOARD_SUBSECTIONS.COLLECTIONS) {
          if ($scope.startCompletedCollectionIndex +
            $scope.PAGE_SIZE <= $scope.startCompletedCollectionIndex.length) {
            $scope.startCompletedCollectionIndex += $scope.PAGE_SIZE;
          }
        }
      }
    };

    $scope.setExplorationsSortingOptions = function(sortType) {
      if (sortType === $scope.currentExpSortType) {
        $scope.isCurrentExpSortDescending = !$scope.isCurrentExpSortDescending;
      } else {
        $scope.currentExpSortType = sortType;
      }
    };

    $scope.setSubscriptionSortingOptions = function(sortType) {
      if (sortType === $scope.currentSubscriptionSortType) {
        $scope.isCurrentSubscriptionSortDescending = (
          !$scope.isCurrentSubscriptionSortDescending);
      } else {
        $scope.currentSubscriptionSortType = sortType;
      }
    };

    $scope.setFeedbackSortingOptions = function(sortType) {
      if (sortType === $scope.currentFeedbackThreadsSortType) {
        $scope.isCurrentFeedbackSortDescending = (
          !$scope.isCurrentFeedbackSortDescending);
      } else {
        $scope.currentFeedbackThreadsSortType = sortType;
      }
    };

    $scope.sortExplorationFunction = function(entity) {
      // This function is passed as a custom comparator function to `orderBy`,
      // so that special cases can be handled while sorting explorations.
      if ($scope.currentExpSortType === EXPLORATIONS_SORT_BY_KEYS.LAST_PLAYED) {
        return null;
      } else {
        return entity[$scope.currentExpSortType];
      }
    };

    $scope.sortSubscriptionFunction = function(entity) {
      // This function is passed as a custom comparator function to `orderBy`,
      // so that special cases can be handled while sorting subscriptions.
      var value = entity[$scope.currentSubscribersSortType];
      if ($scope.currentSubscribersSortType ===
          SUBSCRIPTION_SORT_BY_KEYS.IMPACT) {
        value = (value || 0);
      }
      return value;
    };

    $scope.sortFeedbackFunction = function(entity) {
      return entity[$scope.currentFeedbackThreadsSortType];
    }

    $scope.onClickThread = function(
      explorationId, threadId, explorationTitle) {
      var threadDataUrl = (
        '/learnerdashboardthreadhandler/' + explorationId + '/' + threadId);
      $scope.threadTitle = explorationTitle;
      $scope.feedbackThreadActive = true;
      $scope.explorationId = explorationId;
      $scope.threadId = threadId;

      for (var index = 0; index < $scope.threadSummaries.length; index++) {
        if ($scope.threadSummaries[index].exploration_id === explorationId &&
            $scope.threadSummaries[index].thread_id === threadId) {
          $scope.threadIndex = index;
          var threadSummary = $scope.threadSummaries[index]
          threadSummary.last_message_read = true;
          if (typeof threadSummary.second_last_message_read !== 'undefined') {
            $scope.threadSummaries[index].second_last_message_read = true;
          }
        }
      }

      $http.get(threadDataUrl).then(function(response) {
        var data = response.data;
        $scope.messageSummaries = data.message_summary_list;
      });
    };

    $scope.backFromThread = function() {
      $scope.feedbackThreadActive = false;
    };

    $scope.addNewMessage = function(explorationId, threadId, newMessage) {
      var url = '/threadhandler/' + explorationId + '/' + threadId;
      var payload = {
        updated_status: null,
        updated_subject: null,
        text: newMessage
      };
      $scope.messageSendingInProgress = true;
      $http.post(url, payload).success(function() {
        var messageSummary = {};
        messageSummary.text = newMessage;
        messageSummary.author_username = $scope.username;
        messageSummary.author_picture_data_url = $scope.profilePictureDataUrl;
        messageSummary.created_on = new Date();
        $scope.messageSummaries.push(messageSummary);
        $scope.threadSummary = $scope.threadSummaries[$scope.threadIndex];
        $scope.threadSummary.last_message_text = newMessage;
        $scope.threadSummary.last_updated = new Date();
        $scope.threadSummary.author_second_last_message = (
          $scope.threadSummary.author_last_message);
        $scope.threadSummary.author_last_message = $scope.username;
        $scope.threadSummary.total_no_of_messages += 1
        $scope.messageSendingInProgress = false;
      });
    };

    $scope.openRemoveEntityModal = function(
      sectionName, subSectionName, entity) {
      $modal.open({
        templateUrl: 'modals/removeEntity',
        backdrop: true,
        resolve: {
          sectionName: function() {
            return sectionName;
          },
          subSectionName: function() {
            return subSectionName;
          },
          entity: function() {
            return entity;
          }
        },
        controller: [
          '$scope', '$modalInstance', '$http', 'sectionName', 'subSectionName',
          function($scope, $modalInstance, $http, sectionName, subSectionName) {
            $scope.sectionName = sectionName;
            $scope.subSectionName = subSectionName;
            $scope.entityTitle = entity.title;

            $scope.remove = function() {
              /* eslint-disable max-len */
              if (subSectionName === LEARNER_DASHBOARD_SUBSECTIONS.EXPLORATIONS) {
              /* eslint-enable max-len */
                $http.post(
                  '/learner_dashboard/remove_in_progress_exploration', {
                    exploration_id: entity.id
                  });
              } else if (
                subSectionName === LEARNER_DASHBOARD_SUBSECTIONS.COLLECTIONS) {
                $http.post('/learner_dashboard/remove_in_progress_collection', {
                  collection_id: entity.id
                });
              }
              $modalInstance.close();
            };

            $scope.cancel = function() {
              $modalInstance.dismiss('cancel');
            };
          }
        ]
      }).result.then(function() {
        if (subSectionName === LEARNER_DASHBOARD_SUBSECTIONS.EXPLORATIONS) {
          var index = $scope.incompleteExplorationsList.indexOf(entity);
          if (index !== -1) {
            $scope.incompleteExplorationsList.splice(index, 1);
          }
        } else if (
          subSectionName === LEARNER_DASHBOARD_SUBSECTIONS.COLLECTIONS) {
          var index = $scope.incompleteCollectionsList.indexOf(entity);
          if (index !== -1) {
            $scope.incompleteCollectionsList.splice(index, 1);
          }
        }
      });
    }

    $rootScope.loadingMessage = 'Loading';
    LearnerDashboardBackendApiService.fetchLearnerDashboardData().then(
      function(response) {
        var responseData = response.data;
        $scope.isCurrentExpSortDescending = true;
        $scope.isCurrentSubscriptionSortDescending = true;
        $scope.isCurrentFeedbackSortDescending = true;
        $scope.currentExpSortType = EXPLORATIONS_SORT_BY_KEYS.LAST_PLAYED;
        $scope.currentSubscribersSortType = SUBSCRIPTION_SORT_BY_KEYS.USERNAME;
        $scope.currentFeedbackThreadsSortType = (
          FEEDBACK_THREADS_SORT_BY_KEYS.LAST_UPDATED);
        $scope.startIncompleteExpIndex = 0;
        $scope.startCompletedExpIndex = 0;
        $scope.startIncompleteCollectionIndex = 0;
        $scope.startCompletedCollectionIndex = 0;
        $scope.completedExplorationsList = (
          responseData.completed_explorations_list
        );
        $scope.completedCollectionsList = (
          responseData.completed_collections_list
        );
        $scope.incompleteExplorationsList = (
          responseData.incomplete_explorations_list
        );
        $scope.incompleteCollectionsList = (
          responseData.incomplete_collections_list
        );
        $scope.subscriptionsList = (
          responseData.subscription_list
        );
        $scope.numberDeletedIncompleteExplorations = (
          responseData.number_of_deleted_activities.incomplete_explorations
        );
        $scope.numberDeletedIncompleteCollections = (
          responseData.number_of_deleted_activities.incomplete_collections
        );
        $scope.numberDeletedCompletedExplorations = (
          responseData.number_of_deleted_activities.completed_explorations
        );
        $scope.numberDeletedCompletedCollections = (
          responseData.number_of_deleted_activities.completed_collections
        );
        $scope.completedToIncompleteCollections = (
          responseData.completed_to_incomplete_collections
        );
        $scope.threadSummaries = responseData.thread_summaries;
        $scope.profilePictureDataUrl = responseData.profile_picture_data_url;
        $scope.username = responseData.username;

        $scope.activeSection = LEARNER_DASHBOARD_SECTIONS.INCOMPLETE;
        $scope.activeSubSection = LEARNER_DASHBOARD_SUBSECTIONS.EXPLORATIONS;
        $scope.feedbackThreadActive = false;

        $scope.noActivity = (
          ($scope.completedExplorationsList.length === 0) &&
          ($scope.completedCollectionsList.length === 0) &&
          ($scope.incompleteExplorationsList.length === 0) &&
          ($scope.incompleteCollectionsList.length === 0));
        $rootScope.loadingMessage = '';
      },
      function(errorResponse) {
        if (FATAL_ERROR_CODES.indexOf(errorResponse.status) !== -1) {
          alertsService.addWarning('Failed to get learner dashboard data');
        }
      }
    );
  }
]).animation('.menu-sub-section', function() {
  var NG_HIDE_CLASS = 'ng-hide';
  return {
    beforeAddClass: function(element, className, done) {
      if(className === NG_HIDE_CLASS) {
        element.slideUp(done);
      }
    },
    removeClass: function(element, className, done) {
      if(className === NG_HIDE_CLASS) {
        element.hide().slideDown(done);
      }
    }
  }
});
