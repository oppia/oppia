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
  '$scope', '$http', '$rootScope', '$uibModal', '$timeout', '$translate',
  'AlertsService', 'UrlInterpolationService', 'UserService', 'UtilsService',
  'DASHBOARD_TYPE_CREATOR', 'DASHBOARD_TYPE_LEARNER',
  function(
      $scope, $http, $rootScope, $uibModal, $timeout, $translate,
      AlertsService, UrlInterpolationService, UserService, UtilsService,
      DASHBOARD_TYPE_CREATOR, DASHBOARD_TYPE_LEARNER) {
    var _PREFERENCES_DATA_URL = '/preferenceshandler/data';
    $rootScope.loadingMessage = 'Loading';
    $scope.profilePictureDataUrl = '';
    $scope.DASHBOARD_TYPE_CREATOR = DASHBOARD_TYPE_CREATOR;
    $scope.DASHBOARD_TYPE_LEARNER = DASHBOARD_TYPE_LEARNER;
    $scope.username = GLOBALS.username;

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
          if (UtilsService.isString(subjectInterests[i])) {
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
      AlertsService.clearWarnings();
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

    $scope.savePreferredAudioLanguageCode = function(
        preferredAudioLanguageCode) {
      _saveDataItem(
        'preferred_audio_language_code', preferredAudioLanguageCode);
    };

    $scope.showUsernamePopover = function(creatorUsername) {
      // The popover on the subscription card is only shown if the length of
      // the creator username is greater than 10 and the user hovers over
      // the truncated username.
      if (creatorUsername.length > 10) {
        return 'mouseenter';
      } else {
        return 'none';
      }
    };

    $scope.saveEmailPreferences = function(
        canReceiveEmailUpdates, canReceiveEditorRoleEmail,
        canReceiveFeedbackMessageEmail, canReceiveSubscriptionEmail) {
      var data = {
        can_receive_email_updates: canReceiveEmailUpdates,
        can_receive_editor_role_email: canReceiveEditorRoleEmail,
        can_receive_feedback_message_email: canReceiveFeedbackMessageEmail,
        can_receive_subscription_email: canReceiveSubscriptionEmail
      };
      _saveDataItem('email_preferences', data);
    };

    $scope.savePreferredLanguageCodes = function(preferredLanguageCodes) {
      _saveDataItem('preferred_language_codes', preferredLanguageCodes);
    };

    $scope.saveDefaultDashboard = function(defaultDashboard) {
      _saveDataItem('default_dashboard', defaultDashboard);
    };

    $scope.showEditProfilePictureModal = function() {
      $uibModal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/preferences/edit_profile_picture_modal_directive.html'),
        backdrop: true,
        controller: [
          '$scope', '$uibModalInstance', function($scope, $uibModalInstance) {
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
              $uibModalInstance.close($scope.croppedImageDataUrl);
            };

            $scope.cancel = function() {
              $uibModalInstance.dismiss('cancel');
            };
          }
        ]
      }).result.then(function(newProfilePictureDataUrl) {
        UserService.setProfileImageDataUrlAsync(newProfilePictureDataUrl)
          .then(function() {
            // The reload is needed in order to update the profile picture in
            // the top-right corner.
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

    $scope.SITE_LANGUAGE_CHOICES = constants.SUPPORTED_SITE_LANGUAGES;
    $scope.AUDIO_LANGUAGE_CHOICES = constants.SUPPORTED_AUDIO_LANGUAGES;

    $scope.hasPageLoaded = false;
    $http.get(_PREFERENCES_DATA_URL).then(function(response) {
      var data = response.data;
      $rootScope.loadingMessage = '';
      $scope.userBio = data.user_bio;
      $scope.subjectInterests = data.subject_interests;
      $scope.preferredLanguageCodes = data.preferred_language_codes;
      $scope.profilePictureDataUrl = data.profile_picture_data_url;
      $scope.defaultDashboard = data.default_dashboard;
      $scope.canReceiveEmailUpdates = data.can_receive_email_updates;
      $scope.canReceiveEditorRoleEmail = data.can_receive_editor_role_email;
      $scope.canReceiveSubscriptionEmail = data.can_receive_subscription_email;
      $scope.canReceiveFeedbackMessageEmail = (
        data.can_receive_feedback_message_email);
      $scope.preferredSiteLanguageCode = data.preferred_site_language_code;
      $scope.preferredAudioLanguageCode = data.preferred_audio_language_code;
      $scope.subscriptionList = data.subscription_list;
      $scope.hasPageLoaded = true;
      _forceSelect2Refresh();
    });
  }
]);
