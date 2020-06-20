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
  }
  class mockGuppyConfigurationService {
    static init(): void {}
  }

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('GuppyConfigurationService', mockGuppyConfigurationService);
  }));
  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $window = $injector.get('$window');
    MathEditorCtrl = $componentController('mathEditor');
    $window.Guppy = MockGuppy;

    MathEditorCtrl.$onInit();
  }));

  it('should assign a random id to the guppy divs', function() {
    var mockDocument = document.createElement('div');
    mockDocument.setAttribute('class', 'guppy-div');
    angular.element(document).find('body').append(mockDocument.outerHTML);

    MathEditorCtrl.$onInit();

    var guppyDivs = document.querySelectorAll('.guppy-div');
    for (var i = 0; i < guppyDivs.length; i++) {
      expect(guppyDivs[i].getAttribute('id')).toMatch(/guppy_[0-9]{1,8}/);
    }
  });
});
