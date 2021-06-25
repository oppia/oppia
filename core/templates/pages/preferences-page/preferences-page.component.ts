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

import { Component, Input } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AppConstants } from 'app.constants';
import { LanguageIdAndText, LanguageUtilService } from 'domain/utilities/language-util.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { AlertsService } from 'services/alerts.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { LoaderService } from 'services/loader.service';
import { PreventPageUnloadEventService } from 'services/prevent-page-unload-event.service';
import { SubscriptionSummary, UserBackendApiService } from 'services/user-backend-api.service';
import { UserService } from 'services/user.service';
import { EditProfilePictureModalComponent } from './modal-templates/edit-profile-picture-modal.component';
require('cropperjs/dist/cropper.min.css');

@Component({
  selector: 'oppia-preferences-page',
  templateUrl: './preferences-page.component.html'
})
export class PreferencesPageComponent {
  @Input() subjectInterests;
  @Input() preferredLanguageCodes;
  @Input() preferredSiteLanguageCode;
  @Input() preferredAudioLanguageCode;
  subjectInterestsChangeAtLeastOnce: boolean;
  exportingData = false;
  profilePictureDataUrl;
  DASHBOARD_TYPE_CREATOR = AppConstants.DASHBOARD_TYPE_CREATOR;
  DASHBOARD_TYPE_LEARNER = AppConstants.DASHBOARD_TYPE_LEARNER;
  username: string = '';
  email: string;
  AUDIO_LANGUAGE_CHOICES;
  hasPageLoaded: boolean;
  userBio: string;
  defaultDashboard: string;
  canReceiveEmailUpdates: boolean;
  canReceiveEditorRoleEmail: boolean;
  canReceiveSubscriptionEmail: boolean;
  canReceiveFeedbackMessageEmail: boolean;
  subscriptionList: SubscriptionSummary[];
  userCanDeleteAccount: boolean;
  TAG_REGEX_STRING: string;
  LANGUAGE_CHOICES: LanguageIdAndText[];
  SITE_LANGUAGE_CHOICES;

  constructor(
    private ngbModal: NgbModal,
    private windowRef: WindowRef,
    private alertsService: AlertsService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private languageUtilService: LanguageUtilService,
    private loaderService: LoaderService,
    private preventPageUnloadEventService: PreventPageUnloadEventService,
    private urlInterpolationService: UrlInterpolationService,
    private userBackendApiService: UserBackendApiService,
    private userService: UserService
  ) {}

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  private _saveDataItem(updateType, data): void {
    this.preventPageUnloadEventService.addListener();
    this.userBackendApiService.updatePreferencesDataAsync(
      updateType, data).then(() => {
      this.preventPageUnloadEventService.removeListener();
      this.alertsService.addInfoMessage('Saved!', 1000);
    });
  }

  saveUserBio(userBio: string): void {
    this._saveDataItem('user_bio', userBio);
  }

  registerBioChanged(): void {
    this.preventPageUnloadEventService.addListener();
  }

  onSubjectInterestsSelectionChange(subjectInterests: string[]): void {
    this.alertsService.clearWarnings();
    this.subjectInterestsChangeAtLeastOnce = true;
    this._saveDataItem('subject_interests', subjectInterests);
  }

  savePreferredSiteLanguageCodes(preferredSiteLanguageCode: string): void {
    this.i18nLanguageCodeService.setI18nLanguageCode(preferredSiteLanguageCode);
    this._saveDataItem(
      'preferred_site_language_code', preferredSiteLanguageCode);
  }

  savePreferredAudioLanguageCode(preferredAudioLanguageCode: string): void {
    this._saveDataItem(
      'preferred_audio_language_code', preferredAudioLanguageCode);
  }

  saveEmailPreferences(
      canReceiveEmailUpdates: boolean, canReceiveEditorRoleEmail: boolean,
      canReceiveFeedbackMessageEmail: boolean,
      canReceiveSubscriptionEmail: boolean): void {
    let data = {
      can_receive_email_updates: canReceiveEmailUpdates,
      can_receive_editor_role_email: canReceiveEditorRoleEmail,
      can_receive_feedback_message_email: (
        canReceiveFeedbackMessageEmail),
      can_receive_subscription_email: canReceiveSubscriptionEmail
    };
    this._saveDataItem('email_preferences', data);
  }

  savePreferredLanguageCodes(preferredLanguageCodes: string[]): void {
    this._saveDataItem('preferred_language_codes', preferredLanguageCodes);
  }

  saveDefaultDashboard(defaultDashboard: string): void {
    this._saveDataItem('default_dashboard', defaultDashboard);
  }

  handleExportDataClick(): void {
    if (!this.exportingData) {
      this.exportingData = true;
    }
  }

  showEditProfilePictureModal(): void {
    let modalRef = this.ngbModal.open(EditProfilePictureModalComponent, {
      backdrop: 'static'
    });

    modalRef.result.then((newProfilePictureDataUrl) => {
      this.userService.setProfileImageDataUrlAsync(newProfilePictureDataUrl)
        .then(() => {
          // The reload is needed in order to update the profile picture
          // in the top-right corner.
          this.windowRef.nativeWindow.location.reload();
        }, () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        // No further action is needed.
        });
    });

    // $uibModal.open({
    //   templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
    //     '/pages/preferences-page/modal-templates/' +
    //     'edit-profile-picture-modal.directive.html'),
    //   backdrop: 'static',
    //   controller: 'EditProfilePictureModalController'
    // }).result.then(function(newProfilePictureDataUrl) {
    //   UserService.setProfileImageDataUrlAsync(
    //     newProfilePictureDataUrl)
    //     .then(function() {
    //       // The reload is needed in order to update the profile picture
    //       // in the top-right corner.
    //       $window.location.reload();
    //     });
    // }, function() {
    //   // Note to developers:
    //   // This callback is triggered when the Cancel button is clicked.
    //   // No further action is needed.
    // });
  }

  ngOnInit(): void {
    this.loaderService.showLoadingScreen('Loading');
    let userInfoPromise = this.userService.getUserInfoAsync();
    userInfoPromise.then((userInfo) => {
      this.username = userInfo.getUsername();
      this.email = userInfo.getEmail();
    });

    this.AUDIO_LANGUAGE_CHOICES = AppConstants.SUPPORTED_AUDIO_LANGUAGES.map(
      (languageItem) => {
        return {
          id: languageItem.id,
          text: languageItem.description
        };
      }
    );

    this.hasPageLoaded = false;

    let preferencesPromise = this.userBackendApiService.getPreferencesAsync();

    preferencesPromise.then((data) => {
      this.userBio = data.user_bio;
      this.subjectInterests = data.subject_interests;
      this.preferredLanguageCodes = data.preferred_language_codes;
      this.profilePictureDataUrl = decodeURIComponent(
        data.profile_picture_data_url);
      this.defaultDashboard = data.default_dashboard;
      this.canReceiveEmailUpdates = data.can_receive_email_updates;
      this.canReceiveEditorRoleEmail =
      data.can_receive_editor_role_email;
      this.canReceiveSubscriptionEmail =
        data.can_receive_subscription_email;
      this.canReceiveFeedbackMessageEmail = (
        data.can_receive_feedback_message_email);
      this.preferredSiteLanguageCode =
      data.preferred_site_language_code;
      this.preferredAudioLanguageCode =
        data.preferred_audio_language_code;
      this.subscriptionList = data.subscription_list;
      this.hasPageLoaded = true;
    });

    Promise.all([userInfoPromise, preferencesPromise]).then(() => {
      this.loaderService.hideLoadingScreen();
    });

    this.userCanDeleteAccount = AppConstants.ENABLE_ACCOUNT_DELETION;
    this.userCanDeleteAccount = AppConstants.ENABLE_ACCOUNT_EXPORT;
    this.subjectInterestsChangeAtLeastOnce = false;
    this.TAG_REGEX_STRING = '^[a-z ]+$';
    this.LANGUAGE_CHOICES = this.languageUtilService.getLanguageIdsAndTexts();
    this.SITE_LANGUAGE_CHOICES = AppConstants.SUPPORTED_SITE_LANGUAGES;
  }
}

angular.module('oppia').directive('oppiaPreferencesPage',
  downgradeComponent({
    component: PreferencesPageComponent
  }) as angular.IDirectiveFactory);

// Angular.module('oppia').component('preferencesPage', {
//   bindings: {
//     subjectInterests: '=',
//     preferredLanguageCodes: '=',
//     preferredSiteLanguageCode: '=',
//     preferredAudioLanguageCode: '='
//   },
//   template: require('./preferences-page.component.html'),
//   controller: [
//     '$http', '$q', '$rootScope', '$timeout', '$translate', '$uibModal',
//     '$window', 'AlertsService', 'I18nLanguageCodeService',
//     'LanguageUtilService', 'LoaderService', 'PreventPageUnloadEventService',
//     'UrlInterpolationService', 'UserService',
//     'DASHBOARD_TYPE_CREATOR', 'DASHBOARD_TYPE_LEARNER',
//     'ENABLE_ACCOUNT_DELETION', 'ENABLE_ACCOUNT_EXPORT',
//     'SUPPORTED_AUDIO_LANGUAGES', 'SUPPORTED_SITE_LANGUAGES', function(
//         $http, $q, $rootScope, $timeout, $translate, $uibModal,
//         $window, AlertsService, I18nLanguageCodeService,
//         LanguageUtilService, LoaderService, PreventPageUnloadEventService,
//         UrlInterpolationService, UserService,
//         DASHBOARD_TYPE_CREATOR, DASHBOARD_TYPE_LEARNER,
//         ENABLE_ACCOUNT_DELETION, ENABLE_ACCOUNT_EXPORT,
//         SUPPORTED_AUDIO_LANGUAGES, SUPPORTED_SITE_LANGUAGES) {
//       var ctrl = this;
//       var _PREFERENCES_DATA_URL = '/preferenceshandler/data';

//       ctrl.getStaticImageUrl = function(imagePath) {
//         return UrlInterpolationService.getStaticImageUrl(imagePath);
//       };
//       var _saveDataItem = function(updateType, data) {
//         PreventPageUnloadEventService.addListener();
//         $http.put(_PREFERENCES_DATA_URL, {
//           update_type: updateType,
//           data: data
//         }).then(() => {
//           PreventPageUnloadEventService.removeListener();
//           AlertsService.addInfoMessage('Saved!', 1000);
//         });
//       };

//       // Select2 dropdown cannot automatically refresh its display
//       // after being translated.
//       // Use ctrl.select2DropdownIsShown in its ng-if attribute
//       // and this function to force it to reload.
//       var _forceSelect2Refresh = function() {
//         ctrl.select2DropdownIsShown = false;
//         $timeout(function() {
//           ctrl.select2DropdownIsShown = true;
//         }, 100);
//       };

//       ctrl.saveUserBio = function(userBio) {
//         _saveDataItem('user_bio', userBio);
//       };

//       ctrl.registerBioChanged = function() {
//         PreventPageUnloadEventService.addListener();
//       };

//       ctrl.onSubjectInterestsSelectionChange = function(subjectInterests) {
//         AlertsService.clearWarnings();
//         ctrl.subjectInterestsChangedAtLeastOnce = true;
//         _saveDataItem('subject_interests', subjectInterests);
//       };

//       ctrl.savePreferredSiteLanguageCodes = function(
//           preferredSiteLanguageCode) {
//         $translate.use(preferredSiteLanguageCode);
//         I18nLanguageCodeService.setI18nLanguageCode(
//           preferredSiteLanguageCode);
//         _forceSelect2Refresh();
//         _saveDataItem(
//           'preferred_site_language_code', preferredSiteLanguageCode);
//       };

//       ctrl.savePreferredAudioLanguageCode = function(
//           preferredAudioLanguageCode) {
//         _saveDataItem(
//           'preferred_audio_language_code', preferredAudioLanguageCode);
//       };

//       ctrl.showUsernamePopover = function(creatorUsername) {
//         // The popover on the subscription card is only shown if the length
//         // of the creator username is greater than 10 and the user hovers
//         // over the truncated username.
//         if (creatorUsername.length > 10) {
//           return 'mouseenter';
//         } else {
//           return 'none';
//         }
//       };

//       ctrl.saveEmailPreferences = function(
//           canReceiveEmailUpdates, canReceiveEditorRoleEmail,
//           canReceiveFeedbackMessageEmail, canReceiveSubscriptionEmail) {
//         var data = {
//           can_receive_email_updates: canReceiveEmailUpdates,
//           can_receive_editor_role_email: canReceiveEditorRoleEmail,
//           can_receive_feedback_message_email: (
//             canReceiveFeedbackMessageEmail),
//           can_receive_subscription_email: canReceiveSubscriptionEmail
//         };
//         _saveDataItem('email_preferences', data);
//       };

//       ctrl.savePreferredLanguageCodes = function(preferredLanguageCodes) {
//         _saveDataItem('preferred_language_codes', preferredLanguageCodes);
//       };

//       ctrl.saveDefaultDashboard = function(defaultDashboard) {
//         _saveDataItem('default_dashboard', defaultDashboard);
//       };

//       ctrl.exportingData = false;

//       ctrl.handleExportDataClick = function() {
//         if (!ctrl.exportingData) {
//           ctrl.exportingData = true;
//         }
//       };

//       ctrl.showEditProfilePictureModal = function() {
//         $uibModal.open({
//           templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
//             '/pages/preferences-page/modal-templates/' +
//             'edit-profile-picture-modal.directive.html'),
//           backdrop: 'static',
//           controller: 'EditProfilePictureModalController'
//         }).result.then(function(newProfilePictureDataUrl) {
//           UserService.setProfileImageDataUrlAsync(
//             newProfilePictureDataUrl)
//             .then(function() {
//               // The reload is needed in order to update the profile picture
//               // in the top-right corner.
//               $window.location.reload();
//             });
//         }, function() {
//           // Note to developers:
//           // This callback is triggered when the Cancel button is clicked.
//           // No further action is needed.
//         });
//       };
//       ctrl.$onInit = function() {
//         ctrl.profilePictureDataUrl = '';
//         ctrl.DASHBOARD_TYPE_CREATOR = DASHBOARD_TYPE_CREATOR;
//         ctrl.DASHBOARD_TYPE_LEARNER = DASHBOARD_TYPE_LEARNER;

//         ctrl.username = '';
//         LoaderService.showLoadingScreen('Loading');
//         var userInfoPromise = UserService.getUserInfoAsync();
//         userInfoPromise.then(function(userInfo) {
//           ctrl.username = userInfo.getUsername();
//           ctrl.email = userInfo.getEmail();
//           // TODO(#8521): Remove the use of $rootScope.$apply()
//           // once the controller is migrated to angular.
//           $rootScope.$applyAsync();
//         });

//         ctrl.AUDIO_LANGUAGE_CHOICES = SUPPORTED_AUDIO_LANGUAGES.map(
//           function(languageItem) {
//             return {
//               id: languageItem.id,
//               text: languageItem.description
//             };
//           }
//         );

//         ctrl.hasPageLoaded = false;
//         var preferencesPromise = $http.get(_PREFERENCES_DATA_URL);
//         preferencesPromise.then(function(response) {
//           var data = response.data;
//           ctrl.userBio = data.user_bio;
//           ctrl.subjectInterests = data.subject_interests;
//           ctrl.preferredLanguageCodes = data.preferred_language_codes;
//           ctrl.profilePictureDataUrl = data.profile_picture_data_url;
//           ctrl.defaultDashboard = data.default_dashboard;
//           ctrl.canReceiveEmailUpdates = data.can_receive_email_updates;
//           ctrl.canReceiveEditorRoleEmail =
//           data.can_receive_editor_role_email;
//           ctrl.canReceiveSubscriptionEmail =
//             data.can_receive_subscription_email;
//           ctrl.canReceiveFeedbackMessageEmail = (
//             data.can_receive_feedback_message_email);
//           ctrl.preferredSiteLanguageCode =
//           data.preferred_site_language_code;
//           ctrl.preferredAudioLanguageCode =
//             data.preferred_audio_language_code;
//           ctrl.subscriptionList = data.subscription_list;
//           ctrl.hasPageLoaded = true;
//           _forceSelect2Refresh();
//         });

//         $q.all([userInfoPromise, preferencesPromise]).then(function() {
//           LoaderService.hideLoadingScreen();
//         });
//         ctrl.userCanDeleteAccount = ENABLE_ACCOUNT_DELETION;
//         ctrl.userCanExportAccount = ENABLE_ACCOUNT_EXPORT;
//         ctrl.subjectInterestsChangedAtLeastOnce = false;
//         ctrl.TAG_REGEX_STRING = '^[a-z ]+$';
//         ctrl.LANGUAGE_CHOICES =
//         LanguageUtilService.getLanguageIdsAndTexts();
//         ctrl.SITE_LANGUAGE_CHOICES = SUPPORTED_SITE_LANGUAGES;
//       };
//     }
//   ]
// });
