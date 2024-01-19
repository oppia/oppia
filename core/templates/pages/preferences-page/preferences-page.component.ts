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

import { Component, ViewChild, ElementRef } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { AppConstants } from 'app.constants';
import { LanguageIdAndText, LanguageUtilService } from 'domain/utilities/language-util.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { AlertsService } from 'services/alerts.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { ImageLocalStorageService } from 'services/image-local-storage.service';
import { ImageUploadHelperService } from 'services/image-upload-helper.service';
import { LoaderService } from 'services/loader.service';
import { PreventPageUnloadEventService } from 'services/prevent-page-unload-event.service';
import { EmailPreferencesBackendDict, SubscriptionSummary, UserBackendApiService } from 'services/user-backend-api.service';
import { UserService } from 'services/user.service';
import { WindowRef } from 'services/contextual/window-ref.service';

import { EditProfilePictureModalComponent } from './modal-templates/edit-profile-picture-modal.component';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
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
  profilePicturePngDataUrl!: string;
  profilePictureWebpDataUrl!: string;
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
  DASHBOARD_TYPE_CONTRIBUTOR = AppConstants.DASHBOARD_TYPE_CONTRIBUTOR;
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

  newProfilePictureDataUrl!: string;
  pageShouldBeReloaded: boolean = false;
  hasUnsavedChanges = false;
  unsavedChanges: { [key: string]: boolean } = {
    profile_picture_data_url: false,
    user_bio: false,
    default_dashboard: false,
    subject_interests: false,
    preferred_language_codes: false,
    preferred_site_language_code: false,
    preferred_audio_language_code: false,
    email_preferences: false
  };

  @ViewChild('firstRadio') firstRadio!: ElementRef;

  @ViewChild('secondRadio') secondRadio!: ElementRef;

  @ViewChild('thirdRadio') thirdRadio!: ElementRef;

  constructor(
    private ngbModal: NgbModal,
    private windowRef: WindowRef,
    private alertsService: AlertsService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private imageLocalStorageService: ImageLocalStorageService,
    private imageUploadHelperService: ImageUploadHelperService,
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

  handleBioChange(): void {
    this.hasUnsavedChanges = true;
    this.unsavedChanges.user_bio = true;
    this.preventPageUnloadEventService.addListener();
  }

  handleDefaultDashboardChange(): void {
    this.hasUnsavedChanges = true;
    this.unsavedChanges.default_dashboard = true;
    this.preventPageUnloadEventService.addListener();
  }

  onSubjectInterestsSelectionChange(subjectInterests: string): void {
    this.alertsService.clearWarnings();
    this.hasUnsavedChanges = true;
    this.unsavedChanges.subject_interests = true;
    this.subjectInterests = subjectInterests;
    this.preventPageUnloadEventService.addListener();
  }

  handleLanguageCodesChange(preferredLanguageCodes: string[]): void {
    this.hasUnsavedChanges = true;
    this.unsavedChanges.preferred_language_codes = true;
    this.preferredLanguageCodes = preferredLanguageCodes;
    this.preventPageUnloadEventService.addListener();
  }

  handleSiteLanguageCodeChange(preferredSiteLanguageCode: string): void {
    this.hasUnsavedChanges = true;
    this.unsavedChanges.preferred_site_language_code = true;
    this.preferredSiteLanguageCode = preferredSiteLanguageCode;
    this.preventPageUnloadEventService.addListener();
  }

  handleAudioLanguageCodeChange(preferredAudioLanguageCode: string): void {
    this.hasUnsavedChanges = true;
    this.unsavedChanges.preferred_audio_language_code = true;
    this.preferredAudioLanguageCode = preferredAudioLanguageCode;
    this.preventPageUnloadEventService.addListener();
  }

  handleEmailPreferencesChange(): void {
    this.hasUnsavedChanges = true;
    this.unsavedChanges.email_preferences = true;
    this.preventPageUnloadEventService.addListener();
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

  private handleProfileImageChange(newProfilePictureDataUrl: string): void {
    this.pageShouldBeReloaded = true;
    this.hasUnsavedChanges = true;
    this.unsavedChanges.profile_picture_data_url = true;
    this.newProfilePictureDataUrl = newProfilePictureDataUrl;
  }

  private _saveProfileImageToLocalStorage(image: string): void {
    const newImageFile = (
      this.imageUploadHelperService.convertImageDataToImageFile(image));
    if (newImageFile === null) {
      this.alertsService.addWarning('Image uploaded is not valid.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result as string;
      this.imageLocalStorageService.saveImage(
        this.username + '_profile_picture.png', imageData);
    };
    reader.readAsDataURL(newImageFile);
    // The reload is needed in order to update the profile picture
    // in the top-right corner.
    this.windowRef.nativeWindow.location.reload();
  }

  showEditProfilePictureModal(): void {
    let modalRef = this.ngbModal.open(EditProfilePictureModalComponent, {
      backdrop: 'static'
    });

    modalRef.result.then((newProfilePictureDataUrl) => {
      this.handleProfileImageChange(newProfilePictureDataUrl);
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  handleTabForFirstRadio(event: KeyboardEvent): void {
    if (event.key === 'Tab' && !event.shiftKey) {
      event.preventDefault();
      this.secondRadio.nativeElement.focus();
    }
  }

  handleTabForSecondRadio(event: KeyboardEvent): void {
    if (event.key === 'Tab' && !event.shiftKey) {
      event.preventDefault();
      this.thirdRadio.nativeElement.focus();
    } else if (event.key === 'Tab' && event.shiftKey) {
      event.preventDefault();
      this.firstRadio.nativeElement.focus();
    }
  }

  handleTabForThirdRadio(event: KeyboardEvent): void {
    if (event.key === 'Tab' && event.shiftKey) {
      event.preventDefault();
      this.secondRadio.nativeElement.focus();
    }
  }

  getProfileImagePngDataUrl(username: string): string {
    let [pngImageUrl, _] = this.userService.getProfileImageDataUrl(
      username);
    return pngImageUrl;
  }

  getProfileImageWebpDataUrl(username: string): string {
    let [_, webpImageUrl] = this.userService.getProfileImageDataUrl(
      username);
    return webpImageUrl;
  }

  ngOnInit(): void {
    this.loaderService.showLoadingScreen('Loading');
    let userInfoPromise = this.userService.getUserInfoAsync();
    userInfoPromise.then((userInfo) => {
      this.username = userInfo.getUsername();
      this.email = userInfo.getEmail();
      if (this.username !== null) {
        [this.profilePicturePngDataUrl, this.profilePictureWebpDataUrl] = (
          this.userService.getProfileImageDataUrl(this.username));
      } else {
        this.profilePictureWebpDataUrl = (
          this.urlInterpolationService.getStaticImageUrl(
            AppConstants.DEFAULT_PROFILE_IMAGE_WEBP_PATH));
        this.profilePicturePngDataUrl = (
          this.urlInterpolationService.getStaticImageUrl(
            AppConstants.DEFAULT_PROFILE_IMAGE_PNG_PATH));
      }
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

    this.TAG_REGEX_STRING = '^[a-z ]+$';
    this.LANGUAGE_CHOICES = this.languageUtilService.getLanguageIdsAndTexts();
    this.SITE_LANGUAGE_CHOICES = AppConstants.SUPPORTED_SITE_LANGUAGES;
  }

  savePreferences(): void {
    if (!this.hasUnsavedChanges) {
      return;
    }
    this.alertsService.clearWarnings();
    let emailData: EmailPreferencesBackendDict = {
      can_receive_email_updates: this.canReceiveEmailUpdates,
      can_receive_editor_role_email: this.canReceiveEditorRoleEmail,
      can_receive_feedback_message_email: this.canReceiveFeedbackMessageEmail,
      can_receive_subscription_email: this.canReceiveSubscriptionEmail
    };
    let updates = [
      {
        update_type: 'profile_picture_data_url',
        data: this.newProfilePictureDataUrl
      },
      { update_type: 'user_bio', data: this.userBio },
      { update_type: 'default_dashboard', data: this.defaultDashboard },
      { update_type: 'subject_interests', data: this.subjectInterests },
      {
        update_type: 'preferred_language_codes',
        data: this.preferredLanguageCodes
      },
      {
        update_type: 'preferred_site_language_code',
        data: this.preferredSiteLanguageCode
      },
      {
        update_type: 'preferred_audio_language_code',
        data: this.preferredAudioLanguageCode
      },
      { update_type: 'email_preferences', data: emailData }
    ];
    updates = updates.filter((update) => {
      return this.unsavedChanges[update.update_type] === true;
    });

    if (AssetsBackendApiService.EMULATOR_MODE) {
      // Remove 'profile_picture_data_url' from updates if the emulator mode is
      // on because the backend doesn't support updating profile picture in
      // emulator(DEV) mode.
      updates = updates.filter((update) => {
        return update.update_type !== 'profile_picture_data_url';
      });
    }

    this.userBackendApiService.updateMultiplePreferencesDataAsync(updates)
      .then((returnData) => {
        this.preventPageUnloadEventService.removeListener();
        if (this.unsavedChanges.preferred_site_language_code) {
          this.i18nLanguageCodeService.setI18nLanguageCode(
            this.preferredSiteLanguageCode);
        }
        if (returnData.bulk_email_signup_message_should_be_shown) {
          this.canReceiveEmailUpdates = false;
          this.showEmailSignupLink = true;
        } else {
          this.alertsService.addInfoMessage('Saved!', 1000);
        }
        if (this.unsavedChanges.profile_picture_data_url &&
          AssetsBackendApiService.EMULATOR_MODE) {
          this._saveProfileImageToLocalStorage(
            this.newProfilePictureDataUrl);
        }
        if (this.pageShouldBeReloaded) {
          // The reload is needed in order to update the profile picture
          // in the top-right corner(Nav Bar).
          this.windowRef.nativeWindow.location.reload();
        }
        this.hasUnsavedChanges = false;
        for (let key in this.unsavedChanges) {
          this.unsavedChanges[key] = false;
        }
      })
      .catch((error) => {
        this.preventPageUnloadEventService.removeListener();
        this.alertsService.addWarning(
          'Failed to save changes');
      });
  }
}

angular.module('oppia').directive('oppiaPreferencesPage',
  downgradeComponent({
    component: PreferencesPageComponent
  }) as angular.IDirectiveFactory);
