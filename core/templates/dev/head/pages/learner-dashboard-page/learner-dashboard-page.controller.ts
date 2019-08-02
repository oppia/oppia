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

require(
  'components/common-layout-directives/common-elements/' +
  'background-banner.directive.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'loading-dots.directive.ts');
require('components/summary-tile/collection-summary-tile.directive.ts');
require('components/summary-tile/exploration-summary-tile.directive.ts');
require('filters/string-utility-filters/truncate.filter.ts');

require('directives/angular-html-bind.directive.ts');
require('domain/feedback_message/FeedbackMessageSummaryObjectFactory.ts');
require('domain/feedback_thread/FeedbackThreadSummaryObjectFactory.ts');
require('domain/learner_dashboard/LearnerDashboardBackendApiService.ts');
require(
  'pages/exploration-editor-page/feedback-tab/services/' +
  'thread-status-display.service.ts');
require(
  'pages/learner-dashboard-page/suggestion-modal/' +
  'suggestion-modal-for-learner-dashboard.service.ts');
require('domain/utilities/UrlInterpolationService.ts');
require('services/AlertsService.ts');
require('services/DateTimeFormatService.ts');
require('services/UserService.ts');

require('pages/learner-dashboard-page/learner-dashboard-page.constants.ts');

angular.module('oppia').directive('learnerDashboardPage', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/learner-dashboard-page/learner-dashboard-page.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$scope', '$rootScope', '$q', '$window', '$http', '$uibModal',
        'AlertsService', 'EXPLORATIONS_SORT_BY_KEYS_AND_I18N_IDS',
        'SUBSCRIPTION_SORT_BY_KEYS_AND_I18N_IDS', 'FATAL_ERROR_CODES',
        'LearnerDashboardBackendApiService', 'UrlInterpolationService',
        'LEARNER_DASHBOARD_SECTION_I18N_IDS',
        'LEARNER_DASHBOARD_SUBSECTION_I18N_IDS', 'ThreadStatusDisplayService',
        'DateTimeFormatService', 'FEEDBACK_THREADS_SORT_BY_KEYS_AND_I18N_IDS',
        'FeedbackThreadSummaryObjectFactory',
        'FeedbackMessageSummaryObjectFactory',
        'SuggestionModalForLearnerDashboardService', 'UserService',
        function(
            $scope, $rootScope, $q, $window, $http, $uibModal,
            AlertsService, EXPLORATIONS_SORT_BY_KEYS_AND_I18N_IDS,
            SUBSCRIPTION_SORT_BY_KEYS_AND_I18N_IDS, FATAL_ERROR_CODES,
            LearnerDashboardBackendApiService, UrlInterpolationService,
            LEARNER_DASHBOARD_SECTION_I18N_IDS,
            LEARNER_DASHBOARD_SUBSECTION_I18N_IDS, ThreadStatusDisplayService,
            DateTimeFormatService, FEEDBACK_THREADS_SORT_BY_KEYS_AND_I18N_IDS,
            FeedbackThreadSummaryObjectFactory,
            FeedbackMessageSummaryObjectFactory,
            SuggestionModalForLearnerDashboardService, UserService) {
          var ctrl = this;
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
          ctrl.getStaticImageUrl = UrlInterpolationService.getStaticImageUrl;
          ctrl.PAGE_SIZE = 8;
          ctrl.Math = window.Math;
          UserService.getProfileImageDataUrlAsync().then(function(dataUrl) {
            ctrl.profilePictureDataUrl = dataUrl;
          });

          $rootScope.loadingMessage = 'Loading';
          ctrl.username = '';
          var userInfoPromise = UserService.getUserInfoAsync();
          userInfoPromise.then(function(userInfo) {
            ctrl.username = userInfo.getUsername();
          });

          var dashboardDataPromise = (
            LearnerDashboardBackendApiService.fetchLearnerDashboardData());
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
                responseData.completed_explorations_list
              );
              ctrl.completedCollectionsList = (
                responseData.completed_collections_list
              );
              ctrl.incompleteExplorationsList = (
                responseData.incomplete_explorations_list
              );
              ctrl.incompleteCollectionsList = (
                responseData.incomplete_collections_list
              );
              ctrl.subscriptionsList = (
                responseData.subscription_list
              );
              ctrl.numberNonexistentIncompleteExplorations = (
                responseData.number_of_nonexistent_activities
                  .incomplete_explorations
              );
              ctrl.numberNonexistentIncompleteCollections = (
                responseData.number_of_nonexistent_activities
                  .incomplete_collections
              );
              ctrl.numberNonexistentCompletedExplorations = (
                responseData.number_of_nonexistent_activities
                  .completed_explorations
              );
              ctrl.numberNonexistentCompletedCollections = (
                responseData.number_of_nonexistent_activities
                  .completed_collections
              );
              ctrl.numberNonexistentExplorationsFromPlaylist = (
                responseData.number_of_nonexistent_activities
                  .exploration_playlist
              );
              ctrl.numberNonexistentCollectionsFromPlaylist = (
                responseData.number_of_nonexistent_activities
                  .collection_playlist
              );
              ctrl.completedToIncompleteCollections = (
                responseData.completed_to_incomplete_collections
              );
              var threadSummaryDicts = responseData.thread_summaries;
              ctrl.threadSummaries = [];
              for (var index = 0; index < threadSummaryDicts.length; index++) {
                ctrl.threadSummaries.push(
                  FeedbackThreadSummaryObjectFactory.createFromBackendDict(
                    threadSummaryDicts[index]));
              }
              ctrl.numberOfUnreadThreads =
                responseData.number_of_unread_threads;
              ctrl.explorationPlaylist = responseData.exploration_playlist;
              ctrl.collectionPlaylist = responseData.collection_playlist;
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
            $rootScope.loadingMessage = '';
          });

          ctrl.loadingFeedbacks = false;
          var threadIndex = null;

          ctrl.newMessage = {
            text: ''
          };

          ctrl.getLabelClass = ThreadStatusDisplayService.getLabelClass;
          ctrl.getHumanReadableStatus = (
            ThreadStatusDisplayService.getHumanReadableStatus);
          ctrl.getLocaleAbbreviatedDatetimeString = (
            DateTimeFormatService.getLocaleAbbreviatedDatetimeString);

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
            return ($window.innerWidth < 500);
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
                    ctrl.startIncompleteCollectionIndex.length) {
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
                  ctrl.PAGE_SIZE <= ctrl.startCompletedCollectionIndex.length) {
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
            if (sortType === ctrl.currentSubscriptionSortType) {
              ctrl.isCurrentSubscriptionSortDescending = (
                !ctrl.isCurrentSubscriptionSortDescending);
            } else {
              ctrl.currentSubscriptionSortType = sortType;
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

          ctrl.sortFeedbackThreadsFunction = function(feedbackThread) {
            return feedbackThread[ctrl.currentFeedbackThreadsSortType];
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
                // Making top : 0px to avoid irregular change in position.
                ui.helper.css(
                  {'top': '0 px'});
                /* eslint-enable quote-props */
              },
              update: function(e, ui) {
                var insertExpInLearnerPlaylistUrl = (
                  UrlInterpolationService.interpolateUrl(
                    ('/learnerplaylistactivityhandler/<activityType>/' +
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

          ctrl.collectionPlaylistSortableOptions = getPlaylistSortableOptions(
            constants.ACTIVITY_TYPE_COLLECTION);
          ctrl.explorationPlaylistSortableOptions = getPlaylistSortableOptions(
            constants.ACTIVITY_TYPE_EXPLORATION);

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
                threadSummary.markTheLastTwoMessagesAsRead();
                if (!threadSummary.lastMessageRead) {
                  ctrl.numberOfUnreadThreads -= 1;
                }
              }
            }

            $http.get(threadDataUrl).then(function(response) {
              var messageSummaryDicts = response.data.message_summary_list;
              ctrl.messageSummaries = [];
              for (index = 0; index < messageSummaryDicts.length; index++) {
                ctrl.messageSummaries.push(
                  FeedbackMessageSummaryObjectFactory.createFromBackendDict(
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
            $http.post(url, payload).success(function() {
              ctrl.threadSummary = ctrl.threadSummaries[threadIndex];
              ctrl.threadSummary.appendNewMessage(
                newMessage, ctrl.username);
              ctrl.messageSendingInProgress = false;
              ctrl.newMessage.text = null;
              var newMessageSummary = (
                FeedbackMessageSummaryObjectFactory.createNewMessage(
                  ctrl.threadSummary.totalMessageCount, newMessage,
                  ctrl.username,
                  ctrl.profilePictureDataUrl));
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
                              LEARNER_DASHBOARD_SUBSECTION_I18N_IDS
                                .COLLECTIONS) {
                      activityType = constants.ACTIVITY_TYPE_COLLECTION;
                    } else {
                      throw new Error('Subsection name is not valid.');
                    }

                    var removeActivityUrlPrefix = '';
                    if (sectionNameI18nId ===
                        LEARNER_DASHBOARD_SECTION_I18N_IDS.PLAYLIST) {
                      removeActivityUrlPrefix =
                        '/learnerplaylistactivityhandler/';
                    } else if (sectionNameI18nId ===
                              LEARNER_DASHBOARD_SECTION_I18N_IDS.INCOMPLETE) {
                      removeActivityUrlPrefix =
                        '/learnerincompleteactivityhandler/';
                    } else {
                      throw new Error('Section name is not valid.');
                    }

                    var removeActivityUrl = (
                      UrlInterpolationService.interpolateUrl(
                        removeActivityUrlPrefix +
                        '<activityType>/<activityId>', {
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
                  var index = ctrl.incompleteExplorationsList.indexOf(activity);
                  if (index !== -1) {
                    ctrl.incompleteExplorationsList.splice(index, 1);
                  }
                } else if (subsectionName ===
                          LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.COLLECTIONS) {
                  var index = ctrl.incompleteCollectionsList.indexOf(activity);
                  if (index !== -1) {
                    ctrl.incompleteCollectionsList.splice(index, 1);
                  }
                }
              } else if (sectionNameI18nId ===
                        LEARNER_DASHBOARD_SECTION_I18N_IDS.PLAYLIST) {
                if (subsectionName ===
                    LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS) {
                  var index = ctrl.explorationPlaylist.indexOf(activity);
                  if (index !== -1) {
                    ctrl.explorationPlaylist.splice(index, 1);
                  }
                } else if (subsectionName ===
                          LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.COLLECTIONS) {
                  var index = ctrl.collectionPlaylist.indexOf(activity);
                  if (index !== -1) {
                    ctrl.collectionPlaylist.splice(index, 1);
                  }
                }
              }
            });
          };
        }
      ]};
  }]).animation('.menu-sub-section', function() {
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
