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
 * @fileoverview Unit tests for profile page component.
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

// TODO(#7222): Remove the following block of unnecessary imports once
// thread-data.service.ts is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
import { ProfilePageBackendApiService } from
  './profile-page-backend-api.service';
import { OppiaAngularRootComponent } from
  'components/oppia-angular-root.component';
import { RatingComputationService } from
  'components/ratings/rating-computation/rating-computation.service';

require('pages/profile-page/profile-page.component.ts');

describe('Profile page', function() {
  var $scope = null;
  var ctrl = null;
  var $q = null;
  var UserService = null;
  var CsrfTokenService = null;
  var DateTimeFormatService = null;
  var UserProfileObjectFactory = null;
  var $log = null;
  var windowRefMock = {
    nativeWindow: {
      location: {
        href: '',
        reload: function() {}
      }
    }
  };

  beforeEach(angular.mock.module('oppia', $provide => {
    let ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('UrlService', {
      getUsernameFromProfileUrl: () => 'username1'
    });
    $provide.value('WindowRef', windowRefMock);
  }));

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProfilePageBackendApiService]
    });
    OppiaAngularRootComponent.profilePageBackendApiService = (
      TestBed.get(ProfilePageBackendApiService)
    );
    OppiaAngularRootComponent.ratingComputationService = (
      TestBed.get(RatingComputationService));
  });

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $q = $injector.get('$q');
    UserService = $injector.get('UserService');
    CsrfTokenService = $injector.get('CsrfTokenService');
    DateTimeFormatService = $injector.get('DateTimeFormatService');
    UserProfileObjectFactory = $injector.get('UserProfileObjectFactory');
    $log = $injector.get('$log');

    spyOn(CsrfTokenService, 'getTokenAsync')
      .and.returnValue($q.resolve('sample-csrf-token'));

    var $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    ctrl = $componentController('profilePage', {
      $scope: $scope
    });
  }));

  afterEach(function() {
    windowRefMock.nativeWindow.location.href = '';
  });

  it('should formatted date string from the timestamp in milliseconds',
    function() {
      // This corresponds to Fri, 21 Nov 2014 09:45:00 GMT.
      var NOW_MILLIS = 1416563100000;
      spyOn(DateTimeFormatService, 'getLocaleDateString').withArgs(NOW_MILLIS)
        .and.returnValue('11/21/2014');
      expect(ctrl.getLocaleDateString(NOW_MILLIS)).toBe('11/21/2014');
    });

  describe('when user has edited explorations', function() {
    var profileData = {
      username: '',
      username_of_viewed_profile: 'username1',
      user_bio: 'User bio',
      user_impact_score: 100,
      profile_is_of_current_user: false,
      is_user_visiting_own_profile: false,
      created_exp_summary_dicts: [{
        last_updated_msec: 1591296737470.528,
        community_owned: false,
        objective: 'Test Objective',
        id: '44LKoKLlIbGe',
        num_views: 0,
        thumbnail_icon_url: '/subjects/Algebra.svg',
        human_readable_contributors_summary: {},
        language_code: 'en',
        thumbnail_bg_color: '#cd672b',
        created_on_msec: 1591296635736.666,
        ratings: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0
        },
        status: 'public',
        tags: [],
        activity_type: 'exploration',
        category: 'Algebra',
        title: 'Test Title'
      }],
      is_already_subscribed: false,
      first_contribution_msec: null,
      edited_exp_summary_dicts: [{
        last_updated_msec: 1591296737470.528,
        community_owned: false,
        objective: 'Test Objective',
        id: '44LKoKLlIbGe',
        num_views: 0,
        thumbnail_icon_url: '/subjects/Algebra.svg',
        human_readable_contributors_summary: {},
        language_code: 'en',
        thumbnail_bg_color: '#cd672b',
        created_on_msec: 1591296635736.666,
        ratings: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0
        },
        status: 'public',
        tags: [],
        activity_type: 'exploration',
        category: 'Algebra',
        title: 'Test Title'
      }],
      subject_interests: [],
      profile_picture_data_url: 'image',
    };

    beforeEach(function() {
      spyOn(OppiaAngularRootComponent.profilePageBackendApiService,
        'fetchProfileData').and.returnValue($q.resolve(
        UserProfileObjectFactory.createFromBackendDict(profileData)));
      ctrl.$onInit();
      $scope.$apply();
    });

    it('should get explorations to display when edited explorations are empty',
      function() {
        var userProfile = UserProfileObjectFactory.createFromBackendDict(
          profileData);
        expect(ctrl.getExplorationsToDisplay()).toEqual(
          userProfile.editedExpSummaries);
      });
  });

  describe('when changing pages', function() {
    var profileData = {
      username: '',
      username_of_viewed_profile: 'username1',
      user_bio: 'User bio',
      user_impact_score: 100,
      created_exp_summary_dicts: new Array(7).fill({
        last_updated_msec: 1591296737470.528,
        community_owned: false,
        objective: 'Test Objective',
        id: '44LKoKLlIbGe',
        num_views: 10,
        thumbnail_icon_url: '/subjects/Algebra.svg',
        human_readable_contributors_summary: {},
        language_code: 'en',
        thumbnail_bg_color: '#cd672b',
        created_on_msec: 1591296635736.666,
        ratings: {
          1: 0,
          2: 0,
          3: 1,
          4: 0,
          5: 0
        },
        status: 'public',
        tags: [],
        activity_type: 'exploration',
        category: 'Algebra',
        title: 'Test Title'
      }),
      edited_exp_summary_dicts: []
    };

    beforeEach(function() {
      for (let i = 0; i < 11; i++) {
        profileData.edited_exp_summary_dicts.push({
          last_updated_msec: 1591296737470.528,
          community_owned: false,
          objective: 'Test Objective',
          id: '44LKoKLlIbGe',
          num_views: 10,
          thumbnail_icon_url: '/subjects/Algebra.svg',
          human_readable_contributors_summary: {},
          language_code: 'en',
          thumbnail_bg_color: '#cd672b',
          created_on_msec: 1591296635736.666,
          ratings: {
            1: 0,
            2: 0,
            3: 1,
            4: 0,
            5: 0
          },
          status: 'public',
          tags: [],
          activity_type: 'exploration',
          category: 'Algebra',
          title: 'Test Title'
        });
      }

      profileData.edited_exp_summary_dicts[7].ratings = {
        1: 1,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      };
      profileData.edited_exp_summary_dicts[8].ratings = {
        1: 0,
        2: 0,
        3: 0,
        4: 1,
        5: 0
      };
      profileData.edited_exp_summary_dicts[9].num_views = 5;
      profileData.edited_exp_summary_dicts[10].num_views = 15;

      spyOn(OppiaAngularRootComponent.profilePageBackendApiService,
        'fetchProfileData').and.returnValue($q.resolve(
        UserProfileObjectFactory.createFromBackendDict(profileData)));
      ctrl.$onInit();
      $scope.$apply();
    });

    it('should go back and forth between pages', function() {
      expect(ctrl.currentPageNumber).toBe(0);
      ctrl.goToNextPage();

      expect(ctrl.currentPageNumber).toBe(1);
      expect(ctrl.startingExplorationNumber).toBe(7);
      expect(ctrl.endingExplorationNumber).toBe(11);

      spyOn($log, 'error').and.callThrough();
      ctrl.goToNextPage();

      expect($log.error).toHaveBeenCalledWith('Error: Cannot increment page');

      ctrl.goToPreviousPage();

      expect(ctrl.currentPageNumber).toBe(0);
      expect(ctrl.startingExplorationNumber).toBe(1);
      expect(ctrl.endingExplorationNumber).toBe(6);

      ctrl.goToPreviousPage();

      expect(ctrl.currentPageNumber).toBe(0);
      expect($log.error).toHaveBeenCalledWith('Error: cannot decrement page');
    });
  });

  describe('when user is not logged in', function() {
    var profileData = {
      username: '',
      username_of_viewed_profile: 'username1',
      user_bio: 'User bio',
      user_impact_score: 100,
      created_exp_summary_dicts: [],
      edited_exp_summary_dicts: []
    };

    beforeEach(function() {
      spyOn(OppiaAngularRootComponent.profilePageBackendApiService,
        'fetchProfileData').and.returnValue($q.resolve(
        UserProfileObjectFactory.createFromBackendDict(profileData)));
      ctrl.$onInit();
      $scope.$apply();
    });

    it('should not change subscription status and change to login page',
      function() {
        var loginUrl = 'login-url';
        spyOn(UserService, 'getLoginUrlAsync').and.returnValue(
          $q.resolve(loginUrl));

        ctrl.changeSubscriptionStatus();
        $scope.$apply();

        expect(windowRefMock.nativeWindow.location.href).toBe(loginUrl);
      });

    it('should not change subscription status and reload the page when login' +
      ' page is not provided', function() {
      spyOn(windowRefMock.nativeWindow.location, 'reload').and.callThrough();
      spyOn(UserService, 'getLoginUrlAsync').and.returnValue(
        $q.resolve(null));

      ctrl.changeSubscriptionStatus();
      $scope.$apply();

      expect(windowRefMock.nativeWindow.location.reload).toHaveBeenCalled();
    });

    it('should update subscription button text to warn user to log in',
      function() {
        ctrl.updateSubscriptionButtonPopoverText();
        expect(ctrl.subscriptionButtonPopoverText).toBe(
          'Log in or sign up to subscribe to your favorite creators.');
      });

    it('should get explorations to display when edited explorations are empty',
      function() {
        expect(ctrl.getExplorationsToDisplay()).toEqual([]);
      });
  });

  describe('when user is logged in', function() {
    var profileData = {
      username: 'username1',
      username_of_viewed_profile: 'username1',
      user_bio: 'User bio',
      user_impact_score: 100,
      created_exp_summary_dicts: [],
      edited_exp_summary_dicts: [],
      is_already_subscribed: false
    };

    beforeEach(function() {
      spyOn(OppiaAngularRootComponent.profilePageBackendApiService,
        'fetchProfileData').and.returnValue($q.resolve(
        UserProfileObjectFactory.createFromBackendDict(profileData)));
      ctrl.$onInit();
      $scope.$apply();
    });

    it('should subscribe and unsubscribe from a profile', function() {
      expect(ctrl.isAlreadySubscribed).toBe(false);
      spyOn(OppiaAngularRootComponent.profilePageBackendApiService,
        'subscribe').and.returnValue($q.resolve());
      ctrl.changeSubscriptionStatus();
      $scope.$apply();

      expect(ctrl.isAlreadySubscribed).toBe(true);
      expect(ctrl.subscriptionButtonPopoverText).toBe(
        'Unsubscribe to stop receiving email notifications regarding new' +
        ' explorations published by ' + profileData.username_of_viewed_profile +
        '.');

      spyOn(OppiaAngularRootComponent.profilePageBackendApiService,
        'unsubscribe').and.returnValue($q.resolve());
      ctrl.changeSubscriptionStatus();
      $scope.$apply();

      expect(ctrl.isAlreadySubscribed).toBe(false);
      expect(ctrl.subscriptionButtonPopoverText).toBe(
        'Receive email notifications, whenever ' +
        profileData.username_of_viewed_profile +
        ' publishes a new exploration.');
    });
  });
});
