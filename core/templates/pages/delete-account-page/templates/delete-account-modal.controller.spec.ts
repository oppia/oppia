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
 * @fileoverview Unit tests for the delete account modal.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { UserService } from 'services/user.service';

describe('Delete account modal', function() {
  beforeEach(angular.mock.module('oppia'));
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
  });
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('UserService', TestBed.get(UserService));
  }));

  var $q = null;
  var $scope = null;
  var $uibModalInstance = null;
  var userService = null;

  beforeEach(angular.mock.inject(function($injector, $controller) {
    var $rootScope = $injector.get('$rootScope');

    $q = $injector.get('$q');
    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);
    $scope = $rootScope.$new();
    userService = $injector.get('UserService');
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      $q.resolve({
        getUsername: () => 'username'
      })
    );

    $controller('DeleteAccountModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
    });
    $scope.$apply();
  }));

  it('should check if the username is valid', function() {
    expect($scope.isValid()).toBeFalse();

    $scope.username = 'differentUsername';
    expect($scope.isValid()).toBeFalse();

    $scope.username = 'username';
    expect($scope.isValid()).toBeTrue();
  });
});
