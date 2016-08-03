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
 */

oppia.controller('Preferences', [
  '$scope', '$http', '$rootScope', '$modal', '$timeout', '$translate',
  'alertsService', 'UrlInterpolationService',
  function(
      $scope, $http, $rootScope, $modal, $timeout, $translate, alertsService,
      UrlInterpolationService) {
    var _PREFERENCES_DATA_URL = '/preferenceshandler/data';
    $rootScope.loadingMessage = 'Loading';
    $scope.profilePictureDataUrl = '';

    $scope.getStaticImageUrl = UrlInterpolationService.getStaticImageUrl;

    var _saveDataItem = function(updateType, data) {
      $http.put(_PREFERENCES_DATA_URL, {
        update_type: updateType,
        data: data
      });
    };

    // Select2 dropdown cannot automatically refresh its display
    // after being translated.
    // Use $scope.select2DropdownIsShown in its ng-if attribute
    // and this function to force it to reload
    var _forceSelect2Refresh = function() {
      $scope.select2DropdownIsShown = false;
      $timeout(function() {
        $scope.select2DropdownIsShown = true;
      }, 100);
    };

    $scope.saveUserBio = function(userBio) {
      _saveDataItem('user_bio', userBio);
    };

    $scope.subjectInterestsChangedAtLeastOnce = false;
    $scope.subjectInterestsWarningText = null;
    $scope.TAG_REGEX_STRING = '^[a-z ]+$';

    $scope.updateSubjectInterestsWarning = function(subjectInterests) {
      var TAG_REGEX = new RegExp($scope.TAG_REGEX_STRING);

      if (subjectInterests instanceof Array) {
        for (var i = 0; i < subjectInterests.length; i++) {
          if (typeof subjectInterests[i] === 'string') {
            if (!TAG_REGEX.test(subjectInterests[i])) {
              $scope.subjectInterestsWarningText = (
                'Subject interests should use only lowercase letters.');
            }
          } else {
            console.error(
              'Error: received bad value for a subject interest. Expected a ' +
              'string, got ', subjectInterests[i]);
            throw Error('Error: received bad value for a subject interest.');
          }
        }
      } else {
        console.error(
          'Error: received bad value for subject interests. Expected list of ' +
          'strings, got ', subjectInterests);
        throw Error('Error: received bad value for subject interests.');
      }
    };

    $scope.onSubjectInterestsSelectionChange = function(subjectInterests) {
      alertsService.clearWarnings();
      $scope.subjectInterestsChangedAtLeastOnce = true;
      $scope.subjectInterestsWarningText = null;
      $scope.updateSubjectInterestsWarning(subjectInterests);
      if ($scope.subjectInterestsWarningText === null) {
        _saveDataItem('subject_interests', subjectInterests);
      }
    };

    $scope.savePreferredSiteLanguageCodes = function(
      preferredSiteLanguageCode) {
      $translate.use(preferredSiteLanguageCode);
      _forceSelect2Refresh();
      _saveDataItem(
        'preferred_site_language_code', preferredSiteLanguageCode);
    };

    $scope.saveEmailPreferences = function(
      canReceiveEmailUpdates, canReceiveEditorRoleEmail,
      canReceiveFeedbackMessageEmail) {
      var data = {
        can_receive_email_updates: canReceiveEmailUpdates,
        can_receive_editor_role_email: canReceiveEditorRoleEmail,
        can_receive_feedback_message_email: canReceiveFeedbackMessageEmail
      };
      _saveDataItem('email_preferences', data);
    };

    $scope.savePreferredLanguageCodes = function(preferredLanguageCodes) {
      _saveDataItem('preferred_language_codes', preferredLanguageCodes);
    };

    $scope.showEditProfilePictureModal = function() {
      $modal.open({
        templateUrl: 'modals/editProfilePicture',
        backdrop: true,
        controller: [
          '$scope', '$modalInstance', function($scope, $modalInstance) {
            $scope.uploadedImage = null;
            $scope.croppedImageDataUrl = '';
            $scope.invalidImageWarningIsShown = false;

            $scope.onFileChanged = function(file) {
              $('.oppia-profile-image-uploader').fadeOut(function() {
                $scope.invalidImageWarningIsShown = false;

                var reader = new FileReader();
                reader.onload = function(e) {
                  $scope.$apply(function() {
                    $scope.uploadedImage = e.target.result;
                  });
                };
                reader.readAsDataURL(file);

                $timeout(function() {
                  $('.oppia-profile-image-uploader').fadeIn();
                }, 100);
              });
            };

            $scope.reset = function() {
              $scope.uploadedImage = null;
              $scope.croppedImageDataUrl = '';
            };

            $scope.onInvalidImageLoaded = function() {
              $scope.uploadedImage = null;
              $scope.croppedImageDataUrl = '';
              $scope.invalidImageWarningIsShown = true;
            };

            $scope.confirm = function() {
              $modalInstance.close($scope.croppedImageDataUrl);
            };

            $scope.cancel = function() {
              $modalInstance.dismiss('cancel');
            };
          }
        ]
      }).result.then(function(newProfilePictureDataUrl) {
        $http.put(_PREFERENCES_DATA_URL, {
          update_type: 'profile_picture_data_url',
          data: newProfilePictureDataUrl
        }).then(function() {
          // The reload is needed in order to update the profile picture in the
          // top-right corner.
          location.reload();
        });
      });
    };

    $scope.LANGUAGE_CHOICES = GLOBALS.LANGUAGE_CODES_AND_NAMES.map(
      function(languageItem) {
        return {
          id: languageItem.code,
          text: languageItem.name
        };
      }
    );

    $scope.SITE_LANGUAGE_CHOICES = [];
    for (var languageKey in GLOBALS.SUPPORTED_SITE_LANGUAGES) {
      $scope.SITE_LANGUAGE_CHOICES.push({
        id: languageKey,
        text: GLOBALS.SUPPORTED_SITE_LANGUAGES[languageKey]
      });
    }

    $scope.hasPageLoaded = false;
    $http.get(_PREFERENCES_DATA_URL).then(function(response) {
      var data = response.data;
      $rootScope.loadingMessage = '';
      $scope.userBio = data.user_bio;
      $scope.subjectInterests = data.subject_interests;
      $scope.preferredLanguageCodes = data.preferred_language_codes;
      $scope.profilePictureDataUrl = data.profile_picture_data_url;
      $scope.canReceiveEmailUpdates = data.can_receive_email_updates;
      $scope.canReceiveEditorRoleEmail = data.can_receive_editor_role_email;
      $scope.canReceiveFeedbackMessageEmail = (
        data.can_receive_feedback_message_email);
      $scope.preferredSiteLanguageCode = data.preferred_site_language_code;
      $scope.hasPageLoaded = true;
      _forceSelect2Refresh();
    });
  }
]);
