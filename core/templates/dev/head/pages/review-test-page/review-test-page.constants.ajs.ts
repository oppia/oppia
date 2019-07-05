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
 * @fileoverview Constants for the review tests.
 */

import { ReviewTestPageConstants } from
  'pages/review-test-page/review-test-page.constants.ts';

var oppia = require('AppInit.ts').module;

oppia.constant(
  'REVIEW_TEST_DATA_URL', ReviewTestPageConstants.REVIEW_TEST_DATA_URL);
oppia.constant('REVIEW_TESTS_URL', ReviewTestPageConstants.REVIEW_TESTS_URL);

oppia.constant('STORY_VIEWER_PAGE', ReviewTestPageConstants.STORY_VIEWER_PAGE);
