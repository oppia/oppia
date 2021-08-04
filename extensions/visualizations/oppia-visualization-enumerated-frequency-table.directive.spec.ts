// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for "enumerated frequency table" visualization.
 */

import { AnswerStats } from 'domain/exploration/answer-stats.model';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

describe('oppiaVisualizationEnumeratedFrequencyTable', () => {
  let $compile = null, $rootScope = null;
  let el = null;
  let scope = null;

  importAllAngularServices();
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function(_$compile_, _$rootScope_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
  }));

  beforeEach(() => {
    const elementTemplate = angular.element(
      '<oppia-visualization-enumerated-frequency-table ' + (
        'data="data" options="options" ' +
        'addressed-info-is-supported="addressedInfoIsSupported">') +
      '</oppia-visualization-enumerated-frequency-table>');
    scope = $rootScope.$new();
    let data = [
      {answer: ['foo'], frequency: 3},
      {answer: ['bar'], frequency: 1}];
    scope.data = (data.map(d => AnswerStats.createFromBackendDict(d)));
    el = $compile(elementTemplate)(scope);
    $rootScope.$digest();
  });

  it('should display first answer and hide the second answer', () => {
    expect(el.find(
      'a.answer-rank'
    ).map((_, el) => el.textContent.trim()).toArray())
      .toEqual(['Answer Set #1', 'Answer Set #2']);
    let values = el.find('td')
      .map((_, el) => el.textContent.trim()).toArray();
    expect(values[1]).toBe('foo');
    expect(values[2]).toBe('3');
    expect(values[4]).toBe('bar');
    expect(values[5]).toBe('1');
    expect(el.find(
      'table.item.table.ng-hide angular-html-bind'
    ).map((_, el) => el.textContent.trim()).toArray()).toEqual(['bar']);
    expect(el.find(
      'table.item.table:not(.ng-hide) angular-html-bind'
    ).map((_, el) => el.textContent.trim()).toArray()).toEqual(['foo']);
  });

  it('should display second answer and hide the first answer', () => {
    let list = el.find('.answer-rank');
    list.trigger('click');

    expect(el.find(
      'table.item.table.ng-hide angular-html-bind'
    ).map((_, el) => el.textContent.trim()).toArray()).toEqual(['foo']);
    expect(el.find(
      'table.item.table:not(.ng-hide) angular-html-bind'
    ).map((_, el) => el.textContent.trim()).toArray()).toEqual(['bar']);
    expect(el.find(
      'a.answer-rank'
    ).map((_, el) => el.textContent.trim()).toArray())
      .toEqual(['Answer Set #1', 'Answer Set #2']);
    let values = el.find('td')
      .map((_, el) => el.textContent.trim()).toArray();
    expect(values[1]).toBe('foo');
    expect(values[2]).toBe('3');
    expect(values[4]).toBe('bar');
    expect(values[5]).toBe('1');
  });
});
