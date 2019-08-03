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

require('domain/learner_dashboard/LearnerDashboardIconsDirective.ts');
require('filters/string-utility-filters/truncate-and-capitalize.filter.ts');

require('domain/utilities/UrlInterpolationService.ts');
require('services/DateTimeFormatService.ts');
require('services/UserService.ts');

require('components/summary-tile/collection-summary-tile.constants.ajs.ts');

angular.module('oppia').directive('collectionSummaryTile', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        getCollectionId: '&collectionId',
        getCollectionTitle: '&collectionTitle',
        getObjective: '&objective',
        getNodeCount: '&nodeCount',
        getLastUpdatedMsec: '&lastUpdatedMsec',
        getThumbnailIconUrl: '&thumbnailIconUrl',
        getThumbnailBgColor: '&thumbnailBgColor',
        isLinkedToEditorPage: '=?isLinkedToEditorPage',
        getCategory: '&category',
        isPlaylistTile: '&isPlaylistTile',
        showLearnerDashboardIconsIfPossible: (
          '&showLearnerDashboardIconsIfPossible'),
        isContainerNarrow: '&containerIsNarrow',
        isOwnedByCurrentUser: '&activityIsOwnedByCurrentUser',
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/summary-tile/collection-summary-tile.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        'DateTimeFormatService', 'UserService',
        'COLLECTION_VIEWER_URL', 'COLLECTION_EDITOR_URL', function(
            DateTimeFormatService, UserService,
            COLLECTION_VIEWER_URL, COLLECTION_EDITOR_URL) {
          var ctrl = this;
          ctrl.userIsLoggedIn = null;
          UserService.getUserInfoAsync().then(function(userInfo) {
            ctrl.userIsLoggedIn = userInfo.isLoggedIn();
          });
          ctrl.DEFAULT_EMPTY_TITLE = 'Untitled';
          ctrl.ACTIVITY_TYPE_COLLECTION = constants.ACTIVITY_TYPE_COLLECTION;

          ctrl.getLastUpdatedDatetime = function() {
            return DateTimeFormatService.getLocaleAbbreviatedDatetimeString(
              ctrl.getLastUpdatedMsec());
          };

          ctrl.getCollectionLink = function() {
            var targetUrl = (
              ctrl.isLinkedToEditorPage ?
                COLLECTION_EDITOR_URL : COLLECTION_VIEWER_URL);
            return UrlInterpolationService.interpolateUrl(
              targetUrl, {
                collection_id: ctrl.getCollectionId()
              }
            );
          };

          ctrl.getCompleteThumbnailIconUrl = function() {
            return UrlInterpolationService.getStaticImageUrl(
              ctrl.getThumbnailIconUrl());
          };

          ctrl.getStaticImageUrl = function(url) {
            return UrlInterpolationService.getStaticImageUrl(url);
          };

          ctrl.setHoverState = function(hoverState) {
            ctrl.collectionIsCurrentlyHoveredOver = hoverState;
          };
        }
      ]
    };
  }]);
