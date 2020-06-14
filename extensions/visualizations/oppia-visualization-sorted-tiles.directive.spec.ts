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

// TODO(#7222): Remove the following import once corresponding directive is
// upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';

require('visualizations/oppia-visualization-sorted-tiles.directive.ts');

describe('Oppia sorted tiles visualization', () => {
  beforeEach(angular.mock.module('directiveTemplates'));
  beforeEach(angular.mock.module('oppia', $provide => {
    const ugs = new UpgradedServices();
    for (const [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.inject(($componentController, HtmlEscaperService) => {
    this.ctrl = $componentController('oppiaVisualizationSortedTiles', {
      $attrs: {
        escapedData: '[{"answer": "foo", "frequency": 5}]',
        escapedOptions: '{"header": "Pretty Tiles!"}',
        addressedInfoIsSupported: true,
      },
      HtmlEscaperService: HtmlEscaperService,
    }, {});
    this.ctrl.$onInit();
  }));

  it('should interpret the escaped attributes', () => {
    expect(this.ctrl.addressedInfoIsSupported).toBeTrue();
    expect(this.ctrl.data).toEqual([{answer: 'foo', frequency: 5}]);
    expect(this.ctrl.options).toEqual({header: 'Pretty Tiles!'});
  });
});
