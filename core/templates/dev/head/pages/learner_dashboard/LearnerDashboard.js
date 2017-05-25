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
  SUBSCRIPTIONS: 'I18N_LEARNER_DASHBOARD_SUBSCRIPTIONS_SECTION'
});

oppia.constant('LEARNER_DASHBOARD_SUB_SECTIONS', {
  EXPLORATIONS: 'I18N_DASHBOARD_EXPLORATIONS',
  COLLECTIONS: 'I18N_DASHBOARD_COLLECTIONS'
});

oppia.constant('EXPLORATIONS_SORT_BY_KEYS', {
  TITLE: 'title',
  CATEGORY: 'category'
});

oppia.constant('SUBSCRIPTION_SORT_BY_KEYS', {
  USERNAME: 'subscriber_username',
  IMPACT: 'subscriber_impact'
});

oppia.constant('HUMAN_READABLE_EXPLORATIONS_SORT_BY_KEYS', {
  TITLE: 'I18N_DASHBOARD_EXPLORATIONS_SORT_BY_TITLE ',
  CATEGORY: 'I18N_DASHBOARD_EXPLORATIONS_SORT_BY_CATEGORY',
});

oppia.constant('HUMAN_READABLE_SUBSCRIPTION_SORT_BY_KEYS', {
  USERNAME: 'Username',
  IMPACT: 'Impact'
});

oppia.controller('LearnerDashboard', [
  '$scope', '$rootScope', '$window', '$http', '$modal',
  'EXPLORATIONS_SORT_BY_KEYS', 'SUBSCRIPTION_SORT_BY_KEYS',
  'HUMAN_READABLE_EXPLORATIONS_SORT_BY_KEYS',
  'HUMAN_READABLE_SUBSCRIPTION_SORT_BY_KEYS',
  'LearnerDashboardBackendApiService', 'UrlInterpolationService',
  'LEARNER_DASHBOARD_SECTIONS', 'LEARNER_DASHBOARD_SUB_SECTIONS',
  function(
      $scope, $rootScope, $window, $http, $modal, EXPLORATIONS_SORT_BY_KEYS,
      SUBSCRIPTION_SORT_BY_KEYS, HUMAN_READABLE_EXPLORATIONS_SORT_BY_KEYS, 
      HUMAN_READABLE_SUBSCRIPTION_SORT_BY_KEYS,
      LearnerDashboardBackendApiService, UrlInterpolationService,
      LEARNER_DASHBOARD_SECTIONS, LEARNER_DASHBOARD_SUB_SECTIONS) {
    $scope.EXPLORATIONS_SORT_BY_KEYS = EXPLORATIONS_SORT_BY_KEYS;
    $scope.SUBSCRIPTION_SORT_BY_KEYS = SUBSCRIPTION_SORT_BY_KEYS;
    $scope.HUMAN_READABLE_EXPLORATIONS_SORT_BY_KEYS = (
      HUMAN_READABLE_EXPLORATIONS_SORT_BY_KEYS);
    $scope.HUMAN_READABLE_SUBSCRIPTION_SORT_BY_KEYS = (
      HUMAN_READABLE_SUBSCRIPTION_SORT_BY_KEYS);
    $scope.LEARNER_DASHBOARD_SECTIONS = LEARNER_DASHBOARD_SECTIONS;
    $scope.LEARNER_DASHBOARD_SUB_SECTIONS = LEARNER_DASHBOARD_SUB_SECTIONS;
    $scope.getStaticImageUrl = UrlInterpolationService.getStaticImageUrl;

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

    $scope.setExplorationsSortingOptions = function(sortType) {
      if (sortType === $scope.currentExpSortType) {
        $scope.isCurrentExpSortDescending = !$scope.isCurrentExpSortDescending;
      } else {
        $scope.currentExpSortType = sortType;
      }
      console.log($scope.currentExpSortType);
    };

    $scope.setSubscriptionSortingOptions = function(sortType) {
      if (sortType === $scope.currentSubscriptionSortType) {
        $scope.isCurrentSubscriptionSortDescending = (
          !$scope.isCurrentSubscriptionSortDescending);
      } else {
        $scope.currentSubscriptionSortType = sortType;
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
              if (subSectionName === LEARNER_DASHBOARD_SUB_SECTIONS.EXPLORATIONS) {
              /*eslint-enable */
                $http.post(
                  '/learner_dashboard/remove_in_progress_exploration', {
                    exploration_id: entity.id
                  });
              } else if (
                subSectionName === LEARNER_DASHBOARD_SUB_SECTIONS.COLLECTIONS) {
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
        if (subSectionName === LEARNER_DASHBOARD_SUB_SECTIONS.EXPLORATIONS) {
          var index = $scope.incompleteExplorationsList.indexOf(entity);
          if (index !== -1) {
            $scope.incompleteExplorationsList.splice(index, 1);
          }
        } else if (
          subSectionName === LEARNER_DASHBOARD_SUB_SECTIONS.COLLECTIONS) {
          var index = $scope.incompleteCollectionsList.indexOf(entity);
          if (index !== -1) {
            $scope.incompleteCollectionsList.splice(index, 1);
          }
        }
      })
    }

    $rootScope.loadingMessage = 'Loading';
    LearnerDashboardBackendApiService.fetchLearnerDashboardData().then(
      function(response) {
        var responseData = response.data;
        $scope.currentExpSortType = EXPLORATIONS_SORT_BY_KEYS.TITLE;
        $scope.currentSubscribersSortType = SUBSCRIPTION_SORT_BY_KEYS.USERNAME;
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

        $scope.activeSection = LEARNER_DASHBOARD_SECTIONS.INCOMPLETE;
        $scope.activeSubSection = LEARNER_DASHBOARD_SUB_SECTIONS.EXPLORATIONS;

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
