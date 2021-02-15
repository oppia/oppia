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
  var userProfileImage = 'profile-data-url';
  var userInfo = {
    isModerator: () => true,
    getUsername: () => 'username1',
    isSuperAdmin: () => true
  };

  importAllAngularServices();

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector, $componentController) {
    UserService = $injector.get('UserService');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $q = $injector.get('$q');
    ctrl = $componentController('adminNavbar', {
      scope: $scope
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

  it('should get data from backend', () => {
    var imagePath = '/path/to/image.png';

    expect(ctrl.isModerator).toBe(true);
    expect(ctrl.getStaticImageUrl(imagePath)).toBe(
      '/assets/images/path/to/image.png');
    expect(ctrl.username).toBe('username1');
    expect(ctrl.profilePictureDataUrl).toBe(userProfileImage);
  });

  it('should be routed to the activities tab', () => {
    ctrl.showTab();

    expect(ctrl.isActivitiesTabOpen()).toBe(true);
    expect(ctrl.isConfigTabOpen()).toBe(false);
    expect(ctrl.isFeaturesTabOpen()).toBe(false);
    expect(ctrl.isRolesTabOpen()).toBe(false);
    expect(ctrl.isJobsTabOpen()).toBe(false);
    expect(ctrl.isMiscTabOpen()).toBe(false);
  });

  it('should set profileDropdownIsActive to true', () => {
    ctrl.activateProfileDropdown();

    expect(ctrl.profileDropdownIsActive).toBe(true);
  });

  it('should set profileDropdownIsActive to false', () => {
    ctrl.deactivateProfileDropdown();

    expect(ctrl.profileDropdownIsActive).toBe(false);
  });

  it('should set dropdownMenuisActive to true', () => {
    ctrl.activateDropdownMenu();

    expect(ctrl.dropdownMenuisActive).toBe(true);
  });

  it('should set dropdownMenuisActive to false', () => {
    ctrl.deactivateDropdownMenu();

    expect(ctrl.dropdownMenuisActive).toBe(false);
  });
});
