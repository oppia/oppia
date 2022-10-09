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
 * @fileoverview Unit tests for the Preferences page.
 */

import { NO_ERRORS_SCHEMA, Pipe } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { NgbModal, NgbModalModule, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { UserInfo } from 'domain/user/user-info.model';
import { LanguageUtilService } from 'domain/utilities/language-util.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { AlertsService } from 'services/alerts.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { LoaderService } from 'services/loader.service';
import { PreventPageUnloadEventService } from 'services/prevent-page-unload-event.service';
import { EmailPreferencesBackendDict, NonEmailPreferencesBackendDict, ProfilePictureDataBackendDict, UpdatePreferencesResponse, UserBackendApiService } from 'services/user-backend-api.service';
import { UserService } from 'services/user.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { PreferencesPageComponent } from './preferences-page.component';

describe('Preferences Page Component', () => {
  let componentInstance: PreferencesPageComponent;
  let fixture: ComponentFixture<PreferencesPageComponent>;
  let loaderService: LoaderService;
  let userService: UserService;
  let languageUtilService: LanguageUtilService;
  let urlInterpolationService: UrlInterpolationService;
  let preventPageUnloadEventService: PreventPageUnloadEventService;
  let alertsService: AlertsService;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let ngbModal: NgbModal;
  let mockWindowRef: MockWindowRef;
  let mockUserBackendApiService: MockUserBackendApiService;

  let preferencesProfilePictureDataUrl: ProfilePictureDataBackendDict = {
    profile_picture_data_url: ''
  };

  let emailPreferences: EmailPreferencesBackendDict = {
    can_receive_email_updates: true,
    can_receive_editor_role_email: true,
    can_receive_feedback_message_email: false,
    can_receive_subscription_email: true,
  };

  let preferencesData: NonEmailPreferencesBackendDict = {
    preferred_language_codes: ['en'],
    preferred_site_language_code: 'en',
    preferred_audio_language_code: 'en',
    default_dashboard: 'creator',
    user_bio: 'test user bio',
    subject_interests: '',
    subscription_list: [{
      creator_picture_data_url: 'picture_url',
      creator_username: 'creator',
      creator_impact: 0
    }]
  };

  class MockWindowRef {
    nativeWindow = {
      location: {
        reload: () => {}
      }
    };
  }

  @Pipe({name: 'truncate'})
  class MockTruncatePipe {
    transform(value: string, params: Object | undefined): string {
      return value;
    }
  }

  class MockUserBackendApiService {
    async getPreferencesAsync(): Promise<NonEmailPreferencesBackendDict> {
      return Promise.resolve(preferencesData);
    }

    async updatePreferencesDataAsync(
        updateType: string,
        data: string | string[]
    ): Promise<NonEmailPreferencesBackendDict> {
      return Promise.resolve({
        preferred_language_codes: ['en'],
        preferred_site_language_code: 'en',
        preferred_audio_language_code: 'en',
        default_dashboard: 'creator',
        user_bio: 'test user bio',
        subject_interests: '',
        subscription_list: [{
          creator_picture_data_url: 'picture_url',
          creator_username: 'creator',
          creator_impact: 0
        }]
      });
    }

    async getPreferencesProfilePictureDataUrlAsync(
    ): Promise<ProfilePictureDataBackendDict> {
      return Promise.resolve(preferencesProfilePictureDataUrl);
    }

    async updatePreferencesProfilePictureDataUrlAsync(
        data: string
    ): Promise<ProfilePictureDataBackendDict> {
      return Promise.resolve({
        profile_picture_data_url: '',
      });
    }

    async getEmailPreferencesAsync(
    ): Promise<EmailPreferencesBackendDict> {
      return Promise.resolve(emailPreferences);
    }

    async updateEmailPreferencesAsync(
        data: EmailPreferencesBackendDict
    ): Promise<UpdatePreferencesResponse> {
      return Promise.resolve({
        bulk_email_signup_message_should_be_shown: false
      });
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        NgbModalModule
      ],
      declarations: [
        MockTranslatePipe,
        MockTruncatePipe,
        PreferencesPageComponent
      ],
      providers: [
        AlertsService,
        I18nLanguageCodeService,
        LanguageUtilService,
        LoaderService,
        PreventPageUnloadEventService,
        UrlInterpolationService,
        {
          provide: UserBackendApiService,
          useClass: MockUserBackendApiService
        },
        UserService,
        {
          provide: WindowRef,
          useClass: MockWindowRef
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PreferencesPageComponent);
    componentInstance = fixture.componentInstance;
    loaderService = TestBed.inject(LoaderService);
    userService = TestBed.inject(UserService);
    languageUtilService = TestBed.inject(LanguageUtilService);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    preventPageUnloadEventService = TestBed.inject(
      PreventPageUnloadEventService);
    alertsService = TestBed.inject(AlertsService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    ngbModal = TestBed.inject(NgbModal);
    mockWindowRef = TestBed.inject(WindowRef);
    mockUserBackendApiService = TestBed.inject(UserBackendApiService);
  });

  it('should be defined', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should initialize', fakeAsync(() => {
    let username = 'test';
    let userEmail = 'test_email@example.com';
    spyOn(loaderService, 'showLoadingScreen');
    spyOn(loaderService, 'hideLoadingScreen');
    spyOn(userService, 'getUserInfoAsync').and
      .returnValue(Promise.resolve(new UserInfo(
        ['USER_ROLE'], false, false, false, false, false, 'en', username,
        userEmail, true)));
    spyOn(languageUtilService, 'getLanguageIdsAndTexts').and.returnValue(
      [{
        id: 'en',
        text: 'English'
      }]);
    componentInstance.ngOnInit();
    tick();
    tick();
    tick();
    expect(componentInstance.hasPageLoaded).toBeTrue();
    expect(componentInstance.username).toEqual(username);
    expect(componentInstance.email).toEqual(userEmail);
    expect(componentInstance.userBio).toEqual(preferencesData.user_bio);
    expect(componentInstance.subjectInterests).toEqual(
      preferencesData.subject_interests);
    expect(componentInstance.preferredLanguageCodes).toEqual(
      preferencesData.preferred_language_codes);
    expect(componentInstance.profilePictureDataUrl).toEqual(
      preferencesProfilePictureDataUrl.profile_picture_data_url);
    expect(componentInstance.defaultDashboard).toEqual(
      preferencesData.default_dashboard);
    expect(componentInstance.canReceiveEmailUpdates).toEqual(
      emailPreferences.can_receive_email_updates);
    expect(componentInstance.canReceiveEditorRoleEmail).toEqual(
      emailPreferences.can_receive_editor_role_email);
    expect(componentInstance.canReceiveSubscriptionEmail).toEqual(
      emailPreferences.can_receive_subscription_email);
    expect(componentInstance.canReceiveFeedbackMessageEmail).toEqual(
      emailPreferences.can_receive_feedback_message_email);
    expect(componentInstance.preferredSiteLanguageCode).toEqual(
      preferencesData.preferred_site_language_code);
    expect(componentInstance.subscriptionList).toEqual(
      preferencesData.subscription_list);
    expect(loaderService.showLoadingScreen).toHaveBeenCalled();
    expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
  }));

  it('should get static image url', () => {
    let staticImageUrl = 'static_image_url';
    spyOn(urlInterpolationService, 'getStaticImageUrl').and.returnValue(
      staticImageUrl);
    expect(componentInstance.getStaticImageUrl('')).toEqual(staticImageUrl);
  });

  describe('preferences data', () => {
    beforeEach(() => {
      spyOn(preventPageUnloadEventService, 'addListener');
      spyOn(preventPageUnloadEventService, 'removeListener');
      spyOn(alertsService, 'addInfoMessage');
      spyOn(alertsService, 'clearWarnings');
    });

    it('should save user bio', fakeAsync(() => {
      let bio = 'new user bio';
      componentInstance.saveUserBio(bio);
      tick();
      expect(preventPageUnloadEventService.addListener).toHaveBeenCalled();
      expect(preventPageUnloadEventService.removeListener).toHaveBeenCalled();
      expect(alertsService.addInfoMessage).toHaveBeenCalled();
    }));

    it('should save subject interests', fakeAsync(() => {
      componentInstance.onSubjectInterestsSelectionChange('math');
      expect(alertsService.clearWarnings).toHaveBeenCalled();
      tick();
      expect(componentInstance.subjectInterestsChangeAtLeastOnce).toBeTrue();
      expect(preventPageUnloadEventService.addListener).toHaveBeenCalled();
      expect(preventPageUnloadEventService.removeListener).toHaveBeenCalled();
      expect(alertsService.addInfoMessage).toHaveBeenCalled();
    }));

    it('should save preferred site language codes', fakeAsync(() => {
      let code = 'en';
      spyOn(i18nLanguageCodeService, 'setI18nLanguageCode');
      componentInstance.savePreferredSiteLanguageCodes(code);
      tick();
      expect(i18nLanguageCodeService.setI18nLanguageCode).toHaveBeenCalledWith(
        code);
      expect(preventPageUnloadEventService.addListener).toHaveBeenCalled();
      expect(preventPageUnloadEventService.removeListener).toHaveBeenCalled();
      expect(alertsService.addInfoMessage).toHaveBeenCalled();
    }));

    it('should save preferred audio language code', fakeAsync(() => {
      componentInstance.savePreferredAudioLanguageCode('en');
      tick();
      expect(preventPageUnloadEventService.addListener).toHaveBeenCalled();
      expect(preventPageUnloadEventService.removeListener).toHaveBeenCalled();
      expect(alertsService.addInfoMessage).toHaveBeenCalled();
    }));

    it('should save email preferences', fakeAsync(() => {
      spyOn(mockUserBackendApiService, 'updateEmailPreferencesAsync')
        .and.returnValue(
          Promise.resolve({
            bulk_email_signup_message_should_be_shown: true
          }));
      componentInstance.saveEmailPreferences(true, true, true, true);
      tick();
      expect(preventPageUnloadEventService.addListener).toHaveBeenCalled();
      expect(preventPageUnloadEventService.removeListener).toHaveBeenCalled();
      expect(componentInstance.canReceiveEmailUpdates).toBeFalse();
    }));

    it('should save preferred language codes', fakeAsync(() => {
      componentInstance.savePreferredLanguageCodes(['en', 'hi']);
      tick();
      expect(preventPageUnloadEventService.addListener).toHaveBeenCalled();
      expect(preventPageUnloadEventService.removeListener).toHaveBeenCalled();
      expect(alertsService.addInfoMessage).toHaveBeenCalled();
    }));

    it('should save default dashboard', fakeAsync(() => {
      componentInstance.saveDefaultDashboard('creator');
      tick();
      expect(preventPageUnloadEventService.addListener).toHaveBeenCalled();
      expect(preventPageUnloadEventService.removeListener).toHaveBeenCalled();
      expect(alertsService.addInfoMessage).toHaveBeenCalled();
    }));
  });

  it('should register bio changed', () => {
    spyOn(preventPageUnloadEventService, 'addListener');
    componentInstance.registerBioChanged();
    expect(preventPageUnloadEventService.addListener).toHaveBeenCalled();
  });

  it('should validate user popover when username is longer 10 chars', () => {
    expect(componentInstance.showUsernamePopover('greaterthan10characters'))
      .toEqual('mouseenter');
  });

  it('should not show popover when username is shorter than 10 chars', () => {
    expect(componentInstance.showUsernamePopover('user')).toEqual('none');
  });

  it('should handle export data click', () => {
    componentInstance.exportingData = false;
    componentInstance.handleExportDataClick();
    expect(componentInstance.exportingData).toBeTrue();
  });

  it('should show edit profile picture modal', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.resolve()
    } as NgbModalRef);
    spyOn(userService, 'setProfileImageDataUrlAsync').and.returnValue(
      Promise.resolve({
        profile_picture_data_url: 'a',
        subscription_list: [{
          creator_picture_data_url: 'picture_url',
          creator_username: 'creator',
          creator_impact: 0
        }]
      })
    );
    spyOn(mockWindowRef.nativeWindow.location, 'reload');
    componentInstance.showEditProfilePictureModal();
    tick();
    tick();
    expect(userService.setProfileImageDataUrlAsync).toHaveBeenCalled();
    expect(mockWindowRef.nativeWindow.location.reload).toHaveBeenCalled();
  }));

  it('should handle edit profile picture modal is canceled', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.reject()
    } as NgbModalRef);
    spyOn(userService, 'setProfileImageDataUrlAsync');
    componentInstance.showEditProfilePictureModal();
    tick();
    tick();
    expect(userService.setProfileImageDataUrlAsync).not.toHaveBeenCalled();
  }));
});
