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
 * @fileoverview Unit tests for VersionMismatchModalController.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

import { WindowRef } from 'services/contextual/window-ref.service';
import { LostChangeObjectFactory } from
  'domain/exploration/LostChangeObjectFactory';
import { UtilsService } from 'services/utils.service';

describe('Version Mismatch Modal Controller', () => {
  let $scope = null;
  let $log = null;
  let logSpy = null;
  let $timeout = null;
  const windowRef = new WindowRef();
  const mockExplorationData = {
    discardDraft: (callback) => callback()
  };
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
    $provide.value('ExplorationDataService', mockExplorationData);
    $provide.value('LostChangeObjectFactory', (
      new LostChangeObjectFactory(new UtilsService)));
    $provide.value('WindowRef', windowRef);
  }));
  beforeEach(angular.mock.inject(($injector, $controller) => {
    $log = $injector.get('$log');
    $timeout = $injector.get('$timeout');

    logSpy = spyOn($log, 'error').and.callThrough();

    const $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $controller(
      'VersionMismatchModalController', {
        $scope: $scope,
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
      const reloadSpy = jasmine.createSpy('reload');
      spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
        location: {
          reload: reloadSpy
        }
      });
      const discardDraftSpy = spyOn(mockExplorationData, 'discardDraft').and
        .callThrough();

      $scope.discardChanges();
      expect(discardDraftSpy).toHaveBeenCalled();

      $timeout.flush(20);
      expect(reloadSpy).toHaveBeenCalled();
    });
});
