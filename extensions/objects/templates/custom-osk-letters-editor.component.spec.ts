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
 * @fileoverview Unit tests for the custom OSK letters component.
 */

fdescribe('OnScreenKeyboard', function() {
  let ctrl = null, $window = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $window = $injector.get('$window');
    ctrl = $componentController('customOskLettersEditor');
    ctrl.$onInit();
    ctrl.value = [];
  }));

  it('should update letters list', function() {
    expect(ctrl.value).toEqual([]);
    expect(ctrl.getRemainingLettersCount()).toBe(10);
    ctrl.updateLettersList('z');
    expect(ctrl.value).toEqual(['z']);
    expect(ctrl.getRemainingLettersCount()).toBe(9);
    ctrl.updateLettersList('alpha');
    expect(ctrl.value).toEqual(['z', 'alpha']);
    expect(ctrl.getRemainingLettersCount()).toBe(8);
    ctrl.updateLettersList('z');
    expect(ctrl.value).toEqual(['alpha']);
    expect(ctrl.getRemainingLettersCount()).toBe(9);
    ctrl.updateLettersList('alpha');
    expect(ctrl.value).toEqual([]);
    expect(ctrl.getRemainingLettersCount()).toBe(10);
  });

  it('should correctly identify keyboard events', function() {
    ctrl.lettersAreLowercase = true;
    ctrl.keyDownCallBack({key: 'Shift'});
    expect(ctrl.lettersAreLowercase).toBeFalse();
    ctrl.keyUpCallBack({key: 'Shift'});
    expect(ctrl.lettersAreLowercase).toBeTrue();

    ctrl.value = ['x'];
    ctrl.keyDownCallBack({key: 'Backspace'});
    expect(ctrl.value.length).toBe(0);
    ctrl.keyDownCallBack({key: 'x'});
  });
});
