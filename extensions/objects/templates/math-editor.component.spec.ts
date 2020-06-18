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
 * @fileoverview Unit tests for the math editor component.
 */

describe('MathEditor', function() {
  var MathEditorCtrl = null, $window = null;
  class MockGuppy {
    constructor(id: string, config: Object) {}

    event(name: string, handler: Function): void {
      handler();
    }
    asciimath(): string {
      return 'Dummy value';
    }
    render(): void {}
    configure(name: string, val: Object): void {}
    // eslint-disable-next-line camelcase
    static remove_global_symbol(symbol: string): void {}
  }

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $window = $injector.get('$window');
    MathEditorCtrl = $componentController('mathEditor');
    $window.Guppy = MockGuppy;

    MathEditorCtrl.$onInit();
  }));

  it('should assign random id to the guppy div', function() {
    var guppyDivId = MathEditorCtrl.assignIdToGuppyDiv();
    expect(guppyDivId).toMatch(/guppy_[0-9]{1,8}/);
  });
});
