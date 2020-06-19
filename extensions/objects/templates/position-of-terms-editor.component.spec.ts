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
 * @fileoverview Unit tests for the position of terms component.
 */

describe('PositionOfTerms', function() {
  var PositionOfTermsCtrl = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($componentController) {
    PositionOfTermsCtrl = $componentController('positionOfTermsEditor');
    PositionOfTermsCtrl.$onInit();
  }));

  it('should have the correct default value of position', function() {
    expect(PositionOfTermsCtrl.localValue.name).toBe('both');
  });

  it('should change ctrl.value when ctrl.localValue changes', function() {
    // Initially, the default value of localValue is assigned.
    PositionOfTermsCtrl.onChangePosition();
    expect(PositionOfTermsCtrl.value).toBe('both');

    // Changing localValue should change ctrl.value
    PositionOfTermsCtrl.localValue = PositionOfTermsCtrl.positionOfTerms[0];
    PositionOfTermsCtrl.onChangePosition();
    expect(PositionOfTermsCtrl.value).toBe('lhs');
  });
});
