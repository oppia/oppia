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

describe('Version Mismatch Modal Controller', function() {
  var $scope = null;
  var $log = null;
  var logSpy = null;
  var $timeout = null;
  var windowRef = new WindowRef();
  var mockExplorationData = {
    discardDraft: function(callback) {
      callback();
    }
  };
  var lostChanges = [{
    cmd: 'add_state',
    state_name: 'State name',
  }];

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('ExplorationDataService', mockExplorationData);
    $provide.value('LostChangeObjectFactory', (
      new LostChangeObjectFactory(new UtilsService)));
    $provide.value('WindowRef', windowRef);
  }));
  beforeEach(angular.mock.inject(function($injector, $controller) {
    $log = $injector.get('$log');
    $timeout = $injector.get('$timeout');

    logSpy = spyOn($log, 'error').and.callThrough();

    var $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $controller(
      'VersionMismatchModalController', {
        $scope: $scope,
        lostChanges: lostChanges
      });
  }));

  it('should evaluates lostChanges when controller is initialized',
    function() {
      expect($scope.lostChanges[0].cmd).toBe('add_state');
      expect($scope.lostChanges[0].stateName).toBe('State name');
      expect(logSpy).toHaveBeenCalledWith(
        'Lost changes: ' + JSON.stringify(lostChanges));
    });

  it('should remove exploration draft from local storage when modal is closed',
    function() {
      var reloadSpy = jasmine.createSpy('reload');
      spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
        location: {
          reload: reloadSpy
        }
      });
      var discardDraftSpy = spyOn(mockExplorationData, 'discardDraft').and
        .callThrough();

      $scope.discardChanges();
      expect(discardDraftSpy).toHaveBeenCalled();

      $timeout.flush(20);
      expect(reloadSpy).toHaveBeenCalled();
    });
});
