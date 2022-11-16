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
 * @fileoverview Constants for the Oppia blog dashboard page.
 */

export const BlogDashboardPageConstants = {
  BLOG_DASHBOARD_DATA_URL_TEMPLATE: '/blogdashboardhandler/data',

  BLOG_EDITOR_DATA_URL_TEMPLATE: '/blogeditorhandler/data/<blog_post_id>',

  BLOG_POST_STATS_DATA_URL_TEMPLATE: (
    '/blogdashboardhandler/stats/data/<blog_post_id>/<chart_type>'),

  AUTHOR_STATS_DATA_URL_TEMPLATE: (
    '/blogdashboardhandler/authorstats/data/<chart_type>'),

  BLOG_DASHBOARD_TAB_URLS: {
    PUBLISHED: '#/published',
    DRAFTS: '#/drafts',
    BLOG_POST_EDITOR: '#/blog_post_editor/<blog_post_id>'
  },

  BLOG_POST_ACTIONS: {
    DELETE: 'delete',
    UNPUBLISH: 'unpublish',
    PUBLISH: 'publish'
  },

  STATS_CHART_TYPES: {
    VIEWS_CHART: 'views',
    READS_CHART: 'reads',
    READING_TIME: 'reading_time'
  },

  STATS_CHART_LABLES: {
    VIEWS_CHART: 'views',
    READS_CHART: 'reads',
    READING_TIME: 'number Of users'
  },

  READING_TIME_BUCKET_KEYS_TO_DISPLAY: {
    zeroToOneMin: '< 1',
    oneToTwoMin: '1 to 2',
    twoToThreeMin: '2 to 3',
    threeToFourMin: '3 to 4',
    fourToFiveMin: '4 to 5',
    fiveToSixMin: '5 to 6',
    sixToSevenMin: '6 to 7',
    sevenToEightMin: '7 to 8',
    eightToNineMin: '8 to 9',
    nineToTenMin: '9 to 10',
    moreThanTenMin: '10+',
  }
} as const;
