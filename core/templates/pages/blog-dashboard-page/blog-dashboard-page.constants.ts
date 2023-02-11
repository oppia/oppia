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

  BLOG_POST_TITLE_HANDLER_URL_TEMPLATE: '/blogtitlehandler/data/<blog_post_id>',

  BLOG_DASHBOARD_TAB_URLS: {
    PUBLISHED: '#/published',
    DRAFTS: '#/drafts',
    BLOG_POST_EDITOR: '#/blog_post_editor/<blog_post_id>'
  },

  BLOG_POST_ACTIONS: {
    DELETE: 'delete',
    UNPUBLISH: 'unpublish',
    PUBLISH: 'publish'
  }
} as const;
