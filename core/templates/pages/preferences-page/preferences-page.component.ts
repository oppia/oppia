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
 * @fileoverview Component for the Oppia 'edit preferences' page.
 */

require('cropperjs/dist/cropper.min.css');

require('base-components/base-content.directive.ts');
require(
  'components/forms/custom-forms-directives/select2-dropdown.directive.ts');
require('components/forms/custom-forms-directives/image-uploader.directive.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'background-banner.component.ts');
require('filters/string-utility-filters/truncate.filter.ts');
require(
  'pages/preferences-page/modal-templates/' +
  'edit-profile-picture-modal.controller.ts');

require('domain/utilities/language-util.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('services/alerts.service.ts');
require('services/user.service.ts');
require('services/utils.service.ts');

angular.module('oppia').component('preferencesPage', {
  bindings: {
    subjectInterests: '=',
    preferredLanguageCodes: '=',
    preferredSiteLanguageCode: '=',
    preferredAudioLanguageCode: '='
  },
  template: require('./preferences-page.component.html'),
  controller: [
    '$http', '$q', '$translate', '$timeout', '$window',
    '$uibModal', 'AlertsService', 'LanguageUtilService', 'LoaderService',
    'UrlInterpolationService', 'UserService',
    'DASHBOARD_TYPE_CREATOR', 'DASHBOARD_TYPE_LEARNER',
    'ENABLE_ACCOUNT_DELETION', 'ENABLE_ACCOUNT_EXPORT',
    'SUPPORTED_AUDIO_LANGUAGES', 'SUPPORTED_SITE_LANGUAGES',
    function(
        $http, $q, $translate, $timeout, $window,
        $uibModal, AlertsService, LanguageUtilService, LoaderService,
        UrlInterpolationService, UserService,
        DASHBOARD_TYPE_CREATOR, DASHBOARD_TYPE_LEARNER,
        ENABLE_ACCOUNT_DELETION, ENABLE_ACCOUNT_EXPORT,
        SUPPORTED_AUDIO_LANGUAGES, SUPPORTED_SITE_LANGUAGES) {
      var ctrl = this;
      var _PREFERENCES_DATA_URL = '/preferenceshandler/data';

      ctrl.getStaticImageUrl = function(imagePath) {
        return UrlInterpolationService.getStaticImageUrl(imagePath);
      };
      var _saveDataItem = function(updateType, data) {
        $http.put(_PREFERENCES_DATA_URL, {
          update_type: updateType,
          data: data
        });
      };

      // Select2 dropdown cannot automatically refresh its display
      // after being translated.
      // Use ctrl.select2DropdownIsShown in its ng-if attribute
      // and this function to force it to reload
      var _forceSelect2Refresh = function() {
        ctrl.select2DropdownIsShown = false;
        $timeout(function() {
          ctrl.select2DropdownIsShown = true;
        }, 100);
      };

      ctrl.saveUserBio = function(userBio) {
        _saveDataItem('user_bio', userBio);
      };

      ctrl.onSubjectInterestsSelectionChange = function(subjectInterests) {
        AlertsService.clearWarnings();
        ctrl.subjectInterestsChangedAtLeastOnce = true;
        _saveDataItem('subject_interests', subjectInterests);
      };

      ctrl.savePreferredSiteLanguageCodes = function(
          preferredSiteLanguageCode) {
        $translate.use(preferredSiteLanguageCode);
        _forceSelect2Refresh();
        _saveDataItem(
          'preferred_site_language_code', preferredSiteLanguageCode);
      };

      ctrl.savePreferredAudioLanguageCode = function(
          preferredAudioLanguageCode) {
        _saveDataItem(
          'preferred_audio_language_code', preferredAudioLanguageCode);
      };

      ctrl.showUsernamePopover = function(creatorUsername) {
        // The popover on the subscription card is only shown if the length
        // of the creator username is greater than 10 and the user hovers
        // over the truncated username.
        if (creatorUsername.length > 10) {
          return 'mouseenter';
        } else {
          return 'none';
        }
      };

      ctrl.saveEmailPreferences = function(
          canReceiveEmailUpdates, canReceiveEditorRoleEmail,
          canReceiveFeedbackMessageEmail, canReceiveSubscriptionEmail) {
        var data = {
          can_receive_email_updates: canReceiveEmailUpdates,
          can_receive_editor_role_email: canReceiveEditorRoleEmail,
          can_receive_feedback_message_email: (
            canReceiveFeedbackMessageEmail),
          can_receive_subscription_email: canReceiveSubscriptionEmail
        };
        _saveDataItem('email_preferences', data);
      };

      ctrl.savePreferredLanguageCodes = function(preferredLanguageCodes) {
        _saveDataItem('preferred_language_codes', preferredLanguageCodes);
      };

      ctrl.saveDefaultDashboard = function(defaultDashboard) {
        _saveDataItem('default_dashboard', defaultDashboard);
      };

      ctrl.exportingData = false;

      ctrl.handleExportDataClick = function() {
        if (!ctrl.exportingData) {
          ctrl.exportingData = true;
        }
      };

      ctrl.showEditProfilePictureModal = function() {
        $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/preferences-page/modal-templates/' +
            'edit-profile-picture-modal.directive.html'),
          backdrop: 'static',
          controller: 'EditProfilePictureModalController'
        }).result.then(function(newProfilePictureDataUrl) {
          UserService.setProfileImageDataUrlAsync(
            newProfilePictureDataUrl)
            .then(function() {
              // The reload is needed in order to update the profile picture
              // in the top-right corner.
              $window.location.reload();
            });
        }, function() {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        });
      };
      ctrl.$onInit = function() {
        ctrl.profilePictureDataUrl = '';
        ctrl.DASHBOARD_TYPE_CREATOR = DASHBOARD_TYPE_CREATOR;
        ctrl.DASHBOARD_TYPE_LEARNER = DASHBOARD_TYPE_LEARNER;

        ctrl.username = '';
        LoaderService.showLoadingScreen('Loading');
        var userInfoPromise = UserService.getUserInfoAsync();
        userInfoPromise.then(function(userInfo) {
          ctrl.username = userInfo.getUsername();
          ctrl.email = userInfo.getEmail();
        });

        ctrl.AUDIO_LANGUAGE_CHOICES = SUPPORTED_AUDIO_LANGUAGES.map(
          function(languageItem) {
            return {
              id: languageItem.id,
              text: languageItem.description
            };
          }
        );

        ctrl.hasPageLoaded = false;
        var preferencesPromise = $http.get(_PREFERENCES_DATA_URL);
        preferencesPromise.then(function(response) {
          var data = response.data;
          ctrl.userBio = data.user_bio;
          ctrl.subjectInterests = data.subject_interests;
          ctrl.preferredLanguageCodes = data.preferred_language_codes;
          ctrl.profilePictureDataUrl = data.profile_picture_data_url;
          ctrl.defaultDashboard = data.default_dashboard;
          ctrl.canReceiveEmailUpdates = data.can_receive_email_updates;
          ctrl.canReceiveEditorRoleEmail =
          data.can_receive_editor_role_email;
          ctrl.canReceiveSubscriptionEmail =
            data.can_receive_subscription_email;
          ctrl.canReceiveFeedbackMessageEmail = (
            data.can_receive_feedback_message_email);
          ctrl.preferredSiteLanguageCode =
          data.preferred_site_language_code;
          ctrl.preferredAudioLanguageCode =
            data.preferred_audio_language_code;
          ctrl.subscriptionList = data.subscription_list;
          ctrl.hasPageLoaded = true;
          _forceSelect2Refresh();
        });

        $q.all([userInfoPromise, preferencesPromise]).then(function() {
          LoaderService.hideLoadingScreen();
        });
        ctrl.userCanDeleteAccount = ENABLE_ACCOUNT_DELETION;
        ctrl.userCanExportAccount = ENABLE_ACCOUNT_EXPORT;
        ctrl.subjectInterestsChangedAtLeastOnce = false;
        ctrl.TAG_REGEX_STRING = '^[a-z ]+$';
        ctrl.LANGUAGE_CHOICES =
        LanguageUtilService.getLanguageIdsAndTexts();
        ctrl.SITE_LANGUAGE_CHOICES = SUPPORTED_SITE_LANGUAGES;
      };
    }
  ]
});
