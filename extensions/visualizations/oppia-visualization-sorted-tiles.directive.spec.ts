// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive unit tests for the "enumerated sorted tiles"
 * visualization.
 */

require('visualizations/oppia-visualization-sorted-tiles.directive.ts');

describe('Oppia sorted tiles visualization', function() {
  let $compile, $rootScope, element: JQuery;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function(_$compile_, _$rootScope_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
  }));

  beforeEach(() => {
    const elementHtml = (
      '<oppia-visualization-sorted-tiles data="data" options="options">' +
      '</oppia-visualization-sorted-tiles>');
    const $scope = $rootScope.$new();
    $scope.data = [
      {answer: 'foo', frequency: 3},
      {answer: 'bar', frequency: 1},
    ];
    $scope.options = {
      header: 'Pretty Tiles!'
    };
    element = $compile(elementHtml)($scope);
    $rootScope.$digest();
  });

  it('should render the provided scope bindings', () => {
    expect(element.find('strong').text()).toEqual('Pretty Tiles!');
    expect(element.find('li > div').map((_, el) => el.textContent).toArray())
      .toEqual([
        'foo', '3 times',
        'bar', '1 times',
      ]);
  });
});
