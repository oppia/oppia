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
 * @fileoverview Unit tests for HTML serialization and escaping services.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('services/HtmlEscaperService.ts');

describe('HTML escaper', function() {
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.upgradedServices)) {
      $provide.value(key, value);
    }
  }));

  describe('HTML escaper service', function() {
    var ohe = null;

    beforeEach(angular.mock.inject(function($injector) {
      ohe = $injector.get('HtmlEscaperService');
    }));

    it('should correctly translate between escaped and unescaped strings',
      function() {
        var strs = ['abc', 'a&b<html>', '&&&&&'];
        for (var i = 0; i < strs.length; i++) {
          expect(ohe.escapedStrToUnescapedStr(
            ohe.unescapedStrToEscapedStr(strs[i]))).toEqual(strs[i]);
        }
      }
    );

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
