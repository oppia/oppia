// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for Image Click Input rules.
 */

describe('Image Click Input rules service', function() {
  beforeEach(module('oppia'));

  var icirs = null;
  beforeEach(inject(function($injector) {
    icirs = $injector.get('ImageClickInputRulesService');
  }));

  it('should have a correct \'is in region\' rule', function() {
    expect(icirs.IsInRegion({
      clickPosition: [0.5, 0.5],
      clickedRegions: ['a', 'b', 'c']
    }, {
      x: 'b'
    })).toBe(true);
    expect(icirs.IsInRegion({
      clickPosition: [0.3, 1.0],
      clickedRegions: ['123']
    }, {
      x: '123'
    })).toBe(true);

    expect(icirs.IsInRegion({
      clickPosition: [1.0, 0.5],
      clickedRegions: ['a', 'b', 'c']
    }, {
      x: 'd'
    })).toBe(false);
    expect(icirs.IsInRegion({
      clickPosition: [0.5, 0.5],
      clickedRegions: []
    }, {
      x: 'a'
    })).toBe(false);
  });
});
