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

import { Component } from '@angular/core';
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
import { EmailPreferencesBackendDict, SubscriptionSummary, UserBackendApiService, NonEmailPreferencesBackendDict } from 'services/user-backend-api.service';
import { UserService } from 'services/user.service';
import { EditProfilePictureModalComponent } from './modal-templates/edit-profile-picture-modal.component';
require('cropperjs/dist/cropper.min.css');

import './preferences-page.component.css';

interface AudioLangaugeChoice {
  id: string;
  text: string;
}

@Component({
  selector: 'oppia-preferences-page',
  templateUrl: './preferences-page.component.html',
  styleUrls: ['./preferences-page.component.css']
})
export class PreferencesPageComponent {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  subjectInterests!: string;
  preferredLanguageCodes!: string[];
  preferredSiteLanguageCode!: string;
  preferredAudioLanguageCode!: string;
  profilePictureDataUrl!: string;
  AUDIO_LANGUAGE_CHOICES!: AudioLangaugeChoice[];
  userBio!: string;
  defaultDashboard!: string;
  subscriptionList!: SubscriptionSummary[];
  TAG_REGEX_STRING!: string;
  LANGUAGE_CHOICES!: LanguageIdAndText[];
  // The following two properties are set to null when the
  // user is not logged in.
  username!: string | null;
  email!: string | null;
  SITE_LANGUAGE_CHOICES!: typeof AppConstants.SUPPORTED_SITE_LANGUAGES;
  DASHBOARD_TYPE_CREATOR = AppConstants.DASHBOARD_TYPE_CREATOR;
  DASHBOARD_TYPE_LEARNER = AppConstants.DASHBOARD_TYPE_LEARNER;
  subjectInterestsChangeAtLeastOnce: boolean = false;
  exportingData: boolean = false;
  hasPageLoaded: boolean = false;
  canReceiveEmailUpdates: boolean = false;
  canReceiveEditorRoleEmail: boolean = false;
  canReceiveSubscriptionEmail: boolean = false;
  canReceiveFeedbackMessageEmail: boolean = false;
  showEmailSignupLink: boolean = false;
  emailSignupLink: string = AppConstants.BULK_EMAIL_SERVICE_SIGNUP_URL;
  PAGES_REGISTERED_WITH_FRONTEND = (
    AppConstants.PAGES_REGISTERED_WITH_FRONTEND);

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
  ) { }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  PreferencesData(): NonEmailPreferencesBackendDict {
    return {
      user_bio: this.userBio,
      subject_interests: this.subjectInterests,
      preferred_site_language_code: this.preferredSiteLanguageCode,
      preferred_audio_language_code: this.preferredAudioLanguageCode,
      preferred_language_codes: this.preferredLanguageCodes,
      default_dashboard: this.defaultDashboard,
      subscription_list: this.subscriptionList
    };
  }

  private _saveDataItem(
      data: NonEmailPreferencesBackendDict
  ): void {
    this.preventPageUnloadEventService.addListener();
    this.userBackendApiService.updatePreferencesDataAsync(
      data
    ).then((returnData) => {
      this.preventPageUnloadEventService.removeListener();
      this.alertsService.addInfoMessage('Saved!', 1000);
    });
  }

  saveUserBio(userBio: string): void {
    let data = this.PreferencesData();
    data.user_bio = userBio;
    this._saveDataItem(data);
  }

  registerBioChanged(): void {
    this.preventPageUnloadEventService.addListener();
  }

  onSubjectInterestsSelectionChange(subjectInterests: string): void {
    this.alertsService.clearWarnings();
    this.subjectInterestsChangeAtLeastOnce = true;
    let data = this.PreferencesData();
    data.subject_interests = subjectInterests;
    this._saveDataItem(data);
  }

  savePreferredSiteLanguageCodes(preferredSiteLanguageCode: string): void {
    this.i18nLanguageCodeService.setI18nLanguageCode(preferredSiteLanguageCode);
    let data = this.PreferencesData();
    data.preferred_site_language_code = preferredSiteLanguageCode;
    this._saveDataItem(data);
  }

  savePreferredAudioLanguageCode(preferredAudioLanguageCode: string): void {
    let data = this.PreferencesData();
    data.preferred_audio_language_code = preferredAudioLanguageCode;
    this._saveDataItem(data);
  }

  savePreferredLanguageCodes(preferredLanguageCodes: string[]): void {
    let data = this.PreferencesData();
    data.preferred_language_codes = preferredLanguageCodes;
    this._saveDataItem(data);
  }

  saveDefaultDashboard(defaultDashboard: string): void {
    let data = this.PreferencesData();
    data.default_dashboard = defaultDashboard;
    this._saveDataItem(data);
  }


  private _saveEmailPreferences(
      emailPreferencesData: EmailPreferencesBackendDict
  ): void {
    this.preventPageUnloadEventService.addListener();
    this.userBackendApiService.updateEmailPreferencesAsync(
      emailPreferencesData
    ).then((returnData) => {
      this.preventPageUnloadEventService.removeListener();
      if (returnData.bulk_email_signup_message_should_be_shown) {
        this.canReceiveEmailUpdates = false;
        this.showEmailSignupLink = true;
      } else {
        this.alertsService.addInfoMessage('Saved!', 1000);
      }
    });
  }

  saveEmailPreferences(
      canReceiveEmailUpdates: boolean, canReceiveEditorRoleEmail: boolean,
      canReceiveFeedbackMessageEmail: boolean,
      canReceiveSubscriptionEmail: boolean): void {
    let emailPreferencesData: EmailPreferencesBackendDict = {
      can_receive_email_updates: canReceiveEmailUpdates,
      can_receive_editor_role_email: canReceiveEditorRoleEmail,
      can_receive_feedback_message_email: (
        canReceiveFeedbackMessageEmail),
      can_receive_subscription_email: canReceiveSubscriptionEmail
    };
    this._saveEmailPreferences(emailPreferencesData);
  }


  showUsernamePopover(creatorUsername: string): string {
    // The popover on the subscription card is only shown if the length
    // of the creator username is greater than 10 and the user hovers
    // over the truncated username.
    if (creatorUsername.length > 10) {
      return 'mouseenter';
    } else {
      return 'none';
    }
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
        });
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
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

    let preferencesProfilePictureDataUrlPromise = (
      this.userBackendApiService.getPreferencesProfilePictureDataUrlAsync());
    preferencesProfilePictureDataUrlPromise.then((profilePictureData) => {
      this.profilePictureDataUrl = decodeURIComponent(
        profilePictureData.profile_picture_data_url);
    });


    let emailPreferencesPromise = (
      this.userBackendApiService.getEmailPreferencesAsync());
    emailPreferencesPromise.then((emailPreferencesData) => {
      this.canReceiveEmailUpdates = (
        emailPreferencesData.can_receive_email_updates);
      this.canReceiveEditorRoleEmail = (
        emailPreferencesData.can_receive_editor_role_email);
      this.canReceiveFeedbackMessageEmail = (
        emailPreferencesData.can_receive_feedback_message_email);
      this.canReceiveSubscriptionEmail = (
        emailPreferencesData.can_receive_subscription_email);
      this.hasPageLoaded = true;
    });


    let preferencesPromise = this.userBackendApiService.getPreferencesAsync();

    preferencesPromise.then((data) => {
      this.userBio = data.user_bio;
      this.subjectInterests = data.subject_interests;
      this.preferredLanguageCodes = data.preferred_language_codes;
      this.defaultDashboard = data.default_dashboard;
      this.preferredSiteLanguageCode =
        data.preferred_site_language_code;
      this.preferredAudioLanguageCode =
        data.preferred_audio_language_code;
      this.subscriptionList = data.subscription_list;
      this.subscriptionList.forEach((subscription) => {
        subscription.creator_picture_data_url = (
          decodeURIComponent(subscription.creator_picture_data_url));
      });
      this.hasPageLoaded = true;
    });

    Promise.all([
      userInfoPromise,
      preferencesPromise,
      preferencesProfilePictureDataUrlPromise,
      emailPreferencesPromise
    ]).then(() => {
      this.loaderService.hideLoadingScreen();
    });

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
