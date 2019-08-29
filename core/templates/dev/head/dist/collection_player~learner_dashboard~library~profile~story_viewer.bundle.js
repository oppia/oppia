(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["collection_player~learner_dashboard~library~profile~story_viewer"],{

/***/ "./core/templates/dev/head/components/profile-link-directives/circular-image.directive.ts":
/*!************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/profile-link-directives/circular-image.directive.ts ***!
  \************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
 * @fileoverview Displays circled images with linking (when available).
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('oppia').directive('circularImage', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {
                src: '&',
                link: '&?'
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/profile-link-directives/circular-image.directive.html'),
            controllerAs: '$ctrl',
            controller: [function () {
                    var ctrl = this;
                    ctrl.isLinkAvailable = function () {
                        return ctrl.link() ? true : false;
                    };
                }]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/summary-tile/exploration-summary-tile.directive.ts":
/*!***********************************************************************************************!*\
  !*** ./core/templates/dev/head/components/summary-tile/exploration-summary-tile.directive.ts ***!
  \***********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
 * @fileoverview Component for an exploration summary tile.
 */
__webpack_require__(/*! components/profile-link-directives/circular-image.directive.ts */ "./core/templates/dev/head/components/profile-link-directives/circular-image.directive.ts");
__webpack_require__(/*! domain/learner_dashboard/LearnerDashboardIconsDirective.ts */ "./core/templates/dev/head/domain/learner_dashboard/LearnerDashboardIconsDirective.ts");
__webpack_require__(/*! filters/summarize-nonnegative-number.filter.ts */ "./core/templates/dev/head/filters/summarize-nonnegative-number.filter.ts");
__webpack_require__(/*! filters/string-utility-filters/truncate-and-capitalize.filter.ts */ "./core/templates/dev/head/filters/string-utility-filters/truncate-and-capitalize.filter.ts");
__webpack_require__(/*! filters/string-utility-filters/truncate.filter.ts */ "./core/templates/dev/head/filters/string-utility-filters/truncate.filter.ts");
__webpack_require__(/*! components/ratings/rating-computation/rating-computation.service.ts */ "./core/templates/dev/head/components/ratings/rating-computation/rating-computation.service.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/DateTimeFormatService.ts */ "./core/templates/dev/head/services/DateTimeFormatService.ts");
__webpack_require__(/*! services/UserService.ts */ "./core/templates/dev/head/services/UserService.ts");
__webpack_require__(/*! services/contextual/UrlService.ts */ "./core/templates/dev/head/services/contextual/UrlService.ts");
__webpack_require__(/*! services/contextual/WindowDimensionsService.ts */ "./core/templates/dev/head/services/contextual/WindowDimensionsService.ts");
angular.module('oppia').directive('explorationSummaryTile', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {
                getCollectionId: '&collectionId',
                getExplorationId: '&explorationId',
                getExplorationTitle: '&explorationTitle',
                getStoryNodeId: '&nodeId',
                getLastUpdatedMsec: '&lastUpdatedMsec',
                getNumViews: '&numViews',
                getObjective: '&objective',
                getCategory: '&category',
                getRatings: '&ratings',
                getContributorsSummary: '&contributorsSummary',
                getThumbnailIconUrl: '&thumbnailIconUrl',
                getThumbnailBgColor: '&thumbnailBgColor',
                // If this is not null, the new exploration opens in a new window when
                // the summary tile is clicked.
                openInNewWindow: '@openInNewWindow',
                isCommunityOwned: '&isCommunityOwned',
                // If this is not undefined, collection preview tile for mobile
                // will be displayed.
                isCollectionPreviewTile: '@isCollectionPreviewTile',
                // If the screen width is below the threshold defined here, the mobile
                // version of the summary tile is displayed. This attribute is optional:
                // if it is not specified, it is treated as 0, which means that the
                // desktop version of the summary tile is always displayed.
                mobileCutoffPx: '@mobileCutoffPx',
                isPlaylistTile: '&isPlaylistTile',
                getParentExplorationIds: '&parentExplorationIds',
                showLearnerDashboardIconsIfPossible: ('&showLearnerDashboardIconsIfPossible'),
                isContainerNarrow: '&containerIsNarrow',
                isOwnedByCurrentUser: '&activityIsOwnedByCurrentUser',
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/summary-tile/exploration-summary-tile.directive.html'),
            link: function (scope, element) {
                element.find('.exploration-summary-avatars').on('mouseenter', function () {
                    element.find('.mask').attr('class', 'exploration-summary-tile-mask mask');
                    // As animation duration time may be 400ms, .stop(true) is used to
                    // prevent the effects queue falling behind the mouse movement.
                    // .hide(1) and .show(1) used to place the animation in the effects
                    // queue.
                    element.find('.avatars-num-minus-one').stop(true).hide(1, function () {
                        element.find('.all-avatars').stop(true).slideDown();
                    });
                });
                element.find('.exploration-summary-avatars').on('mouseleave', function () {
                    element.find('.mask').attr('class', 'top-section-mask mask');
                    element.find('.all-avatars').stop(true).slideUp(400, function () {
                        element.find('.avatars-num-minus-one').stop(true).show(1);
                    });
                });
            },
            controller: [
                '$scope', '$http', '$window', 'DateTimeFormatService',
                'RatingComputationService', 'UrlService', 'UserService',
                'WindowDimensionsService', 'ACTIVITY_TYPE_EXPLORATION',
                function ($scope, $http, $window, DateTimeFormatService, RatingComputationService, UrlService, UserService, WindowDimensionsService, ACTIVITY_TYPE_EXPLORATION) {
                    $scope.userIsLoggedIn = null;
                    UserService.getUserInfoAsync().then(function (userInfo) {
                        $scope.userIsLoggedIn = userInfo.isLoggedIn();
                    });
                    $scope.ACTIVITY_TYPE_EXPLORATION = ACTIVITY_TYPE_EXPLORATION;
                    var contributorsSummary = $scope.getContributorsSummary() || {};
                    $scope.contributors = Object.keys(contributorsSummary).sort(function (contributorUsername1, contributorUsername2) {
                        var commitsOfContributor1 = contributorsSummary[contributorUsername1].num_commits;
                        var commitsOfContributor2 = contributorsSummary[contributorUsername2].num_commits;
                        return commitsOfContributor2 - commitsOfContributor1;
                    });
                    $scope.isRefresherExploration = false;
                    if ($scope.getParentExplorationIds()) {
                        $scope.isRefresherExploration = ($scope.getParentExplorationIds().length > 0);
                    }
                    $scope.avatarsList = [];
                    $scope.MAX_AVATARS_TO_DISPLAY = 5;
                    $scope.setHoverState = function (hoverState) {
                        $scope.explorationIsCurrentlyHoveredOver = hoverState;
                    };
                    $scope.loadParentExploration = function () {
                        $window.location.href = $scope.getExplorationLink();
                    };
                    $scope.getAverageRating = function () {
                        if (!$scope.getRatings()) {
                            return null;
                        }
                        return RatingComputationService.computeAverageRating($scope.getRatings());
                    };
                    $scope.getLastUpdatedDatetime = function () {
                        if (!$scope.getLastUpdatedMsec()) {
                            return null;
                        }
                        return DateTimeFormatService.getLocaleAbbreviatedDatetimeString($scope.getLastUpdatedMsec());
                    };
                    $scope.getExplorationLink = function () {
                        if (!$scope.getExplorationId()) {
                            return '#';
                        }
                        else {
                            var result = '/explore/' + $scope.getExplorationId();
                            var urlParams = UrlService.getUrlParams();
                            var parentExplorationIds = $scope.getParentExplorationIds();
                            var collectionIdToAdd = $scope.getCollectionId();
                            var storyIdToAdd = null;
                            var storyNodeIdToAdd = null;
                            // Replace the collection ID with the one in the URL if it exists
                            // in urlParams.
                            if (parentExplorationIds &&
                                urlParams.hasOwnProperty('collection_id')) {
                                collectionIdToAdd = urlParams.collection_id;
                            }
                            else if (UrlService.getPathname().match(/\/story\/(\w|-){12}/g) &&
                                $scope.getStoryNodeId()) {
                                storyIdToAdd = UrlService.getStoryIdFromViewerUrl();
                                storyNodeIdToAdd = $scope.getStoryNodeId();
                            }
                            if (collectionIdToAdd) {
                                result = UrlService.addField(result, 'collection_id', collectionIdToAdd);
                            }
                            if (parentExplorationIds) {
                                for (var i = 0; i < parentExplorationIds.length - 1; i++) {
                                    result = UrlService.addField(result, 'parent', parentExplorationIds[i]);
                                }
                            }
                            if (storyIdToAdd && storyNodeIdToAdd) {
                                result = UrlService.addField(result, 'story_id', storyIdToAdd);
                                result = UrlService.addField(result, 'node_id', storyNodeIdToAdd);
                            }
                            return result;
                        }
                    };
                    if (!$scope.mobileCutoffPx) {
                        $scope.mobileCutoffPx = 0;
                    }
                    $scope.isWindowLarge = (WindowDimensionsService.getWidth() >= $scope.mobileCutoffPx);
                    WindowDimensionsService.registerOnResizeHook(function () {
                        $scope.isWindowLarge = (WindowDimensionsService.getWidth() >= $scope.mobileCutoffPx);
                        $scope.$apply();
                    });
                    $scope.getCompleteThumbnailIconUrl = function () {
                        return UrlInterpolationService.getStaticImageUrl($scope.getThumbnailIconUrl());
                    };
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/filters/summarize-nonnegative-number.filter.ts":
/*!********************************************************************************!*\
  !*** ./core/templates/dev/head/filters/summarize-nonnegative-number.filter.ts ***!
  \********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview SummarizeNonnegativeNumber filter for Oppia.
 */
// Filter that summarizes a large number to a decimal followed by
// the appropriate metric prefix (K, M or B). For example, 167656
// becomes 167.7K.
// Users of this filter should ensure that the input is a non-negative number.
angular.module('oppia').filter('summarizeNonnegativeNumber', [function () {
        return function (input) {
            input = Number(input);
            // Nine zeros for billions (e.g. 146008788788 --> 146.0B).
            // Six zeros for millions (e.g. 146008788 --> 146.0M).
            // Three zeros for thousands (e.g. 146008 --> 146.0K).
            // No change for small numbers (e.g. 12 --> 12).
            return (input >= 1.0e+9 ? (input / 1.0e+9).toFixed(1) + 'B' :
                input >= 1.0e+6 ? (input / 1.0e+6).toFixed(1) + 'M' :
                    input >= 1.0e+3 ? (input / 1.0e+3).toFixed(1) + 'K' :
                        input);
        };
    }]);


/***/ })

}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL3Byb2ZpbGUtbGluay1kaXJlY3RpdmVzL2NpcmN1bGFyLWltYWdlLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL3N1bW1hcnktdGlsZS9leHBsb3JhdGlvbi1zdW1tYXJ5LXRpbGUuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2ZpbHRlcnMvc3VtbWFyaXplLW5vbm5lZ2F0aXZlLW51bWJlci5maWx0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLDBIQUE2QztBQUNyRDtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLGdLQUFnRTtBQUN4RSxtQkFBTyxDQUFDLHdKQUE0RDtBQUNwRSxtQkFBTyxDQUFDLGdJQUFnRDtBQUN4RCxtQkFBTyxDQUFDLG9LQUFrRTtBQUMxRSxtQkFBTyxDQUFDLHNJQUFtRDtBQUMzRCxtQkFBTyxDQUFDLDBLQUFxRTtBQUM3RSxtQkFBTyxDQUFDLDBIQUE2QztBQUNyRCxtQkFBTyxDQUFDLHNHQUFtQztBQUMzQyxtQkFBTyxDQUFDLGtGQUF5QjtBQUNqQyxtQkFBTyxDQUFDLHNHQUFtQztBQUMzQyxtQkFBTyxDQUFDLGdJQUFnRDtBQUN4RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQixpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckIsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUZBQXFGLEdBQUc7QUFDeEY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLCtDQUErQyxxQ0FBcUM7QUFDcEY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUM3S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUsiLCJmaWxlIjoiY29sbGVjdGlvbl9wbGF5ZXJ+bGVhcm5lcl9kYXNoYm9hcmR+bGlicmFyeX5wcm9maWxlfnN0b3J5X3ZpZXdlci5idW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpc3BsYXlzIGNpcmNsZWQgaW1hZ2VzIHdpdGggbGlua2luZyAod2hlbiBhdmFpbGFibGUpLlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ2NpcmN1bGFySW1hZ2UnLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge1xuICAgICAgICAgICAgICAgIHNyYzogJyYnLFxuICAgICAgICAgICAgICAgIGxpbms6ICcmPydcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9jb21wb25lbnRzL3Byb2ZpbGUtbGluay1kaXJlY3RpdmVzL2NpcmN1bGFyLWltYWdlLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuaXNMaW5rQXZhaWxhYmxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGN0cmwubGluaygpID8gdHJ1ZSA6IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1dXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbXBvbmVudCBmb3IgYW4gZXhwbG9yYXRpb24gc3VtbWFyeSB0aWxlLlxuICovXG5yZXF1aXJlKCdjb21wb25lbnRzL3Byb2ZpbGUtbGluay1kaXJlY3RpdmVzL2NpcmN1bGFyLWltYWdlLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnZG9tYWluL2xlYXJuZXJfZGFzaGJvYXJkL0xlYXJuZXJEYXNoYm9hcmRJY29uc0RpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnZmlsdGVycy9zdW1tYXJpemUtbm9ubmVnYXRpdmUtbnVtYmVyLmZpbHRlci50cycpO1xucmVxdWlyZSgnZmlsdGVycy9zdHJpbmctdXRpbGl0eS1maWx0ZXJzL3RydW5jYXRlLWFuZC1jYXBpdGFsaXplLmZpbHRlci50cycpO1xucmVxdWlyZSgnZmlsdGVycy9zdHJpbmctdXRpbGl0eS1maWx0ZXJzL3RydW5jYXRlLmZpbHRlci50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9yYXRpbmdzL3JhdGluZy1jb21wdXRhdGlvbi9yYXRpbmctY29tcHV0YXRpb24uc2VydmljZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvRGF0ZVRpbWVGb3JtYXRTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9Vc2VyU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvY29udGV4dHVhbC9VcmxTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9jb250ZXh0dWFsL1dpbmRvd0RpbWVuc2lvbnNTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ2V4cGxvcmF0aW9uU3VtbWFyeVRpbGUnLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgICAgICBnZXRDb2xsZWN0aW9uSWQ6ICcmY29sbGVjdGlvbklkJyxcbiAgICAgICAgICAgICAgICBnZXRFeHBsb3JhdGlvbklkOiAnJmV4cGxvcmF0aW9uSWQnLFxuICAgICAgICAgICAgICAgIGdldEV4cGxvcmF0aW9uVGl0bGU6ICcmZXhwbG9yYXRpb25UaXRsZScsXG4gICAgICAgICAgICAgICAgZ2V0U3RvcnlOb2RlSWQ6ICcmbm9kZUlkJyxcbiAgICAgICAgICAgICAgICBnZXRMYXN0VXBkYXRlZE1zZWM6ICcmbGFzdFVwZGF0ZWRNc2VjJyxcbiAgICAgICAgICAgICAgICBnZXROdW1WaWV3czogJyZudW1WaWV3cycsXG4gICAgICAgICAgICAgICAgZ2V0T2JqZWN0aXZlOiAnJm9iamVjdGl2ZScsXG4gICAgICAgICAgICAgICAgZ2V0Q2F0ZWdvcnk6ICcmY2F0ZWdvcnknLFxuICAgICAgICAgICAgICAgIGdldFJhdGluZ3M6ICcmcmF0aW5ncycsXG4gICAgICAgICAgICAgICAgZ2V0Q29udHJpYnV0b3JzU3VtbWFyeTogJyZjb250cmlidXRvcnNTdW1tYXJ5JyxcbiAgICAgICAgICAgICAgICBnZXRUaHVtYm5haWxJY29uVXJsOiAnJnRodW1ibmFpbEljb25VcmwnLFxuICAgICAgICAgICAgICAgIGdldFRodW1ibmFpbEJnQ29sb3I6ICcmdGh1bWJuYWlsQmdDb2xvcicsXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhpcyBpcyBub3QgbnVsbCwgdGhlIG5ldyBleHBsb3JhdGlvbiBvcGVucyBpbiBhIG5ldyB3aW5kb3cgd2hlblxuICAgICAgICAgICAgICAgIC8vIHRoZSBzdW1tYXJ5IHRpbGUgaXMgY2xpY2tlZC5cbiAgICAgICAgICAgICAgICBvcGVuSW5OZXdXaW5kb3c6ICdAb3BlbkluTmV3V2luZG93JyxcbiAgICAgICAgICAgICAgICBpc0NvbW11bml0eU93bmVkOiAnJmlzQ29tbXVuaXR5T3duZWQnLFxuICAgICAgICAgICAgICAgIC8vIElmIHRoaXMgaXMgbm90IHVuZGVmaW5lZCwgY29sbGVjdGlvbiBwcmV2aWV3IHRpbGUgZm9yIG1vYmlsZVxuICAgICAgICAgICAgICAgIC8vIHdpbGwgYmUgZGlzcGxheWVkLlxuICAgICAgICAgICAgICAgIGlzQ29sbGVjdGlvblByZXZpZXdUaWxlOiAnQGlzQ29sbGVjdGlvblByZXZpZXdUaWxlJyxcbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgc2NyZWVuIHdpZHRoIGlzIGJlbG93IHRoZSB0aHJlc2hvbGQgZGVmaW5lZCBoZXJlLCB0aGUgbW9iaWxlXG4gICAgICAgICAgICAgICAgLy8gdmVyc2lvbiBvZiB0aGUgc3VtbWFyeSB0aWxlIGlzIGRpc3BsYXllZC4gVGhpcyBhdHRyaWJ1dGUgaXMgb3B0aW9uYWw6XG4gICAgICAgICAgICAgICAgLy8gaWYgaXQgaXMgbm90IHNwZWNpZmllZCwgaXQgaXMgdHJlYXRlZCBhcyAwLCB3aGljaCBtZWFucyB0aGF0IHRoZVxuICAgICAgICAgICAgICAgIC8vIGRlc2t0b3AgdmVyc2lvbiBvZiB0aGUgc3VtbWFyeSB0aWxlIGlzIGFsd2F5cyBkaXNwbGF5ZWQuXG4gICAgICAgICAgICAgICAgbW9iaWxlQ3V0b2ZmUHg6ICdAbW9iaWxlQ3V0b2ZmUHgnLFxuICAgICAgICAgICAgICAgIGlzUGxheWxpc3RUaWxlOiAnJmlzUGxheWxpc3RUaWxlJyxcbiAgICAgICAgICAgICAgICBnZXRQYXJlbnRFeHBsb3JhdGlvbklkczogJyZwYXJlbnRFeHBsb3JhdGlvbklkcycsXG4gICAgICAgICAgICAgICAgc2hvd0xlYXJuZXJEYXNoYm9hcmRJY29uc0lmUG9zc2libGU6ICgnJnNob3dMZWFybmVyRGFzaGJvYXJkSWNvbnNJZlBvc3NpYmxlJyksXG4gICAgICAgICAgICAgICAgaXNDb250YWluZXJOYXJyb3c6ICcmY29udGFpbmVySXNOYXJyb3cnLFxuICAgICAgICAgICAgICAgIGlzT3duZWRCeUN1cnJlbnRVc2VyOiAnJmFjdGl2aXR5SXNPd25lZEJ5Q3VycmVudFVzZXInLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2NvbXBvbmVudHMvc3VtbWFyeS10aWxlL2V4cGxvcmF0aW9uLXN1bW1hcnktdGlsZS5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5maW5kKCcuZXhwbG9yYXRpb24tc3VtbWFyeS1hdmF0YXJzJykub24oJ21vdXNlZW50ZXInLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuZmluZCgnLm1hc2snKS5hdHRyKCdjbGFzcycsICdleHBsb3JhdGlvbi1zdW1tYXJ5LXRpbGUtbWFzayBtYXNrJyk7XG4gICAgICAgICAgICAgICAgICAgIC8vIEFzIGFuaW1hdGlvbiBkdXJhdGlvbiB0aW1lIG1heSBiZSA0MDBtcywgLnN0b3AodHJ1ZSkgaXMgdXNlZCB0b1xuICAgICAgICAgICAgICAgICAgICAvLyBwcmV2ZW50IHRoZSBlZmZlY3RzIHF1ZXVlIGZhbGxpbmcgYmVoaW5kIHRoZSBtb3VzZSBtb3ZlbWVudC5cbiAgICAgICAgICAgICAgICAgICAgLy8gLmhpZGUoMSkgYW5kIC5zaG93KDEpIHVzZWQgdG8gcGxhY2UgdGhlIGFuaW1hdGlvbiBpbiB0aGUgZWZmZWN0c1xuICAgICAgICAgICAgICAgICAgICAvLyBxdWV1ZS5cbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5maW5kKCcuYXZhdGFycy1udW0tbWludXMtb25lJykuc3RvcCh0cnVlKS5oaWRlKDEsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuZmluZCgnLmFsbC1hdmF0YXJzJykuc3RvcCh0cnVlKS5zbGlkZURvd24oKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5maW5kKCcuZXhwbG9yYXRpb24tc3VtbWFyeS1hdmF0YXJzJykub24oJ21vdXNlbGVhdmUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuZmluZCgnLm1hc2snKS5hdHRyKCdjbGFzcycsICd0b3Atc2VjdGlvbi1tYXNrIG1hc2snKTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5maW5kKCcuYWxsLWF2YXRhcnMnKS5zdG9wKHRydWUpLnNsaWRlVXAoNDAwLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmZpbmQoJy5hdmF0YXJzLW51bS1taW51cy1vbmUnKS5zdG9wKHRydWUpLnNob3coMSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAnJHNjb3BlJywgJyRodHRwJywgJyR3aW5kb3cnLCAnRGF0ZVRpbWVGb3JtYXRTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICAnUmF0aW5nQ29tcHV0YXRpb25TZXJ2aWNlJywgJ1VybFNlcnZpY2UnLCAnVXNlclNlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdXaW5kb3dEaW1lbnNpb25zU2VydmljZScsICdBQ1RJVklUWV9UWVBFX0VYUExPUkFUSU9OJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHNjb3BlLCAkaHR0cCwgJHdpbmRvdywgRGF0ZVRpbWVGb3JtYXRTZXJ2aWNlLCBSYXRpbmdDb21wdXRhdGlvblNlcnZpY2UsIFVybFNlcnZpY2UsIFVzZXJTZXJ2aWNlLCBXaW5kb3dEaW1lbnNpb25zU2VydmljZSwgQUNUSVZJVFlfVFlQRV9FWFBMT1JBVElPTikge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUudXNlcklzTG9nZ2VkSW4gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBVc2VyU2VydmljZS5nZXRVc2VySW5mb0FzeW5jKCkudGhlbihmdW5jdGlvbiAodXNlckluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS51c2VySXNMb2dnZWRJbiA9IHVzZXJJbmZvLmlzTG9nZ2VkSW4oKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5BQ1RJVklUWV9UWVBFX0VYUExPUkFUSU9OID0gQUNUSVZJVFlfVFlQRV9FWFBMT1JBVElPTjtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbnRyaWJ1dG9yc1N1bW1hcnkgPSAkc2NvcGUuZ2V0Q29udHJpYnV0b3JzU3VtbWFyeSgpIHx8IHt9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY29udHJpYnV0b3JzID0gT2JqZWN0LmtleXMoY29udHJpYnV0b3JzU3VtbWFyeSkuc29ydChmdW5jdGlvbiAoY29udHJpYnV0b3JVc2VybmFtZTEsIGNvbnRyaWJ1dG9yVXNlcm5hbWUyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY29tbWl0c09mQ29udHJpYnV0b3IxID0gY29udHJpYnV0b3JzU3VtbWFyeVtjb250cmlidXRvclVzZXJuYW1lMV0ubnVtX2NvbW1pdHM7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY29tbWl0c09mQ29udHJpYnV0b3IyID0gY29udHJpYnV0b3JzU3VtbWFyeVtjb250cmlidXRvclVzZXJuYW1lMl0ubnVtX2NvbW1pdHM7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29tbWl0c09mQ29udHJpYnV0b3IyIC0gY29tbWl0c09mQ29udHJpYnV0b3IxO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzUmVmcmVzaGVyRXhwbG9yYXRpb24gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS5nZXRQYXJlbnRFeHBsb3JhdGlvbklkcygpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNSZWZyZXNoZXJFeHBsb3JhdGlvbiA9ICgkc2NvcGUuZ2V0UGFyZW50RXhwbG9yYXRpb25JZHMoKS5sZW5ndGggPiAwKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuYXZhdGFyc0xpc3QgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLk1BWF9BVkFUQVJTX1RPX0RJU1BMQVkgPSA1O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2V0SG92ZXJTdGF0ZSA9IGZ1bmN0aW9uIChob3ZlclN0YXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZXhwbG9yYXRpb25Jc0N1cnJlbnRseUhvdmVyZWRPdmVyID0gaG92ZXJTdGF0ZTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmxvYWRQYXJlbnRFeHBsb3JhdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICR3aW5kb3cubG9jYXRpb24uaHJlZiA9ICRzY29wZS5nZXRFeHBsb3JhdGlvbkxpbmsoKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmdldEF2ZXJhZ2VSYXRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoISRzY29wZS5nZXRSYXRpbmdzKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBSYXRpbmdDb21wdXRhdGlvblNlcnZpY2UuY29tcHV0ZUF2ZXJhZ2VSYXRpbmcoJHNjb3BlLmdldFJhdGluZ3MoKSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5nZXRMYXN0VXBkYXRlZERhdGV0aW1lID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEkc2NvcGUuZ2V0TGFzdFVwZGF0ZWRNc2VjKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBEYXRlVGltZUZvcm1hdFNlcnZpY2UuZ2V0TG9jYWxlQWJicmV2aWF0ZWREYXRldGltZVN0cmluZygkc2NvcGUuZ2V0TGFzdFVwZGF0ZWRNc2VjKCkpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZ2V0RXhwbG9yYXRpb25MaW5rID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEkc2NvcGUuZ2V0RXhwbG9yYXRpb25JZCgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICcjJztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSAnL2V4cGxvcmUvJyArICRzY29wZS5nZXRFeHBsb3JhdGlvbklkKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHVybFBhcmFtcyA9IFVybFNlcnZpY2UuZ2V0VXJsUGFyYW1zKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHBhcmVudEV4cGxvcmF0aW9uSWRzID0gJHNjb3BlLmdldFBhcmVudEV4cGxvcmF0aW9uSWRzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNvbGxlY3Rpb25JZFRvQWRkID0gJHNjb3BlLmdldENvbGxlY3Rpb25JZCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzdG9yeUlkVG9BZGQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzdG9yeU5vZGVJZFRvQWRkID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBSZXBsYWNlIHRoZSBjb2xsZWN0aW9uIElEIHdpdGggdGhlIG9uZSBpbiB0aGUgVVJMIGlmIGl0IGV4aXN0c1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGluIHVybFBhcmFtcy5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGFyZW50RXhwbG9yYXRpb25JZHMgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsUGFyYW1zLmhhc093blByb3BlcnR5KCdjb2xsZWN0aW9uX2lkJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbklkVG9BZGQgPSB1cmxQYXJhbXMuY29sbGVjdGlvbl9pZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoVXJsU2VydmljZS5nZXRQYXRobmFtZSgpLm1hdGNoKC9cXC9zdG9yeVxcLyhcXHd8LSl7MTJ9L2cpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5nZXRTdG9yeU5vZGVJZCgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0b3J5SWRUb0FkZCA9IFVybFNlcnZpY2UuZ2V0U3RvcnlJZEZyb21WaWV3ZXJVcmwoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RvcnlOb2RlSWRUb0FkZCA9ICRzY29wZS5nZXRTdG9yeU5vZGVJZCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29sbGVjdGlvbklkVG9BZGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gVXJsU2VydmljZS5hZGRGaWVsZChyZXN1bHQsICdjb2xsZWN0aW9uX2lkJywgY29sbGVjdGlvbklkVG9BZGQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGFyZW50RXhwbG9yYXRpb25JZHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXJlbnRFeHBsb3JhdGlvbklkcy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IFVybFNlcnZpY2UuYWRkRmllbGQocmVzdWx0LCAncGFyZW50JywgcGFyZW50RXhwbG9yYXRpb25JZHNbaV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdG9yeUlkVG9BZGQgJiYgc3RvcnlOb2RlSWRUb0FkZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBVcmxTZXJ2aWNlLmFkZEZpZWxkKHJlc3VsdCwgJ3N0b3J5X2lkJywgc3RvcnlJZFRvQWRkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gVXJsU2VydmljZS5hZGRGaWVsZChyZXN1bHQsICdub2RlX2lkJywgc3RvcnlOb2RlSWRUb0FkZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGlmICghJHNjb3BlLm1vYmlsZUN1dG9mZlB4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUubW9iaWxlQ3V0b2ZmUHggPSAwO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5pc1dpbmRvd0xhcmdlID0gKFdpbmRvd0RpbWVuc2lvbnNTZXJ2aWNlLmdldFdpZHRoKCkgPj0gJHNjb3BlLm1vYmlsZUN1dG9mZlB4KTtcbiAgICAgICAgICAgICAgICAgICAgV2luZG93RGltZW5zaW9uc1NlcnZpY2UucmVnaXN0ZXJPblJlc2l6ZUhvb2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzV2luZG93TGFyZ2UgPSAoV2luZG93RGltZW5zaW9uc1NlcnZpY2UuZ2V0V2lkdGgoKSA+PSAkc2NvcGUubW9iaWxlQ3V0b2ZmUHgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmdldENvbXBsZXRlVGh1bWJuYWlsSWNvblVybCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXRTdGF0aWNJbWFnZVVybCgkc2NvcGUuZ2V0VGh1bWJuYWlsSWNvblVybCgpKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFN1bW1hcml6ZU5vbm5lZ2F0aXZlTnVtYmVyIGZpbHRlciBmb3IgT3BwaWEuXG4gKi9cbi8vIEZpbHRlciB0aGF0IHN1bW1hcml6ZXMgYSBsYXJnZSBudW1iZXIgdG8gYSBkZWNpbWFsIGZvbGxvd2VkIGJ5XG4vLyB0aGUgYXBwcm9wcmlhdGUgbWV0cmljIHByZWZpeCAoSywgTSBvciBCKS4gRm9yIGV4YW1wbGUsIDE2NzY1NlxuLy8gYmVjb21lcyAxNjcuN0suXG4vLyBVc2VycyBvZiB0aGlzIGZpbHRlciBzaG91bGQgZW5zdXJlIHRoYXQgdGhlIGlucHV0IGlzIGEgbm9uLW5lZ2F0aXZlIG51bWJlci5cbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZpbHRlcignc3VtbWFyaXplTm9ubmVnYXRpdmVOdW1iZXInLCBbZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgICAgICBpbnB1dCA9IE51bWJlcihpbnB1dCk7XG4gICAgICAgICAgICAvLyBOaW5lIHplcm9zIGZvciBiaWxsaW9ucyAoZS5nLiAxNDYwMDg3ODg3ODggLS0+IDE0Ni4wQikuXG4gICAgICAgICAgICAvLyBTaXggemVyb3MgZm9yIG1pbGxpb25zIChlLmcuIDE0NjAwODc4OCAtLT4gMTQ2LjBNKS5cbiAgICAgICAgICAgIC8vIFRocmVlIHplcm9zIGZvciB0aG91c2FuZHMgKGUuZy4gMTQ2MDA4IC0tPiAxNDYuMEspLlxuICAgICAgICAgICAgLy8gTm8gY2hhbmdlIGZvciBzbWFsbCBudW1iZXJzIChlLmcuIDEyIC0tPiAxMikuXG4gICAgICAgICAgICByZXR1cm4gKGlucHV0ID49IDEuMGUrOSA/IChpbnB1dCAvIDEuMGUrOSkudG9GaXhlZCgxKSArICdCJyA6XG4gICAgICAgICAgICAgICAgaW5wdXQgPj0gMS4wZSs2ID8gKGlucHV0IC8gMS4wZSs2KS50b0ZpeGVkKDEpICsgJ00nIDpcbiAgICAgICAgICAgICAgICAgICAgaW5wdXQgPj0gMS4wZSszID8gKGlucHV0IC8gMS4wZSszKS50b0ZpeGVkKDEpICsgJ0snIDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0KTtcbiAgICAgICAgfTtcbiAgICB9XSk7XG4iXSwic291cmNlUm9vdCI6IiJ9