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
 * @fileoverview Unit tests for valueGeneratorEditor.
 */

describe('Value Generator Editor directive', function() {
  var $scope = null;
  var elem = null;

  var compiledElement = null;

  beforeEach(angular.mock.module('directiveTemplates'));
  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($compile, $injector) {
    var $rootScope = $injector.get('$rootScope');

    $scope = $rootScope.$new();
    $scope.generatorId = 'Copier';
    $scope.customizationArgs = [];
    $scope.initArgs = [];
    $scope.objType = 'UnicodeString';

    elem = angular.element(
      '<value-generator-editor generator-id="generatorId" ' +
      'customization-args="customizationArgs" obj-type="objType" ' +
      'init-args="initArgs"></value-generator-editor>');

    compiledElement = $compile(elem)($scope);
    $rootScope.$digest();
  }));

  it('should add new attributes in the compiled one', function() {
    expect(compiledElement.html()).toContain(
      'get-generator-id="getGeneratorId()"');
    expect(compiledElement.html()).toContain(
      'get-init-args="getInitArgs()"');
    expect(compiledElement.html()).toContain(
      'get-generator-id="getGeneratorId()"');
    expect(compiledElement.html()).toContain('get-obj-type="getObjType()"');
  });
});
