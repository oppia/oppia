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
 * @fileoverview Unit tests for AutosaveInfoModalsService.
 */

import { LocalStorageService } from 'services/local-storage.service';
import { TestBed } from '@angular/core/testing';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { importAllAngularServices } from 'tests/unit-test-utils';

describe('AutosaveInfoModalsService', () => {
  let AutosaveInfoModalsService = null;
  let $uibModal = null;
  let $q = null;
  let $rootScope = null;
  const explorationId = '0';
  const lostChanges = [];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LocalStorageService,
        UrlInterpolationService
      ]
    });
  });

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();
  beforeEach(angular.mock.inject(($injector) => {
    AutosaveInfoModalsService = $injector.get('AutosaveInfoModalsService');
    $uibModal = $injector.get('$uibModal');
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
  }));

  it('should call $uibModal open when opening non strict validation fail' +
    ' modal', () => {
    const modalOpenSpy = spyOn($uibModal, 'open').and.callThrough();
    AutosaveInfoModalsService.showNonStrictValidationFailModal();
    expect(modalOpenSpy).toHaveBeenCalled();
  });

  it('should close non strict validation fail modal successfully',
    () => {
      expect(AutosaveInfoModalsService.isModalOpen()).toBe(false);
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve()
      });
      AutosaveInfoModalsService.showNonStrictValidationFailModal();
      expect(AutosaveInfoModalsService.isModalOpen()).toBe(true);
      $rootScope.$apply();

      expect(AutosaveInfoModalsService.isModalOpen()).toBe(false);
    });

  it('should handle rejects when closing non strict validation fail modal',
    () => {
      expect(AutosaveInfoModalsService.isModalOpen()).toBe(false);
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.reject()
      });
      AutosaveInfoModalsService.showNonStrictValidationFailModal();
      expect(AutosaveInfoModalsService.isModalOpen()).toBe(true);
      $rootScope.$apply();

      expect(AutosaveInfoModalsService.isModalOpen()).toBe(false);
    });

  it('should call $uibModal open when opening version mismatch' +
    ' modal', () => {
    const modalOpenSpy = spyOn($uibModal, 'open').and.callThrough();
    AutosaveInfoModalsService.showVersionMismatchModal(lostChanges);
    expect(modalOpenSpy).toHaveBeenCalled();
  });

  it('should close version mismatch modal successfully', () => {
    expect(AutosaveInfoModalsService.isModalOpen()).toBe(false);
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.resolve()
    });
    AutosaveInfoModalsService.showVersionMismatchModal(lostChanges);
    expect(AutosaveInfoModalsService.isModalOpen()).toBe(true);
    $rootScope.$apply();

    expect(AutosaveInfoModalsService.isModalOpen()).toBe(false);
  });

  it('should handle rejects when dismissing save version mismatch modal',
    () => {
      expect(AutosaveInfoModalsService.isModalOpen()).toBe(false);
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.reject()
      });
      AutosaveInfoModalsService.showVersionMismatchModal(lostChanges);
      expect(AutosaveInfoModalsService.isModalOpen()).toBe(true);
      $rootScope.$apply();

      expect(AutosaveInfoModalsService.isModalOpen()).toBe(false);
    });

  it('should call $uibModal open when opening show lost changes modal',
    () => {
      const modalOpenSpy = spyOn($uibModal, 'open').and.callThrough();
      AutosaveInfoModalsService.showLostChangesModal(
        lostChanges, explorationId);
      expect(modalOpenSpy).toHaveBeenCalled();
    });

  it('should close show lost changes modal successfully', () => {
    expect(AutosaveInfoModalsService.isModalOpen()).toBe(false);
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.resolve()
    });
    AutosaveInfoModalsService.showLostChangesModal(lostChanges, explorationId);
    expect(AutosaveInfoModalsService.isModalOpen()).toBe(true);
    $rootScope.$apply();

    expect(AutosaveInfoModalsService.isModalOpen()).toBe(false);
  });

  it('should handle reject when dismissing show lost changes modal', () => {
    expect(AutosaveInfoModalsService.isModalOpen()).toBe(false);
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.reject()
    });
    AutosaveInfoModalsService.showLostChangesModal(lostChanges, explorationId);
    expect(AutosaveInfoModalsService.isModalOpen()).toBe(true);
    $rootScope.$apply();

    expect(AutosaveInfoModalsService.isModalOpen()).toBe(false);
  });
});
