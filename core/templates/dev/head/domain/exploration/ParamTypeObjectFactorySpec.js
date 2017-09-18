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
 * @fileoverview Description of this file.
 */

describe('ParamType objects', function() {
  var ParamTypeObjectFactory = null;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    ParamTypeObjectFactory = $injector.get('ParamTypeObjectFactory');
  }));

  it('should use UnicodeString as default type', inject(function($injector) {
    expect(ParamTypeObjectFactory.getDefaultType())
      .toBe(ParamTypeObjectFactory.registry.UnicodeString);
  }));

  describe('UnicodeString', function() {
    var UnicodeString = null;

    beforeEach(inject(function($injector) {
      UnicodeString = ParamTypeObjectFactory.registry.UnicodeString;
    }));

    it('should give an empty string by default', inject(function($injector) {
      expect(UnicodeString.createDefaultValue()).toEqual('');
    }));

    it('should be named correctly', inject(function($injector) {
      expect(UnicodeString.getName()).toEqual('UnicodeString');
    }));

    it('should be able to tell whether or not values are strings',
        inject(function($injector) {
          expect(UnicodeString.validateValue('abc')).toBeTruthy();
          expect(UnicodeString.validateValue(3)).toBeFalsy();
          expect(UnicodeString.validateValue([1,2])).toBeFalsy();
        }));
  });
});
