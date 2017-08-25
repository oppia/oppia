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
        isPlaylistMode: '&playlistMode',
        getLearnerDashboardActivityIds: '&learnerDashboardActivityIds',
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

          var collectionIsActive = false;

          $scope.toggleCollectionIsActive = function() {
            collectionIsActive = !collectionIsActive;
          };

          $scope.canCollectionBeAddedToLearnerPlaylist = function(collectionId) {
            if ($scope.getLearnerDashboardActivityIds()) {
              if ($scope.getLearnerDashboardActivityIds(
                ).belongsToLearnerDashboardActivities(collectionId)) {
                return false;
              } else {
                return collectionIsActive;
              }
            }
          };

          $scope.addToLearnerPlaylist = function(collectionId) {
            var addCollectionToLearnerPlaylistUrl = (
              UrlInterpolationService.interpolateUrl(
                '/learnerplaylistactivityhandler/<activityType>/<collectionId>', {
                  activityType: constants.ACTIVITY_TYPE_COLLECTION,
                  collectionId: collectionId
                }));
            $http.post(addCollectionToLearnerPlaylistUrl, {})
              .then(function(response) {
                var successfullyAdded = true;
                if (response.data.belongs_to_completed_or_incomplete_list) {
                  successfullyAdded = false;
                  alertsService.addInfoMessage(
                    'You have already completed or are completing this ' +
                    'activity.');
                }
                if (response.data.belongs_to_subscribed_activities) {
                  successfullyAdded = false;
                  alertsService.addInfoMessage(
                    'This is present in your creator dashboard');
                }
                if (response.data.playlist_limit_exceeded) {
                  successfullyAdded = false;
                  alertsService.addInfoMessage(
                    'Your \'Play Later\' list is full!  Either you can ' +
                    'complete some or you can head to the learner dashboard ' +
                    'and remove some.');
                }
                if (successfullyAdded) {
                  alertsService.addSuccessMessage(
                    'Successfully added to your \'Play Later\' list.');
                  $scope.getLearnerDashboardActivityIds().addToCollectionLearnerPlaylist(
                    collectionId);
                }
              });
          };

          $scope.removeFromLearnerPlaylist = function(
            collectionId, collectionTitle) {
            $modal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/learner_dashboard/' +
                'remove_activity_from_learner_dashboard_modal_directive.html'),
              backdrop: true,
              resolve: {
                collectionId: function() {
                  return collectionId;
                },
                collectionTitle: function() {
                  return collectionTitle;
                }
              },
              controller: [
                '$scope', '$modalInstance', '$http',
                'UrlInterpolationService', function($scope, $modalInstance,
                  $http, UrlInterpolationService) {
                  $scope.sectionNameI18nId = (
                    'I18N_LEARNER_DASHBOARD_PLAYLIST_SECTION');
                  $scope.collectionTitle = collectionTitle;
                  var removeFromLearnerPlaylistUrl = (
                    UrlInterpolationService.interpolateUrl(
                      '/learnerplaylistactivityhandler/' +
                      '<activityType>/<collectionId>', {
                        activityType: constants.ACTIVITY_TYPE_COLLECTION,
                        collectionId: collectionId
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
              $scope.getLearnerDashboardActivityIds().removeFromCollectionLearnerPlaylist(
                collectionId);
            });
          };
        }
      ]
    };
  }]);
