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
 * @fileoverview Module for the landing page.
 */

var load = require.context('./', true, /\.module\.ts$/)
load.keys().forEach(load);
module.exports = angular.module('topicLandingPageModule', []).name;

angular.module('topicLandingPageModule', ['topicLandingPageStewardsModule']);

// Note: This oppia constant needs to be keep in sync with
// AVAILABLE_LANDING_PAGES constant defined in feconf.py file.

angular.module('topicLandingPageModule').constant('TOPIC_LANDING_PAGE_DATA', {
  maths: {
    fractions: {
      collection_id: '4UgTQUc1tala',
      page_data: {
        image_1: 'matthew_paper.png',
        image_2: 'matthew_fractions.png',
        video: 'fractions_video.mp4',
      }
    },
    ratios: {
      collection_id: '53gXGLIR044l',
      page_data: {
        image_1: 'ratios_James.png',
        image_2: 'ratios_question.png',
        video: 'ratios_video.mp4',
      }
    }
  }
});
