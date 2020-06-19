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
 * @fileoverview Unit tests for delete account page.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// App.ts is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

describe('Delete account page', function() {
  var $scope = null;
  var ctrl = null;
  var $uibModal = null;
  var $uibModalInstance;
  var $q = null;
  var $httpBackend = null;
  var windowMock = {
    location: ''
  };

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('$window', windowMock);
  }));

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    var $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $uibModal = $injector.get('$uibModal');
    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);
    $q = $injector.get('$q');
    $httpBackend = $injector.get('$httpBackend');

    ctrl = $componentController('deleteAccountPage', {
      $scope: $scope,
      $uibModalInstance
    });
  }));

  afterEach(function() {
    windowMock.location = '';
  });

  it('should delete account when closing the modal', function() {
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.resolve()
    });

    $httpBackend.expectDELETE('/delete-account-handler').respond(null);
    ctrl.deleteAccount();
    $httpBackend.flush();

    expect(windowMock.location).toMatch('pending-account-deletion');
  });

  it('should not delete account when dismissing the modal', function() {
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.reject()
    });

    ctrl.deleteAccount();
    expect(windowMock.location).toBe('');
  });
});
