// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests that the user service is working as expected.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {fakeAsync, flushMicrotasks, TestBed, tick} from '@angular/core/testing';

import {AppConstants} from 'app.constants';
import {UserInfo} from 'domain/user/user-info.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {CsrfTokenService} from 'services/csrf-token.service';
import {UserService} from 'services/user.service';
import {UrlService} from './contextual/url.service';
import {
  PreferencesBackendDict,
  UserBackendApiService,
} from './user-backend-api.service';
import {ImageLocalStorageService} from 'services/image-local-storage.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';

class MockWindowRef {
  imageData: Record<string, string> = {};
  _window = {
    location: {
      pathname: 'home',
    },
    sessionStorage: {
      removeItem: (name: string) => {
        this.imageData = {};
      },
      setItem: (filename: string, rawImage: string) => {
        this.imageData[filename] = rawImage;
      },
      getItem: (filename: string) => {
        if (this.imageData[filename] === undefined) {
          return null;
        }
        return this.imageData[filename];
      },
    },
  };

  get nativeWindow() {
    return this._window;
  }
}

describe('User Api Service', () => {
  describe('on dev mode', () => {
    let userService: UserService;
    let urlInterpolationService: UrlInterpolationService;
    let urlService: UrlService;
    let httpTestingController: HttpTestingController;
    let csrfService: CsrfTokenService;
    let windowRef: MockWindowRef;
    let userBackendApiService: UserBackendApiService;
    let imageLocalStorageService: ImageLocalStorageService;

    beforeEach(() => {
      windowRef = new MockWindowRef();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [{provide: WindowRef, useValue: windowRef}],
      });
      httpTestingController = TestBed.get(HttpTestingController);
      userService = TestBed.get(UserService);
      urlInterpolationService = TestBed.get(UrlInterpolationService);
      urlService = TestBed.get(UrlService);
      csrfService = TestBed.get(CsrfTokenService);
      userBackendApiService = TestBed.inject(UserBackendApiService);
      imageLocalStorageService = TestBed.inject(ImageLocalStorageService);

      spyOn(csrfService, 'getTokenAsync').and.callFake(async () => {
        return new Promise((resolve, reject) => {
          resolve('sample-csrf-token');
        });
      });
    });

    afterEach(() => {
      httpTestingController.verify();
    });

    it('should return userInfo data', fakeAsync(() => {
      const sampleUserInfoBackendObject = {
        roles: ['USER_ROLE'],
        is_moderator: false,
        is_curriculum_admin: false,
        is_super_admin: false,
        is_topic_manager: false,
        can_create_collections: true,
        preferred_site_language_code: null,
        username: 'tester',
        email: 'test@test.com',
        user_is_logged_in: true,
      };
      const sampleUserInfo = UserInfo.createFromBackendDict(
        sampleUserInfoBackendObject
      );

      userService.getUserInfoAsync().then(userInfo => {
        expect(userInfo.isCurriculumAdmin()).toBe(
          sampleUserInfo.isCurriculumAdmin()
        );
        expect(userInfo.isSuperAdmin()).toBe(sampleUserInfo.isSuperAdmin());
        expect(userInfo.isModerator()).toBe(sampleUserInfo.isModerator());
        expect(userInfo.isTopicManager()).toBe(sampleUserInfo.isTopicManager());
        expect(userInfo.isLoggedIn()).toBe(sampleUserInfo.isLoggedIn());
        expect(userInfo.canCreateCollections()).toBe(
          sampleUserInfo.canCreateCollections()
        );
        expect(userInfo.getUsername()).toBe(sampleUserInfo.getUsername());
        expect(userInfo.getEmail()).toBe(sampleUserInfo.getEmail());
        expect(userInfo.getPreferredSiteLanguageCode()).toBe(
          sampleUserInfo.getPreferredSiteLanguageCode()
        );
      });

      const req = httpTestingController.expectOne('/userinfohandler');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleUserInfoBackendObject);

      flushMicrotasks();
    }));

    it('should return new userInfo data when url path is signup', fakeAsync(() => {
      spyOn(urlService, 'getPathname').and.returnValue('/signup');
      const sampleUserInfo = UserInfo.createDefault();

      userService.getUserInfoAsync().then(userInfo => {
        expect(userInfo).toEqual(sampleUserInfo);
      });
    }));

    it('should return new userInfo data when url path is logout', fakeAsync(() => {
      spyOn(urlService, 'getPathname').and.returnValue('/logout');
      const sampleUserInfo = UserInfo.createDefault();

      userService.getUserInfoAsync().then(userInfo => {
        expect(userInfo).toEqual(sampleUserInfo);
      });
    }));

    it('should not fetch userInfo if it was fetched before', fakeAsync(() => {
      const sampleUserInfoBackendObject = {
        roles: ['USER_ROLE'],
        is_moderator: false,
        is_curriculum_admin: false,
        is_super_admin: false,
        is_topic_manager: false,
        can_create_collections: true,
        preferred_site_language_code: null,
        username: 'tester',
        email: 'test@test.com',
        user_is_logged_in: true,
      };
      const sampleUserInfo = UserInfo.createFromBackendDict(
        sampleUserInfoBackendObject
      );

      userService.getUserInfoAsync().then(userInfo => {
        expect(userInfo).toEqual(sampleUserInfo);
        // Fetch userInfo again.
        userService.getUserInfoAsync().then(sameUserInfo => {
          expect(sameUserInfo).toEqual(userInfo);
        });
      });
      const req = httpTestingController.expectOne('/userinfohandler');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleUserInfoBackendObject);

      flushMicrotasks();
    }));

    it('should return new userInfo data if user is not logged', fakeAsync(() => {
      const sampleUserInfoBackendObject = {
        role: 'USER_ROLE',
        is_moderator: false,
        is_curriculum_admin: false,
        is_super_admin: false,
        is_topic_manager: false,
        can_create_collections: true,
        preferred_site_language_code: null,
        username: 'tester',
        email: 'test@test.com',
        user_is_logged_in: false,
      };
      const sampleUserInfo = UserInfo.createDefault();

      userService.getUserInfoAsync().then(userInfo => {
        expect(userInfo).toEqual(sampleUserInfo);
      });
      const req = httpTestingController.expectOne('/userinfohandler');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleUserInfoBackendObject);

      flushMicrotasks();
    }));

    it('should return image stored in session storage while in emulator mode', fakeAsync(() => {
      let filename = 'tester_profile_picture.png';
      const imageData = 'data:image/png;base64,JUMzJTg3JTJD';
      imageLocalStorageService.saveImage(filename, imageData);
      let [profileImagePng, profileImageWebp] =
        userService.getProfileImageDataUrl('tester');
      expect(profileImagePng).toEqual(imageData);
      expect(profileImageWebp).toEqual(imageData);
      imageLocalStorageService.deleteImage(filename);

      flushMicrotasks();
    }));

    it('should return the default profile image path when in emulator mode', fakeAsync(() => {
      let defaultUrlWebp = urlInterpolationService.getStaticImageUrl(
        AppConstants.DEFAULT_PROFILE_IMAGE_WEBP_PATH
      );
      let defaultUrlPng = urlInterpolationService.getStaticImageUrl(
        AppConstants.DEFAULT_PROFILE_IMAGE_PNG_PATH
      );
      let [profileImagePng, profileImageWebp] =
        userService.getProfileImageDataUrl('tester');
      let prformanceTime = profileImagePng.split('?')[1];
      expect(profileImagePng).toEqual(defaultUrlPng + '?' + prformanceTime);
      expect(profileImageWebp).toEqual(defaultUrlWebp + '?' + prformanceTime);

      flushMicrotasks();
    }));

    it('should return the login url', fakeAsync(() => {
      const loginUrl = '/login';
      const currentUrl = 'home';

      userService.getLoginUrlAsync().then(dataUrl => {
        expect(dataUrl).toBe(loginUrl);
      });
      const req = httpTestingController.expectOne(
        '/url_handler?current_url=' + currentUrl
      );
      expect(req.request.method).toEqual('GET');
      req.flush({login_url: loginUrl});

      flushMicrotasks();
    }));

    it('should return the login url with the correct return url', fakeAsync(() => {
      const loginUrl = '/login';
      const returnUrl = 'home';

      userService.setReturnUrl(returnUrl);
      userService.getLoginUrlAsync().then(function (dataUrl) {
        expect(dataUrl).toBe(loginUrl);
      });
      const req = httpTestingController.expectOne(
        '/url_handler?current_url=' + returnUrl
      );
      expect(req.request.method).toEqual('GET');
      req.flush({login_url: loginUrl});

      flushMicrotasks();
    }));

    it('should set a profile image data url', fakeAsync(() => {
      const newProfileImageDataurl = '/avatar/x.png';
      userService.setProfileImageDataUrlAsync(newProfileImageDataurl);
      const req = httpTestingController.expectOne('/preferenceshandler/data');
      expect(req.request.method).toEqual('PUT');
      req.flush({profile_picture_data_url: newProfileImageDataurl});

      flushMicrotasks();
    }));

    it('should handle when set profile image data url is reject', fakeAsync(() => {
      const newProfileImageDataurl = '/avatar/x.png';
      const errorMessage = "It's not possible to set a new profile image data";
      userService.setProfileImageDataUrlAsync(newProfileImageDataurl);
      const req = httpTestingController.expectOne('/preferenceshandler/data');
      expect(req.request.method).toEqual('PUT');
      req.flush(errorMessage);

      flushMicrotasks();
    }));

    it('should return user contribution rights data', fakeAsync(() => {
      const sampleUserContributionRightsDict = {
        translation: ['hi'],
        voiceover: [],
        question: true,
      };

      userService
        .getUserContributionRightsDataAsync()
        .then(userContributionRights => {
          expect(userContributionRights).toEqual(
            sampleUserContributionRightsDict
          );
        });
      const req = httpTestingController.expectOne(
        '/usercontributionrightsdatahandler'
      );
      expect(req.request.method).toEqual('GET');
      req.flush(sampleUserContributionRightsDict);

      flushMicrotasks();
    }));

    it('should not fetch user contribution rights if it is was fetched before', fakeAsync(() => {
      const sampleUserContributionRightsDict = {
        translation: ['hi'],
        voiceover: [],
        question: true,
      };

      userService
        .getUserContributionRightsDataAsync()
        .then(userContributionRights => {
          expect(userContributionRights).toEqual(
            sampleUserContributionRightsDict
          );
          // Fetch userCommunityRightsInfo again.
          userService
            .getUserContributionRightsDataAsync()
            .then(sameUserContributionRights => {
              expect(sameUserContributionRights).toEqual(
                sampleUserContributionRightsDict
              );
            });
        });
      const req = httpTestingController.expectOne(
        '/usercontributionrightsdatahandler'
      );
      expect(req.request.method).toEqual('GET');
      req.flush(sampleUserContributionRightsDict);

      flushMicrotasks();
    }));

    it('should get user preferred dashboard', fakeAsync(() => {
      let defaultDashboard = 'learner';
      spyOn(userBackendApiService, 'getPreferencesAsync').and.returnValue(
        Promise.resolve({
          default_dashboard: defaultDashboard,
        } as PreferencesBackendDict)
      );
      userService.getUserPreferredDashboardAsync().then(preferredDashboard => {
        expect(preferredDashboard).toEqual(defaultDashboard);
      });
      tick();
    }));

    it('should get whether the user can access topics and skills dashboard', fakeAsync(() => {
      const userInfo = UserInfo.createFromBackendDict({
        roles: ['USER_ROLE'],
        is_moderator: true,
        is_curriculum_admin: true,
        is_super_admin: true,
        is_topic_manager: false,
        can_create_collections: true,
        preferred_site_language_code: 'en',
        username: 'tester',
        email: 'tester@example.org',
        user_is_logged_in: true,
      });
      spyOn(userService, 'getUserInfoAsync').and.returnValue(
        Promise.resolve(userInfo)
      );

      userService
        .canUserAccessTopicsAndSkillsDashboard()
        .then(canUserAccessTopicsAndSkillsDashboard => {
          expect(canUserAccessTopicsAndSkillsDashboard).toBeTrue();
        });
    }));

    it('should get whether the user can edit blog posts if user is blog admin', fakeAsync(() => {
      const userInfo = UserInfo.createFromBackendDict({
        roles: ['USER_ROLE', 'BLOG_ADMIN'],
        is_moderator: true,
        is_curriculum_admin: true,
        is_super_admin: true,
        is_topic_manager: false,
        can_create_collections: true,
        preferred_site_language_code: 'en',
        username: 'tester',
        email: 'tester@example.org',
        user_is_logged_in: true,
      });
      spyOn(userService, 'getUserInfoAsync').and.returnValue(
        Promise.resolve(userInfo)
      );

      userService.canUserEditBlogPosts().then(val => {
        expect(val).toBeTrue();
      });
    }));
  });

  describe('on production mode', () => {
    let httpTestingController: HttpTestingController;
    let userService: UserService;

    beforeEach(() => {
      spyOnProperty(
        AssetsBackendApiService,
        'EMULATOR_MODE',
        'get'
      ).and.returnValue(false);
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [AssetsBackendApiService],
      });
      userService = TestBed.inject(UserService);
      httpTestingController = TestBed.inject(HttpTestingController);
    });

    it('should return image path when in production mode', fakeAsync(() => {
      let expectedPngImage =
        'https://storage.googleapis.com/app_default_bucket/user/' +
        'tester/assets/profile_picture.png';
      let expectedWebpImage =
        'https://storage.googleapis.com/app_default_bucket/user/' +
        'tester/assets/profile_picture.webp';
      let [profileImagePng, profileImageWebp] =
        userService.getProfileImageDataUrl('tester');
      let prformanceTime = profileImagePng.split('?')[1];
      expect(profileImagePng).toEqual(expectedPngImage + '?' + prformanceTime);
      expect(profileImageWebp).toEqual(
        expectedWebpImage + '?' + prformanceTime
      );

      flushMicrotasks();
    }));

    afterEach(() => {
      httpTestingController.verify();
    });
  });
});
