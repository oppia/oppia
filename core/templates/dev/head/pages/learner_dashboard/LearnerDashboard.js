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
 * @fileoverview Controllers for the creator dashboard.
 */

oppia.constant('LEARNER_DASHBOARD_SECTION_I18N_IDS', {
  INCOMPLETE: 'I18N_LEARNER_DASHBOARD_INCOMPLETE_SECTION',
  COMPLETED: 'I18N_LEARNER_DASHBOARD_COMPLETED_SECTION',
  SUBSCRIPTIONS: 'I18N_LEARNER_DASHBOARD_SUBSCRIPTIONS_SECTION',
  FEEDBACK: 'I18N_LEARNER_DASHBOARD_FEEDBACK_SECTION',
  PLAYLIST: 'I18N_LEARNER_DASHBOARD_PLAYLIST_SECTION'
});

oppia.constant('LEARNER_DASHBOARD_SUBSECTION_I18N_IDS', {
  EXPLORATIONS: 'I18N_DASHBOARD_EXPLORATIONS',
  COLLECTIONS: 'I18N_DASHBOARD_COLLECTIONS'
});

oppia.constant('EXPLORATIONS_SORT_BY_KEYS_AND_I18N_IDS', {
  LAST_PLAYED: {
    key: 'last_played',
    i18nId: 'I18N_LEARNER_DASHBOARD_EXPLORATIONS_SORT_BY_LAST_PLAYED'
  },
  TITLE: {
    key: 'title',
    i18nId: 'I18N_DASHBOARD_EXPLORATIONS_SORT_BY_TITLE'
  },
  CATEGORY: {
    key: 'category',
    i18nId: 'I18N_DASHBOARD_EXPLORATIONS_SORT_BY_CATEGORY'
  }
});

oppia.constant('SUBSCRIPTION_SORT_BY_KEYS_AND_I18N_IDS', {
  USERNAME: {
    key: 'subscriber_username',
    i18nId: 'I18N_PREFERENCES_USERNAME'
  },
  IMPACT: {
    key: 'subscriber_impact',
    i18nId: 'I18N_CREATOR_IMPACT'
  }
});

oppia.constant('FEEDBACK_THREADS_SORT_BY_KEYS_AND_I18N_IDS', {
  LAST_UPDATED: {
    key: 'last_updated',
    i18nId: 'I18N_DASHBOARD_EXPLORATIONS_SORT_BY_LAST_UPDATED'
  },
  EXPLORATION: {
    key: 'exploration',
    i18nId: 'I18N_DASHBOARD_TABLE_HEADING_EXPLORATION'
  }
});

oppia.controller('LearnerDashboard', [
  '$scope', '$rootScope', '$window', '$http', '$uibModal', 'AlertsService',
  'EXPLORATIONS_SORT_BY_KEYS_AND_I18N_IDS',
  'SUBSCRIPTION_SORT_BY_KEYS_AND_I18N_IDS', 'FATAL_ERROR_CODES',
  'LearnerDashboardBackendApiService', 'UrlInterpolationService',
  'LEARNER_DASHBOARD_SECTION_I18N_IDS',
  'LEARNER_DASHBOARD_SUBSECTION_I18N_IDS', 'ThreadStatusDisplayService',
  'DateTimeFormatService', 'FEEDBACK_THREADS_SORT_BY_KEYS_AND_I18N_IDS',
  'FeedbackThreadSummaryObjectFactory', 'FeedbackMessageSummaryObjectFactory',
  'UserService',
  function(
      $scope, $rootScope, $window, $http, $uibModal, AlertsService,
      EXPLORATIONS_SORT_BY_KEYS_AND_I18N_IDS,
      SUBSCRIPTION_SORT_BY_KEYS_AND_I18N_IDS, FATAL_ERROR_CODES,
      LearnerDashboardBackendApiService, UrlInterpolationService,
      LEARNER_DASHBOARD_SECTION_I18N_IDS,
      LEARNER_DASHBOARD_SUBSECTION_I18N_IDS, ThreadStatusDisplayService,
      DateTimeFormatService, FEEDBACK_THREADS_SORT_BY_KEYS_AND_I18N_IDS,
      FeedbackThreadSummaryObjectFactory, FeedbackMessageSummaryObjectFactory,
      UserService) {
    $scope.EXPLORATIONS_SORT_BY_KEYS_AND_I18N_IDS = (
      EXPLORATIONS_SORT_BY_KEYS_AND_I18N_IDS);
    $scope.SUBSCRIPTION_SORT_BY_KEYS_AND_I18N_IDS = (
      SUBSCRIPTION_SORT_BY_KEYS_AND_I18N_IDS);
    $scope.FEEDBACK_THREADS_SORT_BY_KEYS_AND_I18N_IDS = (
      FEEDBACK_THREADS_SORT_BY_KEYS_AND_I18N_IDS);
    $scope.LEARNER_DASHBOARD_SECTION_I18N_IDS = (
      LEARNER_DASHBOARD_SECTION_I18N_IDS);
    $scope.LEARNER_DASHBOARD_SUBSECTION_I18N_IDS = (
      LEARNER_DASHBOARD_SUBSECTION_I18N_IDS);
    $scope.getStaticImageUrl = UrlInterpolationService.getStaticImageUrl;
    $scope.PAGE_SIZE = 8;
    $scope.Math = window.Math;
    UserService.getProfileImageDataUrlAsync().then(function(dataUrl) {
      $scope.profilePictureDataUrl = dataUrl;
    });
    $scope.username = GLOBALS.username;
    $scope.loadingFeedbacks = false;
    var threadIndex = null;

    $scope.newMessage = {
      text: ''
    };

    $scope.getLabelClass = ThreadStatusDisplayService.getLabelClass;
    $scope.getHumanReadableStatus = (
      ThreadStatusDisplayService.getHumanReadableStatus);
    $scope.getLocaleAbbreviatedDatetimeString = (
      DateTimeFormatService.getLocaleAbbreviatedDatetimeString);

    $scope.setActiveSection = function(newActiveSectionName) {
      $scope.activeSection = newActiveSectionName;
      if ($scope.activeSection ===
        LEARNER_DASHBOARD_SECTION_I18N_IDS.FEEDBACK &&
        $scope.feedbackThreadActive === true) {
        $scope.feedbackThreadActive = false;
      }
    };

    $scope.setActiveSubsection = function(newActiveSubsectionName) {
      $scope.activeSubsection = newActiveSubsectionName;
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

    $scope.getVisibleExplorationList = function(startCompletedExpIndex) {
      return $scope.completedExplorationsList.slice(
        startCompletedExpIndex, Math.min(
          startCompletedExpIndex + $scope.PAGE_SIZE,
          $scope.completedExplorationsList.length));
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
      if (section === LEARNER_DASHBOARD_SECTION_I18N_IDS.INCOMPLETE) {
        if (subsection === LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS) {
          $scope.startIncompleteExpIndex = Math.max(
            $scope.startIncompleteExpIndex - $scope.PAGE_SIZE, 0);
        } else if (
          subsection === LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.COLLECTIONS) {
          $scope.startIncompleteCollectionIndex = Math.max(
            $scope.startIncompleteCollectionIndex - $scope.PAGE_SIZE, 0);
        }
      } else if (section === LEARNER_DASHBOARD_SECTION_I18N_IDS.COMPLETED) {
        if (subsection === LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS) {
          $scope.startCompletedExpIndex = Math.max(
            $scope.startCompletedExpIndex - $scope.PAGE_SIZE, 0);
        } else if (
          subsection === LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.COLLECTIONS) {
          $scope.startCompletedCollectionIndex = Math.max(
            $scope.startCompletedCollectionIndex - $scope.PAGE_SIZE, 0);
        }
      }
    };

    $scope.goToNextPage = function(section, subsection) {
      if (section === LEARNER_DASHBOARD_SECTION_I18N_IDS.INCOMPLETE) {
        if (subsection === LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS) {
          if ($scope.startIncompleteExpIndex +
            $scope.PAGE_SIZE <= $scope.incompleteExplorationsList.length) {
            $scope.startIncompleteExpIndex += $scope.PAGE_SIZE;
          }
        } else if (
          subsection === LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.COLLECTIONS) {
          if ($scope.startIncompleteCollectionIndex +
            $scope.PAGE_SIZE <= $scope.startIncompleteCollectionIndex.length) {
            $scope.startIncompleteCollectionIndex += $scope.PAGE_SIZE;
          }
        }
      } else if (section === LEARNER_DASHBOARD_SECTION_I18N_IDS.COMPLETED) {
        if (subsection === LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS) {
          if ($scope.startCompletedExpIndex +
            $scope.PAGE_SIZE <= $scope.completedExplorationsList.length) {
            $scope.startCompletedExpIndex += $scope.PAGE_SIZE;
          }
        } else if (
          subsection === LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.COLLECTIONS) {
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

    $scope.getValueOfExplorationSortKey = function(exploration) {
      // This function is passed as a custom comparator function to `orderBy`,
      // so that special cases can be handled while sorting explorations.
      if ($scope.currentExpSortType ===
          EXPLORATIONS_SORT_BY_KEYS_AND_I18N_IDS.LAST_PLAYED.key) {
        return null;
      } else {
        return exploration[$scope.currentExpSortType];
      }
    };

    $scope.getValueOfSubscriptionSortKey = function(subscription) {
      // This function is passed as a custom comparator function to `orderBy`,
      // so that special cases can be handled while sorting subscriptions.
      var value = subscription[$scope.currentSubscribersSortType];
      if ($scope.currentSubscribersSortType ===
          SUBSCRIPTION_SORT_BY_KEYS_AND_I18N_IDS.IMPACT.key) {
        value = (value || 0);
      }
      return value;
    };

    $scope.sortFeedbackThreadsFunction = function(feedbackThread) {
      return feedbackThread[$scope.currentFeedbackThreadsSortType];
    };

    var getPlaylistSortableOptions = function(activityType) {
      return {
        'ui-floating': 'auto',
        start: function(e, ui) {
          ui.placeholder.height(ui.item.height());
          $scope.$apply();
        },
        sort: function(e, ui) {
          /* eslint-disable quote-props */
          // Reset the position of the window on scrolling. This keeps the mouse
          // position and elements in sync.
          ui.helper.css(
            {'top': ui.position.top + $(window).scrollTop() + 'px'});
          /* eslint-enable quote-props */
        },
        update: function(e, ui) {
          var insertExpInLearnerPlaylistUrl = (
            UrlInterpolationService.interpolateUrl(
              '/learnerplaylistactivityhandler/<activityType>/<activityId>', {
                activityType: activityType,
                activityId: (
                  $scope.explorationPlaylist[ui.item.sortable.index].id)
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

    $scope.collectionPlaylistSortableOptions = getPlaylistSortableOptions(
      constants.ACTIVITY_TYPE_COLLECTION);
    $scope.explorationPlaylistSortableOptions = getPlaylistSortableOptions(
      constants.ACTIVITY_TYPE_EXPLORATION);

    $scope.onClickThread = function(
        threadStatus, explorationId, threadId, explorationTitle) {
      $scope.loadingFeedbacks = true;
      var threadDataUrl = UrlInterpolationService.interpolateUrl(
        '/learnerdashboardthreadhandler/<threadId>', {
          threadId: threadId
        });
      $scope.explorationTitle = explorationTitle;
      $scope.feedbackThreadActive = true;
      $scope.threadStatus = threadStatus;
      $scope.explorationId = explorationId;
      $scope.threadId = threadId;

      for (var index = 0; index < $scope.threadSummaries.length; index++) {
        if ($scope.threadSummaries[index].threadId === threadId) {
          threadIndex = index;
          var threadSummary = $scope.threadSummaries[index];
          threadSummary.markTheLastTwoMessagesAsRead();
          if (!threadSummary.lastMessageRead) {
            $scope.numberOfUnreadThreads -= 1;
          }
        }
      }

      $http.get(threadDataUrl).then(function(response) {
        var messageSummaryDicts = response.data.message_summary_list;
        $scope.messageSummaries = [];
        for (index = 0; index < messageSummaryDicts.length; index++) {
          $scope.messageSummaries.push(
            FeedbackMessageSummaryObjectFactory.createFromBackendDict(
              messageSummaryDicts[index]));
        }
        $scope.loadingFeedbacks = false;
      });
    };

    $scope.showAllThreads = function() {
      $scope.feedbackThreadActive = false;
      threadIndex = null;
    };

    $scope.addNewMessage = function(threadId, newMessage) {
      var url = UrlInterpolationService.interpolateUrl(
        '/threadhandler/<threadId>', {
          threadId: threadId
        });
      var payload = {
        updated_status: null,
        updated_subject: null,
        text: newMessage
      };
      $scope.messageSendingInProgress = true;
      $http.post(url, payload).success(function() {
        $scope.threadSummary = $scope.threadSummaries[threadIndex];
        $scope.threadSummary.appendNewMessage(
          newMessage, $scope.username);
        $scope.messageSendingInProgress = false;
        $scope.newMessage.text = null;
        var newMessageSummary = (
          FeedbackMessageSummaryObjectFactory.createNewMessage(
            $scope.threadSummary.totalMessageCount, newMessage, $scope.username,
            $scope.profilePictureDataUrl));
        $scope.messageSummaries.push(newMessageSummary);
      });
    };

    $scope.showSuggestionModal = function(newContent, oldContent, description) {
      $uibModal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/' +
          'learner_view_suggestion_modal_directive.html'),
        backdrop: true,
        resolve: {
          newContent: function() {
            return newContent;
          },
          oldContent: function() {
            return oldContent;
          },
          description: function() {
            return description;
          }
        },
        controller: [
          '$scope', '$uibModalInstance', 'newContent', 'oldContent',
          'description',
          function($scope, $uibModalInstance, newContent, oldContent,
              description) {
            $scope.newContent = newContent;
            $scope.oldContent = oldContent;
            $scope.description = description;
            $scope.cancel = function() {
              $uibModalInstance.dismiss('cancel');
            };
          }
        ]
      });
    };

    $scope.openRemoveActivityModal = function(
        sectionNameI18nId, subsectionName, activity) {
      $uibModal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/learner_dashboard/' +
          'remove_activity_from_learner_dashboard_modal_directive.html'),
        backdrop: true,
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
        controller: [
          '$scope', '$uibModalInstance', '$http', 'sectionNameI18nId',
          'subsectionName',
          function(
              $scope, $uibModalInstance, $http, sectionNameI18nId,
              subsectionName) {
            $scope.sectionNameI18nId = sectionNameI18nId;
            $scope.subsectionName = subsectionName;
            $scope.activityTitle = activity.title;
            $scope.remove = function() {
              var activityType = '';
              if (subsectionName ===
                LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS) {
                activityType = constants.ACTIVITY_TYPE_EXPLORATION;
              } else if (subsectionName ===
                         LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.COLLECTIONS) {
                activityType = constants.ACTIVITY_TYPE_COLLECTION;
              } else {
                throw new Error('Subsection name is not valid.');
              }

              var removeActivityUrlPrefix = '';
              if (sectionNameI18nId ===
                  LEARNER_DASHBOARD_SECTION_I18N_IDS.PLAYLIST) {
                removeActivityUrlPrefix = '/learnerplaylistactivityhandler/';
              } else if (sectionNameI18nId ===
                         LEARNER_DASHBOARD_SECTION_I18N_IDS.INCOMPLETE) {
                removeActivityUrlPrefix = '/learnerincompleteactivityhandler/';
              } else {
                throw new Error('Section name is not valid.');
              }

              removeActivityUrl = (
                UrlInterpolationService.interpolateUrl(
                  removeActivityUrlPrefix + '<activityType>/<activityId>', {
                    activityType: activityType,
                    activityId: activity.id
                  }));

              $http['delete'](removeActivityUrl);
              $uibModalInstance.close();
            };

            $scope.cancel = function() {
              $uibModalInstance.dismiss('cancel');
            };
          }
        ]
      }).result.then(function() {
        if (sectionNameI18nId ===
            LEARNER_DASHBOARD_SECTION_I18N_IDS.INCOMPLETE) {
          if (subsectionName ===
              LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS) {
            var index = $scope.incompleteExplorationsList.indexOf(activity);
            if (index !== -1) {
              $scope.incompleteExplorationsList.splice(index, 1);
            }
          } else if (subsectionName ===
                     LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.COLLECTIONS) {
            var index = $scope.incompleteCollectionsList.indexOf(activity);
            if (index !== -1) {
              $scope.incompleteCollectionsList.splice(index, 1);
            }
          }
        } else if (sectionNameI18nId ===
                   LEARNER_DASHBOARD_SECTION_I18N_IDS.PLAYLIST) {
          if (subsectionName ===
              LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS) {
            var index = $scope.explorationPlaylist.indexOf(activity);
            if (index !== -1) {
              $scope.explorationPlaylist.splice(index, 1);
            }
          } else if (subsectionName ===
                     LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.COLLECTIONS) {
            var index = $scope.collectionPlaylist.indexOf(activity);
            if (index !== -1) {
              $scope.collectionPlaylist.splice(index, 1);
            }
          }
        }
      });
    };

    $rootScope.loadingMessage = 'Loading';
    LearnerDashboardBackendApiService.fetchLearnerDashboardData().then(
      function(response) {
        var responseData = response.data;
        $scope.isCurrentExpSortDescending = true;
        $scope.isCurrentSubscriptionSortDescending = true;
        $scope.isCurrentFeedbackSortDescending = true;
        $scope.currentExpSortType = (
          EXPLORATIONS_SORT_BY_KEYS_AND_I18N_IDS.LAST_PLAYED.key);
        $scope.currentSubscribersSortType = (
          SUBSCRIPTION_SORT_BY_KEYS_AND_I18N_IDS.USERNAME.key);
        $scope.currentFeedbackThreadsSortType = (
          FEEDBACK_THREADS_SORT_BY_KEYS_AND_I18N_IDS.LAST_UPDATED.key);
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
        $scope.numberNonexistentIncompleteExplorations = (
          responseData.number_of_nonexistent_activities.incomplete_explorations
        );
        $scope.numberNonexistentIncompleteCollections = (
          responseData.number_of_nonexistent_activities.incomplete_collections
        );
        $scope.numberNonexistentCompletedExplorations = (
          responseData.number_of_nonexistent_activities.completed_explorations
        );
        $scope.numberNonexistentCompletedCollections = (
          responseData.number_of_nonexistent_activities.completed_collections
        );
        $scope.numberNonexistentExplorationsFromPlaylist = (
          responseData.number_of_nonexistent_activities.exploration_playlist
        );
        $scope.numberNonexistentCollectionsFromPlaylist = (
          responseData.number_of_nonexistent_activities.collection_playlist
        );
        $scope.completedToIncompleteCollections = (
          responseData.completed_to_incomplete_collections
        );
        var threadSummaryDicts = responseData.thread_summaries;
        $scope.threadSummaries = [];
        for (var index = 0; index < threadSummaryDicts.length; index++) {
          $scope.threadSummaries.push(
            FeedbackThreadSummaryObjectFactory.createFromBackendDict(
              threadSummaryDicts[index]));
        }
        $scope.numberOfUnreadThreads = responseData.number_of_unread_threads;
        $scope.explorationPlaylist = responseData.exploration_playlist;
        $scope.collectionPlaylist = responseData.collection_playlist;
        $scope.activeSection = LEARNER_DASHBOARD_SECTION_I18N_IDS.INCOMPLETE;
        $scope.activeSubsection = (
          LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS);
        $scope.feedbackThreadActive = false;

        $scope.noExplorationActivity = (
          ($scope.completedExplorationsList.length === 0) &&
            ($scope.incompleteExplorationsList.length === 0));
        $scope.noCollectionActivity = (
          ($scope.completedCollectionsList.length === 0) &&
            ($scope.incompleteCollectionsList.length === 0));
        $scope.noActivity = (
          ($scope.noExplorationActivity) && ($scope.noCollectionActivity) &&
          ($scope.explorationPlaylist.length === 0) &&
          ($scope.collectionPlaylist.length === 0));
        $rootScope.loadingMessage = '';
      },
      function(errorResponse) {
        if (FATAL_ERROR_CODES.indexOf(errorResponse.status) !== -1) {
          AlertsService.addWarning('Failed to get learner dashboard data');
        }
      }
    );
  }
]).animation('.menu-sub-section', function() {
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
