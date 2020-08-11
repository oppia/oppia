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
  'domain/feature_gating/PlatformParameterFilterObjectFactory';

const constants = require('constants.ts');

/**
 * @fileoverview Constants for the admin features tab.
 */

export class AdminFeaturesTabConstants {
  public static ALLOWED_SERVER_MODES = [
    ServerMode.Dev, ServerMode.Test, ServerMode.Prod
  ].map(val => val.toString());

  public static ALLOWED_CLIENT_TYPES = ['Android', 'Web'];

  public static ALLOWED_BROWSER_TYPES = [
    'Chrome', 'Edge', 'Safari', 'Firefox', 'Others'];

  public static APP_VERSION_REGEXP = /^\d+(?:\.\d+)*$/;

  public static ALLOWED_SITE_LANGUAGE_IDS = constants.SUPPORTED_SITE_LANGUAGES
    .map((lang: {id: string}) => lang.id);

  public static ALLOWED_APP_VERSION_FLAVORS = [
    'test', 'alpha', 'beta', 'release'];
}
