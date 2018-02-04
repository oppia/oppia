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
 * @fileoverview Unit tests for generic services.
 */

describe('Constants Generating', function() {
  beforeEach(module('oppia'));

  var $injector = null;
  beforeEach(inject(function(_$injector_) {
    $injector = _$injector_.get('$injector');
  }));

  it('should transform all key value pairs to angular constants', function() {
    for (var constantName in constants) {
      expect($injector.has(constantName)).toBe(true);
      expect($injector.get(constantName)).toBe(constants[constantName]);
    }
  });
});
