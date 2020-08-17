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

/**
 * @fileoverview Constants for platform feature domain.
 */

import { AdminPageConstants } from
  'pages/admin-page/admin-page.constants';

export class PlatformFeatureDomainConstants {
  public static PLATFORM_FEATURE_HANDLER_URL = '/platformfeaturehandler';
  public static DUMMY_HANDLER_URL = '/platformfeaturedummyhandler';
  public static ADMIN_HANDLER_URL = AdminPageConstants.ADMIN_HANDLER_URL;
  public static UPDATE_FEATURE_FLAG_RULES_ACTION = 'update_feature_flag_rules';
}
