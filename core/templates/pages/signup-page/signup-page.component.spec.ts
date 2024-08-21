// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for sign up page component.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {
  NgbModal,
  NgbModalModule,
  NgbModalRef,
} from '@ng-bootstrap/ng-bootstrap';
import {AlertsService} from 'services/alerts.service';
import {UrlService} from 'services/contextual/url.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {LoaderService} from 'services/loader.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {MockTranslateModule} from 'tests/unit-test-utils';
import {SignupPageBackendApiService} from './services/signup-page-backend-api.service';
import {SignupPageComponent} from './signup-page.component';

class MockWindowRef {
  nativeWindow = {
    location: {
      href: '',
    },
    gtag: () => {},
  };
}

describe('Sign up page component', () => {
  let fixture: ComponentFixture<SignupPageComponent>;
  let componentInstance: SignupPageComponent;
  let loaderService: LoaderService;
  let signupPageBackendApiService: SignupPageBackendApiService;
  let focusManagerService: FocusManagerService;
  let ngbModal: NgbModal;
  let alertsService: AlertsService;
  let urlService: UrlService;
  let siteAnalyticsService: SiteAnalyticsService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        MockTranslateModule,
        NgbModalModule,
        FormsModule,
      ],
      declarations: [SignupPageComponent],
      providers: [
        {
          provide: WindowRef,
          useClass: MockWindowRef,
        },
        AlertsService,
        FocusManagerService,
        LoaderService,
        SignupPageBackendApiService,
        SiteAnalyticsService,
        UrlService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SignupPageComponent);
    componentInstance = fixture.componentInstance;
    loaderService = TestBed.inject(LoaderService);
    signupPageBackendApiService = TestBed.inject(SignupPageBackendApiService);
    focusManagerService = TestBed.inject(FocusManagerService);
    ngbModal = TestBed.inject(NgbModal);
    alertsService = TestBed.inject(AlertsService);
    urlService = TestBed.inject(UrlService);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should intialize', fakeAsync(() => {
    const canSendEmails = true;
    const hasAgreedToLatestTerms = true;
    const hasEverRegistered = true;
    const username = 'test_user';

    spyOn(loaderService, 'showLoadingScreen');
    spyOn(loaderService, 'hideLoadingScreen');
    spyOn(focusManagerService, 'setFocus');
    spyOn(
      signupPageBackendApiService,
      'fetchSignupPageDataAsync'
    ).and.returnValue(
      Promise.resolve({
        server_can_send_emails: canSendEmails,
        has_agreed_to_latest_terms: hasAgreedToLatestTerms,
        has_ever_registered: hasEverRegistered,
        username: username,
      })
    );

    componentInstance.ngOnInit();
    tick();
    expect(loaderService.showLoadingScreen).toHaveBeenCalled();
    expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
    expect(focusManagerService.setFocus).toHaveBeenCalled();
    expect(componentInstance.username).toEqual(username);
    expect(componentInstance.hasEverRegistered).toEqual(hasEverRegistered);
    expect(componentInstance.hasAgreedToLatestTerms).toEqual(
      hasAgreedToLatestTerms
    );
    expect(componentInstance.username).toEqual(username);
  }));

  it('should validate form input', () => {
    componentInstance.hasAgreedToLatestTerms = true;
    componentInstance.hasUsername = true;
    componentInstance.warningI18nCode = '';
    expect(componentInstance.isFormValid()).toBeTrue();
  });

  it('should confirm license explanation modal', () => {
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.resolve(),
    } as NgbModalRef);
    componentInstance.showLicenseExplanationModal({
      target: {innerText: 'here'},
    });
    expect(ngbModal.open).toHaveBeenCalled();
  });

  it('should cancel license explanation modal', () => {
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.reject(),
    } as NgbModalRef);
    componentInstance.showLicenseExplanationModal({
      target: {innerText: 'here'},
    });
    expect(ngbModal.open).toHaveBeenCalled();
  });

  it('should not trigger license explanation modal if click elsewhere', () => {
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.reject(),
    } as NgbModalRef);
    componentInstance.showLicenseExplanationModal({target: {innerText: ''}});
    expect(ngbModal.open).not.toHaveBeenCalled();
  });

  it('should confirm registration session expired modal', () => {
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.resolve(),
    } as NgbModalRef);
    componentInstance.showRegistrationSessionExpiredModal();
    expect(ngbModal.open).toHaveBeenCalled();
  });

  it('should cancel registration session expired modal', () => {
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.reject(),
    } as NgbModalRef);
    componentInstance.showRegistrationSessionExpiredModal();
    expect(ngbModal.open).toHaveBeenCalled();
  });

  it('should handle username input blur event', fakeAsync(() => {
    spyOn(alertsService, 'clearWarnings');
    spyOn(componentInstance, 'updateWarningText');
    spyOn(
      signupPageBackendApiService,
      'checkUsernameAvailableAsync'
    ).and.returnValue(
      Promise.resolve({
        username_is_taken: true,
      })
    );
    componentInstance.warningI18nCode = '';
    componentInstance.onUsernameInputFormBlur('');
    tick();
    expect(componentInstance.blurredAtLeastOnce).toBeTrue();
    expect(componentInstance.usernameCheckIsInProgress).toBeFalse();
    expect(componentInstance.warningI18nCode).toEqual(
      'I18N_SIGNUP_ERROR_USERNAME_TAKEN'
    );
  }));

  it('should not perform checks for empty username', () => {
    spyOn(alertsService, 'clearWarnings');
    componentInstance.hasUsername = true;
    componentInstance.onUsernameInputFormBlur('');
    expect(alertsService.clearWarnings).not.toHaveBeenCalled();
  });

  it('should update warning text', () => {
    componentInstance.updateWarningText('');
    expect(componentInstance.warningI18nCode).toEqual(
      'I18N_SIGNUP_ERROR_NO_USERNAME'
    );
    componentInstance.updateWarningText(' ');
    expect(componentInstance.warningI18nCode).toEqual(
      'I18N_SIGNUP_ERROR_USERNAME_WITH_SPACES'
    );
    componentInstance.updateWarningText(
      'this_username_is_longer_than_thiry_characters'
    );
    expect(componentInstance.warningI18nCode).toEqual(
      'I18N_SIGNUP_ERROR_USERNAME_TOO_LONG'
    );
    componentInstance.updateWarningText('$%');
    expect(componentInstance.warningI18nCode).toEqual(
      'I18N_SIGNUP_ERROR_USERNAME_ONLY_ALPHANUM'
    );
    componentInstance.updateWarningText('admin');
    expect(componentInstance.warningI18nCode).toEqual(
      'I18N_SIGNUP_ERROR_USERNAME_WITH_ADMIN'
    );
    componentInstance.updateWarningText('oppia');
    expect(componentInstance.warningI18nCode).toEqual(
      'I18N_SIGNUP_ERROR_USERNAME_NOT_AVAILABLE'
    );
    componentInstance.updateWarningText('validusername');
    expect(componentInstance.warningI18nCode).toEqual('');
  });

  it('should update email preference warning', () => {
    componentInstance.onSelectEmailPreference();
    expect(componentInstance.emailPreferencesWarningText).toEqual('');
  });

  it('should not submit if user doesnot agree to terms', () => {
    spyOn(alertsService, 'addWarning');
    componentInstance.submitPrerequisitesForm(false, 'test', 'yes');
    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'I18N_SIGNUP_ERROR_MUST_AGREE_TO_TERMS'
    );
  });

  it('should not submit if username is not valid', () => {
    spyOn(urlService, 'getUrlParams');
    componentInstance.warningI18nCode = 'not_empty';
    componentInstance.submitPrerequisitesForm(true, '', 'yes');
    expect(urlService.getUrlParams).not.toHaveBeenCalled();
  });

  it('should submit prerequisites form', fakeAsync(() => {
    spyOn(urlService, 'getUrlParams').and.returnValue({
      return_url: 'creator-dashboard',
    });
    spyOn(signupPageBackendApiService, 'updateUsernameAsync').and.returnValue(
      Promise.resolve({
        bulk_email_signup_message_should_be_shown: true,
      })
    );
    spyOn(siteAnalyticsService, 'registerNewSignupEvent');
    componentInstance.hasUsername = false;
    componentInstance.showEmailPreferencesForm = true;

    componentInstance.submitPrerequisitesForm(true, 'username', 'yes');
    tick();
    expect(componentInstance.showEmailSignupLink).toBeTrue();
    expect(componentInstance.submissionInProcess).toBeFalse();
  }));

  it('should not submit when receive emails not enabled', () => {
    spyOn(urlService, 'getUrlParams').and.returnValue({
      return_url: 'learner-dashboard',
    });
    spyOn(signupPageBackendApiService, 'updateUsernameAsync').and.returnValue(
      Promise.resolve({
        bulk_email_signup_message_should_be_shown: true,
      })
    );
    spyOn(siteAnalyticsService, 'registerNewSignupEvent');
    componentInstance.hasUsername = false;
    componentInstance.showEmailPreferencesForm = true;

    componentInstance.submitPrerequisitesForm(true, 'username', null);
    expect(componentInstance.emailPreferencesWarningText).toEqual(
      'I18N_SIGNUP_FIELD_REQUIRED'
    );
  });

  it('should submit prerequisites form and save analytics', fakeAsync(() => {
    spyOn(urlService, 'getUrlParams').and.returnValue({
      return_url: 'creator-dashboard',
    });
    spyOn(signupPageBackendApiService, 'updateUsernameAsync').and.returnValue(
      Promise.resolve({
        bulk_email_signup_message_should_be_shown: false,
      })
    );
    spyOn(siteAnalyticsService, 'registerNewSignupEvent');
    componentInstance.hasUsername = false;
    componentInstance.showEmailPreferencesForm = true;

    componentInstance.submitPrerequisitesForm(true, 'username', 'no');
    tick();
    tick(200);
    expect(siteAnalyticsService.registerNewSignupEvent).toHaveBeenCalled();
  }));

  it(
    "should submit prerequisites form with user's preferred default " +
      'dashboard',
    fakeAsync(() => {
      spyOn(urlService, 'getUrlParams').and.returnValue({
        return_url: 'contributor-dashboard',
      });
      spyOn(signupPageBackendApiService, 'updateUsernameAsync').and.returnValue(
        Promise.resolve({
          bulk_email_signup_message_should_be_shown: true,
        })
      );

      const sentRequestParams = {
        agreed_to_terms: true,
        can_receive_email_updates: false,
        default_dashboard: 'contributor',
        username: 'username',
      };

      componentInstance.hasUsername = false;
      componentInstance.showEmailPreferencesForm = true;

      componentInstance.submitPrerequisitesForm(
        sentRequestParams.agreed_to_terms,
        sentRequestParams.username,
        'no'
      );
      tick();

      expect(
        signupPageBackendApiService.updateUsernameAsync
      ).toHaveBeenCalledWith(sentRequestParams);
    })
  );

  it('should throw error if canReceiveEmailUpdates param is not valid', () => {
    spyOn(urlService, 'getUrlParams').and.returnValue({
      return_url: 'creator-dashboard',
    });
    componentInstance.hasUsername = false;
    componentInstance.showEmailPreferencesForm = true;

    expect(() => {
      componentInstance.submitPrerequisitesForm(true, 'username', 'not_valid');
    }).toThrowError();
  });

  it('should handle if form is not processed at backend', fakeAsync(() => {
    spyOn(urlService, 'getUrlParams').and.returnValue({
      return_url: 'creator-dashboard',
    });
    spyOn(signupPageBackendApiService, 'updateUsernameAsync').and.returnValue(
      Promise.reject({
        status_code: 401,
      })
    );
    spyOn(componentInstance, 'showRegistrationSessionExpiredModal');
    componentInstance.hasUsername = false;
    componentInstance.showEmailPreferencesForm = true;

    componentInstance.submitPrerequisitesForm(true, 'username', 'no');
    tick();
    expect(
      componentInstance.showRegistrationSessionExpiredModal
    ).toHaveBeenCalled();
    expect(componentInstance.submissionInProcess).toBeFalse();
  }));
});
