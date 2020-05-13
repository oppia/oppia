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
 * @fileoverview Page object for the get_started page, for use in Protractor
 * tests.
 */
var waitFor = require('./waitFor.js');

var GetStartedPage = function() {
  var GET_STARTED_PAGE_URL = '/get_started';

  this.get = function() {
    browser.get(GET_STARTED_PAGE_URL);
    return waitFor.pageToFullyLoad();
  };

  this.getMetaTagContent = function(name, type) {
    if (type === 'itemprop') {
      var tag = element(by.css('meta[itemprop="' + name + '"]'));
    } else if (type === 'og') {
      var tag = element(by.css('meta[property="og:' + name + '"]'));
    } else if (type === 'name') {
      var tag = element(by.css('meta[name="' + name + '"]'));
    } else {
      throw new Error('Unsupported tag type specified: ' + type);
    }

    return tag.getAttribute('content');
  };
};

exports.GetStartedPage = GetStartedPage;
