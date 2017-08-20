// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Summary tile for collections.
 */

oppia.constant(
  'COLLECTION_VIEWER_URL', '/collection/<collection_id>');
oppia.constant(
  'COLLECTION_EDITOR_URL', '/collection_editor/create/<collection_id>');

oppia.directive('collectionSummaryTile', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        getCollectionId: '&collectionId',
        getCollectionTitle: '&collectionTitle',
        getObjective: '&objective',
        getNodeCount: '&nodeCount',
        getLastUpdatedMsec: '&lastUpdatedMsec',
        getThumbnailIconUrl: '&thumbnailIconUrl',
        getThumbnailBgColor: '&thumbnailBgColor',
        isLinkedToEditorPage: '=?isLinkedToEditorPage',
        getCategory: '&category',
        playlistMode: '=?playlistMode',
        learnerDashboardActivityIds: '=?learnerDashboardActivityIds',
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/summary_tile/' +
        'collection_summary_tile_directive.html'),
      controller: [
        '$scope', '$http', '$modal', 'oppiaDatetimeFormatter',
        'COLLECTION_VIEWER_URL', 'COLLECTION_EDITOR_URL',
        'UrlInterpolationService', 'alertsService', function(
          $scope, $http, $modal, oppiaDatetimeFormatter,
          COLLECTION_VIEWER_URL, COLLECTION_EDITOR_URL,
          UrlInterpolationService, alertsService) {
          $scope.DEFAULT_EMPTY_TITLE = 'Untitled';
          $scope.collectionType = constants.ACTIVITY_TYPE_COLLECTION;

          $scope.getLastUpdatedDatetime = function() {
            return oppiaDatetimeFormatter.getLocaleAbbreviatedDatetimeString(
              $scope.getLastUpdatedMsec());
          };

          $scope.getCollectionLink = function() {
            var targetUrl = (
              $scope.isLinkedToEditorPage ?
              COLLECTION_EDITOR_URL : COLLECTION_VIEWER_URL);
            return UrlInterpolationService.interpolateUrl(
              targetUrl, {
                collection_id: $scope.getCollectionId()
              }
            );
          };

          $scope.getCompleteThumbnailIconUrl = function () {
            return UrlInterpolationService.getStaticImageUrl(
              $scope.getThumbnailIconUrl());
          };

          $scope.getStaticImageUrl = function (url) {
            return UrlInterpolationService.getStaticImageUrl(url);
          };

          var hoverOverActivity = false;
          var activeActivityId = '';

          $scope.setHoverOverActivity = function(activityId) {
            activeActivityId = activityId;
            hoverOverActivity = !hoverOverActivity;
          };

          $scope.showAddToLearnerPlaylistIcon = function(activityId) {
            if ($scope.learnerDashboardActivityIds) {
              var incompleteCollectionIds = (
                $scope.learnerDashboardActivityIds.incomplete_collection_ids);
              var completedCollectionIds = (
                $scope.learnerDashboardActivityIds.completed_collection_ids);
              var collectionPlaylistIds = (
                $scope.learnerDashboardActivityIds.collection_playlist_ids);

              if (incompleteCollectionIds.indexOf(activityId) !== -1 ||
                  completedCollectionIds.indexOf(activityId) !== -1 ||
                  collectionPlaylistIds.indexOf(activityId) !== -1) {
                return false;
              } else {
                return hoverOverActivity && (activeActivityId == activityId);
              }
            }
          };

          $scope.addToLearnerPlaylist = function(activityType, activityId) {
            var addActivityToLearnerPlaylistUrl = (
              UrlInterpolationService.interpolateUrl(
                '/learnerplaylistactivityhandler/<activityType>/<activityId>', {
                  activityType: activityType,
                  activityId: activityId
                }));
            $http.post(addActivityToLearnerPlaylistUrl, {})
              .then(function(response) {
                if (response.data.belongs_to_completed_or_incomplete_list) {
                  alertsService.addInfoMessage(
                    'You have already completed or are completing this ' +
                    'activity.');
                } else if (response.data.belongs_to_subscribed_activities) {
                  alertsService.addInfoMessage(
                    'This is present in your creator dashboard');
                } else if (response.data.playlist_limit_exceeded) {
                  alertsService.addInfoMessage(
                    'Your \'Play Later\' list is full!  Either you can ' +
                    'complete some or you can head to the learner dashboard ' +
                    'and remove some.');
                } else {
                  alertsService.addSuccessMessage(
                    'Successfully added to your \'Play Later\' list.');
                }
              });

            if (activityType == constants.ACTIVITY_TYPE_COLLECTION) {
              $scope.learnerDashboardActivityIds.collection_playlist_ids.push(
                activityId);
            }
          };

          $scope.removeFromLearnerPlaylist = function(
            activityId, activityType, activityTitle) {
            $modal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/learner_dashboard/' +
                'remove_activity_from_learner_dashboard_modal_directive.html'),
              backdrop: true,
              resolve: {
                activityId: function() {
                  return activityId;
                },
                activityType: function() {
                  return activityType;
                },
                activityTitle: function() {
                  return activityTitle;
                }
              },
              controller: [
                '$scope', '$modalInstance', '$http',
                'UrlInterpolationService', function($scope, $modalInstance,
                  $http, UrlInterpolationService) {
                  $scope.sectionNameI18nId = (
                    'I18N_LEARNER_DASHBOARD_PLAYLIST_SECTION');
                  $scope.activityTitle = activityTitle;
                  var removeFromLearnerPlaylistUrl = (
                    UrlInterpolationService.interpolateUrl(
                      '/learnerplaylistactivityhandler/' +
                      '<activityType>/<activityId>', {
                        activityType: activityType,
                        activityId: activityId
                      }));
                  $scope.remove = function() {
                    $http['delete'](removeFromLearnerPlaylistUrl);
                    $modalInstance.close();
                  };

                  $scope.cancel = function() {
                    $modalInstance.dismiss('cancel');
                  };
                }
              ]
            }).result.then(function() {
              /* eslint-disable max-len */
              if (activityType == constants.ACTIVITY_TYPE_COLLECTION) {
                var index = (
                  $scope.learnerDashboardActivityIds.collection_playlist_ids.indexOf(
                    activityId));
                if (index !== -1) {
                  $scope.learnerDashboardActivityIds.collection_playlist_ids.splice(
                    index, 1);
                }
              }
              /* eslint-enable max-len */
            });
          };
        }
      ]
    };
  }]);
