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
  var sampleExplorationsList = null;

  beforeEach(module('oppia'));
  beforeEach(inject(function($injector) {
    sortExplorationsService = $injector.get('sortExplorationsService');

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
        ratings: {
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
        ratings: {
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
        ratings: {
          5: 0,
          4: 1,
          3: 2,
          2: 1,
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
    var sortedByTitle = (
      sortExplorationsService.sortBy(sampleExplorationsList, 'title'));
    expect(sortedByTitle.length).toBe(sampleExplorationsList.length);
    expect(sortedByTitle[0].title).toBe(sampleExplorationsList[1].title);
    expect(sortedByTitle[1].title).toBe(sampleExplorationsList[0].title);
    expect(sortedByTitle[2].title).toBe(sampleExplorationsList[2].title);

    var sortedByLastUpdated = (
      sortExplorationsService.sortBy(
        sampleExplorationsList, 'last_updated_msec'));
    expect(sortedByLastUpdated.length).toBe(sampleExplorationsList.length);
    expect(sortedByLastUpdated[0].last_updated_msec).toBe(
      sampleExplorationsList[2].last_updated_msec);
    expect(sortedByLastUpdated[1].last_updated_msec).toBe(
      sampleExplorationsList[0].last_updated_msec);
    expect(sortedByLastUpdated[2].last_updated_msec).toBe(
      sampleExplorationsList[1].last_updated_msec);

    var sortedByNumOpenThreads = (
      sortExplorationsService.sortBy(
        sampleExplorationsList, 'num_open_threads'));
    expect(sortedByNumOpenThreads.length).toBe(sampleExplorationsList.length);
    expect(sortedByNumOpenThreads[0].num_open_threads).toBe(
      sampleExplorationsList[0].num_open_threads);
    expect(sortedByNumOpenThreads[1].num_open_threads).toBe(
      sampleExplorationsList[2].num_open_threads);
    expect(sortedByNumOpenThreads[2].num_open_threads).toBe(
      sampleExplorationsList[1].num_open_threads);

    var sortedByNumUnresolvedAnswers = (
      sortExplorationsService.sortBy(
        sampleExplorationsList, 'num_unresolved_answers'));
    expect(sortedByNumUnresolvedAnswers.length).toBe(
      sampleExplorationsList.length);
    expect(sortedByNumUnresolvedAnswers[0].num_unresolved_answers).toBe(
      sampleExplorationsList[1].num_unresolved_answers);
    expect(sortedByNumUnresolvedAnswers[1].num_unresolved_answers).toBe(
      sampleExplorationsList[0].num_unresolved_answers);
    expect(sortedByNumUnresolvedAnswers[2].num_unresolved_answers).toBe(
      sampleExplorationsList[2].num_unresolved_answers);

    var sortedByNumViews = (
      sortExplorationsService.sortBy(sampleExplorationsList, 'num_views'));
    expect(sortedByNumViews.length).toBe(sampleExplorationsList.length);
    expect(sortedByNumViews[0].num_views).toBe(
      sampleExplorationsList[1].num_views);
    expect(sortedByNumViews[1].num_views).toBe(
      sampleExplorationsList[2].num_views);
    expect(sortedByNumViews[2].num_views).toBe(
      sampleExplorationsList[0].num_views);

    var sortedByUnexpectedParameter = (
      sortExplorationsService.sortBy(sampleExplorationsList, 'abc'));
    expect(sortedByUnexpectedParameter).toBe(sampleExplorationsList);
  });
});
