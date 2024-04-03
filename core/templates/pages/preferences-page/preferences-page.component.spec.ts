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

import {NO_ERRORS_SCHEMA, Pipe, ElementRef} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {
  NgbModal,
  NgbModalModule,
  NgbModalRef,
} from '@ng-bootstrap/ng-bootstrap';
import {UserInfo} from 'domain/user/user-info.model';
import {LanguageUtilService} from 'domain/utilities/language-util.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {AlertsService} from 'services/alerts.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {LoaderService} from 'services/loader.service';
import {PreventPageUnloadEventService} from 'services/prevent-page-unload-event.service';
import {
  PreferencesBackendDict,
  UpdatePreferenceDict,
  UpdatePreferencesResponse,
  UserBackendApiService,
} from 'services/user-backend-api.service';
import {UserService} from 'services/user.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {PreferencesPageComponent} from './preferences-page.component';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {ImageUploadHelperService} from '../../services/image-upload-helper.service';

describe('Preferences Page Component', () => {
  @Pipe({name: 'truncate'})
  class MockTruncatePipe {
    transform(value: string, params: Object | undefined): string {
      return value;
    }
  }
  describe('on dev mode', () => {
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
    let imageUploadHelperService: ImageUploadHelperService;

    let preferencesData: PreferencesBackendDict = {
      preferred_language_codes: ['en'],
      preferred_site_language_code: 'en',
      preferred_audio_language_code: 'en',
      default_dashboard: 'creator',
      user_bio: 'test user bio',
      subject_interests: '',
      can_receive_email_updates: true,
      can_receive_editor_role_email: true,
      can_receive_feedback_message_email: false,
      can_receive_subscription_email: true,
      subscription_list: [
        {
          creator_username: 'creator',
          creator_impact: 0,
        },
      ],
    };

    class MockWindowRef {
      imageData: Record<string, string> = {};
      _window = {
        location: {
          reload: () => {},
        },
        sessionStorage: {
          removeItem: (name: string) => {
            this.imageData = {};
          },
          setItem: (filename: string, rawImage: string) => {
            this.imageData[filename] = rawImage;
          },
          getItem: (filename: string) => {
            return 'data:image/png;base64,JUMzJTg3JTJD';
          },
        },
        addEventListener: (
          event: string,
          callback: () => void,
          useCapture: boolean
        ) => {},
        removeEventListener: (
          event: string,
          callback: () => void,
          useCapture: boolean
        ) => {},
      };

      get nativeWindow() {
        return this._window;
      }
    }

    class MockUserBackendApiService {
      async getPreferencesAsync(): Promise<PreferencesBackendDict> {
        return Promise.resolve(preferencesData);
      }

      async updateMultiplePreferencesDataAsync(
        updates: UpdatePreferenceDict[]
      ): Promise<UpdatePreferencesResponse> {
        return Promise.resolve({
          bulk_email_signup_message_should_be_shown: false,
        });
      }
    }

    beforeEach(waitForAsync(() => {
      mockWindowRef = new MockWindowRef();
      TestBed.configureTestingModule({
        imports: [NgbModalModule, HttpClientTestingModule],
        declarations: [
          MockTranslatePipe,
          MockTruncatePipe,
          PreferencesPageComponent,
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
            useClass: MockUserBackendApiService,
          },
          UserService,
          {
            provide: WindowRef,
            useValue: mockWindowRef,
          },
        ],
        schemas: [NO_ERRORS_SCHEMA],
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
        PreventPageUnloadEventService
      );
      alertsService = TestBed.inject(AlertsService);
      i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
      ngbModal = TestBed.inject(NgbModal);
      mockUserBackendApiService = TestBed.inject(UserBackendApiService);
      imageUploadHelperService = TestBed.inject(ImageUploadHelperService);

      spyOn(userService, 'getProfileImageDataUrl').and.returnValue([
        'profile-image-url-png',
        'profile-image-url-webp',
      ]);
    });

    it('should be defined', () => {
      expect(componentInstance).toBeDefined();
    });

    it('should initialize', fakeAsync(() => {
      let username = 'test';
      let userEmail = 'test_email@example.com';
      spyOn(loaderService, 'showLoadingScreen');
      spyOn(loaderService, 'hideLoadingScreen');
      spyOn(userService, 'getUserInfoAsync').and.returnValue(
        Promise.resolve(
          new UserInfo(
            ['USER_ROLE'],
            false,
            false,
            false,
            false,
            false,
            'en',
            username,
            userEmail,
            true
          )
        )
      );
      spyOn(languageUtilService, 'getLanguageIdsAndTexts').and.returnValue([
        {
          id: 'en',
          text: 'English',
          ariaLabelInEnglish: 'English',
        },
      ]);
      componentInstance.ngOnInit();
      tick();
      tick();
      let formValues = componentInstance.preferencesForm.value;
      expect(componentInstance.preferencesForm).toBeDefined;
      expect(componentInstance.hasPageLoaded).toBeTrue();
      expect(componentInstance.username).toEqual(username);
      expect(componentInstance.email).toEqual(userEmail);
      expect(formValues.profilePicturePngDataUrl).toEqual(
        'profile-image-url-png'
      );
      expect(formValues.profilePictureWebpDataUrl).toEqual(
        'profile-image-url-webp'
      );
      expect(formValues.userBio).toEqual(preferencesData.user_bio);
      expect(formValues.defaultDashboard).toEqual(
        preferencesData.default_dashboard
      );
      expect(formValues.subjectInterests).toEqual(
        preferencesData.subject_interests
      );
      expect(formValues.preferredLanguageCodes).toEqual(
        preferencesData.preferred_language_codes
      );
      expect(formValues.preferredSiteLanguageCode).toEqual(
        preferencesData.preferred_site_language_code
      );
      expect(formValues.preferredAudioLanguageCode).toEqual(
        preferencesData.preferred_audio_language_code
      );
      expect(formValues.emailPreferences.canReceiveEmailUpdates).toEqual(
        preferencesData.can_receive_email_updates
      );
      expect(formValues.emailPreferences.canReceiveEditorRoleEmail).toEqual(
        preferencesData.can_receive_editor_role_email
      );
      expect(formValues.emailPreferences.canReceiveSubscriptionEmail).toEqual(
        preferencesData.can_receive_subscription_email
      );
      expect(
        formValues.emailPreferences.canReceiveFeedbackMessageEmail
      ).toEqual(preferencesData.can_receive_feedback_message_email);
      expect(componentInstance.subscriptionList).toEqual(
        preferencesData.subscription_list
      );
      expect(loaderService.showLoadingScreen).toHaveBeenCalled();
      expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
    }));

    it('should get user profile image png data url correctly', () => {
      expect(componentInstance.getProfileImagePngDataUrl('username')).toBe(
        'profile-image-url-png'
      );
    });

    it('should get user profile image webp data url correctly', () => {
      expect(componentInstance.getProfileImageWebpDataUrl('username')).toBe(
        'profile-image-url-webp'
      );
    });

    it('should set default profile pictures when username is null', fakeAsync(() => {
      let userInfo = {
        getUsername: () => null,
        isSuperAdmin: () => true,
        getEmail: () => 'test_email@example.com',
      };
      spyOn(loaderService, 'showLoadingScreen');
      spyOn(loaderService, 'hideLoadingScreen');
      spyOn(userService, 'getUserInfoAsync').and.resolveTo(
        userInfo as UserInfo
      );

      componentInstance.ngOnInit();
      tick();
      let formValues = componentInstance.preferencesForm.value;
      expect(formValues.profilePicturePngDataUrl).toEqual(
        '/assets/images/avatar/user_blue_150px.png'
      );
      expect(formValues.profilePictureWebpDataUrl).toEqual(
        '/assets/images/avatar/user_blue_150px.webp'
      );
    }));

    it('should get static image url', () => {
      let staticImageUrl = 'static_image_url';
      spyOn(urlInterpolationService, 'getStaticImageUrl').and.returnValue(
        staticImageUrl
      );
      expect(componentInstance.getStaticImageUrl('')).toEqual(staticImageUrl);
    });

    describe('preferences data', () => {
      beforeEach(fakeAsync(() => {
        spyOn(preventPageUnloadEventService, 'addListener');
        spyOn(preventPageUnloadEventService, 'removeListener');
        spyOn(alertsService, 'addInfoMessage');
        spyOn(alertsService, 'clearWarnings');
        spyOn(userService, 'getUserInfoAsync').and.returnValue(
          Promise.resolve(
            new UserInfo(
              ['USER_ROLE'],
              false,
              false,
              false,
              false,
              false,
              'en',
              'test',
              'test_email@example.com',
              true
            )
          )
        );
        componentInstance.ngOnInit();
        tick();
        expect(componentInstance.preferencesForm).toBeDefined();
      }));

      it('should save user bio', fakeAsync(() => {
        const formCtrl = componentInstance.preferencesForm.controls.userBio;
        formCtrl.setValue('test user bio');
        formCtrl.markAsDirty();
        componentInstance.preferencesForm.updateValueAndValidity();
        componentInstance.savePreferences();
        tick();
        expect(
          componentInstance.preferencesForm.controls.userBio.value
        ).toEqual('test user bio');
        expect(preventPageUnloadEventService.addListener).toHaveBeenCalled();
        expect(preventPageUnloadEventService.removeListener).toHaveBeenCalled();
        expect(alertsService.addInfoMessage).toHaveBeenCalled();
      }));

      it('should save default dashboard', fakeAsync(() => {
        const formCtrl =
          componentInstance.preferencesForm.controls.defaultDashboard;
        formCtrl.setValue('learner');
        formCtrl.markAsDirty();
        componentInstance.preferencesForm.updateValueAndValidity();
        componentInstance.savePreferences();
        tick();
        expect(
          componentInstance.preferencesForm.controls.defaultDashboard.value
        ).toEqual('learner');
        expect(preventPageUnloadEventService.addListener).toHaveBeenCalled();
        expect(preventPageUnloadEventService.removeListener).toHaveBeenCalled();
        expect(alertsService.addInfoMessage).toHaveBeenCalled();
      }));

      it('should save subject interests', fakeAsync(() => {
        const formCtrl =
          componentInstance.preferencesForm.controls.subjectInterests;
        formCtrl.setValue(['math']);
        formCtrl.markAsDirty();
        componentInstance.preferencesForm.updateValueAndValidity();
        componentInstance.savePreferences();
        tick();
        expect(
          componentInstance.preferencesForm.controls.subjectInterests.value
        ).toEqual(['math']);
        expect(preventPageUnloadEventService.addListener).toHaveBeenCalled();
        expect(preventPageUnloadEventService.removeListener).toHaveBeenCalled();
        expect(alertsService.addInfoMessage).toHaveBeenCalled();
      }));

      it('should save preferred language codes', fakeAsync(() => {
        const formCtrl =
          componentInstance.preferencesForm.controls.preferredLanguageCodes;
        formCtrl.setValue(['en', 'hi']);
        formCtrl.markAsDirty();
        componentInstance.preferencesForm.updateValueAndValidity();
        componentInstance.savePreferences();
        tick();
        expect(
          componentInstance.preferencesForm.controls.preferredLanguageCodes
            .value
        ).toEqual(['en', 'hi']);
        expect(preventPageUnloadEventService.addListener).toHaveBeenCalled();
        expect(preventPageUnloadEventService.removeListener).toHaveBeenCalled();
        expect(alertsService.addInfoMessage).toHaveBeenCalled();
      }));

      it('should save preferred site language code', fakeAsync(() => {
        let code = 'en';
        spyOn(i18nLanguageCodeService, 'setI18nLanguageCode');
        const formCtrl =
          componentInstance.preferencesForm.controls.preferredSiteLanguageCode;
        formCtrl.setValue(code);
        formCtrl.markAsDirty();
        componentInstance.preferencesForm.updateValueAndValidity();
        componentInstance.savePreferences();
        tick();
        tick();
        expect(
          componentInstance.preferencesForm.controls.preferredSiteLanguageCode
            .value
        ).toEqual(code);
        expect(preventPageUnloadEventService.addListener).toHaveBeenCalled();
        expect(preventPageUnloadEventService.removeListener).toHaveBeenCalled();
        expect(
          i18nLanguageCodeService.setI18nLanguageCode
        ).toHaveBeenCalledWith(code);
        expect(alertsService.addInfoMessage).toHaveBeenCalled();
      }));

      it('should save preferred audio languauge code', fakeAsync(() => {
        const formCtrl =
          componentInstance.preferencesForm.controls.preferredAudioLanguageCode;
        formCtrl.setValue('en');
        formCtrl.markAsDirty();
        componentInstance.preferencesForm.updateValueAndValidity();
        componentInstance.savePreferences();
        tick();
        expect(
          componentInstance.preferencesForm.controls.preferredAudioLanguageCode
            .value
        ).toEqual('en');
        expect(preventPageUnloadEventService.addListener).toHaveBeenCalled();
        expect(preventPageUnloadEventService.removeListener).toHaveBeenCalled();
        expect(alertsService.addInfoMessage).toHaveBeenCalled();
      }));

      it('should save email preferences', fakeAsync(() => {
        spyOn(
          mockUserBackendApiService,
          'updateMultiplePreferencesDataAsync'
        ).and.returnValue(
          Promise.resolve({
            bulk_email_signup_message_should_be_shown: true,
          })
        );

        const formGrp = componentInstance.preferencesForm.controls
          .emailPreferences as FormGroup;
        formGrp.controls.canReceiveEditorRoleEmail.setValue(false);
        formGrp.markAsDirty();
        componentInstance.preferencesForm.updateValueAndValidity();
        componentInstance.savePreferences();
        tick();
        expect(preventPageUnloadEventService.addListener).toHaveBeenCalled();
        expect(preventPageUnloadEventService.removeListener).toHaveBeenCalled();
        expect(
          componentInstance.preferencesForm.controls.emailPreferences.value
            .canReceiveEmailUpdates
        ).toBeFalse();
      }));
    });

    it('should validate user popover when username is longer 10 chars', () => {
      expect(
        componentInstance.showUsernamePopover('greaterthan10characters')
      ).toEqual('mouseenter');
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
      let profilePictureDataUrl = 'data:image/png;base64,JUMzJTg3JTJD';
      spyOn(ngbModal, 'open').and.returnValue({
        result: Promise.resolve(profilePictureDataUrl),
      } as NgbModalRef);
      spyOn(mockWindowRef.nativeWindow.location, 'reload');
      spyOn(userService, 'getUserInfoAsync').and.returnValue(
        Promise.resolve(
          new UserInfo(
            ['USER_ROLE'],
            false,
            false,
            false,
            false,
            false,
            'en',
            'test',
            'test_email@example.com',
            true
          )
        )
      );
      componentInstance.ngOnInit();
      tick();
      componentInstance.showEditProfilePictureModal();
      tick();
      componentInstance.savePreferences();
      tick();
      expect(mockWindowRef.nativeWindow.sessionStorage.getItem('file')).toEqual(
        profilePictureDataUrl
      );
      expect(mockWindowRef.nativeWindow.location.reload).toHaveBeenCalled();
    }));

    it('should edit profile picture modal raise error when image is invalid', fakeAsync(() => {
      let error = 'Image uploaded is not valid.';
      let profilePictureDataUrl = 'data:text/plain;base64,JUMzJTg3JTJD';
      spyOn(ngbModal, 'open').and.returnValue({
        result: Promise.resolve(profilePictureDataUrl),
      } as NgbModalRef);
      spyOn(
        imageUploadHelperService,
        'convertImageDataToImageFile'
      ).and.returnValue(null);
      spyOn(alertsService, 'addWarning');
      spyOn(userService, 'getUserInfoAsync').and.returnValue(
        Promise.resolve(
          new UserInfo(
            ['USER_ROLE'],
            false,
            false,
            false,
            false,
            false,
            'en',
            'test',
            'test_email@example.com',
            true
          )
        )
      );
      componentInstance.ngOnInit();
      tick();
      componentInstance.showEditProfilePictureModal();
      tick();
      componentInstance.savePreferences();
      tick();
      expect(alertsService.addWarning).toHaveBeenCalledWith(error);
    }));

    it('should handle edit profile picture modal is canceled', fakeAsync(() => {
      spyOn(ngbModal, 'open').and.returnValue({
        result: Promise.resolve(null),
      } as NgbModalRef);
      spyOn(userService, 'setProfileImageDataUrlAsync');
      spyOn(userService, 'getUserInfoAsync').and.returnValue(
        Promise.resolve(
          new UserInfo(
            ['USER_ROLE'],
            false,
            false,
            false,
            false,
            false,
            'en',
            'test',
            'test_email@example.com',
            true
          )
        )
      );
      componentInstance.ngOnInit();
      tick();
      tick();
      componentInstance.showEditProfilePictureModal();
      tick();
      expect(userService.setProfileImageDataUrlAsync).not.toHaveBeenCalled();
    }));

    it('should handle when there are no unsaved changes', fakeAsync(() => {
      spyOn(mockUserBackendApiService, 'updateMultiplePreferencesDataAsync');
      spyOn(userService, 'getUserInfoAsync').and.returnValue(
        Promise.resolve(
          new UserInfo(
            ['USER_ROLE'],
            false,
            false,
            false,
            false,
            false,
            'en',
            'test',
            'test_email@example.com',
            true
          )
        )
      );
      componentInstance.ngOnInit();
      tick();
      componentInstance.savePreferences();
      tick();
      expect(
        mockUserBackendApiService.updateMultiplePreferencesDataAsync
      ).not.toHaveBeenCalled();
    }));
  });

  describe('on production mode', () => {
    let httpTestingController: HttpTestingController;
    let componentInstance: PreferencesPageComponent;
    let ngbModal: NgbModal;
    let mockUserBackendApiService: MockUserBackendApiService;
    let mockWindowRef: MockWindowRef;
    let userService: UserService;
    let fixture: ComponentFixture<PreferencesPageComponent>;

    let preferencesData: PreferencesBackendDict = {
      preferred_language_codes: ['en'],
      preferred_site_language_code: 'en',
      preferred_audio_language_code: 'en',
      default_dashboard: 'creator',
      user_bio: 'test user bio',
      subject_interests: '',
      can_receive_email_updates: true,
      can_receive_editor_role_email: true,
      can_receive_feedback_message_email: false,
      can_receive_subscription_email: true,
      subscription_list: [
        {
          creator_username: 'creator',
          creator_impact: 0,
        },
      ],
    };

    class MockWindowRef {
      nativeWindow = {
        location: {
          reload: () => {},
        },
        addEventListener: (
          event: string,
          callback: () => void,
          useCapture: boolean
        ) => {},
        removeEventListener: (
          event: string,
          callback: () => void,
          useCapture: boolean
        ) => {},
      };
    }

    class MockUserBackendApiService {
      async getPreferencesAsync(): Promise<PreferencesBackendDict> {
        return Promise.resolve(preferencesData);
      }

      async updateMultiplePreferencesDataAsync(
        updates: UpdatePreferenceDict[]
      ): Promise<UpdatePreferencesResponse> {
        return Promise.resolve({
          bulk_email_signup_message_should_be_shown: false,
        });
      }
    }

    beforeEach(() => {
      spyOnProperty(
        AssetsBackendApiService,
        'EMULATOR_MODE',
        'get'
      ).and.returnValue(false);
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule, NgbModalModule],
        declarations: [
          PreferencesPageComponent,
          MockTranslatePipe,
          MockTruncatePipe,
        ],
        providers: [
          AssetsBackendApiService,
          UserService,
          {
            provide: WindowRef,
            useClass: MockWindowRef,
          },
          {
            provide: UserBackendApiService,
            useClass: MockUserBackendApiService,
          },
        ],
        schemas: [NO_ERRORS_SCHEMA],
      }).compileComponents();
      fixture = TestBed.createComponent(PreferencesPageComponent);
      componentInstance = fixture.componentInstance;
      httpTestingController = TestBed.inject(HttpTestingController);
      mockWindowRef = TestBed.inject(WindowRef);
      ngbModal = TestBed.inject(NgbModal);
      userService = TestBed.inject(UserService);
    });

    it('should show edit profile picture modal', fakeAsync(() => {
      mockUserBackendApiService = TestBed.inject(UserBackendApiService);
      let profilePictureDataUrl = 'data:image/png;base64,JUMzJTg3JTJD';
      spyOn(ngbModal, 'open').and.returnValue({
        result: Promise.resolve(profilePictureDataUrl),
      } as NgbModalRef);
      spyOn(
        mockUserBackendApiService,
        'updateMultiplePreferencesDataAsync'
      ).and.returnValue(
        Promise.resolve({
          bulk_email_signup_message_should_be_shown: false,
        })
      );
      spyOn(mockWindowRef.nativeWindow.location, 'reload');
      let username = 'test';
      let userEmail = 'test_email@example.com';
      spyOn(userService, 'getUserInfoAsync').and.returnValue(
        Promise.resolve(
          new UserInfo(
            ['USER_ROLE'],
            false,
            false,
            false,
            false,
            false,
            'en',
            username,
            userEmail,
            true
          )
        )
      );
      componentInstance.ngOnInit();
      tick();
      componentInstance.showEditProfilePictureModal();
      tick();
      componentInstance.savePreferences();
      tick();
      expect(
        componentInstance.preferencesForm.controls.profilePicturePngDataUrl
          .value
      ).toEqual(profilePictureDataUrl);
      expect(
        mockUserBackendApiService.updateMultiplePreferencesDataAsync
      ).toHaveBeenCalled();
      expect(mockWindowRef.nativeWindow.location.reload).toHaveBeenCalled();
    }));

    it('should handle tab key press for first radio', () => {
      const mockSecondRadio = new ElementRef(document.createElement('input'));
      const mockThirdRadio = new ElementRef(document.createElement('input'));
      const event = new KeyboardEvent('keydown', {key: 'Tab'});

      componentInstance.secondRadio = mockSecondRadio;
      componentInstance.thirdRadio = mockThirdRadio;

      spyOn(componentInstance.secondRadio.nativeElement, 'focus');
      spyOn(componentInstance.thirdRadio.nativeElement, 'focus');

      componentInstance.handleTabForFirstRadio(event);

      expect(
        componentInstance.secondRadio.nativeElement.focus
      ).toHaveBeenCalled();
      expect(
        componentInstance.thirdRadio.nativeElement.focus
      ).not.toHaveBeenCalled();
    });

    it('should handle tab key press for second radio', () => {
      const mockFirstRadio = new ElementRef(document.createElement('input'));
      const mockThirdRadio = new ElementRef(document.createElement('input'));
      const event = new KeyboardEvent('keydown', {key: 'Tab'});

      componentInstance.firstRadio = mockFirstRadio;
      componentInstance.thirdRadio = mockThirdRadio;

      spyOn(componentInstance.firstRadio.nativeElement, 'focus');
      spyOn(componentInstance.thirdRadio.nativeElement, 'focus');

      componentInstance.handleTabForSecondRadio(event);

      expect(
        componentInstance.firstRadio.nativeElement.focus
      ).not.toHaveBeenCalled();
      expect(
        componentInstance.thirdRadio.nativeElement.focus
      ).toHaveBeenCalled();
    });

    it('should handle shift+tab key press for second radio', () => {
      const mockFirstRadio = new ElementRef(document.createElement('input'));
      const mockThirdRadio = new ElementRef(document.createElement('input'));
      const event = new KeyboardEvent('keydown', {key: 'Tab', shiftKey: true});

      componentInstance.firstRadio = mockFirstRadio;
      componentInstance.thirdRadio = mockThirdRadio;

      spyOn(componentInstance.firstRadio.nativeElement, 'focus');
      spyOn(componentInstance.thirdRadio.nativeElement, 'focus');

      componentInstance.handleTabForSecondRadio(event);

      expect(
        componentInstance.firstRadio.nativeElement.focus
      ).toHaveBeenCalled();
      expect(
        componentInstance.thirdRadio.nativeElement.focus
      ).not.toHaveBeenCalled();
    });

    it('should handle shift+tab key press for third radio', () => {
      const mockFirstRadio = new ElementRef(document.createElement('input'));
      const mockSecondRadio = new ElementRef(document.createElement('input'));
      const event = new KeyboardEvent('keydown', {key: 'Tab', shiftKey: true});

      componentInstance.firstRadio = mockFirstRadio;
      componentInstance.secondRadio = mockSecondRadio;

      spyOn(componentInstance.firstRadio.nativeElement, 'focus');
      spyOn(componentInstance.secondRadio.nativeElement, 'focus');

      componentInstance.handleTabForThirdRadio(event);

      expect(
        componentInstance.firstRadio.nativeElement.focus
      ).not.toHaveBeenCalled();
      expect(
        componentInstance.secondRadio.nativeElement.focus
      ).toHaveBeenCalled();
    });

    afterEach(() => {
      httpTestingController.verify();
    });
  });
});
