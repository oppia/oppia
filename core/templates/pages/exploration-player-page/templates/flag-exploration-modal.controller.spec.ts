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
 * @fileoverview Unit tests for FlagExplorationModalController.
 */

import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ANGULAR_SERVICES, ANGULAR_SERVICES_NAMES } from
  'tests/angular-services.index';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PlayerPositionService } from '../services/player-position.service';
import { DeviceInfoService } from 'services/contextual/device-info.service';
import { IdGenerationService } from 'services/id-generation.service';

describe('Flag Exploration Modal Controller', function() {
  var $scope = null;
  var $uibModalInstance = null;
  var ContextService = null;
  var FocusManagerService = null;
  var playerPositionService = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
  });

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    for (let i in ANGULAR_SERVICES) {
      $provide.value(ANGULAR_SERVICES_NAMES[i],
        TestBed.get(ANGULAR_SERVICES[i]));
    }
  }));
  beforeEach(angular.mock.inject(function($injector, $controller) {
    var $rootScope = $injector.get('$rootScope');
    ContextService = $injector.get('ContextService');
    spyOn(ContextService, 'getExplorationId').and.returnValue('exp1');
    FocusManagerService = $injector.get('FocusManagerService');
    playerPositionService = $injector.get('PlayerPositionService');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    spyOn(playerPositionService, 'getCurrentStateName').and.returnValue(
      'Introduction');

    $scope = $rootScope.$new();
    $controller('FlagExplorationModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance
    });
  }));

  it('should show flag message text area when value is truthy', function() {
    expect($scope.flagMessageTextareaIsShown).toBe(false);

    spyOn(FocusManagerService, 'setFocus');
    $scope.showFlagMessageTextarea('text');

    expect($scope.flagMessageTextareaIsShown).toBe(true);
    expect(FocusManagerService.setFocus).toHaveBeenCalledWith(
      'flagMessageTextarea');
  });

  it('should not show flag message text area when value is falsy', function() {
    expect($scope.flagMessageTextareaIsShown).toBe(false);

    spyOn(FocusManagerService, 'setFocus');
    $scope.showFlagMessageTextarea('');

    expect($scope.flagMessageTextareaIsShown).toBe(false);
    expect(FocusManagerService.setFocus).not.toHaveBeenCalled();
  });

  it('should submit report when flag message is truthy', function() {
    var flagMessage = 'text';
    $scope.flagMessage = flagMessage;
    $scope.showFlagMessageTextarea(flagMessage);
    $scope.submitReport();

    expect($scope.flagMessageTextareaIsShown).toBe(true);
    expect($uibModalInstance.close).toHaveBeenCalled();

    // Resetting $scope.flagMessage value in order to not affect other specs.
    $scope.flagMessage = null;
  });

  it('should not submit report when flag message is falsy', function() {
    var flagMessage = '';
    $scope.flagMessage = flagMessage;
    $scope.showFlagMessageTextarea(flagMessage);
    $scope.submitReport();

    expect($scope.flagMessageTextareaIsShown).toBe(false);
    expect($uibModalInstance.close).not.toHaveBeenCalled();
  });
});
