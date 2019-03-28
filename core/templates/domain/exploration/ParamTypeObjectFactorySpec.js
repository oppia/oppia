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
  var ParamType = null;

  beforeEach(module('oppia'));
  beforeEach(inject(function($injector) {
    ParamType = $injector.get('ParamTypeObjectFactory');
  }));

  it('should have its registry frozen', function() {
    expect(Object.isFrozen(ParamType.registry)).toBe(true);
  });

  it('should use UnicodeString as default type', function() {
    expect(ParamType.getDefaultType()).toBe(ParamType.registry.UnicodeString);
  });

  it('should throw for non-existant types', function() {
    expect(function() {
      ParamType.getTypeFromBackendName('MissingType');
    })
      .toThrowError(/not a registered parameter type/);
  });

  it('should not allow invalid default values', function() {
    expect(function() {
      // Defines a "Natural Number" type but gives it a negative default value.
      new ParamType({
        validate: function(v) {
          return v >= 0;
        },
        default_value: -1,
      });
    }).toThrowError(/default value is invalid/);
  });

  describe('UnicodeString', function() {
    var UnicodeString = null;

    beforeEach(function() {
      UnicodeString = ParamType.registry.UnicodeString;
    });

    it('should be frozen', function() {
      expect(Object.isFrozen(UnicodeString)).toBe(true);
    });

    it('should give an empty string by default', function() {
      expect(UnicodeString.createDefaultValue()).toEqual('');
    });

    it('should be named correctly', function() {
      expect(UnicodeString.getName()).toEqual('UnicodeString');
    });

    it('should be able to tell whether or not values are strings', function() {
      expect(UnicodeString.valueIsValid('abc')).toBe(true);
      expect(UnicodeString.valueIsValid(3)).toBe(false);
      expect(UnicodeString.valueIsValid([1, 2])).toBe(false);
    });
  });
});
