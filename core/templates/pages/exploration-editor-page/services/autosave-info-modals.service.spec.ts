// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for AutosaveInfoModalsService.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// RteHelperService.ts is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

describe('AutosaveInfoModalsService', function() {
  var AutosaveInfoModalsService = null;
  var $uibModal = null;
  var $q = null;
  var $rootScope = null;
  var explorationId = '0';
  var lostChanges = [];

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.inject(function($injector) {
    AutosaveInfoModalsService = $injector.get('AutosaveInfoModalsService');
    $uibModal = $injector.get('$uibModal');
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
  }));

  it('should call $uibModal open when opening non strict validation fail' +
    ' modal', function() {
    var modalOpenSpy = spyOn($uibModal, 'open').and.callThrough();
    AutosaveInfoModalsService.showNonStrictValidationFailModal();
    expect(modalOpenSpy).toHaveBeenCalled();
  });

  it('should close non strict validation fail modal with no errors',
    function() {
      AutosaveInfoModalsService.isModalOpen(false);
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve()
      });
      AutosaveInfoModalsService.showNonStrictValidationFailModal();
      AutosaveInfoModalsService.isModalOpen(true);
      $rootScope.$apply();

      AutosaveInfoModalsService.isModalOpen(false);
    });

  it('should handle rejects when closing non strict validation fail modal',
    function() {
      AutosaveInfoModalsService.isModalOpen(false);
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.reject()
      });
      AutosaveInfoModalsService.showNonStrictValidationFailModal();
      AutosaveInfoModalsService.isModalOpen(true);
      $rootScope.$apply();

      AutosaveInfoModalsService.isModalOpen(false);
    });

  it('should call $uibModal open when opening version mismatch' +
    ' modal', function() {
    var modalOpenSpy = spyOn($uibModal, 'open').and.callThrough();
    AutosaveInfoModalsService.showVersionMismatchModal(lostChanges);
    expect(modalOpenSpy).toHaveBeenCalled();
  });

  it('should close version mismatch modal with no errors', function() {
    AutosaveInfoModalsService.isModalOpen(false);
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.resolve()
    });
    AutosaveInfoModalsService.showVersionMismatchModal(lostChanges);
    AutosaveInfoModalsService.isModalOpen(true);
    $rootScope.$apply();

    AutosaveInfoModalsService.isModalOpen(false);
  });

  it('should handle rejects when closing version mismatch modal and throw' +
    ' error', function() {
    AutosaveInfoModalsService.isModalOpen(false);
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.reject()
    });
    AutosaveInfoModalsService.showVersionMismatchModal(lostChanges);
    AutosaveInfoModalsService.isModalOpen(true);
    $rootScope.$apply();

    AutosaveInfoModalsService.isModalOpen(false);
  });

  it('should call $uibModal open when opening show lost changes modal',
    function() {
      var modalOpenSpy = spyOn($uibModal, 'open').and.callThrough();
      AutosaveInfoModalsService.showLostChangesModal(
        lostChanges, explorationId);
      expect(modalOpenSpy).toHaveBeenCalled();
    });

  it('should close show lost changes modal with no errors', function() {
    AutosaveInfoModalsService.isModalOpen(false);
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.resolve()
    });
    AutosaveInfoModalsService.showLostChangesModal(lostChanges, explorationId);
    AutosaveInfoModalsService.isModalOpen(true);
    $rootScope.$apply();

    AutosaveInfoModalsService.isModalOpen(false);
  });

  it('should handler reject when closing show lost changes modal throw' +
    ' error', function() {
    AutosaveInfoModalsService.isModalOpen(false);
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.reject()
    });
    AutosaveInfoModalsService.showLostChangesModal(lostChanges, explorationId);
    AutosaveInfoModalsService.isModalOpen(true);
    $rootScope.$apply();

    AutosaveInfoModalsService.isModalOpen(false);
  });
});
