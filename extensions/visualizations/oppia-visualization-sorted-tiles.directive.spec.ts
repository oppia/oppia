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

require('App.ts');
require('visualizations/oppia-visualization-sorted-tiles.directive.ts');

describe('Oppia sorted tiles visualization', function() {
  var $componentController, HtmlEscaperService, ctrl;
  beforeEach(angular.mock.module('directiveTemplates'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    const ugs = new UpgradedServices();
    for (const [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.inject(function(
      _$componentController_, _HtmlEscaperService_) {
    $componentController = _$componentController_;
    HtmlEscaperService = _HtmlEscaperService_;
    ctrl = $componentController('oppiaVisualizationSortedTiles', {
      $attrs: {
        escapedData: '[{"answer": "foo", "frequency": 5}]',
        escapedOptions: '{"header": "Pretty Tiles"}',
        addressedInfoIsSupported: true,
      },
      HtmlEscaperService: HtmlEscaperService,
    }, {});
    ctrl.$onInit();
  }));

  it('should interpret the escaped attributes', () => {
    expect(ctrl.addressedInfoIsSupported).toBeTrue();
    expect(ctrl.data).toEqual([{answer: 'foo', frequency: 5}]);
    expect(ctrl.options).toEqual({header: 'Pretty Tiles'});
  });
});
