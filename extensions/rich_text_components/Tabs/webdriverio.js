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
 * @fileoverview Utilities for using the Tabs component during
 * end-to-end testing with WebdriverIO.js
 */

var forms = require(process.cwd() + '/core/tests/webdriverio_utils/forms.js');
var waitFor = require(
  process.cwd() + '/core/tests/webdriverio_utils/waitFor.js'
);

// The 'tabArray' arg should be an array of dictionaries with keys:
//   'title': a string
//   'content': a function that gives rich text editing instructions.
var customizeComponent = async function (modal, tabArray) {
  var listEditor = await forms.ListEditor(modal);

  await listEditor.setLength(tabArray.length);
  for (var i = 0; i < tabArray.length; i++) {
    var dictionaryEditor = await listEditor.editItem(i, 'Dictionary');
    var unicodeEditor = await dictionaryEditor.editEntry(0, 'UnicodeString');
    await unicodeEditor.setValue(tabArray[i].title);
    var richTextEditor = await dictionaryEditor.editEntry(1, 'RichText');
    await richTextEditor.clear();
    await tabArray[i].content(richTextEditor);
  }
};

var expectComponentDetailsToMatch = async function (elem, tabArray) {
  var titleElems = elem.$$('.e2e-test-non-interactive-tabs-headers');
  expect(await titleElems.length).toEqual(tabArray.length);

  for (var i = 0; i < tabArray.length; i++) {
    // Click on each tab in turn to check its contents.
    await waitFor.visibilityOf(
      elem.$('.e2e-test-non-interactive-tabs-headers'),
      'Non-interactive-tabs-headers is taking too long to appear'
    );
    expect(await await titleElems[i].getText()).toMatch(tabArray[i].title);
    await (await titleElems[i]).click();

    const tabContentEl = elem.$(`.e2e-test-tab-content-${i}`);

    await waitFor.visibilityOf(
      tabContentEl,
      '.e2e-test-tab-content-' + i + 'is taking too long to appear'
    );
    await forms.expectRichText(tabContentEl).toMatch(tabArray[i].content);
  }
};

exports.customizeComponent = customizeComponent;
exports.expectComponentDetailsToMatch = expectComponentDetailsToMatch;
