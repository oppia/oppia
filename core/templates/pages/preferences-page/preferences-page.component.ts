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
import { BackendPreferenceUpdateType, EmailPreferencesBackendDict, SubscriptionSummary, UpdatePreferenceDict, UserBackendApiService } from 'services/user-backend-api.service';
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

// A Dict that maps the UserPreferences model field names
// to the backend update_types.
const BACKEND_UPDATE_TYPE_DICT: (
  { [key: string]: BackendPreferenceUpdateType }) = {
  newProfilePictureDataUrl: 'profile_picture_data_url',
  userBio: 'user_bio',
  defaultDashboard: 'default_dashboard',
  subjectInterests: 'subject_interests',
  preferredLanguageCodes: 'preferred_language_codes',
  preferredSiteLanguageCode: 'preferred_site_language_code',
  preferredAudioLanguageCode: 'preferred_audio_language_code',
  emailPreferences: 'email_preferences'
};

type ValidPreferenceFields = {
  [K in keyof UserPreferences]: UserPreferences[K] extends string |
  string[] | EmailPreferencesBackendDict ? K : never;
}[keyof UserPreferences];

class UserPreferences {
  // The following property is used to track if there are any unsaved changes
  // for each field in the preferences page.
  private fieldsWithChangedValues: { [key: string]: boolean } = {
    newProfilePictureDataUrl: false,
    userBio: false,
    defaultDashboard: false,
    subjectInterests: false,
    preferredLanguageCodes: false,
    preferredSiteLanguageCode: false,
    preferredAudioLanguageCode: false,
    emailPreferences: false
  };

  // The following property is the new profile picture data url that is
  // uploaded by the user and will be sent to the server.
  newProfilePictureDataUrl!: string;

  constructor(
    public profilePicturePngDataUrl: string,
    public profilePictureWebpDataUrl: string,
    public userBio: string,
    public defaultDashboard: string,
    public subjectInterests: string,
    public preferredLanguageCodes: string[],
    public preferredSiteLanguageCode: string,
    public preferredAudioLanguageCode: string,
    public canReceiveEmailUpdates: boolean,
    public canReceiveEditorRoleEmail: boolean,
    public canReceiveFeedbackMessageEmail: boolean,
    public canReceiveSubscriptionEmail: boolean,
    public subscriptionList: SubscriptionSummary[]
  ) {}

  hasUnsavedChanges(): boolean {
    // Checks if there are any unsaved changes in the preferences.
    return Object.values(this.fieldsWithChangedValues).some((value) => value);
  }

  markPreferenceAsChanged(preferenceField: string): void {
    this.fieldsWithChangedValues[preferenceField] = true;
  }

  isFieldChanged(preferenceField: string): boolean {
    return this.fieldsWithChangedValues[preferenceField];
  }

  resetFieldsWithChangedValues(): void {
    for (let key in this.fieldsWithChangedValues) {
      this.fieldsWithChangedValues[key] = false;
    }
  }

  isPreferenceField(key: string): key is ValidPreferenceFields {
    return key in UserPreferences;
  }

  getUpdates(): UpdatePreferenceDict[] {
    const updates: UpdatePreferenceDict[] = [];
    for (const preferenceField in this.fieldsWithChangedValues) {
      if (this.fieldsWithChangedValues[preferenceField]) {
        if (preferenceField === 'emailPreferences') {
          let emailData: EmailPreferencesBackendDict = {
            can_receive_email_updates: this.canReceiveEmailUpdates,
            can_receive_editor_role_email: this.canReceiveEditorRoleEmail,
            can_receive_feedback_message_email: (
              this.canReceiveFeedbackMessageEmail),
            can_receive_subscription_email: this.canReceiveSubscriptionEmail
          };
          updates.push({
            update_type: BACKEND_UPDATE_TYPE_DICT[preferenceField],
            data: emailData
          });
          continue;
        }
        updates.push({
          update_type: BACKEND_UPDATE_TYPE_DICT[preferenceField],
          data: this[preferenceField as ValidPreferenceFields]
        });
      }
    }
    return updates;
  }
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
  userPreferences!: UserPreferences;
  AUDIO_LANGUAGE_CHOICES!: AudioLangaugeChoice[];
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
  showEmailSignupLink: boolean = false;
  emailSignupLink: string = AppConstants.BULK_EMAIL_SERVICE_SIGNUP_URL;
  PAGES_REGISTERED_WITH_FRONTEND = (
    AppConstants.PAGES_REGISTERED_WITH_FRONTEND);

  // The following property is used to track if the page should be reloaded,
  // after saving preferences, it is set to true when profile picture
  // is to be updated.
  pageShouldBeReloaded: boolean = false;

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

  markUserBioAsChanged(): void {
    this.userPreferences.markPreferenceAsChanged('userBio');
    this.preventPageUnloadEventService.addListener();
  }

  markDefaultDashboardAsChanged(): void {
    this.userPreferences.markPreferenceAsChanged('defaultDashboard');
    this.preventPageUnloadEventService.addListener();
  }

  onSubjectInterestsSelectionChange(subjectInterests: string): void {
    this.alertsService.clearWarnings();
    this.userPreferences.markPreferenceAsChanged('subjectInterests');
    this.userPreferences.subjectInterests = subjectInterests;
    this.preventPageUnloadEventService.addListener();
  }

  updateAndMarkLanguageCodesAsChanged(preferredLanguageCodes: string[]): void {
    this.userPreferences.markPreferenceAsChanged('preferredLanguageCodes');
    this.userPreferences.preferredLanguageCodes = preferredLanguageCodes;
    this.preventPageUnloadEventService.addListener();
  }

  updateAndMarkSiteLanguageCodeAsChanged(
      preferredSiteLanguageCode: string): void {
    this.userPreferences.markPreferenceAsChanged('preferredSiteLanguageCode');
    this.userPreferences.preferredSiteLanguageCode = preferredSiteLanguageCode;
    this.preventPageUnloadEventService.addListener();
  }

  updateAndMarkAudioLanguageCodeAsChanged(
      preferredAudioLanguageCode: string): void {
    this.userPreferences.markPreferenceAsChanged('preferredAudioLanguageCode');
    this.userPreferences.preferredAudioLanguageCode = (
      preferredAudioLanguageCode);
    this.preventPageUnloadEventService.addListener();
  }

  markEmailPreferencesAsChanged(): void {
    this.userPreferences.markPreferenceAsChanged('emailPreferences');
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

  private updateAndMarkProfileImageAsChanged(
      newProfilePictureDataUrl: string): void {
    this.pageShouldBeReloaded = true;
    this.userPreferences.markPreferenceAsChanged('newProfilePictureDataUrl');
    this.userPreferences.newProfilePictureDataUrl = newProfilePictureDataUrl;
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
  }

  showEditProfilePictureModal(): void {
    let modalRef = this.ngbModal.open(EditProfilePictureModalComponent, {
      backdrop: 'static'
    });

    modalRef.result.then((newProfilePictureDataUrl) => {
      this.updateAndMarkProfileImageAsChanged(newProfilePictureDataUrl);
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

    Promise.all([userInfoPromise, preferencesPromise])
      .then(([userInfo, preferencesData]) => {
        this.username = userInfo.getUsername();
        this.email = userInfo.getEmail();
        let profilePicturePngDataUrl: string;
        let profilePictureWebpDataUrl: string;
        if (this.username !== null) {
          [profilePicturePngDataUrl, profilePictureWebpDataUrl] = (
            this.userService.getProfileImageDataUrl(this.username));
        } else {
          profilePictureWebpDataUrl = (
            this.urlInterpolationService.getStaticImageUrl(
              AppConstants.DEFAULT_PROFILE_IMAGE_WEBP_PATH));
          profilePicturePngDataUrl = (
            this.urlInterpolationService.getStaticImageUrl(
              AppConstants.DEFAULT_PROFILE_IMAGE_PNG_PATH));
        }
        this.userPreferences = new UserPreferences(
          profilePicturePngDataUrl,
          profilePictureWebpDataUrl,
          preferencesData.user_bio,
          preferencesData.default_dashboard,
          preferencesData.subject_interests,
          preferencesData.preferred_language_codes,
          preferencesData.preferred_site_language_code,
          preferencesData.preferred_audio_language_code,
          preferencesData.can_receive_email_updates,
          preferencesData.can_receive_editor_role_email,
          preferencesData.can_receive_feedback_message_email,
          preferencesData.can_receive_subscription_email,
          preferencesData.subscription_list
        );
        this.hasPageLoaded = true;
        this.loaderService.hideLoadingScreen();
      });

    this.TAG_REGEX_STRING = '^[a-z ]+$';
    this.LANGUAGE_CHOICES = this.languageUtilService.getLanguageIdsAndTexts();
    this.SITE_LANGUAGE_CHOICES = AppConstants.SUPPORTED_SITE_LANGUAGES;
  }

  savePreferences(): void {
    if (!this.userPreferences.hasUnsavedChanges()) {
      return;
    }
    this.alertsService.clearWarnings();

    // Get the updated fields to send to the backend on-save.
    let updates: UpdatePreferenceDict[] = this.userPreferences.getUpdates();

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
        if (this.userPreferences.isFieldChanged(
          'preferredSiteLanguageCode')) {
          this.i18nLanguageCodeService.setI18nLanguageCode(
            this.userPreferences.preferredSiteLanguageCode);
        }
        if (returnData.bulk_email_signup_message_should_be_shown) {
          this.userPreferences.canReceiveEmailUpdates = false;
          this.showEmailSignupLink = true;
        } else {
          this.alertsService.addInfoMessage('Saved!', 1000);
        }
        if (this.userPreferences.isFieldChanged(
          'newProfilePictureDataUrl') &&
          AssetsBackendApiService.EMULATOR_MODE) {
          this._saveProfileImageToLocalStorage(
            this.userPreferences.newProfilePictureDataUrl);
        }
        if (this.pageShouldBeReloaded) {
          // The reload is needed in order to update the profile picture
          // in the top-right corner(Nav Bar).
          this.windowRef.nativeWindow.location.reload();
        }
        this.userPreferences.resetFieldsWithChangedValues();
      });
  }
}

angular.module('oppia').directive('oppiaPreferencesPage',
  downgradeComponent({
    component: PreferencesPageComponent
  }) as angular.IDirectiveFactory);
