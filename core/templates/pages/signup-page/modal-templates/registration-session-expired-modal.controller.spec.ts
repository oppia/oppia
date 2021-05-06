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
 * @fileoverview Unit tests for RegistrationSessionExpiredModalController.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { UserService } from 'services/user.service';

describe('Registration Session Expired Modal Controller', function() {
  var $q = null;
  var $scope = null;
  var $timeout = null;
  var $uibModalInstance = null;
  var userService: UserService = null;
  var mockWindow = {
    location: {
      reload: () => {}
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
  });
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('UserService', TestBed.get(UserService));
  }));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('$window', mockWindow);
  }));
  beforeEach(angular.mock.inject(function($injector, $controller) {
    $q = $injector.get('$q');
    var $rootScope = $injector.get('$rootScope');
    $timeout = $injector.get('$timeout');
    userService = $injector.get('UserService');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    $scope = $rootScope.$new();
    $controller('RegistrationSessionExpiredModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
    });
  }));

  afterEach(function() {
    mockWindow = {
      location: {
        reload: () => {}
      }
    };
  });

  it('should continue registration', function() {
    spyOn(userService, 'getLoginUrlAsync').and.returnValue(
      $q.resolve('login-url'));
    $scope.continueRegistration();
    $scope.$apply();

    expect($uibModalInstance.dismiss).toHaveBeenCalledWith('cancel');
    $timeout.flush(150);
    expect(mockWindow.location).toBe('login-url');
  });

  it('should not continue registration', function() {
    spyOn(mockWindow.location, 'reload').and.callThrough();
    spyOn(userService, 'getLoginUrlAsync').and.returnValue(
      $q.resolve(''));
    $scope.continueRegistration();
    $scope.$apply();

    expect($uibModalInstance.dismiss).toHaveBeenCalledWith('cancel');
    expect(mockWindow.location.reload).toHaveBeenCalled();
  });
});
