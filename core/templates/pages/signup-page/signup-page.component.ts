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
 * @fileoverview Component for the Oppia profile page.
 */

import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AppConstants } from 'app.constants';
import { AlertsService } from 'services/alerts.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { LoaderService } from 'services/loader.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { UtilsService } from 'services/utils.service';
import { LicenseExplanationModalComponent } from './modals/license-explanation-modal.component';
import { RegistrationSessionExpiredModalComponent } from './modals/registration-session-expired-modal.component';
import { SignupPageBackendApiService } from './services/signup-page-backend-api.service';
import analyticsConstants from 'analytics-constants';

@Component({
  selector: 'oppia-signup-page',
  templateUrl: './signup-page.component.html'
})
export class SignupPageComponent {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  username!: string;
  emailPreferencesWarningText!: string;
  // Null represents, if the user has not yet agreed to the latest terms.
  canReceiveEmailUpdates!: string | null;
  MAX_USERNAME_LENGTH = AppConstants.MAX_USERNAME_LENGTH;
  warningI18nCode = '';
  siteName = AppConstants.SITE_NAME;
  submissionInProcess = false;
  usernameCheckIsInProgress = false;
  showEmailSignupLink = false;
  emailSignupLink = AppConstants.BULK_EMAIL_SERVICE_SIGNUP_URL;
  hasEverRegistered: boolean = false;
  hasAgreedToLatestTerms: boolean = false;
  showEmailPreferencesForm: boolean = false;
  hasUsername: boolean = false;
  blurredAtLeastOnce = false;

  constructor(
    private ngbModal: NgbModal,
    private windowRef: WindowRef,
    private alertsService: AlertsService,
    private focusManagerService: FocusManagerService,
    private loaderService: LoaderService,
    private signupPageBackendApiService: SignupPageBackendApiService,
    private siteAnalyticsService: SiteAnalyticsService,
    private urlService: UrlService,
    private utilsService: UtilsService
  ) {}

  ngOnInit(): void {
    this.loaderService.showLoadingScreen('I18N_SIGNUP_LOADING');

    this.signupPageBackendApiService.fetchSignupPageDataAsync()
      .then((data) => {
        this.loaderService.hideLoadingScreen();
        this.username = data.username;
        this.hasEverRegistered = data.has_ever_registered;
        this.hasAgreedToLatestTerms = data.has_agreed_to_latest_terms;
        this.showEmailPreferencesForm = data.can_send_emails;
        this.hasUsername = Boolean(this.username);
        this.focusManagerService.setFocus('usernameInputField');
      });
  }

  isFormValid(): boolean {
    return (
      this.hasAgreedToLatestTerms &&
      (this.hasUsername || !this.warningI18nCode)
    );
  }

  showLicenseExplanationModal(evt: { target: {innerText: string} }): void {
    if (evt.target.innerText !== 'here') {
      return;
    }
    let modalRef = this.ngbModal.open(LicenseExplanationModalComponent, {
      backdrop: true
    });

    modalRef.result.then(() => {
      // Note to developers:
      // This callback is triggered when the Confirm button is clicked.
      // No further action is needed.
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  onUsernameInputFormBlur(username: string): void {
    if (this.hasUsername) {
      return;
    }
    this.alertsService.clearWarnings();
    this.blurredAtLeastOnce = true;
    this.updateWarningText(username);
    if (!this.warningI18nCode) {
      this.usernameCheckIsInProgress = true;
      this.signupPageBackendApiService.checkUsernameAvailableAsync(username)
        .then((response) => {
          if (response.username_is_taken) {
            this.warningI18nCode = 'I18N_SIGNUP_ERROR_USERNAME_TAKEN';
          }
          this.usernameCheckIsInProgress = false;
        });
    }
  }

  // Returns the warning text corresponding to the validation error for
  // the given username, or an empty string if the username is valid.
  updateWarningText(username: string): void {
    let alphanumericRegex = /^[A-Za-z0-9]+$/;
    let adminRegex = /admin/i;
    let oppiaRegex = /oppia/i;

    if (!username) {
      this.warningI18nCode = 'I18N_SIGNUP_ERROR_NO_USERNAME';
    } else if (username.indexOf(' ') !== -1) {
      this.warningI18nCode = 'I18N_SIGNUP_ERROR_USERNAME_WITH_SPACES';
    } else if (username.length > this.MAX_USERNAME_LENGTH) {
      this.warningI18nCode = 'I18N_SIGNUP_ERROR_USERNAME_TOO_LONG';
    } else if (!alphanumericRegex.test(username)) {
      this.warningI18nCode = 'I18N_SIGNUP_ERROR_USERNAME_ONLY_ALPHANUM';
    } else if (adminRegex.test(username)) {
      this.warningI18nCode = 'I18N_SIGNUP_ERROR_USERNAME_WITH_ADMIN';
    } else if (oppiaRegex.test(username)) {
      this.warningI18nCode = 'I18N_SIGNUP_ERROR_USERNAME_NOT_AVAILABLE';
    } else {
      this.warningI18nCode = '';
    }
  }

  onSelectEmailPreference(): void {
    this.emailPreferencesWarningText = '';
  }

  submitPrerequisitesForm(
      agreedToTerms: boolean,
      username: string,
      canReceiveEmailUpdates: string | null = null): void {
    if (!agreedToTerms) {
      this.alertsService.addWarning('I18N_SIGNUP_ERROR_MUST_AGREE_TO_TERMS');
      return;
    }

    if (!this.hasUsername && this.warningI18nCode) {
      return;
    }

    let defaultDashboard: string = AppConstants.DASHBOARD_TYPE_LEARNER;
    let returnUrl = (
      decodeURIComponent(this.urlService.getUrlParams().return_url));

    if (returnUrl.indexOf('creator-dashboard') !== -1) {
      defaultDashboard = AppConstants.DASHBOARD_TYPE_CREATOR;
    } else if (returnUrl.indexOf('contributor-dashboard') !== -1) {
      defaultDashboard = AppConstants.DASHBOARD_TYPE_CONTRIBUTOR;
    } else {
      defaultDashboard = AppConstants.DASHBOARD_TYPE_LEARNER;
    }

    let requestParams = {
      agreed_to_terms: agreedToTerms,
      can_receive_email_updates: false,
      default_dashboard: defaultDashboard,
      username: username
    };

    if (this.showEmailPreferencesForm && !this.hasUsername) {
      if (canReceiveEmailUpdates === null) {
        this.emailPreferencesWarningText = 'I18N_SIGNUP_FIELD_REQUIRED';
        return;
      }

      if (canReceiveEmailUpdates === 'yes') {
        requestParams.can_receive_email_updates = true;
      } else if (canReceiveEmailUpdates === 'no') {
        requestParams.can_receive_email_updates = false;
      } else {
        throw new Error(
          'Invalid value for email preferences: ' +
          canReceiveEmailUpdates);
      }
    }

    this.submissionInProcess = true;
    this.signupPageBackendApiService.updateUsernameAsync(requestParams)
      .then((returnValue) => {
        if (returnValue.bulk_email_signup_message_should_be_shown) {
          this.showEmailSignupLink = true;
          this.submissionInProcess = false;
          return;
        }
        this.siteAnalyticsService.registerNewSignupEvent('#signup-submit');
        setTimeout(() => {
          this.windowRef.nativeWindow.location.href = (
            this.utilsService.getSafeReturnUrl(returnUrl));
        }, analyticsConstants.CAN_SEND_ANALYTICS_EVENTS ? 150 : 0);
      }, (rejection) => {
        if (rejection && rejection.status_code === 401) {
          this.showRegistrationSessionExpiredModal();
        }
        this.submissionInProcess = false;
      });
  }

  showRegistrationSessionExpiredModal(): void {
    let modalRef = this.ngbModal.open(
      RegistrationSessionExpiredModalComponent, {
        backdrop: 'static',
        keyboard: false
      });

    modalRef.result.then(() => {
      // Note to developers:
      // This callback is triggered when the Confirm button is clicked.
      // No further action is needed.
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }
}
