// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for DashboardServices.
 */

describe('Dashboard services', function() {
  var sortExplorationsService = null;
  var alertsService = null;
  var sampleExplorationsList = null;
  var EXPLORATIONS_SORT_BY_KEYS = null;
  var RatingComputationService = null;

  beforeEach(module('oppia'));
  beforeEach(inject(function($injector) {
    sortExplorationsService = $injector.get('sortExplorationsService');
    alertsService = $injector.get('alertsService');
    EXPLORATIONS_SORT_BY_KEYS = $injector.get('EXPLORATIONS_SORT_BY_KEYS');
    RatingComputationService = $injector.get('RatingComputationService');

    // Sample explorations list
    sampleExplorationsList = [
      {
        id: 'hyuy4GUlvTqJ',
        title: 'Sample Title',
        activity_type: 'exploration',
        category: 'Computing',
        objective: 'Sample objective',
        language_code: 'en',
        created_on_msec: 1466178691847.67,
        last_updated_msec: 1466178759209.839,
        status: 'public',
        rating: {
          5: 0,
          4: 1,
          3: 0,
          2: 0,
          1: 0
        },
        community_owned: false,
        tags: '',
        thumbnail_icon_url: '/subjects/Computing.svg',
        thumbnail_bg_color: '#bb8b2f',
        num_views: 20,
        num_open_threads: 0,
        num_total_threads: 0,
        num_unresolved_answers: 2
      },
      {
        id: 'pouy2JVlvTqH',
        title: 'ABC',
        activity_type: 'exploration',
        category: 'Economics',
        objective: 'Sample objective',
        language_code: 'en',
        created_on_msec: 1468178691847.71,
        last_updated_msec: 1468178759209.849,
        status: 'private',
        rating: {
          5: 0,
          4: 1,
          3: 0,
          2: 1,
          1: 0
        },
        community_owned: false,
        tags: '',
        thumbnail_icon_url: '/subjects/Computing.svg',
        thumbnail_bg_color: '#bb8b2f',
        num_views: 5,
        num_open_threads: 10,
        num_total_threads: 10,
        num_unresolved_answers: 0
      },
      {
        id: 'moiq9JVlcWqL',
        title: '',
        activity_type: 'exploration',
        category: 'Economics',
        objective: 'Sample objective',
        language_code: 'en',
        created_on_msec: 1418178691848.19,
        last_updated_msec: 1418178759219.124,
        status: 'private',
        rating: {
          5: 1,
          4: 1,
          3: 2,
          2: 0,
          1: 0
        },
        community_owned: false,
        tags: '',
        thumbnail_icon_url: '/subjects/Computing.svg',
        thumbnail_bg_color: '#bb8b2f',
        num_views: 10,
        num_open_threads: 8,
        num_total_threads: 9,
        num_unresolved_answers: 5
      }
    ];
  }));

  it('should correctly sort the explorations list', function() {
    var expectListOrder = function(sortedList, sortType, expectedOrder) {
      expect(sortedList.length, sampleExplorationsList.length);
      expectedOrder.forEach(function(i, index) {
        expect(sortedList[index][sortType]).toBe(
          sampleExplorationsList[i][sortType]);
      });
    };

    expectListOrder(
      sortExplorationsService.sortBy(
        sampleExplorationsList, EXPLORATIONS_SORT_BY_KEYS.TITLE),
      EXPLORATIONS_SORT_BY_KEYS.TITLE,
      [1, 0, 2]);

    expectListOrder(
      sortExplorationsService.sortBy(
        sampleExplorationsList, EXPLORATIONS_SORT_BY_KEYS.TITLE, true),
      EXPLORATIONS_SORT_BY_KEYS.TITLE,
      [2, 0, 1]);

    expectListOrder(
      sortExplorationsService.sortBy(
        sampleExplorationsList, EXPLORATIONS_SORT_BY_KEYS.LAST_UPDATED),
      EXPLORATIONS_SORT_BY_KEYS.LAST_UPDATED,
      [2, 0, 1]);

    expectListOrder(
      sortExplorationsService.sortBy(
        sampleExplorationsList, EXPLORATIONS_SORT_BY_KEYS.OPEN_FEEDBACK),
      EXPLORATIONS_SORT_BY_KEYS.OPEN_FEEDBACK,
      [0, 2, 1]);

    expectListOrder(
      sortExplorationsService.sortBy(
        sampleExplorationsList, EXPLORATIONS_SORT_BY_KEYS.UNRESOLVED_ANSWERS),
      EXPLORATIONS_SORT_BY_KEYS.UNRESOLVED_ANSWERS,
      [1, 0, 2]);

    expectListOrder(
      sortExplorationsService.sortBy(
        sampleExplorationsList, EXPLORATIONS_SORT_BY_KEYS.NUM_VIEWS),
      EXPLORATIONS_SORT_BY_KEYS.NUM_VIEWS,
      [1, 2, 0]);

    expectListOrder(
      sortExplorationsService.sortBy(
        sampleExplorationsList, EXPLORATIONS_SORT_BY_KEYS.abc),
      EXPLORATIONS_SORT_BY_KEYS.abc,
      [0, 1, 2]);
    expect(alertsService.warnings.length).toBe(1);
    expect(alertsService.warnings[0].content).toBe(
      'Invalid type of key name for sorting explorations: ' +
        EXPLORATIONS_SORT_BY_KEYS.abc);

    var sortedByAverageRating = (
      sortExplorationsService.sortBy(
        sampleExplorationsList, EXPLORATIONS_SORT_BY_KEYS.RATING));
    expect(sortedByAverageRating.length, sampleExplorationsList.length);
    expect(RatingComputationService.computeAverageRating(
      sortedByAverageRating[0][EXPLORATIONS_SORT_BY_KEYS.RATING])).toBe(
        RatingComputationService.computeAverageRating(
          sampleExplorationsList[1][EXPLORATIONS_SORT_BY_KEYS.RATING]));
    expect(RatingComputationService.computeAverageRating(
      sortedByAverageRating[1][EXPLORATIONS_SORT_BY_KEYS.RATING])).toBe(
        RatingComputationService.computeAverageRating(
          sampleExplorationsList[2][EXPLORATIONS_SORT_BY_KEYS.RATING]));
    expect(RatingComputationService.computeAverageRating(
      sortedByAverageRating[2][EXPLORATIONS_SORT_BY_KEYS.RATING])).toBe(
        RatingComputationService.computeAverageRating(
          sampleExplorationsList[0][EXPLORATIONS_SORT_BY_KEYS.RATING]));
  });
});
