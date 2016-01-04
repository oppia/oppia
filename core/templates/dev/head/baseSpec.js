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
 * @fileoverview Unit tests for the base controller.
 *
 * @author sll@google.com (Sean Lip)
 */

describe('Base controller', function() {
  beforeEach(module('oppia'));

  describe('BaseCtrl', function() {
    var scope, ctrl, $httpBackend;

    beforeEach(inject(function($rootScope, $controller) {
      scope = $rootScope.$new();
      ctrl = $controller('Base', {
        $scope: scope,
        warningsData: null,
        activeInputData: null,
        messengerService: null
      });
    }));

    it('should check if an object is empty', function() {
      var a = {
        a: 'b'
      };
      var isEmpty = scope.isEmpty(a);
      expect(isEmpty).toEqual(false);
      var b = {};
      var isEmpty = scope.isEmpty(b);
      expect(isEmpty).toEqual(true);
    });

    it('should have matching fuzzy rule constants',
        inject(function($injector) {
      expect($injector.get('DEFAULT_FUZZY_RULE').rule_type).toEqual(
        $injector.get('FUZZY_RULE_TYPE'));
    }));
  });
});
