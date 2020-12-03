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
 * @fileoverview Unit tests for testInteractionPanel.
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { StateEditorRefreshService } from
  'pages/exploration-editor-page/services/state-editor-refresh.service';
import { ReadOnlyExplorationBackendApiService } from
  'domain/exploration/read-only-exploration-backend-api.service';

describe('Test Interaction Panel directive', function() {
  var $scope = null;
  var $uibModalInstance = null;
  var CurrentInteractionService = null;
  var ExplorationStatesService = null;

  var stateName = 'Introduction';
  var state = {
    interaction: {
      id: 'NumberWithUnits'
    }
  };

  beforeEach(angular.mock.module('oppia'));

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
  });

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value(
      'StateEditorRefreshService', TestBed.get(StateEditorRefreshService));
    $provide.value(
      'ReadOnlyExplorationBackendApiService',
      TestBed.get(ReadOnlyExplorationBackendApiService));
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    var $rootScope = $injector.get('$rootScope');
    CurrentInteractionService = $injector.get('CurrentInteractionService');
    ExplorationStatesService = $injector.get('ExplorationStatesService');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    spyOn(ExplorationStatesService, 'getState').and.returnValue(state);
    spyOn(CurrentInteractionService, 'isSubmitButtonDisabled').and
      .returnValue(false);

    $scope = $rootScope.$new();
    var ctrl = $componentController('testInteractionPanel', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
    }, {
      getStateName: () => stateName
    });
    ctrl.$onInit();
  }));

  it('should initialize controller properties after its initialization',
    function() {
      expect($scope.isSubmitButtonDisabled()).toBe(false);
      expect($scope.interactionIsInline).toBe(true);
    });

  it('should submit answer when clicking on button', function() {
    spyOn(CurrentInteractionService, 'submitAnswer');
    $scope.onSubmitAnswerFromButton();

    expect(CurrentInteractionService.submitAnswer).toHaveBeenCalled();
  });
});
