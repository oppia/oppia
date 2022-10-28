// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Provides constant global variables, for use in WebdriverIO
 * tests.
 */

var path = require('path');
var DOWNLOAD_PATH = path.resolve(__dirname, '../downloads');

module.exports = {
  SKILL_STATUS_UNASSIGNED: 'Unassigned',
  SKILL_STATUS_ASSIGNED: 'Assigned',
  TEST_SVG_PATH: '../data/test_svg.svg',
  DOWNLOAD_PATH: DOWNLOAD_PATH
};
