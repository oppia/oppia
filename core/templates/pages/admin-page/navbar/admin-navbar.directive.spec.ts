// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for admin navbar component.
 */

import { importAllAngularServices } from 'tests/unit-test-utils';

describe('Admin Navbar component', () => {
  var $rootScope = null;
  var ctrl = null;
  var $scope = null;
  var $q = null;
  var UserService = null;
  var AdminRouterService = null;
  var userProfileImage = 'profile-data-url';
  var userInfo = {
    isModerator: () => true,
    getUsername: () => 'username1',
    isSuperAdmin: () => true
  };
  var imagePath = '/path/to/image.png';
  var profileUrl = '/profile/username1';

  importAllAngularServices();

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector, $componentController) {
    UserService = $injector.get('UserService');
    AdminRouterService = $injector.get('AdminRouterService');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $q = $injector.get('$q');
    ctrl = $componentController('adminNavbar', {
      $scope: $scope
    });
  }));

  beforeEach(() => {
    spyOn(UserService, 'getProfileImageDataUrlAsync')
      .and.returnValue($q.resolve(userProfileImage));
    spyOn(UserService, 'getUserInfoAsync').and.returnValue(
      $q.resolve(userInfo));
    ctrl.$onInit();
    $rootScope.$apply();
  });

  it('should initialize component properties correctly', () => {
    expect(ctrl.profilePictureDataUrl).toBe(userProfileImage);
    expect(ctrl.getStaticImageUrl(imagePath)).toBe(
      '/assets/images/path/to/image.png');
    expect(ctrl.username).toBe('username1');
    expect(ctrl.isModerator).toBe(true);
    expect(ctrl.isSuperAdmin).toBe(true);
    expect(ctrl.profileUrl).toEqual(profileUrl);
    expect(ctrl.logoutUrl).toEqual('/logout');
    expect(ctrl.profileDropdownIsActive).toBe(false);
    expect(ctrl.dropdownMenuisActive).toBe(false);
  });

  it('should be routed to the activities tab by default', () => {
    expect(ctrl.isActivitiesTabOpen()).toBe(true);
    expect(ctrl.isConfigTabOpen()).toBe(false);
    expect(ctrl.isFeaturesTabOpen()).toBe(false);
    expect(ctrl.isRolesTabOpen()).toBe(false);
    expect(ctrl.isJobsTabOpen()).toBe(false);
    expect(ctrl.isMiscTabOpen()).toBe(false);
  });

  it('should be routed to the config tab', () => {
    expect(ctrl.isActivitiesTabOpen()).toBe(true);
    expect(ctrl.isConfigTabOpen()).toBe(false);
    expect(ctrl.isFeaturesTabOpen()).toBe(false);
    expect(ctrl.isRolesTabOpen()).toBe(false);
    expect(ctrl.isJobsTabOpen()).toBe(false);
    expect(ctrl.isMiscTabOpen()).toBe(false);

    AdminRouterService.showTab('#config');

    expect(ctrl.isActivitiesTabOpen()).toBe(false);
    expect(ctrl.isConfigTabOpen()).toBe(true);
    expect(ctrl.isFeaturesTabOpen()).toBe(false);
    expect(ctrl.isRolesTabOpen()).toBe(false);
    expect(ctrl.isJobsTabOpen()).toBe(false);
    expect(ctrl.isMiscTabOpen()).toBe(false);
  });

  it('should be routed to the features tab', () => {
    expect(ctrl.isActivitiesTabOpen()).toBe(true);
    expect(ctrl.isConfigTabOpen()).toBe(false);
    expect(ctrl.isFeaturesTabOpen()).toBe(false);
    expect(ctrl.isRolesTabOpen()).toBe(false);
    expect(ctrl.isJobsTabOpen()).toBe(false);
    expect(ctrl.isMiscTabOpen()).toBe(false);

    AdminRouterService.showTab('#features');

    expect(ctrl.isActivitiesTabOpen()).toBe(false);
    expect(ctrl.isConfigTabOpen()).toBe(false);
    expect(ctrl.isFeaturesTabOpen()).toBe(true);
    expect(ctrl.isRolesTabOpen()).toBe(false);
    expect(ctrl.isJobsTabOpen()).toBe(false);
    expect(ctrl.isMiscTabOpen()).toBe(false);
  });

  it('should be routed to the roles tab', () => {
    expect(ctrl.isActivitiesTabOpen()).toBe(true);
    expect(ctrl.isConfigTabOpen()).toBe(false);
    expect(ctrl.isFeaturesTabOpen()).toBe(false);
    expect(ctrl.isRolesTabOpen()).toBe(false);
    expect(ctrl.isJobsTabOpen()).toBe(false);
    expect(ctrl.isMiscTabOpen()).toBe(false);

    AdminRouterService.showTab('#roles');

    expect(ctrl.isActivitiesTabOpen()).toBe(false);
    expect(ctrl.isConfigTabOpen()).toBe(false);
    expect(ctrl.isFeaturesTabOpen()).toBe(false);
    expect(ctrl.isRolesTabOpen()).toBe(true);
    expect(ctrl.isJobsTabOpen()).toBe(false);
    expect(ctrl.isMiscTabOpen()).toBe(false);
  });

  it('should be routed to the jobs tab', () => {
    expect(ctrl.isActivitiesTabOpen()).toBe(true);
    expect(ctrl.isConfigTabOpen()).toBe(false);
    expect(ctrl.isFeaturesTabOpen()).toBe(false);
    expect(ctrl.isRolesTabOpen()).toBe(false);
    expect(ctrl.isJobsTabOpen()).toBe(false);
    expect(ctrl.isMiscTabOpen()).toBe(false);

    AdminRouterService.showTab('#jobs');

    expect(ctrl.isActivitiesTabOpen()).toBe(false);
    expect(ctrl.isConfigTabOpen()).toBe(false);
    expect(ctrl.isFeaturesTabOpen()).toBe(false);
    expect(ctrl.isRolesTabOpen()).toBe(false);
    expect(ctrl.isJobsTabOpen()).toBe(true);
    expect(ctrl.isMiscTabOpen()).toBe(false);
  });

  it('should be routed to the misc tab', () => {
    expect(ctrl.isActivitiesTabOpen()).toBe(true);
    expect(ctrl.isConfigTabOpen()).toBe(false);
    expect(ctrl.isFeaturesTabOpen()).toBe(false);
    expect(ctrl.isRolesTabOpen()).toBe(false);
    expect(ctrl.isJobsTabOpen()).toBe(false);
    expect(ctrl.isMiscTabOpen()).toBe(false);

    AdminRouterService.showTab('#misc');

    expect(ctrl.isActivitiesTabOpen()).toBe(false);
    expect(ctrl.isConfigTabOpen()).toBe(false);
    expect(ctrl.isFeaturesTabOpen()).toBe(false);
    expect(ctrl.isRolesTabOpen()).toBe(false);
    expect(ctrl.isJobsTabOpen()).toBe(false);
    expect(ctrl.isMiscTabOpen()).toBe(true);
  });

  it('should set profileDropdownIsActive to true', () => {
    expect(ctrl.profileDropdownIsActive).toBe(false);

    ctrl.activateProfileDropdown();

    expect(ctrl.profileDropdownIsActive).toBe(true);
  });

  it('should set profileDropdownIsActive to false', () => {
    ctrl.profileDropdownIsActive = true;

    expect(ctrl.profileDropdownIsActive).toBe(true);

    ctrl.deactivateProfileDropdown();

    expect(ctrl.profileDropdownIsActive).toBe(false);
  });

  it('should set dropdownMenuisActive to true', () => {
    expect(ctrl.dropdownMenuisActive).toBe(false);

    ctrl.activateDropdownMenu();

    expect(ctrl.dropdownMenuisActive).toBe(true);
  });

  it('should set dropdownMenuisActive to false', () => {
    ctrl.dropdownMenuisActive = true;

    expect(ctrl.dropdownMenuisActive).toBe(true);

    ctrl.deactivateDropdownMenu();

    expect(ctrl.dropdownMenuisActive).toBe(false);
  });
});
