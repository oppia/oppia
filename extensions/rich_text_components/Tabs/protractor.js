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
 * @fileoverview Utilities for using the Tabs component during
 * end-to-end testing with Protractor.js
 */

var forms = require(process.cwd() + '/core/tests/protractor_utils/forms.js');

// The 'tabArray' arg should be an array of dictionaries with keys:
//   'title': a string
//   'content': a function that gives rich text editing instructions
var customizeComponent = async function(modal, tabArray) {
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

var expectComponentDetailsToMatch = async function(elem, tabArray) {
  var titleElems = elem.element(by.tagName('ul')).all(by.tagName('li'));
  expect(await titleElems.count()).toEqual(tabArray.length);
  var contentElems = elem.element(by.css('.tab-content')).all(by.xpath('./*'));

  for (var i = 0; i < tabArray.length; i++) {
    // Click on each tab in turn to check its contents
    expect(await (await titleElems.get(i)).getText()).toMatch(
      tabArray[i].title);
    await (await titleElems.get(i)).click();
    await forms.expectRichText((await contentElems.get(i)).element(
      by.css('.protractor-test-tab-content'))
    ).toMatch(tabArray[i].content);
  }
};

exports.customizeComponent = customizeComponent;
exports.expectComponentDetailsToMatch = expectComponentDetailsToMatch;
