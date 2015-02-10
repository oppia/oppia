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
 * @author sfederwisch@google.com (Stephanie Federwisch)
 */

oppia.controller('Profile', ['$scope', '$http', '$rootScope', function(
    $scope, $http, $rootScope) {
  $scope.profileDataUrl = '/profilehandler/data';
  $rootScope.loadingMessage = 'Loading';

  $scope.saveUserBio = function(userBio) {
    $http.put($scope.profileDataUrl, {
      update_type: 'user_bio',
      data: userBio
    });
  };

  $scope.savePreferredLanguageCodes = function(preferredLanguageCodes) {
    $http.put($scope.profileDataUrl, {
      update_type: 'preferred_language_codes',
      data: preferredLanguageCodes
    });
  };

  $scope.LANGUAGE_CHOICES = GLOBALS.LANGUAGE_CODES_AND_NAMES.map(function(languageItem) {
    return {
      id: languageItem.code,
      text: languageItem.name
    };
  });

  $scope.hasPageLoaded = false;
  $http.get($scope.profileDataUrl).success(function(data) {
    $rootScope.loadingMessage = '';
    $scope.userBio = data.user_bio;
    $scope.preferredLanguageCodes = data.preferred_language_codes;
    $scope.hasPageLoaded = true;
  });
}]);
