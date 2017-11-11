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
 * @fileoverview Tests the embed exploration modal.
 */

 describe('Exploration Embed Button Service', function () {
  var ExplorationEmbedButtonService, ModalInstance;

  beforeEach(module('oppia'));
  beforeEach(inject(function($injector, _$controller_) {
    ExplorationEmbedButtonService = $injector.get('ExplorationEmbedButtonService');
    ModalInstance = ExplorationEmbedButtonService.showModal(12345);

    $controller = _$controller_;

    var mockExplorationId = function () {
      return 12345;

    serviceController = $controller('ModalInstance.controller',
      {$scope:$scope, $modalInstance: $modalInstance,
        $window: $window, explorationId: mockExplorationId});
    }
  }));

  it('should return true for backdrop', function(){
    expect(ModalInstance.backdrop).toBe(true);
  });

  it('should return correct explorationId', function(){
    expect(ModalInstance.resolve.explorationId()).toBe(12345);
  });

  it('should return correct templateUrl', function(){
    expect(ModalInstance.templateUrl).toBe('core/templates/dev/head/components/embed_modal/embed_exploration_modal_directive.html');
  });

 });
