// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for Directive for requiring "isFloat" filter.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require(
  'components/forms/custom-forms-directives/' +
  'require-is-float.directive.ts');

describe('Testing requireIsFloat directive', function() {
  var $compile, scope, testInput;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($compile, $rootScope) {
    scope = $rootScope.$new();
    var element = '<form name="testForm">' +
      '<input name="floatValue" type="number" ng-model="localValue" ' +
      'require-is-float apply-validation>' +
      '</form>';
    scope.validators = function() {
      return [{
        id: 'isFloat'
      }];
    };
    $compile(element)(scope);
    testInput = scope.testForm.floatValue;
  }));

  it('should validate if value is a float', function() {
    testInput.$setViewValue('2');
    scope.$digest();
    expect(testInput.$valid).toEqual(true);

    testInput.$setViewValue('2.0');
    scope.$digest();
    expect(testInput.$valid).toEqual(true);

    testInput.$setViewValue('3.5');
    scope.$digest();
    expect(testInput.$valid).toEqual(true);

    testInput.$setViewValue('-3.5');
    scope.$digest();
    expect(testInput.$valid).toEqual(true);
  });

  it('should invalidate if value is not a float', function() {
    testInput.$setViewValue('-abc');
    scope.$digest();
    expect(testInput.$valid).toEqual(false);

    testInput.$setViewValue('3..5');
    scope.$digest();
    expect(testInput.$valid).toEqual(false);

    testInput.$setViewValue('-2.abc');
    scope.$digest();
    expect(testInput.$valid).toEqual(false);

    testInput.$setViewValue('0.3.5');
    scope.$digest();
    expect(testInput.$valid).toEqual(false);

    testInput.$setViewValue(undefined);
    scope.$digest();
    expect(testInput.$valid).toEqual(false);
  });
});
