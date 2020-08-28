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

export class PracticeSessionPageConstants {
  public static TOTAL_QUESTIONS = 20;

  public static PRACTICE_SESSIONS_DATA_URL = (
    '/practice_session/data/<classroom_url_fragment>/' +
    '<topic_url_fragment>?selected_subtopic_ids=' +
    '<comma_separated_subtopic_ids>');

  public static TOPIC_VIEWER_PAGE = (
    '/learn/<classroom_url_fragment>/<topic_url_fragment>');

  public static PRACTICE_SESSIONS_URL = (
    '/learn/<classroom_url_fragment>/<topic_url_fragment>/practice/' +
    'session?selected_subtopic_ids=<comma_separated_subtopic_ids>');
}
