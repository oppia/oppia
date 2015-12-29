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

  describe('validators service', function() {
    var vs = null;

    beforeEach(inject(function($injector) {
      vs = $injector.get('validatorsService');
    }));

    it('should correctly validate entity names', function() {
      GLOBALS = {
        INVALID_NAME_CHARS: 'xyz'
      };

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

describe('HTML escaper', function() {
  beforeEach(module('oppia'));

  describe('HTML escaper service', function() {
    var ohe = null;

    beforeEach(inject(function($injector) {
      ohe = $injector.get('oppiaHtmlEscaper');
    }));

    it('should correctly translate between escaped and unescaped strings',
        function() {
      var strs = ['abc', 'a&b<html>', '&&&&&'];
      for (var i = 0; i < strs.length; i++) {
        expect(ohe.escapedStrToUnescapedStr(
          ohe.unescapedStrToEscapedStr(strs[i]))).toEqual(strs[i]);
      }
    });

    it('should correctly escape and unescape JSON', function() {
      var objs = [{
        a: 'b'
      }, ['a', 'b'], 2, true, 'abc'];
      for (var i = 0; i < objs.length; i++) {
        expect(ohe.escapedJsonToObj(
          ohe.objToEscapedJson(objs[i]))).toEqual(objs[i]);
      }
    });
  });
});

describe('Datetime Formatter', function() {
  beforeEach(module('oppia'));

  describe('datetimeformatter', function() {
    // This corresponds to Fri, 21 Nov 2014 09:45:00 GMT.
    var NOW_MILLIS = 1416563100000;
    var YESTERDAY_MILLIS = NOW_MILLIS - 24 * 60 * 60 * 1000;
    var df = null;
    var OldDate = Date;

    beforeEach(inject(function($injector) {
      df = $injector.get('oppiaDatetimeFormatter');

      // Mock Date() to give a time of NOW_MILLIS in GMT. (Unfortunately, there
      // doesn't seem to be a good way to set the timezone locale directly.)
      spyOn(window, 'Date').andCallFake(function(optionalMillisSinceEpoch) {
        if (optionalMillisSinceEpoch) {
          return new OldDate(optionalMillisSinceEpoch);
        } else {
          return new OldDate(NOW_MILLIS);
        }
      });
    }));

    it('should show only the time for a datetime occurring today', function() {
      // In any timezone, 10 minutes before xx:45:00 should still fall within
      // the same date as xx:45:00 in getLocaleAbbreviateDatetimeString().
      expect(df.getLocaleAbbreviatedDatetimeString(
        NOW_MILLIS - 10 * 60 * 1000)).not.toBe('11/21/2014');
      expect(df.getLocaleAbbreviatedDatetimeString(
        NOW_MILLIS - 10 * 60 * 1000)).not.toBe('2014/11/21');
    });

    it('should show only the date for a datetime occurring before today',
        function() {
      // 72 hours ago. This is 18 Nov 2014 09:45:00 GMT, which corresponds to
      // 17 Nov 2014 in some parts of the world, and 18 Nov 2014 in others.
      // Also have into account different locales where the order of time/date
      // formatting is different. This should hold true in
      // getLocaleAbbreviateDatetimeString()
      expect([
        '11/18/2014', '11/17/2014', '2014/11/18', '2014/11/17', '18/11/2014'
      ]).toContain(
        df.getLocaleAbbreviatedDatetimeString(
          NOW_MILLIS - 72 * 60 * 60 * 1000));
    });

    it('should show the date even for a datetime occurring today', function() {
      // In any timezone, 10 minutes before xx:45:00 should still fall within
      // the same date as xx:45:00 in getLocaleDateString(). The date should
      // always be shown as '11/21/2014'
      expect(df.getLocaleDateString(
        NOW_MILLIS - 10 * 60 * 1000)).toBe('11/21/2014');
      expect(df.getLocaleDateString(
        NOW_MILLIS - 10 * 60 * 1000)).not.toBe('2014/11/21');
    });

    it('should show only the date for a datetime occurring before today',
        function() {
      // 72 hours ago. This is 18 Nov 2014 09:45:00 GMT, which corresponds to
      // 17 Nov 2014 in some parts of the world, and 18 Nov 2014 in others.
      // Also have into account different locales where the order of time/date
      // formatting is different. This should hold true in
      // getLocaleDateString().
      expect([
        '11/18/2014', '11/17/2014', '2014/11/18', '2014/11/17', '18/11/2014'
      ]).toContain(df.getLocaleDateString(NOW_MILLIS - 72 * 60 * 60 * 1000));
    });
  });
});

describe('Code Normalization', function() {
  beforeEach(module('oppia'));

  var cns = null;
  beforeEach(inject(function($injector) {
    cns = $injector.get('codeNormalizationService');
  }));

  it('should not modify contents of code', function() {
    expect(cns.getNormalizedCode(
      'def x():\n' +
      '    y = 345'
    )).toBe(
      'def x():\n' +
      '    y = 345'
    );
  });

  it('should convert indentation to 4 spaces, remove trailing whitespace ' +
      'and empty lines', function() {
    expect(cns.getNormalizedCode(
      'def x():         \n' +
      '    \n' +
      '  y = 345\n' +
      '            \n' +
      '       '
    )).toBe(
      'def x():\n' +
      '    y = 345'
    );
  });

  it('should remove full-line comments, but not comments in the middle ' +
     'of a line', function() {
    expect(cns.getNormalizedCode(
      '# This is a comment.\n' +
      '  # This is a comment with some spaces before it.\n' +
      'def x():         # And a comment with some code before it.\n' +
      '  y = \'#String with hashes#\''
    )).toBe(
      'def x():         # And a comment with some code before it.\n' +
      '    y = \'#String with hashes#\''
    );
  });

  it('should handle complex indentation', function() {
    expect(cns.getNormalizedCode(
      'abcdefg\n' +
      '    hij\n' +
      '              ppppp\n' +
      'x\n' +
      '  abc\n' +
      '  abc\n' +
      '    bcd\n' +
      '  cde\n' +
      '              xxxxx\n' +
      '  y\n' +
      ' z'
    )).toBe(
      'abcdefg\n' +
      '    hij\n' +
      '        ppppp\n' +
      'x\n' +
      '    abc\n' +
      '    abc\n' +
      '        bcd\n' +
      '    cde\n' +
      '        xxxxx\n' +
      '    y\n' +
      'z'
    );
  });

  it('should handle shortfall lines', function() {
    expect(cns.getNormalizedCode(
      'abcdefg\n' +
      '    hij\n' +
      '              ppppp\n' +
      '      x\n' +
      '  abc\n' +
      '    bcd\n' +
      '  cde'
    )).toBe(
      'abcdefg\n' +
      '    hij\n' +
      '        ppppp\n' +
      '    x\n' +
      'abc\n' +
      '    bcd\n' +
      'cde'
    );
  });
});
