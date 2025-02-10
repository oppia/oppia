// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Constants for the Oppia contributors' library page.
 */

// NOTE TO DEVELOPERS: The constants defined below in LIBRARY_PAGE_MODES should
// be same as the LIBRARY_PAGE_MODE constants defined in feconf.py. For example
// LIBRARY_PAGE_MODES.GROUP should have the same value as
// LIBRARY_PAGE_MODE_GROUP in feconf.py.
export const LibraryPageConstants = {
  LIBRARY_PAGE_MODES: {
    GROUP: 'group',
    INDEX: 'index',
    SEARCH: 'search',
  },

  LIBRARY_PATHS_TO_MODES: {
    '/community-library': 'index',
    '/community-library/top-rated': 'group',
    '/community-library/recently-published': 'group',
    '/search/find': 'search',
  },

  SEARCH_EXPLORATION_URL_TEMPLATE: '/exploration/metadata_search?q=<query>',
} as const;
