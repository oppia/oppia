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

import { UpgradedServices } from 'services/UpgradedServices';

import { IAnswerStatsBackendDict, AnswerStatsObjectFactory } from
  'domain/exploration/AnswerStatsObjectFactory';

describe('Oppia sorted tiles visualization', function() {
  let $compile, $rootScope;
  let answerStatsObjectFactory: AnswerStatsObjectFactory;

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.inject(function(
      _$compile_, _$rootScope_, _AnswerStatsObjectFactory_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    answerStatsObjectFactory = _AnswerStatsObjectFactory_;
  }));

  const newDirective = (data: IAnswerStatsBackendDict[], options): JQLite => {
    const elementHtml = (
      '<oppia-visualization-sorted-tiles data="data" options="options">' +
      '</oppia-visualization-sorted-tiles>');
    const scope = $rootScope.$new();
    scope.data = (
      data.map(d => answerStatsObjectFactory.createFromBackendDict(d)));
    scope.options = options;
    const element = $compile(elementHtml)(scope);
    $rootScope.$digest();
    return element;
  };

  describe('Without percentages', () => {
    let element: JQLite;

    beforeEach(() => {
      element = newDirective(
        [{answer: 'foo', frequency: 3}, {answer: 'bar', frequency: 1}],
        {header: 'Pretty Tiles!', use_percentages: false});
    });

    it('should render the provided data and their frequencies', () => {
      expect(element.find('strong').text()).toEqual('Pretty Tiles!');
      expect(
        element.find('div.oppia-visualization-sorted-tile-content > div')
          .map((_, el) => el.textContent.trim()).toArray())
        .toEqual(['foo', '3 times', 'bar', '1 times']);
    });
  });

  describe('With percentages', () => {
    let element: JQLite;

    beforeEach(() => {
      element = newDirective(
        [{answer: 'foo', frequency: 3}, {answer: 'bar', frequency: 1}],
        {header: 'Pretty Tiles!', use_percentages: true});
    });

    it('should render the provided data with percentages', () => {
      expect(
        element.find('div.oppia-visualization-sorted-tile-content > div')
          .map((_, el) => el.textContent.trim()).toArray())
        .toEqual(['foo', '75%', 'bar', '25%']);
    });

    describe('Tooltip behavior', () => {
      it('should not show frequency tooltip by default', () => {
        expect(element.find('.oppia-visualization-sorted-tile-tooltip').length)
          .toEqual(0);
      });

      it('should show and hide tooltip when hovering the percentage', () => {
        element.find('li:first').trigger('mouseover');

        expect(element.find('.oppia-visualization-sorted-tile-tooltip').length)
          .toEqual(1);
        expect(
          element.find('.oppia-visualization-sorted-tile-tooltip')
            .get(0).innerText.trim())
          .toEqual('3 times');

        element.find('li:first').trigger('mouseout');
        expect(element.find('.oppia-visualization-sorted-tile-tooltip').length)
          .toEqual(0);
      });
    });
  });
});
