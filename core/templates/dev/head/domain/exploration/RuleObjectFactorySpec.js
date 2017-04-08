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
 * @fileoverview Unit tests for the rule object factory.
 */

describe('Rule object factory', function() {
  beforeEach(module('oppia'));

  describe('RuleObjectFactory', function() {
    var scope, rof;

    beforeEach(inject(function($rootScope, $injector) {
      scope = $rootScope.$new();
      rof = $injector.get('RuleObjectFactory');
    }));

    it('should have matching classifier constants', inject(function($injector) {
      expect(rof.createNewClassifierRule().type).toEqual(
        $injector.get('RULE_TYPE_CLASSIFIER'));
    }));
  });
});
