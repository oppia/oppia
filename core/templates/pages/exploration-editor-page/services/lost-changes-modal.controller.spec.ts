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
 * @fileoverview Unit tests for LostChangesModalController.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

import { LostChangeObjectFactory } from
  'domain/exploration/LostChangeObjectFactory';
import { UtilsService } from 'services/utils.service';

describe('Lost Changes Modal Controller', () => {
  let $scope = null;
  let $uibModalInstance = null;
  let $log = null;
  let logSpy = null;
  let LocalStorageService = null;
  const explorationId = '0';
  const lostChanges = [{
    cmd: 'add_state',
    state_name: 'State name',
  }];

  beforeEach(angular.mock.module('oppia', ($provide) => {
    const ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.module('oppia', ($provide) => {
    $provide.value('LostChangeObjectFactory', (
      new LostChangeObjectFactory(new UtilsService)));
  }));
  beforeEach(angular.mock.inject(($injector, $controller) => {
    $log = $injector.get('$log');
    LocalStorageService = $injector.get('LocalStorageService');

    logSpy = spyOn($log, 'error').and.callThrough();

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    const $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $controller(
      'LostChangesModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance,
        explorationId: explorationId,
        lostChanges: lostChanges
      });
  }));

  it('should evaluates lostChanges when controller is initialized',
    () => {
      expect($scope.lostChanges[0].cmd).toBe('add_state');
      expect($scope.lostChanges[0].stateName).toBe('State name');
      expect(logSpy).toHaveBeenCalledWith(
        'Lost changes: ' + JSON.stringify(lostChanges));
    });

  it('should remove exploration draft from local storage when modal is closed',
    () => {
      LocalStorageService.saveExplorationDraft(explorationId, [], 1);
      $scope.close();
      expect(LocalStorageService.getExplorationDraft(explorationId)).toBeNull();
      expect($uibModalInstance.dismiss).toHaveBeenCalledWith('cancel');
    });
});
