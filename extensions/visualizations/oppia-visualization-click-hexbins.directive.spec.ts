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
 * @fileoverview Directive unit tests for the "click hexbins" visualization.
 */

require('visualizations/oppia-visualization-click-hexbins.directive.ts');

describe('Oppia click hexbins visualization', function() {
  let $compile, $rootScope;
  let el: JQLite;

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('AssetsBackendApiService', {
      getImageUrlForPreview: (url: string) => url,
    });
    $provide.value('ContextService', {
      getEntityId: () => 'eid',
      getEntityType: () => 'exploration',
    });
    $provide.value('ImagePreloaderService', {
      getDimensionsOfImage: (_: string) => ({width: 300, height: 250}),
    });
  }));

  beforeEach(angular.mock.inject(function(_$compile_, _$rootScope_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
  }));

  beforeEach(() => {
    const elementTemplate = angular.element(
      '<oppia-visualization-click-hexbins ' + (
        'data="data" interaction-args="interactionArgs">') +
      '</oppia-visualization-click-hexbins>');
    const scope = $rootScope.$new();
    scope.data = [
      {answer: {clickPosition: [0.03, 0.03], clickedRegions: []}, frequency: 2},
      {answer: {clickPosition: [0.50, 0.50], clickedRegions: []}, frequency: 1},
    ];
    scope.interactionArgs = {
      imageAndRegions: {
        value: { imagePath: 'solar-system.png' },
      },
    };
    el = $compile(elementTemplate)(scope);
    $rootScope.$digest();
  });

  it('should group the two answers as two distinct hexagons', () => {
    expect(el.find('.click-hexbin-hexagon').length).toEqual(2);
  });

  describe('Tooltip behavior', () => {
    it('should be hidden by default', () => {
      expect(el.find('.click-hexbin-chart-tooltip').length).toEqual(0);
    });

    it('should appear after hovering a hexagon', () => {
      el.find('.e2e-test-hexagon-0').trigger('mouseover');
      expect(el.find('.click-hexbin-chart-tooltip').length).toEqual(1);
      expect(el.find('.click-hexbin-chart-tooltip').get(0).innerText.trim())
        .toEqual('2 clicks');
    });

    it('should switch focus when moving mouse between hexagons', () => {
      el.find('.e2e-test-hexagon-0').trigger('mouseover');
      expect(el.find('.click-hexbin-chart-tooltip').length).toEqual(1);
      expect(el.find('.click-hexbin-chart-tooltip').get(0).innerText.trim())
        .toEqual('2 clicks');

      el.find('.e2e-test-hexagon-0').trigger('mouseout');
      expect(el.find('.click-hexbin-chart-tooltip').length).toEqual(0);

      el.find('.e2e-test-hexagon-1').trigger('mouseover');
      expect(el.find('.click-hexbin-chart-tooltip').length).toEqual(1);
      expect(el.find('.click-hexbin-chart-tooltip').get(0).innerText.trim())
        .toEqual('1 click');
    });

    it('should stick to first hexagon hovered', () => {
      el.find('.e2e-test-hexagon-0').trigger('mouseover');
      expect(el.find('.click-hexbin-chart-tooltip').length).toEqual(1);
      expect(el.find('.click-hexbin-chart-tooltip').get(0).innerText.trim())
        .toEqual('2 clicks');

      el.find('.e2e-test-hexagon-1').trigger('mouseover');
      expect(el.find('.click-hexbin-chart-tooltip').length).toEqual(1);
      expect(el.find('.click-hexbin-chart-tooltip').get(0).innerText.trim())
        .toEqual('2 clicks');
    });

    it('should handle mouseout of unfocused hexagons gracefully', () => {
      expect(el.find('.click-hexbin-chart-tooltip').length).toEqual(0);

      el.find('.e2e-test-hexagon-0').trigger('mouseout');
      expect(el.find('.click-hexbin-chart-tooltip').length).toEqual(0);

      el.find('.e2e-test-hexagon-1').trigger('mouseout');
      expect(el.find('.click-hexbin-chart-tooltip').length).toEqual(0);
    });
  });
});
