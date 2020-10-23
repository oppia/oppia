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

import { ServerMode } from
  'domain/platform_feature/platform-parameter-filter.model';

const constants = require('constants.ts');

/**
 * @fileoverview Constants for the admin features tab.
 */

export const AdminFeaturesTabConstants = {
  ALLOWED_SERVER_MODES: [
    ServerMode.Dev, ServerMode.Test, ServerMode.Prod
  ].map(val => val.toString()),

  ALLOWED_CLIENT_TYPES: <string[]>
    constants.PLATFORM_PARAMETER_ALLOWED_CLIENT_TYPES,

  ALLOWED_BROWSER_TYPES: <string[]>
    constants.PLATFORM_PARAMETER_ALLOWED_BROWSER_TYPES,

  // Matches app version with the numeric part only, hash and flavor are not
  // needed since hash is redundant and there is already app_version_flavor
  // filter.
  APP_VERSION_REGEXP: new RegExp(
    constants.PLATFORM_PARAMETER_APP_VERSION_WITHOUT_HASH_REGEXP),

  ALLOWED_SITE_LANGUAGE_IDS: constants.SUPPORTED_SITE_LANGUAGES
    .map((lang: {id: string}) => lang.id),

  ALLOWED_APP_VERSION_FLAVORS: <string[]>
    constants.PLATFORM_PARAMETER_ALLOWED_APP_VERSION_FLAVORS,
} as const;
