// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Constants for the Oppia contributors' blog author page.
 */

// NOTE TO DEVELOPERS: The constants defined below should be same as the
// constants defined in feconf.py..
export const BlogAuthorProfilePageConstants = {
  MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_AUTHOR_PROFILE_PAGE: 12,
  BLOG_AUTHOR_PROFILE_PAGE_URL_TEMPLATE: '/blog/author/<author_username>',
  BLOG_AUTHOR_PROFILE_PAGE_DATA_URL_TEMPLATE: '/blog/author/data/<author_username>', // eslint-disable-line max-len
} as const;
