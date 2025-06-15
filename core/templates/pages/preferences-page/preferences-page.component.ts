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

import {Component, ViewChild, ElementRef} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

import {AppConstants} from 'app.constants';
import {
  LanguageIdAndText,
  LanguageUtilService,
} from 'domain/utilities/language-util.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {AlertsService} from 'services/alerts.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {ImageLocalStorageService} from 'services/image-local-storage.service';
import {ImageUploadHelperService} from 'services/image-upload-helper.service';
import {LoaderService} from 'services/loader.service';
import {PreventPageUnloadEventService} from 'services/prevent-page-unload-event.service';
import {
  BackendPreferenceUpdateType,
  EmailPreferencesBackendDict,
  SubscriptionSummary,
  UpdatePreferenceDict,
  UserBackendApiService,
} from 'services/user-backend-api.service';
import {UserService} from 'services/user.service';
import {WindowRef} from 'services/contextual/window-ref.service';

import {EditProfilePictureModalComponent} from './modal-templates/edit-profile-picture-modal.component';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
require('cropperjs/dist/cropper.min.css');

import './preferences-page.component.css';
import {FormControl, FormGroup} from '@angular/forms';

interface AudioLangaugeChoice {
  id: string;
  text: string;
}

// A Dict that maps the form Control names in the frontend
// to the backend update_types.
const BACKEND_UPDATE_TYPE_DICT: {[key: string]: BackendPreferenceUpdateType} = {
  profilePicturePngDataUrl: 'profile_picture_data_url',
  userBio: 'user_bio',
  defaultDashboard: 'default_dashboard',
  subjectInterests: 'subject_interests',
  preferredLanguageCodes: 'preferred_language_codes',
  preferredSiteLanguageCode: 'preferred_site_language_code',
  preferredAudioLanguageCode: 'preferred_audio_language_code',
  emailPreferences: 'email_preferences',
};

@Component({
  selector: 'oppia-preferences-page',
  templateUrl: './preferences-page.component.html',
  styleUrls: ['./preferences-page.component.css'],
})
export class PreferencesPageComponent {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
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
  PAGES_REGISTERED_WITH_FRONTEND = AppConstants.PAGES_REGISTERED_WITH_FRONTEND;

  subscriptionList: SubscriptionSummary[] = [];
  preferencesForm!: FormGroup;

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
  ) {}

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
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
    newProfilePictureDataUrl: string
  ): void {
    const pngControl = this.preferencesForm.controls.profilePicturePngDataUrl;
    const webpControl = this.preferencesForm.controls.profilePictureWebpDataUrl;
    pngControl.setValue(newProfilePictureDataUrl);
    webpControl.setValue(newProfilePictureDataUrl);
    // We need to mark the control as dirty programmatically because it
    // is not changed by the user but by the component.
    pngControl.markAsDirty();
    webpControl.markAsDirty();
    // The following line is needed to emit the statusChanges observable.
    pngControl.updateValueAndValidity();
    webpControl.updateValueAndValidity();
  }

  // TODO(#19737): Remove the following function.
  private _saveProfileImageToLocalStorage(image: string): void {
    const newImageFile =
      this.imageUploadHelperService.convertImageDataToImageFile(image);
    if (newImageFile === null) {
      this.alertsService.addWarning('Image uploaded is not valid.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result as string;
      this.imageLocalStorageService.saveImage(
        this.username + '_profile_picture.png',
        imageData
      );
    };
    reader.readAsDataURL(newImageFile);
  }

  showEditProfilePictureModal(): void {
    let modalRef = this.ngbModal.open(EditProfilePictureModalComponent, {
      backdrop: 'static',
    });

    modalRef.result.then(
      newProfilePictureDataUrl => {
        if (newProfilePictureDataUrl) {
          this.updateAndMarkProfileImageAsChanged(newProfilePictureDataUrl);
        }
      },
      () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        // No further action is needed.
      }
    );
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
    let [pngImageUrl, _] = this.userService.getProfileImageDataUrl(username);
    return pngImageUrl;
  }

  getProfileImageWebpDataUrl(username: string): string {
    let [_, webpImageUrl] = this.userService.getProfileImageDataUrl(username);
    return webpImageUrl;
  }

  ngOnInit(): void {
    this.loaderService.showLoadingScreen('Loading');
    let userInfoPromise = this.userService.getUserInfoAsync();

    this.AUDIO_LANGUAGE_CHOICES = AppConstants.SUPPORTED_AUDIO_LANGUAGES.map(
      languageItem => {
        return {
          id: languageItem.id,
          text: languageItem.description,
        };
      }
    );

    this.hasPageLoaded = false;

    let preferencesPromise = this.userBackendApiService.getPreferencesAsync();

    Promise.all([userInfoPromise, preferencesPromise]).then(
      ([userInfo, preferencesData]) => {
        this.username = userInfo.getUsername();
        this.email = userInfo.getEmail();
        let profilePicturePngDataUrl: string;
        let profilePictureWebpDataUrl: string;
        if (this.username !== null) {
          [profilePicturePngDataUrl, profilePictureWebpDataUrl] =
            this.userService.getProfileImageDataUrl(this.username);
        } else {
          profilePictureWebpDataUrl =
            this.urlInterpolationService.getStaticImageUrl(
              AppConstants.DEFAULT_PROFILE_IMAGE_WEBP_PATH
            );
          profilePicturePngDataUrl =
            this.urlInterpolationService.getStaticImageUrl(
              AppConstants.DEFAULT_PROFILE_IMAGE_PNG_PATH
            );
        }
        this.preferencesForm = new FormGroup({
          profilePicturePngDataUrl: new FormControl(profilePicturePngDataUrl),
          profilePictureWebpDataUrl: new FormControl(profilePictureWebpDataUrl),
          userBio: new FormControl(preferencesData.user_bio),
          defaultDashboard: new FormControl(preferencesData.default_dashboard),
          subjectInterests: new FormControl(preferencesData.subject_interests),
          preferredLanguageCodes: new FormControl(
            preferencesData.preferred_language_codes
          ),
          preferredSiteLanguageCode: new FormControl(
            preferencesData.preferred_site_language_code
          ),
          preferredAudioLanguageCode: new FormControl(
            preferencesData.preferred_audio_language_code
          ),
          emailPreferences: new FormGroup({
            canReceiveEmailUpdates: new FormControl(
              preferencesData.can_receive_email_updates
            ),
            canReceiveEditorRoleEmail: new FormControl(
              preferencesData.can_receive_editor_role_email
            ),
            canReceiveFeedbackMessageEmail: new FormControl(
              preferencesData.can_receive_feedback_message_email
            ),
            canReceiveSubscriptionEmail: new FormControl(
              preferencesData.can_receive_subscription_email
            ),
          }),
        });

        this.subscriptionList = preferencesData.subscription_list;

        // Subscribe to the statusChanges observable of the form.
        this.preferencesForm.statusChanges.subscribe(() => {
          // Check if any of the controls is dirty.
          if (this.preferencesForm.dirty) {
            this.preventPageUnloadEventService.addListener();
          } else {
            this.preventPageUnloadEventService.removeListener();
          }
        });

        this.hasPageLoaded = true;
        this.loaderService.hideLoadingScreen();
      }
    );

    this.TAG_REGEX_STRING = '^[a-z ]+$';
    this.LANGUAGE_CHOICES = this.languageUtilService.getLanguageIdsAndTexts();
    this.SITE_LANGUAGE_CHOICES = AppConstants.SUPPORTED_SITE_LANGUAGES;
  }

  savePreferences(): void {
    if (!this.preferencesForm.dirty) {
      return;
    }
    this.alertsService.clearWarnings();

    // Get the updated fields to send to the backend on-save.
    let updates: UpdatePreferenceDict[] = [];
    for (let key in this.preferencesForm.value) {
      if (!this.preferencesForm.controls[key].dirty) {
        // We don't send unchanged fields to the backend.
        continue;
      }
      if (key === 'profilePictureWebpDataUrl') {
        // We send only png data url because png and webp urls same here as
        // we are not converting the image to webp format.
        continue;
      }
      if (key === 'emailPreferences') {
        let emailFormData = this.preferencesForm.controls[key].value;
        let emailData: EmailPreferencesBackendDict = {
          can_receive_email_updates: emailFormData.canReceiveEmailUpdates,
          can_receive_editor_role_email:
            emailFormData.canReceiveEditorRoleEmail,
          can_receive_feedback_message_email:
            emailFormData.canReceiveFeedbackMessageEmail,
          can_receive_subscription_email:
            emailFormData.canReceiveSubscriptionEmail,
        };
        updates.push({
          update_type: BACKEND_UPDATE_TYPE_DICT[key],
          data: emailData,
        });
        continue;
      }
      updates.push({
        update_type: BACKEND_UPDATE_TYPE_DICT[key],
        data: this.preferencesForm.controls[key].value,
      });
    }

    // TODO(#19737): Remove the following condition.
    if (AssetsBackendApiService.EMULATOR_MODE) {
      // Remove 'profile_picture_data_url' from updates if the emulator mode is
      // on because the backend doesn't support updating profile picture in
      // emulator mode.
      updates = updates.filter(update => {
        return update.update_type !== 'profile_picture_data_url';
      });
    }

    this.userBackendApiService
      .updateMultiplePreferencesDataAsync(updates)
      .then(returnData => {
        if (this.preferencesForm.controls.preferredSiteLanguageCode.dirty) {
          this.i18nLanguageCodeService.setI18nLanguageCode(
            this.preferencesForm.controls.preferredSiteLanguageCode.value
          );
        }
        if (returnData.bulk_email_signup_message_should_be_shown) {
          const formGrp = this.preferencesForm.controls
            .emailPreferences as FormGroup;
          formGrp.controls.canReceiveEmailUpdates.setValue(false);
          this.showEmailSignupLink = true;
        } else {
          this.alertsService.addInfoMessage('Saved!', 3000);
        }
        if (this.preferencesForm.controls.profilePicturePngDataUrl.dirty) {
          // TODO(#19737): Remove the following 'if' condition.
          if (AssetsBackendApiService.EMULATOR_MODE) {
            this._saveProfileImageToLocalStorage(
              this.preferencesForm.controls.profilePicturePngDataUrl.value
            );
          }
          // The reload is needed in order to update the profile picture
          // in the top-right corner(Nav Bar).
          this.preventPageUnloadEventService.removeListener();
          this.windowRef.nativeWindow.location.reload();
        }
        // Marks all the preferences as unchanged and updates the form status.
        this.preferencesForm.markAsPristine();
        this.preferencesForm.updateValueAndValidity();
      });
  }
}
