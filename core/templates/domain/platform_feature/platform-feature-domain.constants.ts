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

export const PlatformFeatureDomainConstants = {
  // Url for the dummy backend handler gated by the dummy_feature.
  DUMMY_HANDLER_URL: '/platform_feature_dummy_handler',

  // Url for the backend handler for evaluation of platform features.
  PLATFORM_FEATURES_EVALUATION_HANDLER_URL: (
    '/platform_features_evaluation_handler'),

  // Action name for request to the admin handler that updates the rules
  // of feature flags.
  UPDATE_FEATURE_FLAG_RULES_ACTION: 'update_feature_flag_rules'
} as const;
