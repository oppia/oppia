// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the Hint Manager service.
 */

describe('Hint manager service', function() {
  beforeEach(module('oppia'));

  var hms;
  beforeEach(inject(function($injector) {
    hms = $injector.get('HintManagerService');
  }));

  it('should consume hints correctly', function() {
    hms.reset([{
      hintText: 'one'
    }, {
      hintText: 'two'
    }, {
      hintText: 'three'
    }]);

    hms.consumeHint();
    hms.consumeHint();
    var currentHint = hms.consumeHint();

    expect(currentHint).toBe('three');

    expect(hms.areAllHintsExhausted()).toBe(true);
  });

  it('should be displayed correctly', function() {
    hms.reset([{
      hintText: 'one'
    }, {
      hintText: 'two'
    }, {
      hintText: 'three'
    }]);

    expect(hms.isCurrentHintAvailable()).toBe(false);
    hms.consumeHint();
    expect(hms.isCurrentHintAvailable()).toBe(false);
    hms.makeCurrentHintAvailable();
    expect(hms.isCurrentHintAvailable()).toBe(true);
  });
});
