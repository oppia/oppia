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

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('visualizations/oppia-visualization-sorted-tiles.directive.ts');

describe('Oppia sorted tiles visualization', function() {
  beforeEach(angular.mock.module('directiveTemplates'));
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    const ugs = new UpgradedServices();
    for (const [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.inject(function(
      $compile, $rootScope, $templateCache, UrlInterpolationService) {
    const templateHtml = $templateCache.get(
      UrlInterpolationService.getExtensionResourceUrl(
        '/visualizations/oppia-visualization-sorted-tiles.directive.html'));
    $compile(templateHtml)($rootScope);
    $rootScope.$digest();
    this.outerScope = $rootScope.$new();
    const elem = angular.element(
      '<oppia-visualization-sorted-tiles ' +
      'escaped-data="[{\'answer\': \'foo\', \'frequency\': 5}]" ' +
      'escaped-options="{\'header\': \'Pretty Tiles\'}" ' +
      '>' +
      '</oppia-visualization-sorted-tiles>');
    const compiledElem = $compile(elem)(this.outerScope);
    this.outerScope.$digest();
    this.ctrlScope = compiledElem[0].getControllerScope();
  }));

  it('should interpret the escaped data', function() {
    this.outerScope.$digest();
    expect(this.ctrlScope.data).toEqual([{answer: 'foo', frequency: 5}]);
  });

  it('should interpret the escaped options', () => {
    expect(this.ctrlScope.options).toEqual({header: 'Pretty Tiles'});
  });
});
