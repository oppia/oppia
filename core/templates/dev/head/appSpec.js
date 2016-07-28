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

    it('should correctly validate exploration titles', function() {
      GLOBALS = {
        INVALID_NAME_CHARS: '#'
      };

      expect(vs.isValidExplorationTitle('b')).toBe(true);
      expect(vs.isValidExplorationTitle('abc def')).toBe(true);

      expect(vs.isValidExplorationTitle('')).toBe(false);
      expect(vs.isValidExplorationTitle(null)).toBe(false);
      expect(vs.isValidExplorationTitle(undefined)).toBe(false);
      expect(vs.isValidExplorationTitle(
        'A title with invalid characters #')).toBe(false);
      expect(vs.isValidExplorationTitle(
        'A title that is way way way way way way way too long.')).toBe(false);
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
    var df = null;
    var OldDate = Date;

    beforeEach(inject(function($injector) {
      df = $injector.get('oppiaDatetimeFormatter');

      // Mock Date() to give a time of NOW_MILLIS in GMT. (Unfortunately, there
      // doesn't seem to be a good way to set the timezone locale directly.)
      spyOn(window, 'Date').andCallFake(function() {
        return new OldDate(NOW_MILLIS);
      });
    }));

    it('should correctly indicate recency', function() {
      // 1 second ago is recent.
      expect(df.isRecent(NOW_MILLIS - 1)).toBe(true);
      // 72 hours ago is recent.
      expect(df.isRecent(NOW_MILLIS - 72 * 60 * 60 * 1000)).toBe(true);
      // 8 days ago is not recent.
      expect(df.isRecent(NOW_MILLIS - 8 * 24 * 60 * 60 * 1000)).toBe(false);
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
