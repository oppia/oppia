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
 * @fileoverview Unit tests for loginRequiredMessage.
 */

describe('Login required message component', function() {
  var ctrl = null;
  var $flushPendingTasks = null;
  var $q = null;
  var $scope = null;
  var userService = null;

  var mockWindow = null;

  beforeEach(angular.mock.module('oppia', function($provide) {
    mockWindow = {
      location: {
        reload: jasmine.createSpy('reload', () => {})
      }
    };

    $provide.value('$window', mockWindow);
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $flushPendingTasks = $injector.get('$flushPendingTasks');
    var $rootScope = $injector.get('$rootScope');
    $q = $injector.get('$q');
    userService = $injector.get('UserService');

    $scope = $rootScope.$new();
    ctrl = $componentController('loginRequiredMessage');
    ctrl.$onInit();
  }));

  it('should initialize controller properties after its initialization',
    function() {
      expect(ctrl.OPPIA_AVATAR_IMAGE_URL).toBe(
        '/assets/images/avatar/oppia_avatar_100px.svg');
    });

  it('should go to login url when login button is clicked', function() {
    spyOn(userService, 'getLoginUrlAsync').and.returnValue(
      $q.resolve('login-url'));

    ctrl.onLoginButtonClicked();
    $scope.$apply();
    $flushPendingTasks();

    expect(mockWindow.location).toBe('login-url');
  });

  it('should refresh page if login url is not provided when login button is' +
    ' clicked', function() {
    spyOn(userService, 'getLoginUrlAsync').and.returnValue($q.resolve(null));

    ctrl.onLoginButtonClicked();
    $scope.$apply();

    expect(mockWindow.location.reload).toHaveBeenCalled();
  });
});
