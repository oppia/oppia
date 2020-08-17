// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the learner's view of a collection.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'attribution-guide.component.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'background-banner.component.ts');
require('components/summary-tile/exploration-summary-tile.directive.ts');

require('domain/collection/CollectionObjectFactory.ts');
require('domain/collection/CollectionPlaythroughObjectFactory.ts');
require('domain/collection/guest-collection-progress.service.ts');
require('domain/collection/read-only-collection-backend-api.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('services/alerts.service.ts');
require('services/page-title.service.ts');
require('services/user.service.ts');
require('services/contextual/url.service.ts');

angular.module('oppia').animation(
  '.oppia-collection-animate-slide', function() {
    return {
      enter: function(element) {
        element.hide().slideDown();
      },
      leave: function(element) {
        element.slideUp();
      }
    };
  });

angular.module('oppia').directive('collectionPlayerPage', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/collection-player-page/collection-player-page.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$anchorScroll', '$http', '$location', '$rootScope', '$scope',
        'AlertsService', 'CollectionObjectFactory',
        'CollectionPlaythroughObjectFactory', 'GuestCollectionProgressService',
        'LoaderService', 'PageTitleService',
        'ReadOnlyCollectionBackendApiService', 'UrlInterpolationService',
        'UrlService', 'UserService',
        'WHITELISTED_COLLECTION_IDS_FOR_SAVING_GUEST_PROGRESS',
        function(
            $anchorScroll, $http, $location, $rootScope, $scope,
            AlertsService, CollectionObjectFactory,
            CollectionPlaythroughObjectFactory, GuestCollectionProgressService,
            LoaderService, PageTitleService,
            ReadOnlyCollectionBackendApiService, UrlInterpolationService,
            UrlService, UserService,
            WHITELISTED_COLLECTION_IDS_FOR_SAVING_GUEST_PROGRESS) {
          var ctrl = this;
          ctrl.getStaticImageUrl = function(imagePath) {
            return UrlInterpolationService.getStaticImageUrl(imagePath);
          };
          ctrl.setIconHighlight = function(index) {
            ctrl.activeHighlightedIconIndex = index;
          };

          ctrl.unsetIconHighlight = function() {
            ctrl.activeHighlightedIconIndex = -1;
          };

          ctrl.togglePreviewCard = function() {
            ctrl.explorationCardIsShown = !ctrl.explorationCardIsShown;
          };

          ctrl.getCollectionNodeForExplorationId = function(explorationId) {
            var collectionNode = (
              ctrl.collection.getCollectionNodeByExplorationId(explorationId));
            if (!collectionNode) {
              AlertsService.addWarning(
                'There was an error loading the collection.');
            }
            return collectionNode;
          };

          ctrl.getNextRecommendedCollectionNodes = function() {
            return ctrl.getCollectionNodeForExplorationId(
              ctrl.collectionPlaythrough.getNextExplorationId());
          };

          ctrl.getCompletedExplorationNodes = function() {
            return ctrl.getCollectionNodeForExplorationId(
              ctrl.collectionPlaythrough.getCompletedExplorationIds());
          };

          ctrl.getNonRecommendedCollectionNodeCount = function() {
            return ctrl.collection.getCollectionNodeCount() - (
              ctrl.collectionPlaythrough.getNextRecommendedCollectionNodeCount(
              ) + ctrl.collectionPlaythrough.getCompletedExplorationNodeCount(
              ));
          };

          ctrl.updateExplorationPreview = function(explorationId) {
            ctrl.explorationCardIsShown = true;
            ctrl.currentExplorationId = explorationId;
            ctrl.summaryToPreview = ctrl.getCollectionNodeForExplorationId(
              explorationId).getExplorationSummaryObject();
          };

          // Calculates the SVG parameters required to draw the curved path.
          ctrl.generatePathParameters = function() {
            // The pathSvgParameters represents the final string of SVG
            // parameters for the bezier curve to be generated. The default
            // parameters represent the first curve ie. lesson 1 to lesson 3.
            ctrl.pathSvgParameters = 'M250 80  C 470 100, 470 280, 250 300';
            var collectionNodeCount = ctrl.collection.getCollectionNodeCount();
            // The sParameterExtension represents the co-ordinates following
            // the 'S' (smooth curve to) command in SVG.
            var sParameterExtension = '';
            ctrl.pathIconParameters = ctrl.generatePathIconParameters();
            if (collectionNodeCount === 1) {
              ctrl.pathSvgParameters = '';
            } else if (collectionNodeCount === 2) {
              ctrl.pathSvgParameters = 'M250 80  C 470 100, 470 280, 250 300';
            } else {
              // The x and y here represent the co-ordinates of the control
              // points for the bezier curve (path).
              var y = 500;
              for (var i = 1; i < Math.floor(collectionNodeCount / 2); i++) {
                var x = (i % 2) ? 30 : 470;
                sParameterExtension += x + ' ' + y + ', ';
                y += 20;
                sParameterExtension += 250 + ' ' + y + ', ';
                y += 200;
              }
              if (sParameterExtension !== '') {
                ctrl.pathSvgParameters += ' S ' + sParameterExtension;
              }
            }
            if (collectionNodeCount % 2 === 0) {
              if (collectionNodeCount === 2) {
                ctrl.svgHeight = ctrl.MIN_HEIGHT_FOR_PATH_SVG_PX;
              } else {
                ctrl.svgHeight = y - ctrl.EVEN_SVG_HEIGHT_OFFSET_PX;
              }
            } else {
              if (collectionNodeCount === 1) {
                ctrl.svgHeight = ctrl.MIN_HEIGHT_FOR_PATH_SVG_PX;
              } else {
                ctrl.svgHeight = y - ctrl.ODD_SVG_HEIGHT_OFFSET_PX;
              }
            }
          };

          ctrl.generatePathIconParameters = function() {
            var collectionNodes = ctrl.collection.getCollectionNodes();
            var iconParametersArray = [];
            iconParametersArray.push({
              thumbnailIconUrl:
                collectionNodes[0].getExplorationSummaryObject(
                ).thumbnail_icon_url.replace('subjects', 'inverted_subjects'),
              left: '225px',
              top: '35px',
              thumbnailBgColor:
                collectionNodes[0].getExplorationSummaryObject(
                ).thumbnail_bg_color
            });

            // Here x and y represent the co-ordinates for the icons in the
            // path.
            var x = ctrl.ICON_X_MIDDLE_PX;
            var y = ctrl.ICON_Y_INITIAL_PX;
            var countMiddleIcon = 1;

            for (var i = 1; i < ctrl.collection.getCollectionNodeCount(); i++) {
              if (countMiddleIcon === 0 && x === ctrl.ICON_X_MIDDLE_PX) {
                x = ctrl.ICON_X_LEFT_PX;
                y += ctrl.ICON_Y_INCREMENT_PX;
                countMiddleIcon = 1;
              } else if (countMiddleIcon === 1 && x === ctrl.ICON_X_MIDDLE_PX) {
                x = ctrl.ICON_X_RIGHT_PX;
                y += ctrl.ICON_Y_INCREMENT_PX;
                countMiddleIcon = 0;
              } else {
                x = ctrl.ICON_X_MIDDLE_PX;
                y += ctrl.ICON_Y_INCREMENT_PX;
              }
              iconParametersArray.push({
                thumbnailIconUrl:
                  collectionNodes[i].getExplorationSummaryObject(
                  ).thumbnail_icon_url.replace('subjects', 'inverted_subjects'),
                left: x + 'px',
                top: y + 'px',
                thumbnailBgColor:
                  collectionNodes[i].getExplorationSummaryObject(
                  ).thumbnail_bg_color
              });
            }
            return iconParametersArray;
          };

          ctrl.getExplorationUrl = function(explorationId) {
            return (
              '/explore/' + explorationId + '?collection_id=' +
              ctrl.collectionId);
          };

          ctrl.getExplorationTitlePosition = function(index) {
            if (index % 2 === 0) {
              return '8px';
            } else if ((index + 1) % 2 === 0 && (index + 1) % 4 !== 0) {
              return '30px';
            } else if ((index + 1) % 4 === 0) {
              return '-40px';
            }
          };

          ctrl.scrollToLocation = function(id) {
            $location.hash(id);
            $anchorScroll();
          };

          ctrl.closeOnClickingOutside = function() {
            ctrl.explorationCardIsShown = false;
          };

          ctrl.onClickStopPropagation = function($evt) {
            $evt.stopPropagation();
          };
          ctrl.$onInit = function() {
            $scope.$watch('$ctrl.collection', function(newValue) {
              if (newValue !== null) {
                ctrl.generatePathParameters();
              }
            }, true);
            LoaderService.showLoadingScreen('Loading');
            ctrl.collection = null;
            ctrl.collectionPlaythrough = null;
            ctrl.collectionId = UrlService.getCollectionIdFromUrl();
            ctrl.explorationCardIsShown = false;
            // The pathIconParameters is an array containing the co-ordinates,
            // background color and icon url for the icons generated on the
            // path.
            ctrl.pathIconParameters = [];
            ctrl.activeHighlightedIconIndex = -1;
            ctrl.MIN_HEIGHT_FOR_PATH_SVG_PX = 220;
            ctrl.ODD_SVG_HEIGHT_OFFSET_PX = 150;
            ctrl.EVEN_SVG_HEIGHT_OFFSET_PX = 280;
            ctrl.ICON_Y_INITIAL_PX = 35;
            ctrl.ICON_Y_INCREMENT_PX = 110;
            ctrl.ICON_X_MIDDLE_PX = 225;
            ctrl.ICON_X_LEFT_PX = 55;
            ctrl.ICON_X_RIGHT_PX = 395;
            ctrl.svgHeight = ctrl.MIN_HEIGHT_FOR_PATH_SVG_PX;
            ctrl.nextExplorationId = null;
            ctrl.whitelistedCollectionIdsForGuestProgress = (
              WHITELISTED_COLLECTION_IDS_FOR_SAVING_GUEST_PROGRESS);
            $anchorScroll.yOffset = -80;

            // Touching anywhere outside the mobile preview should hide it.
            document.addEventListener('touchstart', function() {
              if (ctrl.explorationCardIsShown === true) {
                ctrl.explorationCardIsShown = false;
              }
            });
            $http.get('/collection_handler/data/' + ctrl.collectionId).then(
              function(response) {
                response = response.data;
                angular.element('meta[itemprop="name"]').attr(
                  'content', response.meta_name);
                angular.element('meta[itemprop="description"]').attr(
                  'content', response.meta_description);
                angular.element('meta[property="og:title"]').attr(
                  'content', response.meta_name);
                angular.element('meta[property="og:description"]').attr(
                  'content', response.meta_description);
              }
            );

            $http.get('/collectionsummarieshandler/data', {
              params: {
                stringified_collection_ids: JSON.stringify([ctrl.collectionId])
              }
            }).then(
              function(response) {
                ctrl.collectionSummary = response.data.summaries[0];
              },
              function() {
                AlertsService.addWarning(
                  'There was an error while fetching the collection summary.');
              }
            );

            // Load the collection the learner wants to view.
            ReadOnlyCollectionBackendApiService.loadCollection(
              ctrl.collectionId).then(
              function(collection) {
                ctrl.collection = collection;

                PageTitleService.setPageTitle(
                  ctrl.collection.getTitle() + ' - Oppia');

                // Load the user's current progress in the collection. If the
                // user is a guest, then either the defaults from the server
                // will be used or the user's local progress, if any has been
                // made and the collection is whitelisted.
                var collectionAllowsGuestProgress = (
                  ctrl.whitelistedCollectionIdsForGuestProgress.indexOf(
                    ctrl.collectionId) !== -1);
                UserService.getUserInfoAsync().then(function(userInfo) {
                  LoaderService.hideLoadingScreen();
                  ctrl.isLoggedIn = userInfo.isLoggedIn();
                  if (!ctrl.isLoggedIn && collectionAllowsGuestProgress &&
                      GuestCollectionProgressService
                        .hasCompletedSomeExploration(ctrl.collectionId)) {
                    var completedExplorationIds = (
                      GuestCollectionProgressService.getCompletedExplorationIds(
                        ctrl.collection));
                    var nextExplorationId = (
                      GuestCollectionProgressService.getNextExplorationId(
                        ctrl.collection, completedExplorationIds));
                    ctrl.collectionPlaythrough = (
                      CollectionPlaythroughObjectFactory.create(
                        nextExplorationId, completedExplorationIds));
                  } else {
                    ctrl.collectionPlaythrough = collection.getPlaythrough();
                  }
                  ctrl.nextExplorationId =
                    ctrl.collectionPlaythrough.getNextExplorationId();

                  ctrl.isCompletedExploration = function(explorationId) {
                    var completedExplorationIds = (
                      ctrl.collectionPlaythrough.getCompletedExplorationIds());
                    return completedExplorationIds.indexOf(explorationId) > -1;
                  };
                });
              },
              function() {
                // TODO(bhenning): Handle not being able to load the collection.
                // NOTE TO DEVELOPERS: Check the backend console for an
                // indication as to why this error occurred; sometimes the
                // errors are noisy, so they are not shown to the user.
                AlertsService.addWarning(
                  'There was an error loading the collection.');
              }
            );
          };
        }
      ]
    };
  }
]);
