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

require('visualizations/oppia-visualization-sorted-tiles.component.ts');

import { TestBed } from '@angular/core/testing';

import { AnswerStatsBackendDict, AnswerStats } from
  'domain/exploration/answer-stats.model';
import { UtilsService } from 'services/utils.service';

describe('Oppia sorted tiles visualization', function() {
  let $compile, $rootScope, $uibModal;
  let utilsService: UtilsService;

  beforeEach(angular.mock.module('oppia', function($provide) {
    utilsService = TestBed.get(UtilsService);
    $provide.value('UtilsService', utilsService);
  }));
  beforeEach(angular.mock.inject(function($injector) {
    $compile = $injector.get('$compile');
    $rootScope = $injector.get('$rootScope');
    $uibModal = $injector.get('$uibModal');
  }));

  const newDirective = (
    (data: AnswerStatsBackendDict[], options: Object): JQLite => {
      const elementHtml = (
        '<oppia-visualization-sorted-tiles data="data" options="options">' +
        '</oppia-visualization-sorted-tiles>');
      const scope = $rootScope.$new();
      scope.data = (
        data.map(d => AnswerStats.createFromBackendDict(d)));
      scope.options = options;
      const element = $compile(elementHtml)(scope);
      $rootScope.$digest();
      return element;
    });

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
        .toEqual(['foo', '3 times', 'bar', '1 time']);
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
        element.find('.oppia-visualization-sorted-tile-content:first')
          .trigger('mouseover');

        expect(element.find('.oppia-visualization-sorted-tile-tooltip').length)
          .toEqual(1);
        expect(
          element.find('.oppia-visualization-sorted-tile-tooltip')
            .get(0).innerText.trim())
          .toEqual('3 times');

        element.find('.oppia-visualization-sorted-tile-content:first')
          .trigger('mouseleave');
        expect(element.find('.oppia-visualization-sorted-tile-tooltip').length)
          .toEqual(0);
      });
    });
  });

  describe('Very long content', () => {
    const veryLongAnswer = (
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do ' +
      'eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ' +
      'ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut ' +
      'aliquip ex ea commodo consequat. Duis aute irure dolor in ' +
      'reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla ' +
      'pariatur. Excepteur sint occaecat cupidatat non proident, sunt in ' +
      'culpa qui officia deserunt mollit anim id est laborum.');
    let element: JQLite;

    beforeEach(() => {
      spyOn(utilsService, 'isOverflowing').and.returnValue(true);

      element = newDirective(
        [{answer: veryLongAnswer, frequency: 3}],
        {header: 'Pretty Tiles!', use_percentages: true});
    });

    it('should respect that the answer is too long', () => {
      expect(element.find('.answer-0 > .more').length).toEqual(1);
    });

    it('should open the answer content modal when prompted for more', () => {
      const openModalSpy = spyOn($uibModal, 'open').and.callThrough();

      element.find('.more > a').click();
      expect(openModalSpy).toHaveBeenCalledWith(jasmine.objectContaining({
        controller: 'AnswerContentModalController'
      }));
    });
  });
});
