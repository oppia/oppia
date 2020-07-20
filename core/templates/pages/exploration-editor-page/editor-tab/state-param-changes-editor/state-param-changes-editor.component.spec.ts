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
 * @fileoverview Unit tests for stateParamChangesEditor component.
 */

import { TestBed } from '@angular/core/testing';
import { StateParamChangesService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-param-changes.service';

require(
  'pages/exploration-editor-page/editor-tab/state-param-changes-editor/' +
  'state-param-changes-editor.component.ts');

describe('State Param Changes Editor directive', function() {
  var $scope = null;
  var stateParamChangesService = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(function() {
    stateParamChangesService = TestBed.get(StateParamChangesService);
  });

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    var $rootScope = $injector.get('$rootScope');

    $scope = $rootScope.$new();
    $componentController('stateParamChangesEditor', {
      $scope: $scope,
      StateParamChangesService: stateParamChangesService
    });
  }));

  it('should evaluate controller properties', function() {
    expect($scope.StateParamChangesService).toEqual(stateParamChangesService);
  });
});
