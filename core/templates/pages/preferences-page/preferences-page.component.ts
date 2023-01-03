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
import { HttpClient } from '@angular/common/http';

import { AppConstants } from 'app.constants';
import { LanguageIdAndText, LanguageUtilService } from 'domain/utilities/language-util.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { AlertsService } from 'services/alerts.service';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { ContextService } from 'services/context.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { ImageLocalStorageService } from 'services/image-local-storage.service';
import { ImageUploadHelperService } from 'services/image-upload-helper.service';
import { LoaderService } from 'services/loader.service';
import { PreventPageUnloadEventService } from 'services/prevent-page-unload-event.service';
import { EmailPreferencesBackendDict, SubscriptionSummary, UserBackendApiService } from 'services/user-backend-api.service';
import { UserService } from 'services/user.service';
import { WindowRef } from 'services/contextual/window-ref.service';

import { EditProfilePictureModalComponent } from './modal-templates/edit-profile-picture-modal.component';
require('cropperjs/dist/cropper.min.css');

import './preferences-page.component.css';

interface AudioLangaugeChoice {
  id: string;
  text: string;
}

interface ImageUploadBackendResponse {
  filename: string;
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
    private http: HttpClient,
    private ngbModal: NgbModal,
    private windowRef: WindowRef,
    private alertsService: AlertsService,
    private assetsBackendApiService: AssetsBackendApiService,
    private contextService: ContextService,
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

  private _saveDataItem(
      updateType: string,
      data: string | string[] | EmailPreferencesBackendDict
  ): void {
    this.preventPageUnloadEventService.addListener();
    this.userBackendApiService.updatePreferencesDataAsync(
      updateType, data).then((returnData) => {
      this.preventPageUnloadEventService.removeListener();
      if (returnData.bulk_email_signup_message_should_be_shown) {
        this.canReceiveEmailUpdates = false;
        this.showEmailSignupLink = true;
      } else {
        this.alertsService.addInfoMessage('Saved!', 1000);
      }
    });
  }

  saveUserBio(userBio: string): void {
    this._saveDataItem('user_bio', userBio);
  }

  registerBioChanged(): void {
    this.preventPageUnloadEventService.addListener();
  }

  onSubjectInterestsSelectionChange(subjectInterests: string): void {
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
    let data: EmailPreferencesBackendDict = {
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

  private saveProfileImage(newProfilePictureDataUrl: string): void {
    console.log(this.contextService.getImageSaveDestination());
    if (
      this.contextService.getImageSaveDestination() ===
      AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE
    ) {
      this._saveProfileImageToLocalStorage(newProfilePictureDataUrl);
    } else {
      this._postProfileImageToServer(newProfilePictureDataUrl);
    }
  }

  private _saveProfileImageToLocalStorage(image: string): void {
    this.profilePictureDataUrl = image;
    const newImageFile = (
      this.imageUploadHelperService.convertImageDataToImageFile(image));
    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result as string;
      this.imageLocalStorageService.saveImage(
        'profile_picture.png', imageData);
    };
    reader.readAsDataURL(newImageFile);
  }

  private _postProfileImageToServer(image: string): void {
    this.profilePictureDataUrl = image;
    this.userService.setProfileImageDataUrlAsync(image)
      .then(() => {});
  }

  showEditProfilePictureModal(): void {
    let modalRef = this.ngbModal.open(EditProfilePictureModalComponent, {
      backdrop: 'static'
    });

    modalRef.result.then((newProfilePictureDataUrl) => {
      this.saveProfileImage(newProfilePictureDataUrl);
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

    let preferencesPromise = this.userBackendApiService.getPreferencesAsync();
    console.log('******************************');
    console.log(this.contextService.getImageSaveDestination());
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
      this.subscriptionList.forEach((subscription) => {
        subscription.creator_picture_data_url = (
          decodeURIComponent(subscription.creator_picture_data_url));
      });
      this.hasPageLoaded = true;
    });

    // this.contextService.setImageSaveDestinationToLocalStorage();

    let profileImagePromise = this.userService.getProfileImageDataUrlAsync();
    console.log(profileImagePromise);
    profileImagePromise.then(data => {
      console.log("**********************************");
      this.profilePictureDataUrl = decodeURIComponent(data as string);
      console.log(this.profilePictureDataUrl);
      console.log(data);
    });

    Promise.all([
      userInfoPromise, preferencesPromise, profileImagePromise
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
