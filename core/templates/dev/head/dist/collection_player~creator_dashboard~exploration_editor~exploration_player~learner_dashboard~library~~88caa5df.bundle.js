(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["collection_player~creator_dashboard~exploration_editor~exploration_player~learner_dashboard~library~~88caa5df"],{

/***/ "./core/templates/dev/head/components/ratings/rating-computation/rating-computation.service.ts":
/*!*****************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/ratings/rating-computation/rating-computation.service.ts ***!
  \*****************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
 * @fileoverview Service for computing the average rating.
 */
angular.module('ratingsModule').factory('RatingComputationService', [function () {
        var areRatingsShown = function (ratingFrequencies) {
            var MINIMUM_ACCEPTABLE_NUMBER_OF_RATINGS = 1;
            var totalNumber = 0;
            for (var value in ratingFrequencies) {
                totalNumber += ratingFrequencies[value];
            }
            return totalNumber >= MINIMUM_ACCEPTABLE_NUMBER_OF_RATINGS;
        };
        return {
            computeAverageRating: function (ratingFrequencies) {
                if (!areRatingsShown(ratingFrequencies)) {
                    return undefined;
                }
                else {
                    var totalNumber = 0;
                    var totalValue = 0.0;
                    for (var value in ratingFrequencies) {
                        totalValue += parseInt(value) * ratingFrequencies[value];
                        totalNumber += ratingFrequencies[value];
                    }
                    if (totalNumber === 0) {
                        return undefined;
                    }
                    return totalValue / totalNumber;
                }
            }
        };
    }]);


/***/ }),

/***/ "./core/templates/dev/head/domain/learner_dashboard/LearnerDashboardIconsDirective.ts":
/*!********************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/learner_dashboard/LearnerDashboardIconsDirective.ts ***!
  \********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
 * @fileoverview Directive for showing learner dashboard icons.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
oppia.directive('learnerDashboardIcons', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {
                getActivityType: '&activityType',
                getActivityId: '&activityId',
                getActivityTitle: '&activityTitle',
                activityActive: '=activityActive',
                isContainerNarrow: '&containerIsNarrow',
                isAddToPlaylistIconShown: '&addToPlaylistIconIsShown'
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/domain/learner_dashboard/' +
                'learner_dashboard_icons_directive.html'),
            controller: [
                '$scope', 'LearnerDashboardIdsBackendApiService',
                'LearnerDashboardActivityIdsObjectFactory',
                'LearnerPlaylistService',
                function ($scope, LearnerDashboardIdsBackendApiService, LearnerDashboardActivityIdsObjectFactory, LearnerPlaylistService) {
                    $scope.activityIsCurrentlyHoveredOver = true;
                    $scope.playlistTooltipIsEnabled = false;
                    $scope.enablePlaylistTooltip = function () {
                        $scope.playlistTooltipIsEnabled = true;
                    };
                    $scope.disablePlaylistTooltip = function () {
                        $scope.playlistTooltipIsEnabled = false;
                    };
                    $scope.$watch('activityActive', function (value) {
                        $scope.activityIsCurrentlyHoveredOver = $scope.activityActive;
                    });
                    LearnerDashboardIdsBackendApiService.fetchLearnerDashboardIds().then(function (response) {
                        $scope.learnerDashboardActivityIds = (LearnerDashboardActivityIdsObjectFactory.createFromBackendDict(response.data.learner_dashboard_activity_ids));
                    });
                    $scope.setHoverState = function (hoverState) {
                        $scope.activityIsCurrentlyHoveredOver = hoverState;
                    };
                    $scope.canActivityBeAddedToLearnerPlaylist = function (activityId) {
                        if ($scope.learnerDashboardActivityIds) {
                            if ($scope.learnerDashboardActivityIds.includesActivity(activityId)) {
                                return false;
                            }
                            else {
                                if ($scope.isContainerNarrow()) {
                                    return true;
                                }
                                else {
                                    return $scope.activityIsCurrentlyHoveredOver;
                                }
                            }
                        }
                    };
                    $scope.belongsToLearnerPlaylist = function () {
                        var activityType = $scope.getActivityType();
                        if ($scope.learnerDashboardActivityIds) {
                            /* eslint-disable max-len */
                            if (activityType === constants.ACTIVITY_TYPE_EXPLORATION) {
                                return ($scope.learnerDashboardActivityIds.belongsToExplorationPlaylist($scope.getActivityId()));
                            }
                            else if (activityType === constants.ACTIVITY_TYPE_COLLECTION) {
                                return ($scope.learnerDashboardActivityIds.belongsToCollectionPlaylist($scope.getActivityId()));
                            }
                            /* eslint-enable max-len */
                        }
                    };
                    $scope.belongsToCompletedActivities = function () {
                        var activityType = $scope.getActivityType();
                        if ($scope.learnerDashboardActivityIds) {
                            /* eslint-disable max-len */
                            if (activityType === constants.ACTIVITY_TYPE_EXPLORATION) {
                                return ($scope.learnerDashboardActivityIds.belongsToCompletedExplorations($scope.getActivityId()));
                            }
                            else if (activityType === constants.ACTIVITY_TYPE_COLLECTION) {
                                return ($scope.learnerDashboardActivityIds.belongsToCompletedCollections($scope.getActivityId()));
                            }
                            /* eslint-enable max-len */
                        }
                    };
                    $scope.belongsToIncompleteActivities = function () {
                        var activityType = $scope.getActivityType();
                        if ($scope.learnerDashboardActivityIds) {
                            /* eslint-disable max-len */
                            if (activityType === constants.ACTIVITY_TYPE_EXPLORATION) {
                                return ($scope.learnerDashboardActivityIds.belongsToIncompleteExplorations($scope.getActivityId()));
                            }
                            else if (activityType === constants.ACTIVITY_TYPE_COLLECTION) {
                                return ($scope.learnerDashboardActivityIds.belongsToIncompleteCollections($scope.getActivityId()));
                            }
                            /* eslint-enable max-len */
                        }
                    };
                    $scope.addToLearnerPlaylist = function (activityId, activityType) {
                        var isSuccessfullyAdded = (LearnerPlaylistService.addToLearnerPlaylist(activityId, activityType));
                        if (isSuccessfullyAdded) {
                            if (activityType === constants.ACTIVITY_TYPE_EXPLORATION) {
                                /* eslint-disable max-len */
                                $scope.learnerDashboardActivityIds.addToExplorationLearnerPlaylist(activityId);
                                /* eslint-enable max-len */
                            }
                            else if (activityType === constants.ACTIVITY_TYPE_COLLECTION) {
                                /* eslint-disable max-len */
                                $scope.learnerDashboardActivityIds.addToCollectionLearnerPlaylist(activityId);
                                /* eslint-enable max-len */
                            }
                            $scope.disablePlaylistTooltip();
                        }
                    };
                    $scope.removeFromLearnerPlaylist = function (activityId, activityTitle, activityType) {
                        var isSuccessfullyRemoved = (LearnerPlaylistService.removeFromLearnerPlaylist(activityId, activityTitle, activityType, $scope.learnerDashboardActivityIds));
                    };
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/filters/string-utility-filters/truncate-and-capitalize.filter.ts":
/*!**************************************************************************************************!*\
  !*** ./core/templates/dev/head/filters/string-utility-filters/truncate-and-capitalize.filter.ts ***!
  \**************************************************************************************************/
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
 * @fileoverview TruncateAndCapitalize filter for Oppia.
 */
// Note that this filter does not truncate at the middle of a word.
angular.module('stringUtilityFiltersModule').filter('truncateAndCapitalize', [function () {
        return function (input, maxNumberOfCharacters) {
            if (!input) {
                return input;
            }
            var words = input.trim().match(/\S+/g);
            // Capitalize the first word and add it to the result.
            var result = words[0].charAt(0).toUpperCase() + words[0].slice(1);
            // Add the remaining words to the result until the character limit is
            // reached.
            for (var i = 1; i < words.length; i++) {
                if (!maxNumberOfCharacters ||
                    result.length + 1 + words[i].length <= maxNumberOfCharacters) {
                    result += ' ';
                    result += words[i];
                }
                else {
                    result += '...';
                    break;
                }
            }
            return result;
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/filters/string-utility-filters/truncate.filter.ts":
/*!***********************************************************************************!*\
  !*** ./core/templates/dev/head/filters/string-utility-filters/truncate.filter.ts ***!
  \***********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
 * @fileoverview Truncate filter for Oppia.
 */
__webpack_require__(/*! filters/string-utility-filters/convert-to-plain-text.filter.ts */ "./core/templates/dev/head/filters/string-utility-filters/convert-to-plain-text.filter.ts");
// Filter that truncates long descriptors.
angular.module('stringUtilityFiltersModule').filter('truncate', ['$filter', function ($filter) {
        return function (input, length, suffix) {
            if (!input) {
                return '';
            }
            if (isNaN(length)) {
                length = 70;
            }
            if (suffix === undefined) {
                suffix = '...';
            }
            if (!angular.isString(input)) {
                input = String(input);
            }
            input = $filter('convertToPlainText')(input);
            return (input.length <= length ? input : (input.substring(0, length - suffix.length) + suffix));
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/DateTimeFormatService.ts":
/*!*******************************************************************!*\
  !*** ./core/templates/dev/head/services/DateTimeFormatService.ts ***!
  \*******************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
* @fileoverview Service for converting dates in milliseconds
* since the Epoch to human-readable dates.
*/
oppia.factory('DateTimeFormatService', ['$filter', function ($filter) {
        return {
            // Returns just the time if the local datetime representation has the
            // same date as the current date. Otherwise, returns just the date if the
            // local datetime representation has the same year as the current date.
            // Otherwise, returns the full date (with the year abbreviated).
            getLocaleAbbreviatedDatetimeString: function (millisSinceEpoch) {
                var date = new Date(millisSinceEpoch);
                if (date.toLocaleDateString() === new Date().toLocaleDateString()) {
                    return date.toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true
                    });
                }
                else if (date.getFullYear() === new Date().getFullYear()) {
                    return $filter('date')(date, 'MMM d');
                }
                else {
                    return $filter('date')(date, 'shortDate');
                }
            },
            // Returns just the date.
            getLocaleDateString: function (millisSinceEpoch) {
                var date = new Date(millisSinceEpoch);
                return date.toLocaleDateString();
            },
            // Returns whether the date is at most one week before the current date.
            isRecent: function (millisSinceEpoch) {
                var ONE_WEEK_IN_MILLIS = 7 * 24 * 60 * 60 * 1000;
                return new Date().getTime() - millisSinceEpoch < ONE_WEEK_IN_MILLIS;
            }
        };
    }]);


/***/ }),

/***/ "./core/templates/dev/head/services/UserService.ts":
/*!*********************************************************!*\
  !*** ./core/templates/dev/head/services/UserService.ts ***!
  \*********************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for user data.
 */
oppia.factory('UserService', [
    '$http', '$q', '$window', 'UrlInterpolationService', 'UserInfoObjectFactory',
    'DEFAULT_PROFILE_IMAGE_PATH',
    function ($http, $q, $window, UrlInterpolationService, UserInfoObjectFactory, DEFAULT_PROFILE_IMAGE_PATH) {
        var PREFERENCES_DATA_URL = '/preferenceshandler/data';
        var userInfo = null;
        var getUserInfoAsync = function () {
            if (GLOBALS.userIsLoggedIn) {
                if (userInfo) {
                    return $q.resolve(userInfo);
                }
                return $http.get('/userinfohandler').then(function (response) {
                    userInfo = UserInfoObjectFactory.createFromBackendDict(response.data);
                    return userInfo;
                });
            }
            else {
                return $q.resolve(UserInfoObjectFactory.createDefault());
            }
        };
        return {
            getProfileImageDataUrlAsync: function () {
                var profilePictureDataUrl = (UrlInterpolationService.getStaticImageUrl(DEFAULT_PROFILE_IMAGE_PATH));
                if (GLOBALS.userIsLoggedIn) {
                    return $http.get('/preferenceshandler/profile_picture').then(function (response) {
                        if (response.data.profile_picture_data_url) {
                            profilePictureDataUrl = response.data.profile_picture_data_url;
                        }
                        return profilePictureDataUrl;
                    });
                }
                else {
                    return $q.resolve(profilePictureDataUrl);
                }
            },
            setProfileImageDataUrlAsync: function (newProfileImageDataUrl) {
                return $http.put(PREFERENCES_DATA_URL, {
                    update_type: 'profile_picture_data_url',
                    data: newProfileImageDataUrl
                });
            },
            getLoginUrlAsync: function () {
                var urlParameters = {
                    current_url: $window.location.href
                };
                return $http.get('/url_handler', { params: urlParameters }).then(function (response) {
                    return response.data.login_url;
                });
            },
            getUserInfoAsync: getUserInfoAsync
        };
    }
]);


/***/ })

}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL3JhdGluZ3MvcmF0aW5nLWNvbXB1dGF0aW9uL3JhdGluZy1jb21wdXRhdGlvbi5zZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9sZWFybmVyX2Rhc2hib2FyZC9MZWFybmVyRGFzaGJvYXJkSWNvbnNEaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZmlsdGVycy9zdHJpbmctdXRpbGl0eS1maWx0ZXJzL3RydW5jYXRlLWFuZC1jYXBpdGFsaXplLmZpbHRlci50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9maWx0ZXJzL3N0cmluZy11dGlsaXR5LWZpbHRlcnMvdHJ1bmNhdGUuZmlsdGVyLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL0RhdGVUaW1lRm9ybWF0U2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9zZXJ2aWNlcy9Vc2VyU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7Ozs7Ozs7Ozs7O0FDNUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQywwSEFBNkM7QUFDckQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNsSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCLGtCQUFrQjtBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLGdLQUFnRTtBQUN4RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7Ozs7Ozs7Ozs7OztBQ2xETDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrREFBa0Qsd0JBQXdCO0FBQzFFO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJjb2xsZWN0aW9uX3BsYXllcn5jcmVhdG9yX2Rhc2hib2FyZH5leHBsb3JhdGlvbl9lZGl0b3J+ZXhwbG9yYXRpb25fcGxheWVyfmxlYXJuZXJfZGFzaGJvYXJkfmxpYnJhcnl+fjg4Y2FhNWRmLmJ1bmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSBmb3IgY29tcHV0aW5nIHRoZSBhdmVyYWdlIHJhdGluZy5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3JhdGluZ3NNb2R1bGUnKS5mYWN0b3J5KCdSYXRpbmdDb21wdXRhdGlvblNlcnZpY2UnLCBbZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYXJlUmF0aW5nc1Nob3duID0gZnVuY3Rpb24gKHJhdGluZ0ZyZXF1ZW5jaWVzKSB7XG4gICAgICAgICAgICB2YXIgTUlOSU1VTV9BQ0NFUFRBQkxFX05VTUJFUl9PRl9SQVRJTkdTID0gMTtcbiAgICAgICAgICAgIHZhciB0b3RhbE51bWJlciA9IDA7XG4gICAgICAgICAgICBmb3IgKHZhciB2YWx1ZSBpbiByYXRpbmdGcmVxdWVuY2llcykge1xuICAgICAgICAgICAgICAgIHRvdGFsTnVtYmVyICs9IHJhdGluZ0ZyZXF1ZW5jaWVzW3ZhbHVlXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0b3RhbE51bWJlciA+PSBNSU5JTVVNX0FDQ0VQVEFCTEVfTlVNQkVSX09GX1JBVElOR1M7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjb21wdXRlQXZlcmFnZVJhdGluZzogZnVuY3Rpb24gKHJhdGluZ0ZyZXF1ZW5jaWVzKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFhcmVSYXRpbmdzU2hvd24ocmF0aW5nRnJlcXVlbmNpZXMpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdG90YWxOdW1iZXIgPSAwO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdG90YWxWYWx1ZSA9IDAuMDtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgdmFsdWUgaW4gcmF0aW5nRnJlcXVlbmNpZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvdGFsVmFsdWUgKz0gcGFyc2VJbnQodmFsdWUpICogcmF0aW5nRnJlcXVlbmNpZXNbdmFsdWVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgdG90YWxOdW1iZXIgKz0gcmF0aW5nRnJlcXVlbmNpZXNbdmFsdWVdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0b3RhbE51bWJlciA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdG90YWxWYWx1ZSAvIHRvdGFsTnVtYmVyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNyBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3Igc2hvd2luZyBsZWFybmVyIGRhc2hib2FyZCBpY29ucy5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xub3BwaWEuZGlyZWN0aXZlKCdsZWFybmVyRGFzaGJvYXJkSWNvbnMnLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgICAgICBnZXRBY3Rpdml0eVR5cGU6ICcmYWN0aXZpdHlUeXBlJyxcbiAgICAgICAgICAgICAgICBnZXRBY3Rpdml0eUlkOiAnJmFjdGl2aXR5SWQnLFxuICAgICAgICAgICAgICAgIGdldEFjdGl2aXR5VGl0bGU6ICcmYWN0aXZpdHlUaXRsZScsXG4gICAgICAgICAgICAgICAgYWN0aXZpdHlBY3RpdmU6ICc9YWN0aXZpdHlBY3RpdmUnLFxuICAgICAgICAgICAgICAgIGlzQ29udGFpbmVyTmFycm93OiAnJmNvbnRhaW5lcklzTmFycm93JyxcbiAgICAgICAgICAgICAgICBpc0FkZFRvUGxheWxpc3RJY29uU2hvd246ICcmYWRkVG9QbGF5bGlzdEljb25Jc1Nob3duJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2RvbWFpbi9sZWFybmVyX2Rhc2hib2FyZC8nICtcbiAgICAgICAgICAgICAgICAnbGVhcm5lcl9kYXNoYm9hcmRfaWNvbnNfZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAnJHNjb3BlJywgJ0xlYXJuZXJEYXNoYm9hcmRJZHNCYWNrZW5kQXBpU2VydmljZScsXG4gICAgICAgICAgICAgICAgJ0xlYXJuZXJEYXNoYm9hcmRBY3Rpdml0eUlkc09iamVjdEZhY3RvcnknLFxuICAgICAgICAgICAgICAgICdMZWFybmVyUGxheWxpc3RTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHNjb3BlLCBMZWFybmVyRGFzaGJvYXJkSWRzQmFja2VuZEFwaVNlcnZpY2UsIExlYXJuZXJEYXNoYm9hcmRBY3Rpdml0eUlkc09iamVjdEZhY3RvcnksIExlYXJuZXJQbGF5bGlzdFNlcnZpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmFjdGl2aXR5SXNDdXJyZW50bHlIb3ZlcmVkT3ZlciA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5wbGF5bGlzdFRvb2x0aXBJc0VuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmVuYWJsZVBsYXlsaXN0VG9vbHRpcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5wbGF5bGlzdFRvb2x0aXBJc0VuYWJsZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZGlzYWJsZVBsYXlsaXN0VG9vbHRpcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5wbGF5bGlzdFRvb2x0aXBJc0VuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiR3YXRjaCgnYWN0aXZpdHlBY3RpdmUnLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5hY3Rpdml0eUlzQ3VycmVudGx5SG92ZXJlZE92ZXIgPSAkc2NvcGUuYWN0aXZpdHlBY3RpdmU7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBMZWFybmVyRGFzaGJvYXJkSWRzQmFja2VuZEFwaVNlcnZpY2UuZmV0Y2hMZWFybmVyRGFzaGJvYXJkSWRzKCkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5sZWFybmVyRGFzaGJvYXJkQWN0aXZpdHlJZHMgPSAoTGVhcm5lckRhc2hib2FyZEFjdGl2aXR5SWRzT2JqZWN0RmFjdG9yeS5jcmVhdGVGcm9tQmFja2VuZERpY3QocmVzcG9uc2UuZGF0YS5sZWFybmVyX2Rhc2hib2FyZF9hY3Rpdml0eV9pZHMpKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5zZXRIb3ZlclN0YXRlID0gZnVuY3Rpb24gKGhvdmVyU3RhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5hY3Rpdml0eUlzQ3VycmVudGx5SG92ZXJlZE92ZXIgPSBob3ZlclN0YXRlO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY2FuQWN0aXZpdHlCZUFkZGVkVG9MZWFybmVyUGxheWxpc3QgPSBmdW5jdGlvbiAoYWN0aXZpdHlJZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS5sZWFybmVyRGFzaGJvYXJkQWN0aXZpdHlJZHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLmxlYXJuZXJEYXNoYm9hcmRBY3Rpdml0eUlkcy5pbmNsdWRlc0FjdGl2aXR5KGFjdGl2aXR5SWQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuaXNDb250YWluZXJOYXJyb3coKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHNjb3BlLmFjdGl2aXR5SXNDdXJyZW50bHlIb3ZlcmVkT3ZlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmJlbG9uZ3NUb0xlYXJuZXJQbGF5bGlzdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhY3Rpdml0eVR5cGUgPSAkc2NvcGUuZ2V0QWN0aXZpdHlUeXBlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLmxlYXJuZXJEYXNoYm9hcmRBY3Rpdml0eUlkcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWN0aXZpdHlUeXBlID09PSBjb25zdGFudHMuQUNUSVZJVFlfVFlQRV9FWFBMT1JBVElPTikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKCRzY29wZS5sZWFybmVyRGFzaGJvYXJkQWN0aXZpdHlJZHMuYmVsb25nc1RvRXhwbG9yYXRpb25QbGF5bGlzdCgkc2NvcGUuZ2V0QWN0aXZpdHlJZCgpKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGFjdGl2aXR5VHlwZSA9PT0gY29uc3RhbnRzLkFDVElWSVRZX1RZUEVfQ09MTEVDVElPTikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKCRzY29wZS5sZWFybmVyRGFzaGJvYXJkQWN0aXZpdHlJZHMuYmVsb25nc1RvQ29sbGVjdGlvblBsYXlsaXN0KCRzY29wZS5nZXRBY3Rpdml0eUlkKCkpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogZXNsaW50LWVuYWJsZSBtYXgtbGVuICovXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5iZWxvbmdzVG9Db21wbGV0ZWRBY3Rpdml0aWVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFjdGl2aXR5VHlwZSA9ICRzY29wZS5nZXRBY3Rpdml0eVR5cGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUubGVhcm5lckRhc2hib2FyZEFjdGl2aXR5SWRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogZXNsaW50LWRpc2FibGUgbWF4LWxlbiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhY3Rpdml0eVR5cGUgPT09IGNvbnN0YW50cy5BQ1RJVklUWV9UWVBFX0VYUExPUkFUSU9OKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoJHNjb3BlLmxlYXJuZXJEYXNoYm9hcmRBY3Rpdml0eUlkcy5iZWxvbmdzVG9Db21wbGV0ZWRFeHBsb3JhdGlvbnMoJHNjb3BlLmdldEFjdGl2aXR5SWQoKSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChhY3Rpdml0eVR5cGUgPT09IGNvbnN0YW50cy5BQ1RJVklUWV9UWVBFX0NPTExFQ1RJT04pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICgkc2NvcGUubGVhcm5lckRhc2hib2FyZEFjdGl2aXR5SWRzLmJlbG9uZ3NUb0NvbXBsZXRlZENvbGxlY3Rpb25zKCRzY29wZS5nZXRBY3Rpdml0eUlkKCkpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogZXNsaW50LWVuYWJsZSBtYXgtbGVuICovXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5iZWxvbmdzVG9JbmNvbXBsZXRlQWN0aXZpdGllcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhY3Rpdml0eVR5cGUgPSAkc2NvcGUuZ2V0QWN0aXZpdHlUeXBlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLmxlYXJuZXJEYXNoYm9hcmRBY3Rpdml0eUlkcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWN0aXZpdHlUeXBlID09PSBjb25zdGFudHMuQUNUSVZJVFlfVFlQRV9FWFBMT1JBVElPTikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKCRzY29wZS5sZWFybmVyRGFzaGJvYXJkQWN0aXZpdHlJZHMuYmVsb25nc1RvSW5jb21wbGV0ZUV4cGxvcmF0aW9ucygkc2NvcGUuZ2V0QWN0aXZpdHlJZCgpKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGFjdGl2aXR5VHlwZSA9PT0gY29uc3RhbnRzLkFDVElWSVRZX1RZUEVfQ09MTEVDVElPTikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKCRzY29wZS5sZWFybmVyRGFzaGJvYXJkQWN0aXZpdHlJZHMuYmVsb25nc1RvSW5jb21wbGV0ZUNvbGxlY3Rpb25zKCRzY29wZS5nZXRBY3Rpdml0eUlkKCkpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogZXNsaW50LWVuYWJsZSBtYXgtbGVuICovXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5hZGRUb0xlYXJuZXJQbGF5bGlzdCA9IGZ1bmN0aW9uIChhY3Rpdml0eUlkLCBhY3Rpdml0eVR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpc1N1Y2Nlc3NmdWxseUFkZGVkID0gKExlYXJuZXJQbGF5bGlzdFNlcnZpY2UuYWRkVG9MZWFybmVyUGxheWxpc3QoYWN0aXZpdHlJZCwgYWN0aXZpdHlUeXBlKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNTdWNjZXNzZnVsbHlBZGRlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhY3Rpdml0eVR5cGUgPT09IGNvbnN0YW50cy5BQ1RJVklUWV9UWVBFX0VYUExPUkFUSU9OKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmxlYXJuZXJEYXNoYm9hcmRBY3Rpdml0eUlkcy5hZGRUb0V4cGxvcmF0aW9uTGVhcm5lclBsYXlsaXN0KGFjdGl2aXR5SWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIG1heC1sZW4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoYWN0aXZpdHlUeXBlID09PSBjb25zdGFudHMuQUNUSVZJVFlfVFlQRV9DT0xMRUNUSU9OKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmxlYXJuZXJEYXNoYm9hcmRBY3Rpdml0eUlkcy5hZGRUb0NvbGxlY3Rpb25MZWFybmVyUGxheWxpc3QoYWN0aXZpdHlJZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIGVzbGludC1lbmFibGUgbWF4LWxlbiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZGlzYWJsZVBsYXlsaXN0VG9vbHRpcCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUucmVtb3ZlRnJvbUxlYXJuZXJQbGF5bGlzdCA9IGZ1bmN0aW9uIChhY3Rpdml0eUlkLCBhY3Rpdml0eVRpdGxlLCBhY3Rpdml0eVR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpc1N1Y2Nlc3NmdWxseVJlbW92ZWQgPSAoTGVhcm5lclBsYXlsaXN0U2VydmljZS5yZW1vdmVGcm9tTGVhcm5lclBsYXlsaXN0KGFjdGl2aXR5SWQsIGFjdGl2aXR5VGl0bGUsIGFjdGl2aXR5VHlwZSwgJHNjb3BlLmxlYXJuZXJEYXNoYm9hcmRBY3Rpdml0eUlkcykpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgVHJ1bmNhdGVBbmRDYXBpdGFsaXplIGZpbHRlciBmb3IgT3BwaWEuXG4gKi9cbi8vIE5vdGUgdGhhdCB0aGlzIGZpbHRlciBkb2VzIG5vdCB0cnVuY2F0ZSBhdCB0aGUgbWlkZGxlIG9mIGEgd29yZC5cbmFuZ3VsYXIubW9kdWxlKCdzdHJpbmdVdGlsaXR5RmlsdGVyc01vZHVsZScpLmZpbHRlcigndHJ1bmNhdGVBbmRDYXBpdGFsaXplJywgW2Z1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChpbnB1dCwgbWF4TnVtYmVyT2ZDaGFyYWN0ZXJzKSB7XG4gICAgICAgICAgICBpZiAoIWlucHV0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlucHV0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHdvcmRzID0gaW5wdXQudHJpbSgpLm1hdGNoKC9cXFMrL2cpO1xuICAgICAgICAgICAgLy8gQ2FwaXRhbGl6ZSB0aGUgZmlyc3Qgd29yZCBhbmQgYWRkIGl0IHRvIHRoZSByZXN1bHQuXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gd29yZHNbMF0uY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyB3b3Jkc1swXS5zbGljZSgxKTtcbiAgICAgICAgICAgIC8vIEFkZCB0aGUgcmVtYWluaW5nIHdvcmRzIHRvIHRoZSByZXN1bHQgdW50aWwgdGhlIGNoYXJhY3RlciBsaW1pdCBpc1xuICAgICAgICAgICAgLy8gcmVhY2hlZC5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgd29yZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoIW1heE51bWJlck9mQ2hhcmFjdGVycyB8fFxuICAgICAgICAgICAgICAgICAgICByZXN1bHQubGVuZ3RoICsgMSArIHdvcmRzW2ldLmxlbmd0aCA8PSBtYXhOdW1iZXJPZkNoYXJhY3RlcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9ICcgJztcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9IHdvcmRzW2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9ICcuLi4nO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBUcnVuY2F0ZSBmaWx0ZXIgZm9yIE9wcGlhLlxuICovXG5yZXF1aXJlKCdmaWx0ZXJzL3N0cmluZy11dGlsaXR5LWZpbHRlcnMvY29udmVydC10by1wbGFpbi10ZXh0LmZpbHRlci50cycpO1xuLy8gRmlsdGVyIHRoYXQgdHJ1bmNhdGVzIGxvbmcgZGVzY3JpcHRvcnMuXG5hbmd1bGFyLm1vZHVsZSgnc3RyaW5nVXRpbGl0eUZpbHRlcnNNb2R1bGUnKS5maWx0ZXIoJ3RydW5jYXRlJywgWyckZmlsdGVyJywgZnVuY3Rpb24gKCRmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChpbnB1dCwgbGVuZ3RoLCBzdWZmaXgpIHtcbiAgICAgICAgICAgIGlmICghaW5wdXQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXNOYU4obGVuZ3RoKSkge1xuICAgICAgICAgICAgICAgIGxlbmd0aCA9IDcwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHN1ZmZpeCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgc3VmZml4ID0gJy4uLic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWFuZ3VsYXIuaXNTdHJpbmcoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgaW5wdXQgPSBTdHJpbmcoaW5wdXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaW5wdXQgPSAkZmlsdGVyKCdjb252ZXJ0VG9QbGFpblRleHQnKShpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gKGlucHV0Lmxlbmd0aCA8PSBsZW5ndGggPyBpbnB1dCA6IChpbnB1dC5zdWJzdHJpbmcoMCwgbGVuZ3RoIC0gc3VmZml4Lmxlbmd0aCkgKyBzdWZmaXgpKTtcbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiogQGZpbGVvdmVydmlldyBTZXJ2aWNlIGZvciBjb252ZXJ0aW5nIGRhdGVzIGluIG1pbGxpc2Vjb25kc1xuKiBzaW5jZSB0aGUgRXBvY2ggdG8gaHVtYW4tcmVhZGFibGUgZGF0ZXMuXG4qL1xub3BwaWEuZmFjdG9yeSgnRGF0ZVRpbWVGb3JtYXRTZXJ2aWNlJywgWyckZmlsdGVyJywgZnVuY3Rpb24gKCRmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8vIFJldHVybnMganVzdCB0aGUgdGltZSBpZiB0aGUgbG9jYWwgZGF0ZXRpbWUgcmVwcmVzZW50YXRpb24gaGFzIHRoZVxuICAgICAgICAgICAgLy8gc2FtZSBkYXRlIGFzIHRoZSBjdXJyZW50IGRhdGUuIE90aGVyd2lzZSwgcmV0dXJucyBqdXN0IHRoZSBkYXRlIGlmIHRoZVxuICAgICAgICAgICAgLy8gbG9jYWwgZGF0ZXRpbWUgcmVwcmVzZW50YXRpb24gaGFzIHRoZSBzYW1lIHllYXIgYXMgdGhlIGN1cnJlbnQgZGF0ZS5cbiAgICAgICAgICAgIC8vIE90aGVyd2lzZSwgcmV0dXJucyB0aGUgZnVsbCBkYXRlICh3aXRoIHRoZSB5ZWFyIGFiYnJldmlhdGVkKS5cbiAgICAgICAgICAgIGdldExvY2FsZUFiYnJldmlhdGVkRGF0ZXRpbWVTdHJpbmc6IGZ1bmN0aW9uIChtaWxsaXNTaW5jZUVwb2NoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRhdGUgPSBuZXcgRGF0ZShtaWxsaXNTaW5jZUVwb2NoKTtcbiAgICAgICAgICAgICAgICBpZiAoZGF0ZS50b0xvY2FsZURhdGVTdHJpbmcoKSA9PT0gbmV3IERhdGUoKS50b0xvY2FsZURhdGVTdHJpbmcoKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGF0ZS50b0xvY2FsZVRpbWVTdHJpbmcoW10sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhvdXI6ICdudW1lcmljJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pbnV0ZTogJ251bWVyaWMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgaG91cjEyOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChkYXRlLmdldEZ1bGxZZWFyKCkgPT09IG5ldyBEYXRlKCkuZ2V0RnVsbFllYXIoKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJGZpbHRlcignZGF0ZScpKGRhdGUsICdNTU0gZCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRmaWx0ZXIoJ2RhdGUnKShkYXRlLCAnc2hvcnREYXRlJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIFJldHVybnMganVzdCB0aGUgZGF0ZS5cbiAgICAgICAgICAgIGdldExvY2FsZURhdGVTdHJpbmc6IGZ1bmN0aW9uIChtaWxsaXNTaW5jZUVwb2NoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRhdGUgPSBuZXcgRGF0ZShtaWxsaXNTaW5jZUVwb2NoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0ZS50b0xvY2FsZURhdGVTdHJpbmcoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBSZXR1cm5zIHdoZXRoZXIgdGhlIGRhdGUgaXMgYXQgbW9zdCBvbmUgd2VlayBiZWZvcmUgdGhlIGN1cnJlbnQgZGF0ZS5cbiAgICAgICAgICAgIGlzUmVjZW50OiBmdW5jdGlvbiAobWlsbGlzU2luY2VFcG9jaCkge1xuICAgICAgICAgICAgICAgIHZhciBPTkVfV0VFS19JTl9NSUxMSVMgPSA3ICogMjQgKiA2MCAqIDYwICogMTAwMDtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCkgLSBtaWxsaXNTaW5jZUVwb2NoIDwgT05FX1dFRUtfSU5fTUlMTElTO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE4IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSBmb3IgdXNlciBkYXRhLlxuICovXG5vcHBpYS5mYWN0b3J5KCdVc2VyU2VydmljZScsIFtcbiAgICAnJGh0dHAnLCAnJHEnLCAnJHdpbmRvdycsICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsICdVc2VySW5mb09iamVjdEZhY3RvcnknLFxuICAgICdERUZBVUxUX1BST0ZJTEVfSU1BR0VfUEFUSCcsXG4gICAgZnVuY3Rpb24gKCRodHRwLCAkcSwgJHdpbmRvdywgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UsIFVzZXJJbmZvT2JqZWN0RmFjdG9yeSwgREVGQVVMVF9QUk9GSUxFX0lNQUdFX1BBVEgpIHtcbiAgICAgICAgdmFyIFBSRUZFUkVOQ0VTX0RBVEFfVVJMID0gJy9wcmVmZXJlbmNlc2hhbmRsZXIvZGF0YSc7XG4gICAgICAgIHZhciB1c2VySW5mbyA9IG51bGw7XG4gICAgICAgIHZhciBnZXRVc2VySW5mb0FzeW5jID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKEdMT0JBTFMudXNlcklzTG9nZ2VkSW4pIHtcbiAgICAgICAgICAgICAgICBpZiAodXNlckluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlc29sdmUodXNlckluZm8pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvdXNlcmluZm9oYW5kbGVyJykudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdXNlckluZm8gPSBVc2VySW5mb09iamVjdEZhY3RvcnkuY3JlYXRlRnJvbUJhY2tlbmREaWN0KHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdXNlckluZm87XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVzb2x2ZShVc2VySW5mb09iamVjdEZhY3RvcnkuY3JlYXRlRGVmYXVsdCgpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGdldFByb2ZpbGVJbWFnZURhdGFVcmxBc3luYzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBwcm9maWxlUGljdHVyZURhdGFVcmwgPSAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0U3RhdGljSW1hZ2VVcmwoREVGQVVMVF9QUk9GSUxFX0lNQUdFX1BBVEgpKTtcbiAgICAgICAgICAgICAgICBpZiAoR0xPQkFMUy51c2VySXNMb2dnZWRJbikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvcHJlZmVyZW5jZXNoYW5kbGVyL3Byb2ZpbGVfcGljdHVyZScpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UuZGF0YS5wcm9maWxlX3BpY3R1cmVfZGF0YV91cmwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9maWxlUGljdHVyZURhdGFVcmwgPSByZXNwb25zZS5kYXRhLnByb2ZpbGVfcGljdHVyZV9kYXRhX3VybDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwcm9maWxlUGljdHVyZURhdGFVcmw7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlc29sdmUocHJvZmlsZVBpY3R1cmVEYXRhVXJsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0UHJvZmlsZUltYWdlRGF0YVVybEFzeW5jOiBmdW5jdGlvbiAobmV3UHJvZmlsZUltYWdlRGF0YVVybCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cC5wdXQoUFJFRkVSRU5DRVNfREFUQV9VUkwsIHtcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlX3R5cGU6ICdwcm9maWxlX3BpY3R1cmVfZGF0YV91cmwnLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBuZXdQcm9maWxlSW1hZ2VEYXRhVXJsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0TG9naW5VcmxBc3luYzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciB1cmxQYXJhbWV0ZXJzID0ge1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50X3VybDogJHdpbmRvdy5sb2NhdGlvbi5ocmVmXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvdXJsX2hhbmRsZXInLCB7IHBhcmFtczogdXJsUGFyYW1ldGVycyB9KS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5sb2dpbl91cmw7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0VXNlckluZm9Bc3luYzogZ2V0VXNlckluZm9Bc3luY1xuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIl0sInNvdXJjZVJvb3QiOiIifQ==