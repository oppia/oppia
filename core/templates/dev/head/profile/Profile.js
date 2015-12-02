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
 * @fileoverview Data and controllers for the Oppia profile page.
 *
 * @author sean@seanlip.org (Sean Lip)
 */

oppia.controller('Profile', [
  '$scope', '$http', '$rootScope', 'oppiaDatetimeFormatter', 'ratingVisibilityService',
  function($scope, $http, $rootScope, oppiaDatetimeFormatter, ratingVisibilityService) {
    var profileDataUrl = '/profilehandler/data/' + GLOBALS.PROFILE_USERNAME;
    var DEFAULT_PROFILE_PICTURE_URL = '/images/general/no_profile_picture.png';

    $scope.getLocaleDateString = function(millisSinceEpoch) {
      return oppiaDatetimeFormatter.getLocaleDateString(millisSinceEpoch);
    };

//to be redefined to pull from the back end instead of 4.5s

    $scope.userDisplayedStatistics = [
      {'number_value': 4.5, 'title': "User Impact"},
      {'number_value': 4.5, 'title': "Created Explorations"},
      {'number_value': 4.5, 'title': "Edited Explorations"}
    ];

    $scope.areRatingsShown = function(ratingFrequencies) {
    return ratingVisibilityService.areRatingsShown(ratingFrequencies);
  }; 
    $scope.userCreatedExplorations = [{"status": "publicized", "community_owned": true, "last_updated": 1447362647145.1201,   "is_editable": true, "language_code": "en", "id": "0", "category": "Welcome", "ratings": {"1": 1, "3": 1, "2": 0, "5": 5, "4": 3}, "title": "Welcome to Oppia!", "objective": "become familiar with Oppia's capabilities", "thumbnail_image_url": "/images/gallery/exploration_background_teal_small.png"}, {"status": "public", "community_owned": false, "last_updated": 1448031062905.04, "is_editable": false, "language_code": "en", "id": "TZTJWx0kA4ML", "category": "Education", "ratings": {"1": 0, "3": 0, "2": 0, "5": 1, "4": 0}, "title": "TEST", "objective": "THE BENEFITS OF 3D MOOCS", "thumbnail_image_url": "/images/gallery/exploration_background_teal_small.png"}, {"status": "public", "community_owned": false, "last_updated": 1448029838111.9199, "is_editable": false, "language_code": "en", "id": "Xtn9w_HYzm1Y", "category": "Education", "ratings": {"1": 0, "3": 0, "2": 0, "5": 0, "4": 0}, "title": "Programme Rep Training", "objective": "To introduce the role of Programme Rep and provide the key information to get started in the role.", "thumbnail_image_url": "/images/gallery/exploration_background_teal_small.png"}, {"status": "public", "community_owned": false, "last_updated": 1448044088407.8799, "is_editable": false, "language_code": "en", "id": "C-UDcqyIDAf4", "category": "Education", "ratings": {"1": 0, "3": 0, "2": 0, "5": 0, "4": 0}, "title": "Turtle Geometry", "objective": "Create algorithms to draw shapes", "thumbnail_image_url": "/images/gallery/exploration_background_teal_small.png"}];

    $scope.userEditedExplorations = [{"status": "publicized", "community_owned": true, "last_updated": 1447362647145.1201,   "is_editable": true, "language_code": "en", "id": "0", "category": "Welcome", "ratings": {"1": 1, "3": 1, "2": 0, "5": 5, "4": 3}, "title": "Welcome to Oppia!", "objective": "become familiar with Oppia's capabilities", "thumbnail_image_url": "/images/gallery/exploration_background_teal_small.png"}, {"status": "public", "community_owned": false, "last_updated": 1448031062905.04, "is_editable": false, "language_code": "en", "id": "TZTJWx0kA4ML", "category": "Education", "ratings": {"1": 0, "3": 0, "2": 0, "5": 1, "4": 0}, "title": "TEST", "objective": "THE BENEFITS OF 3D MOOCS", "thumbnail_image_url": "/images/gallery/exploration_background_teal_small.png"}, {"status": "public", "community_owned": false, "last_updated": 1448029838111.9199, "is_editable": false, "language_code": "en", "id": "Xtn9w_HYzm1Y", "category": "Education", "ratings": {"1": 0, "3": 0, "2": 0, "5": 0, "4": 0}, "title": "Programme Rep Training", "objective": "To introduce the role of Programme Rep and provide the key information to get started in the role.", "thumbnail_image_url": "/images/gallery/exploration_background_teal_small.png"}, {"status": "public", "community_owned": false, "last_updated": 1448044088407.8799, "is_editable": false, "language_code": "en", "id": "C-UDcqyIDAf4", "category": "Education", "ratings": {"1": 0, "3": 0, "2": 0, "5": 0, "4": 0}, "title": "Turtle Geometry", "objective": "Create algorithms to draw shapes", "thumbnail_image_url": "/images/gallery/exploration_background_teal_small.png"}];
    
     
    $rootScope.loadingMessage = 'Loading';
    $http.get(profileDataUrl).success(function(data) {
      $rootScope.loadingMessage = '';
      $scope.userBio = data.user_bio;
      $scope.firstContributionDatetime = data.first_contribution_datetime;
      $scope.profilePictureDataUrl = (
        data.profile_picture_data_url || DEFAULT_PROFILE_PICTURE_URL);
      $rootScope.loadingMessage = '';
    });
  }
]);


