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
 * @fileoverview Data and controllers for the Oppia 'edit preferences' page.
 *
 * @author sfederwisch@google.com (Stephanie Federwisch)
 */

oppia.controller('Preferences', ['$scope', '$http', '$rootScope', '$modal',
    function($scope, $http, $rootScope, $modal) {
  var _PREFERENCES_DATA_URL = '/preferenceshandler/data';
  $rootScope.loadingMessage = 'Loading';

  var _saveDataItem = function(updateType, data) {
    $http.put(_PREFERENCES_DATA_URL, {
      update_type: updateType,
      data: data
    });
  };

  $scope.saveUserBio = function(userBio) {
    _saveDataItem('user_bio', userBio);
  };

  $scope.savePreferredLanguageCodes = function(preferredLanguageCodes) {
    _saveDataItem('preferred_language_codes', preferredLanguageCodes);
  };

  $scope.showEditProfilePictureModal = function() {
    $modal.open({
      templateUrl: 'modals/editProfilePicture',
      backdrop: true,
      controller: ['$scope', '$modalInstance', function($scope, $modalInstance) {
        $scope.uploadedImage = '';
        $scope.croppedImage = '';

        var handleFileSelect = function(event) {
          var file = event.currentTarget.files[0];
          var reader = new FileReader();
          reader.onload = function(event) {
            $scope.$apply(function() {
              $scope.uploadedImage = event.target.result;
            });
          };
          reader.readAsDataURL(file);
        };
        angular.element(document)
          .on('change', '.profile-picture-input', handleFileSelect);

        $scope.confirm = function() {
          $modalInstance.close($scope.croppedImage);
        };

        $scope.cancel = function() {
          $modalInstance.dismiss('cancel');
        };
      }]
    }).result.then(function(newProfilePicture) {
      $http.put(_PREFERENCES_DATA_URL, {
        update_type: 'profile_picture',
        data: newProfilePicture
      }).success(function(response) {
        location.reload();
      });
    });
  };

  $scope.LANGUAGE_CHOICES = GLOBALS.LANGUAGE_CODES_AND_NAMES.map(function(languageItem) {
    return {
      id: languageItem.code,
      text: languageItem.name
    };
  });

  $scope.hasPageLoaded = false;
  $http.get(_PREFERENCES_DATA_URL).success(function(data) {
    $rootScope.loadingMessage = '';
    $scope.userBio = data.user_bio;
    $scope.preferredLanguageCodes = data.preferred_language_codes;
    $scope.hasPageLoaded = true;
  });
}]);
