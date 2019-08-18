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
 * @fileoverview Constants for the practice session.
 */

// TODO(#7092): Delete this file once migration is complete and these AngularJS
// equivalents of the Angular constants are no longer needed.
import { PracticeSessionPageConstants } from
  'pages/practice-session-page/practice-session-page.constants';

angular.module('oppia').constant(
  'TOTAL_QUESTIONS', PracticeSessionPageConstants.TOTAL_QUESTIONS);

angular.module('oppia').constant(
  'PRACTICE_SESSIONS_DATA_URL',
  PracticeSessionPageConstants.PRACTICE_SESSIONS_DATA_URL);

angular.module('oppia').constant(
  'TOPIC_VIEWER_PAGE', PracticeSessionPageConstants.TOPIC_VIEWER_PAGE);

angular.module('oppia').constant(
  'PRACTICE_SESSIONS_URL',
  PracticeSessionPageConstants.PRACTICE_SESSIONS_URL);
