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
 *
 * @author sll@google.com (Sean Lip)
 */

describe('Validators service', function() {
  beforeEach(module('oppia'));

  describe('validatorservice', function() {
    var vs = null;

    beforeEach(inject(function($injector) {
      vs = $injector.get('validatorsService');
    }));

    it('should correctly validate entity names', function() {
      GLOBALS = {INVALID_NAME_CHARS: 'xyz'};

      expect(vs.isValidEntityName('b')).toBe(true);
      expect(vs.isValidEntityName('b   ')).toBe(true);
      expect(vs.isValidEntityName('   b')).toBe(true);
      expect(vs.isValidEntityName('bd')).toBe(true);

      expect(vs.isValidEntityName('')).toBe(false);
      expect(vs.isValidEntityName('   ')).toBe(false);
      expect(vs.isValidEntityName('x')).toBe(false);
      expect(vs.isValidEntityName('y')).toBe(false);
      expect(vs.isValidEntityName('bx')).toBe(false);
    });

    it('should correctly validate non-emptiness', function() {
      expect(vs.isNonempty('b')).toBe(true);
      expect(vs.isNonempty('abc def')).toBe(true);

      expect(vs.isNonempty('')).toBe(false);
      expect(vs.isNonempty(null)).toBe(false);
      expect(vs.isNonempty(undefined)).toBe(false);
    });
  });
});

describe('Datetime Formatter', function() {
  beforeEach(module('oppia'));

  describe('datetimeformatter', function() {
    var vs = null;

    beforeEach(inject(function($injector) {
      vs = $injector.get('oppiaDatetimeFormatter');
    }));

      it('should correctly return date time string', function() {

	expect(vs.getHumanReadableDatetime(1408124298786)).toBe('Fri, 15 Aug 2014 17:38:18 GMT');
      });

      it('should correctly return local date time string', function() {

        expect(vs.getLocaleString(1408124298786).toBe('8/15/2014 11:08:18 PM'));
      });
	
      it('should correctly return local date time string', function() {
		
        var d = new Date();
	var millis = d.getTime();
        var currentTime = new Date(millis).toLocaleTimeString().replace(/:\d\d /, ' ');
        // Get yesterday's date.
	d.setDate(date.getDate() - 1);
        var yesterdayMillis = d.getTime();
	var yesterdayDate =  new Date(millis).toLocaleDateString();
		
        expect(vs.getLocaleString(millis).toBe(currentTime));
	
	expect(vs.getLocaleString(yesterdayMillis).toBe(yesterdayDate));
      });	
    });
});
