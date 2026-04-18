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
 * @fileoverview Page object for the get_started page, for use in Webdriverio
 * tests.
 */
var waitFor = require('./waitFor.js');
var action = require('./action.js');

var GetStartedPage = function () {
  var GET_STARTED_PAGE_URL = '/get-started';
  var EXPECTED_META_DESCRIPTION = 'Learn how to get started using Oppia.';

  this.get = async function () {
    await browser.url(GET_STARTED_PAGE_URL);
    await waitFor.pageToFullyLoad();
    // Wait for Angular to update the meta tags. The server returns generic
    // meta tags, and Angular updates them dynamically in ngOnInit. We need
    // to wait for this update to complete before the test checks the content.
    await browser.waitUntil(
      async () => {
        // We can't use a classname selector here.
        // eslint-disable-next-line oppia/e2e-practices
        var metaTag = await $('meta[itemprop="description"]');
        var content = await metaTag.getAttribute('content');
        return content === EXPECTED_META_DESCRIPTION;
      },
      {
        timeout: 10000,
        timeoutMsg:
          'Meta tags were not updated by Angular within the timeout period',
      }
    );
  };

  this.getMetaTagContent = async function (name, type) {
    if (type === 'itemprop') {
      var tag = $(`meta[itemprop="${name}"]`);
    } else if (type === 'og') {
      var tag = $(`meta[property="og:${name}"]`);
    } else if (type === 'name') {
      var tag = $(`meta[name="${name}"]`);
    } else {
      throw new Error('Unsupported tag type specified: ' + type);
    }

    await waitFor.presenceOf(tag, 'Tag is taking too long to appear');
    var contentAtrribute = await action.getAttribute(
      'Tag name',
      tag,
      'content'
    );
    return contentAtrribute;
  };
};

exports.GetStartedPage = GetStartedPage;
