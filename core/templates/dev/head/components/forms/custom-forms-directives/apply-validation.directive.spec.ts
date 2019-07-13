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
 * @fileoverview Tests for Directive for applying validation.
 */

require(
  'components/forms/custom-forms-directives/' +
  'apply-validation.directive.ts');

describe('Testing apply-validation directive', function() {
  var $compile, element, scope, testInput;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($rootScope) {
    scope = $rootScope.$new();
    element = '<form name="testForm">' +
      '<input name="inputValue" type="number" ng-model="localValue" ' +
      'apply-validation validators="validators()">' +
      '</form>';
  }));

  it('should apply isAtLeast validation', angular.mock.inject(
    function($compile) {
      scope.validators = function() {
        return [{
          id: 'isAtLeast',
          minValue: -2.5
        }];
      };
      $compile(element)(scope);
      testInput = scope.testForm.inputValue;

      testInput.$setViewValue(-1);
      scope.$digest();
      expect(testInput.$valid).toEqual(true);
      expect(Object.keys(testInput.$error).length).toEqual(0);

      testInput.$setViewValue('1');
      scope.$digest();
      expect(testInput.$valid).toEqual(true);
      expect(Object.keys(testInput.$error).length).toEqual(0);

      testInput.$setViewValue(-2.5);
      scope.$digest();
      expect(testInput.$valid).toEqual(true);
      expect(Object.keys(testInput.$error).length).toEqual(0);

      testInput.$setViewValue(-3);
      scope.$digest();
      expect(testInput.$valid).toEqual(false);
      expect(Object.keys(testInput.$error).length).toEqual(1);

      testInput.$setViewValue('-3');
      scope.$digest();
      expect(testInput.$valid).toEqual(false);
      expect(Object.keys(testInput.$error).length).toEqual(1);
    }));

  it('should apply isAtMost validation', angular.mock.inject(
    function($compile) {
      scope.validators = function() {
        return [{
          id: 'isAtMost',
          maxValue: 5
        }];
      };
      $compile(element)(scope);
      testInput = scope.testForm.inputValue;

      testInput.$setViewValue(-1);
      scope.$digest();
      expect(testInput.$valid).toEqual(true);
      expect(Object.keys(testInput.$error).length).toEqual(0);

      testInput.$setViewValue('1');
      scope.$digest();
      expect(testInput.$valid).toEqual(true);
      expect(Object.keys(testInput.$error).length).toEqual(0);

      testInput.$setViewValue(5);
      scope.$digest();
      expect(testInput.$valid).toEqual(true);
      expect(Object.keys(testInput.$error).length).toEqual(0);

      testInput.$setViewValue(6);
      scope.$digest();
      expect(testInput.$valid).toEqual(false);
      expect(Object.keys(testInput.$error).length).toEqual(1);

      testInput.$setViewValue('10');
      scope.$digest();
      expect(testInput.$valid).toEqual(false);
      expect(Object.keys(testInput.$error).length).toEqual(1);
    }));

  it('should apply isNonempty validation', angular.mock.inject(
    function($compile) {
      scope.validators = function() {
        return [{
          id: 'isNonempty'
        }];
      };
      $compile(element)(scope);
      testInput = scope.testForm.inputValue;

      testInput.$setViewValue(-1);
      scope.$digest();
      expect(testInput.$valid).toEqual(true);
      expect(Object.keys(testInput.$error).length).toEqual(0);

      testInput.$setViewValue('1');
      scope.$digest();
      expect(testInput.$valid).toEqual(true);
      expect(Object.keys(testInput.$error).length).toEqual(0);

      testInput.$setViewValue('');
      scope.$digest();
      expect(testInput.$valid).toEqual(false);
      expect(Object.keys(testInput.$error).length).toEqual(1);
    }));

  it('should apply isInteger validation', angular.mock.inject(
    function($compile) {
      scope.validators = function() {
        return [{
          id: 'isInteger'
        }];
      };
      $compile(element)(scope);
      testInput = scope.testForm.inputValue;

      testInput.$setViewValue(-3);
      scope.$digest();
      expect(testInput.$valid).toEqual(true);
      expect(Object.keys(testInput.$error).length).toEqual(0);

      testInput.$setViewValue('1');
      scope.$digest();
      expect(testInput.$valid).toEqual(true);
      expect(Object.keys(testInput.$error).length).toEqual(0);

      testInput.$setViewValue('3.0');
      scope.$digest();
      expect(testInput.$valid).toEqual(true);
      expect(Object.keys(testInput.$error).length).toEqual(0);

      testInput.$setViewValue(3.5);
      scope.$digest();
      expect(testInput.$valid).toEqual(false);
      expect(Object.keys(testInput.$error).length).toEqual(1);

      testInput.$setViewValue('O');
      scope.$digest();
      expect(testInput.$valid).toEqual(false);
      expect(Object.keys(testInput.$error).length).not.toEqual(0);
    }));

  it('should apply isFloat validation', angular.mock.inject(function($compile) {
    scope.validators = function() {
      return [{
        id: 'isFloat'
      }];
    };
    $compile(element)(scope);
    testInput = scope.testForm.inputValue;

    testInput.$setViewValue(-3.5);
    scope.$digest();
    expect(testInput.$valid).toEqual(true);
    expect(Object.keys(testInput.$error).length).toEqual(0);

    testInput.$setViewValue('0.5');
    scope.$digest();
    expect(testInput.$valid).toEqual(true);
    expect(Object.keys(testInput.$error).length).toEqual(0);

    testInput.$setViewValue('1.0');
    scope.$digest();
    expect(testInput.$valid).toEqual(true);
    expect(Object.keys(testInput.$error).length).toEqual(0);

    testInput.$setViewValue(2);
    scope.$digest();
    expect(testInput.$valid).toEqual(true);
    expect(Object.keys(testInput.$error).length).toEqual(0);

    testInput.$setViewValue(3);
    scope.$digest();
    expect(testInput.$valid).toEqual(true);
    expect(Object.keys(testInput.$error).length).toEqual(0);

    testInput.$setViewValue(4);
    scope.$digest();
    expect(testInput.$valid).toEqual(true);
    expect(Object.keys(testInput.$error).length).toEqual(0);

    testInput.$setViewValue('abc');
    scope.$digest();
    expect(testInput.$valid).toBeUndefined();
    expect(Object.keys(testInput.$error).length).not.toEqual(0);

    testInput.$setViewValue('1.2.3');
    scope.$digest();
    expect(testInput.$valid).toBeUndefined();
    expect(Object.keys(testInput.$error).length).not.toEqual(0);

    testInput.$setViewValue('-3..5');
    scope.$digest();
    expect(testInput.$valid).toBeUndefined();
    expect(Object.keys(testInput.$error).length).not.toEqual(0);
  }));

  it('should not apply nonexistent validation', angular.mock.inject(
    function($compile) {
      scope.validators = function() {
        return [{
          id: 'testFilterFilter'
        }];
      };
      $compile(element)(scope);
      testInput = scope.testForm.inputValue;

      testInput.$setViewValue('-abc');
      scope.$digest();
      expect(Object.keys(testInput.$error).length).not.toEqual(0);
    }));
});
