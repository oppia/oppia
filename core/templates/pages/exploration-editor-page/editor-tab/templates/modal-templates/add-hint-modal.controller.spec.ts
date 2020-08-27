// Copyright 2020 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for AddHintModalController.
 */

import { TestBed } from '@angular/core/testing';
import { HintObjectFactory } from 'domain/exploration/HintObjectFactory';
import { StateHintsService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-hints.service';
import { GenerateContentIdService } from 'services/generate-content-id.service';

describe('Add Hint Modal Controller', function() {
  var $scope = null;
  var $uibModalInstance = null;
  var ContextService = null;
  var generateContentIdService = null;
  var hintObjectFactory = null;
  var stateHintsService = null;

  var existingHintsContentIds = [];

  beforeEach(angular.mock.module('oppia'));

  beforeEach(function() {
    generateContentIdService = TestBed.get(GenerateContentIdService);
    hintObjectFactory = TestBed.get(HintObjectFactory);
    stateHintsService = TestBed.get(StateHintsService);
  });

  beforeEach(angular.mock.inject(function($injector, $controller) {
    var $rootScope = $injector.get('$rootScope');
    ContextService = $injector.get('ContextService');
    spyOn(ContextService, 'getEntityType').and.returnValue('question');

    stateHintsService.init('State1', new Array(4));

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    $scope = $rootScope.$new();
    $controller('AddHintModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
      GenerateContentIdService: generateContentIdService,
      HintObjectFactory: hintObjectFactory,
      StateHintsService: stateHintsService,
      existingHintsContentIds: existingHintsContentIds
    });
  }));

  it('should initialize $scope properties after controller is initialized',
    function() {
      expect($scope.tmpHint).toBe('');
      expect($scope.addHintForm).toEqual({});
      expect($scope.hintIndex).toBe(5);
    });

  it('should save hint when closing the modal', function() {
    var contentId = 'cont_1';
    var hintExpected = hintObjectFactory.createNew(contentId, '');

    spyOn(
      generateContentIdService, 'getNextStateId'
    ).and.returnValue(contentId);
    $scope.saveHint();

    expect($uibModalInstance.close).toHaveBeenCalledWith({
      hint: hintExpected,
      contentId: contentId
    });
  });
});
