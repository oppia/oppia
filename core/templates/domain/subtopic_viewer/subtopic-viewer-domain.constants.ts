// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Constants for the subtopic viewer domain.
 */

export const SubtopicViewerDomainConstants = {
  SUBTOPIC_DATA_URL_TEMPLATE: (
    '/subtopic_data_handler/<classroom_url_fragment>/' +
    '<topic_url_fragment>/<subtopic_url_fragment>'),
  TOPIC_VIEWER_URL_TEMPLATE: (
    '/learn/<classroom_url_fragment>/<topic_url_fragment>')
} as const;
