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
 * @fileoverview Constants for the Oppia admin page.
 */

export const AdminPageConstants = {
  ADMIN_ROLE_HANDLER_URL: '/adminrolehandler',
  TOPIC_MANAGER_ROLE_HANDLER_URL: '/topicmanagerrolehandler',
  TRANSLATION_COORDINATOR_ROLE_HANDLER_URL:
    '/translationcoordinatorrolehandler',

  ADMIN_HANDLER_URL: '/adminhandler',
  ADMIN_TOPICS_CSV_DOWNLOAD_HANDLER_URL: '/admintopicscsvdownloadhandler',

  ADMIN_JOB_OUTPUT_URL_TEMPLATE: '/adminjoboutput?job_id=<jobId>',
  ADMIN_MEMORY_CACHE_HANDLER_URL: '/memorycacheadminhandler',
  ADMIN_UPDATE_USERNAME_HANDLER_URL: '/updateusernamehandler',
  ADMIN_NUMBER_OF_DELETION_REQUEST_HANDLER_URL:
    '/numberofdeletionrequestshandler',
  ADMIN_SEND_DUMMY_MAIL_HANDLER_URL: '/senddummymailtoadminhandler',
  ADMIN_VERIFY_USER_MODELS_DELETED_HANDLER_URL:
    '/verifyusermodelsdeletedhandler',
  ADMIN_DELETE_USER_HANDLER_URL: '/deleteuserhandler',
  ADMIN_SUPER_ADMIN_PRIVILEGES_HANDLER_URL: '/adminsuperadminhandler',
  ADMIN_BANNED_USERS_HANDLER: '/bannedusershandler',
  ADMIN_UPDATE_BLOG_POST_DATA_HANDLER: '/updateblogpostdatahandler',
  ADMIN_REGENERATE_TOPIC_SUMMARIES_URL: '/regenerate_topic_summaries_handler',
  AUTOMATIC_VOICEOVER_ADMIN_CONTROL_URL:
    '/automatic_voiceover_admin_control_handler',

  ADMIN_TAB_URLS: {
    ACTIVITIES: '#/activities',
    PLATFORM_PARAMETERS: '#/platform-parameters',
    ROLES: '#/roles',
    MISC: '#/misc',
  },

  EXPLORATION_INTERACTIONS_HANDLER: '/interactions',

  PROFILE_URL_TEMPLATE: '/profile/<username>',
} as const;
