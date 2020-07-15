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

// // TODO(#7222): Remove the following block of unnnecessary imports once
// // UserService.ts is upgraded to Angular 8.
// import { UserInfoObjectFactory } from 'domain/user/UserInfoObjectFactory';
// import { UpgradedServices } from 'services/UpgradedServices';
// // ^^^ This block is to be removed.

// require('domain/utilities/url-interpolation.service.ts');
// require('services/user.service.ts');

// describe('User Service', function() {
//   var UserService, $httpBackend, UrlInterpolationService;
//   var userInfoObjectFactory;
//   var CsrfService = null;
//   var UrlService = null;

//   beforeEach(angular.mock.module('oppia'));
//   beforeEach(angular.mock.module('oppia', function($provide) {
//     $provide.value('UserInfoObjectFactory', new UserInfoObjectFactory());
//     $provide.value('$window', {
//       location: {
//         pathname: 'home'
//       }
//     });
//   }));
//   beforeEach(angular.mock.module('oppia', function($provide) {
//     var ugs = new UpgradedServices();
//     for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
//       $provide.value(key, value);
//     }
//   }));

//   beforeEach(angular.mock.inject(function($injector, $q) {
//     UserService = $injector.get('UserService');
//     UrlInterpolationService = $injector.get(
//       'UrlInterpolationService');
//     UrlService = $injector.get(
//       'UrlService');
//     // The injector is required because this service is directly used in this
//     // spec, therefore even though UserInfoObjectFactory is upgraded to
//     // Angular, it cannot be used just by instantiating it by its class but
//     // instead needs to be injected. Note that 'userInfoObjectFactory' is
//     // the injected service instance whereas 'UserInfoObjectFactory' is the
//     // service class itself. Therefore, use the instance instead of the class in
//     // the specs.
//     userInfoObjectFactory = $injector.get(
//       'UserInfoObjectFactory');
//     $httpBackend = $injector.get('$httpBackend');

//     CsrfService = $injector.get('CsrfTokenService');

//     spyOn(CsrfService, 'getTokenAsync').and.callFake(function() {
//       var deferred = $q.defer();
//       deferred.resolve('sample-csrf-token');
//       return deferred.promise;
//     });
//   }));

//   afterEach(function() {
//     $httpBackend.verifyNoOutstandingExpectation();
//     $httpBackend.verifyNoOutstandingRequest();
//   });

//   it('should return userInfo data', function() {
//     // Creating a test user for checking profile picture of user.
//     var sampleUserInfoBackendObject = {
//       is_moderator: false,
//       is_admin: false,
//       is_super_admin: false,
//       is_topic_manager: false,
//       can_create_collections: true,
//       preferred_site_language_code: null,
//       username: 'tester',
//       user_is_logged_in: true
//     };
//     $httpBackend.expect('GET', '/userinfohandler').respond(
//       200, sampleUserInfoBackendObject);
//     var sampleUserInfo = userInfoObjectFactory.createFromBackendDict(
//       sampleUserInfoBackendObject);

//     UserService.getUserInfoAsync().then(function(userInfo) {
//       expect(userInfo.isAdmin()).toBe(sampleUserInfo.isAdmin());
//       expect(userInfo.isSuperAdmin()).toBe(sampleUserInfo.isSuperAdmin());
//       expect(userInfo.isModerator()).toBe(sampleUserInfo.isModerator());
//       expect(userInfo.isTopicManager()).toBe(sampleUserInfo.isTopicManager());
//       expect(userInfo.isLoggedIn()).toBe(
//         sampleUserInfo.isLoggedIn());
//       expect(userInfo.canCreateCollections()).toBe(
//         sampleUserInfo.canCreateCollections());
//       expect(userInfo.getUsername()).toBe(sampleUserInfo.getUsername());
//       expect(userInfo.getPreferredSiteLanguageCode()).toBe(
//         sampleUserInfo.getPreferredSiteLanguageCode());
//     });

//     $httpBackend.flush();
//   });

//   it('should return new userInfo data when url path is signup', function() {
//     spyOn(UrlService, 'getPathname').and.returnValue('/signup');
//     var sampleUserInfo = userInfoObjectFactory.createDefault();

//     UserService.getUserInfoAsync().then(function(userInfo) {
//       expect(userInfo).toEqual(sampleUserInfo);
//     });
//   });

//   it('should not fetch userInfo if it is was fetched before', function() {
//     var sampleUserInfoBackendObject = {
//       is_moderator: false,
//       is_admin: false,
//       is_super_admin: false,
//       is_topic_manager: false,
//       can_create_collections: true,
//       preferred_site_language_code: null,
//       username: 'tester',
//       user_is_logged_in: true
//     };
//     $httpBackend.expect('GET', '/userinfohandler').respond(
//       200, sampleUserInfoBackendObject);
//     var sampleUserInfo = userInfoObjectFactory.createFromBackendDict(
//       sampleUserInfoBackendObject);

//     UserService.getUserInfoAsync().then(function(userInfo) {
//       expect(userInfo).toEqual(sampleUserInfo);
//       // Fetch userInfo again.
//       UserService.getUserInfoAsync().then(function(sameUserInfo) {
//         expect(sameUserInfo).toEqual(userInfo);
//       });
//     });
//     $httpBackend.flush(1);
//   });

//   it('should return new userInfo data if user is not logged', function() {
//     var sampleUserInfoBackendObject = {
//       is_moderator: false,
//       is_admin: false,
//       is_super_admin: false,
//       is_topic_manager: false,
//       can_create_collections: true,
//       preferred_site_language_code: null,
//       username: 'tester',
//       user_is_logged_in: false
//     };
//     $httpBackend.expect('GET', '/userinfohandler').respond(
//       200, sampleUserInfoBackendObject);
//     var sampleUserInfo = userInfoObjectFactory.createDefault();

//     UserService.getUserInfoAsync().then(function(userInfo) {
//       expect(userInfo).toEqual(sampleUserInfo);
//     });
//     $httpBackend.flush();
//   });

//   it('should return image data', function() {
//     var requestUrl = '/preferenceshandler/profile_picture';
//     // Create a test user for checking profile picture of user.
//     var sampleUserInfoBackendObject = {
//       is_moderator: false,
//       is_admin: false,
//       is_super_admin: false,
//       is_topic_manager: false,
//       can_create_collections: true,
//       preferred_site_language_code: null,
//       username: 'tester',
//       user_is_logged_in: true
//     };
//     $httpBackend.expect('GET', '/userinfohandler').respond(
//       200, sampleUserInfoBackendObject);
//     $httpBackend.expect('GET', requestUrl).respond(
//       200, {profile_picture_data_url: 'image data'});

//     UserService.getProfileImageDataUrlAsync().then(function(dataUrl) {
//       expect(dataUrl).toBe('image data');
//     });
//     $httpBackend.flush();

//     $httpBackend.when('GET', '/userinfohandler').respond(
//       200, sampleUserInfoBackendObject);
//     $httpBackend.when('GET', requestUrl).respond(404);

//     UserService.getProfileImageDataUrlAsync().then(function(dataUrl) {
//       expect(dataUrl).toBe(UrlInterpolationService.getStaticImageUrl(
//         '/avatar/user_blue_72px.webp'));
//     });
//     $httpBackend.flush();
//   });

//   it('should return the default profile image path when user is not logged',
//     function() {
//       var sampleUserInfoBackendObject = {
//         is_moderator: false,
//         is_admin: false,
//         is_super_admin: false,
//         is_topic_manager: false,
//         can_create_collections: true,
//         preferred_site_language_code: null,
//         username: 'tester',
//         user_is_logged_in: false
//       };
//       $httpBackend.expect('GET', '/userinfohandler').respond(
//         200, sampleUserInfoBackendObject);

//       UserService.getProfileImageDataUrlAsync().then(function(dataUrl) {
//         expect(dataUrl).toBe(UrlInterpolationService.getStaticImageUrl(
//           '/avatar/user_blue_72px.webp'));
//       });
//       $httpBackend.flush();
//     });

//   it('should return the login url', function() {
//     var loginUrl = '/login';
//     var currentUrl = 'home';
//     $httpBackend.expect('GET', '/url_handler?current_url=' + currentUrl)
//       .respond({login_url: loginUrl});

//     UserService.getLoginUrlAsync().then(function(dataUrl) {
//       expect(dataUrl).toBe(loginUrl);
//     });
//     $httpBackend.flush();
//   });

//   it('should set a profile image data url', function() {
//     var newProfileImageDataurl = '/avatar/x.png';
//     $httpBackend.expect('PUT', '/preferenceshandler/data')
//       .respond({profile_picture_data_url: newProfileImageDataurl});

//     UserService.setProfileImageDataUrlAsync(newProfileImageDataurl).then(
//       function(response) {
//         expect(response.data.profile_picture_data_url).toBe(
//           newProfileImageDataurl);
//       }
//     );
//     $httpBackend.flush();
//   });

//   it('should handle when set profile image data url is reject', function() {
//     var newProfileImageDataurl = '/avatar/x.png';
//     var errorMessage = 'It\'s not possible to set a new profile image data';
//     $httpBackend.expect('PUT', '/preferenceshandler/data')
//       .respond(500, errorMessage);

//     UserService.setProfileImageDataUrlAsync(newProfileImageDataurl)
//       /* eslint-disable dot-notation */
//       .catch(function(error) {
//       /* eslint-enable dot-notation */
//         expect(error.data).toEqual(errorMessage);
//       });
//     $httpBackend.flush();
//   });

//   it('should return user community rights data', function() {
//     var sampleUserCommunityRightsDict = {
//       translation: ['hi'],
//       voiceover: [],
//       question: true
//     };
//     $httpBackend.expect('GET', '/usercommunityrightsdatahandler').respond(
//       200, sampleUserCommunityRightsDict);

//     UserService.getUserCommunityRightsData().then(function(
//         userCommunityRights) {
//       expect(userCommunityRights).toEqual(sampleUserCommunityRightsDict);
//     });
//     $httpBackend.flush();
//   });

//   it('should not fetch userCommunityRights if it is was fetched before',
//     function() {
//       var sampleUserCommunityRightsDict = {
//         translation: ['hi'],
//         voiceover: [],
//         question: true
//       };
//       $httpBackend.expect('GET', '/usercommunityrightsdatahandler').respond(
//         200, sampleUserCommunityRightsDict);

//       UserService.getUserCommunityRightsData().then(
//         function(userCommunityRights) {
//           expect(userCommunityRights).toEqual(sampleUserCommunityRightsDict);
//           // Fetch userCommunityRightsInfo again.
//           UserService.getUserCommunityRightsData().then(function(
//               sameUserCommunityRights) {
//             expect(sameUserCommunityRights).toEqual(
//               sampleUserCommunityRightsDict);
//           });
//         });
//       $httpBackend.flush(1);
//     });
// });
import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { UserService } from 'services/user.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { UserInfoObjectFactory } from 'domain/user/UserInfoObjectFactory';
import { UrlService } from './contextual/url.service';

describe('User Service', () => {
  let userService, urlInterpolationService, userInfoObjectFactory = null;
  let csrfService = null;
  let urlService = null;
  var httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    httpTestingController = TestBed.get(HttpTestingController);
    userService = TestBed.get(UserService);
    urlInterpolationService = TestBed.get(UrlInterpolationService);
    userInfoObjectFactory = TestBed.get(UserInfoObjectFactory);
    urlService = TestBed.get(UrlService);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should return userInfo data', fakeAsync(() => {
    // creating a test user for checking profile picture of user.
    var sampleUserInfoBackendObject = {
      is_moderator: false,
      is_admin: false,
      is_super_admin: false,
      is_topic_manager: false,
      can_create_collections: true,
      preferred_site_language_code: null,
      username: 'tester',
      user_is_logged_in: true
    };
    var sampleUserInfo = userInfoObjectFactory.createFromBackendDict(
      sampleUserInfoBackendObject);

    userService.getUserInfoAsync().then((userInfo) => {
      expect(userInfo.isAdmin()).toBe(sampleUserInfo.isAdmin());
      expect(userInfo.isSuperAdmin()).toBe(sampleUserInfo.isSuperAdmin());
      expect(userInfo.isModerator()).toBe(sampleUserInfo.isModerator());
      expect(userInfo.isTopicManager()).toBe(sampleUserInfo.isTopicManager());
      expect(userInfo.isLoggedIn()).toBe(
        sampleUserInfo.isLoggedIn());
      expect(userInfo.canCreateCollections()).toBe(
        sampleUserInfo.canCreateCollections());
      expect(userInfo.getUsername()).toBe(sampleUserInfo.getUsername());
      expect(userInfo.getPreferredSiteLanguageCode()).toBe(
        sampleUserInfo.getPreferredSiteLanguageCode());
    });
    var req = httpTestingController.expectOne('/userinfohandler');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleUserInfo);

    flushMicrotasks();
  }));

  it('should return new userInfo data when url path is signup', fakeAsync(() => {
    spyOn(urlService, 'getPathname').and.returnValue('/signup');
    var sampleUserInfo = userInfoObjectFactory.createDefault();

    userService.getUserInfoAsync().then((userInfo) => {
      expect(userInfo).toEqual(sampleUserInfo);
    });
    //need to add anything here?
  }));

  it('should not fetch userInfo if it is was fetched before', fakeAsync(() => {
    var sampleUserInfoBackendObject = {
      is_moderator: false,
      is_admin: false,
      is_super_admin: false,
      is_topic_manager: false,
      can_create_collections: true,
      preferred_site_language_code: null,
      username: 'tester',
      user_is_logged_in: true
    };
    var sampleUserInfo = userInfoObjectFactory.createFromBackendDict(
      sampleUserInfoBackendObject);

    userService.getUserInfoAsync().then((userInfo) => {
      expect(userInfo).toEqual(sampleUserInfo);
      // Fetch userInfo again
      userService.getUserInfoAsync().then((sameUserInfo) => {
        expect(sameUserInfo).toEqual(userInfo);
      });
    });
    var req = httpTestingController.expectOne('/userinfohandler');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleUserInfoBackendObject);

    flushMicrotasks();
  }));

  it('should return new userInfo data if user is not logged', fakeAsync(() => {
    var sampleUserInfoBackendObject = {
      is_moderator: false,
      is_admin: false,
      is_super_admin: false,
      is_topic_manager: false,
      can_create_collections: true,
      preferred_site_language_code: null,
      username: 'tester',
      user_is_logged_in: false
    };
    var sampleUserInfo = userInfoObjectFactory.createDefault();

    userService.getUserInfoAsync().then((userInfo) => {
      expect(userInfo).toEqual(sampleUserInfo);
    });
    var req = httpTestingController.expectOne('/userinfohandler');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleUserInfoBackendObject);

    flushMicrotasks();
  }));

  it('should return image data', fakeAsync(() => {
    var requestUrl = '/preferenceshandler/profile_picture';
    // Create a test user for checking profile picture of user.
    var sampleUserInfoBackendObject = {
      is_moderator: false,
      is_admin: false,
      is_super_admin: false,
      is_topic_manager: false,
      can_create_collections: true,
      preferred_site_language_code: null,
      username: 'tester',
      user_is_logged_in: true
    };

    userService.getProfileImageDataUrlAsync().then((dataUrl) => {
      expect(dataUrl).toBe('image data');
    });

    //???
    var req = httpTestingController.expectOne('/userinfohandler');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleUserInfoBackendObject);

    req = httpTestingController.expectOne(requestUrl);
    expect(req.request.method).toEqual('GET');
    req.flush({profile_picture_data_url: 'image data'});
    //
    flushMicrotasks();

    userService.getProfileImageDataUrlAsync().then((dataUrl) => {
      expect(dataUrl).toBe(urlInterpolationService.getStaticImageUrl(
        '/avatar/user_blue_72px.png'));
    });
    //???
    req = httpTestingController.expectOne('/userinfohandler');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleUserInfoBackendObject);
    
    req = httpTestingController.expectOne(requestUrl);
    expect(req.request.method).toEqual('GET');
    req.flush(404);
    //
    flushMicrotasks();
  }));

  it('should return the default profile image path when user is not logged',
    fakeAsync(() => {
      var sampleUserInfoBackendObject = {
        is_moderator: false,
        is_admin: false,
        is_super_admin: false,
        is_topic_manager: false,
        can_create_collections: true,
        preferred_site_language_code: null,
        username: 'tester',
        user_is_logged_in: false
      };

      userService.getProfileImageDataUrlAsync().then((dataUrl) => {
        expect(dataUrl).toBe(urlInterpolationService.getStaticImageUrl(
          '/avatar/user_blue_72px.png'));
      });
      var req = httpTestingController.expectOne('/userinfohandler');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleUserInfoBackendObject);

      flushMicrotasks()
    }));

  it('should return the login url', fakeAsync(() => {
    var loginUrl = '/login';
    var currentUrl = 'home';

    userService.getLoginUrlAsync().then((dataUrl) => {
      expect(dataUrl).toBe(loginUrl);
    });
    var req = httpTestingController.expectOne('/url_handler?current_url=' + currentUrl);
    expect(req.request.method).toEqual('GET');
    req.flush({login_url: loginUrl});

    flushMicrotasks()
  }));

  it('should set a profile image data url', fakeAsync(() => {
    var newProfileImageDataurl = '/avatar/x.png';
    //need to check this
    userService.setProfileImageDataUrlAsync(newProfileImageDataurl).then(
      (response) => {
        expect(response.data.profile_picture_data_url).toBe(
          newProfileImageDataurl);
      }
    );
    var req = httpTestingController.expectOne('/preferenceshandler/data');
    expect(req.request.method).toEqual('PUT');
    req.flush({profile_picture_data_url: newProfileImageDataurl});

    flushMicrotasks();
  }));

  it('should handle when set profile image data url is reject', fakeAsync(() => {
    var newProfileImageDataurl = '/avatar/x.png';
    var errorMessage = 'It\'s not possible to set a new profile image data';
    //check this too
    userService.setProfileImageDataUrlAsync(newProfileImageDataurl)
      /* eslint-disable dot-notation */
      .catch((error) => {
      /* eslint-enable dot-notation */
        expect(error.data).toEqual(errorMessage);
      });
    var req = httpTestingController.expectOne('/preferenceshandler/data');
    expect(req.request.method).toEqual('PUT');
    req.flush(errorMessage);

    flushMicrotasks();
  }));

  it('should return user community rights data', fakeAsync(() => {
    var sampleUserCommunityRightsDict = {
      translation: ['hi'],
      voiceover: [],
      question: true
    };

    userService.getUserCommunityRightsData().then((
        userCommunityRights) => {
      expect(userCommunityRights).toEqual(sampleUserCommunityRightsDict);
    });
    var req = httpTestingController.expectOne('/usercommunityrightsdatahandler');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleUserCommunityRightsDict);

    flushMicrotasks();
  }));

  it('should not fetch userCommunityRights if it is was fetched before',
    fakeAsync(() => {
      var sampleUserCommunityRightsDict = {
        translation: ['hi'],
        voiceover: [],
        question: true
      };

      userService.getUserCommunityRightsData().then(
        (userCommunityRights) => {
          expect(userCommunityRights).toEqual(sampleUserCommunityRightsDict);
          // Fetch userCommunityRightsInfo again.
          userService.getUserCommunityRightsData().then((
              sameUserCommunityRights) => {
            expect(sameUserCommunityRights).toEqual(
              sampleUserCommunityRightsDict);
          });
        });
      var req = httpTestingController.expectOne('/usercommunityrightsdatahandler');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleUserCommunityRightsDict);
  
      flushMicrotasks();
    }));
});