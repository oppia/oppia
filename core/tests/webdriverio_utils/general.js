// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Minor general functional components for end-to-end testing
 * with protractor.
 */


var SERVER_URL_PREFIX = 'http://localhost:9001';
var EDITOR_URL_SLICE = '/create/';
var USER_PREFERENCES_URL = '/preferences';
var LOGIN_URL_SUFFIX = '/login';
var LOGOUT_URL_SUFFIX = '/logout';
var MODERATOR_URL_SUFFIX = '/moderator';
// Note that this only works in dev, due to the use of cache slugs in prod.
var SCRIPTS_URL_SLICE = '/assets/scripts/';

var FIRST_STATE_DEFAULT_NAME = 'Introduction';

var waitFor = require('./waitFor.js');

var expectErrorPage = async(errorNum) => {
  var errorContainer = await $('.protractor-test-error-container');
  await waitFor.visibilityOf(
    errorContainer,
    'Protractor test error container taking too long to appear');
  await expect(await errorContainer.getText()).
    toMatch(`Error ${errorNum}`);
};

exports.expectErrorPage = expectErrorPage;
exports.SERVER_URL_PREFIX = SERVER_URL_PREFIX;
exports.USER_PREFERENCES_URL = USER_PREFERENCES_URL;
exports.EDITOR_URL_SLICE = EDITOR_URL_SLICE;
exports.LOGIN_URL_SUFFIX = LOGIN_URL_SUFFIX;
exports.LOGOUT_URL_SUFFIX = LOGOUT_URL_SUFFIX;
exports.MODERATOR_URL_SUFFIX = MODERATOR_URL_SUFFIX;
exports.SCRIPTS_URL_SLICE = SCRIPTS_URL_SLICE;
exports.FIRST_STATE_DEFAULT_NAME = FIRST_STATE_DEFAULT_NAME;
