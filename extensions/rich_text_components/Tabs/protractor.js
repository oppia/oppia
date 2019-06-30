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

var forms = require('../../../core/tests/protractor_utils/forms.js');

// The 'tabArray' arg should be an array of dictionaries with keys:
//   'title': a string
//   'content': a function that gives rich text editing instructions
var customizeComponent = function(modal, tabArray) {
  var listEditor = forms.ListEditor(modal);

  listEditor.setLength(tabArray.length);
  for (var i = 0; i < tabArray.length; i++) {
    var dictionaryEditor = listEditor.editItem(i, 'Dictionary');
    dictionaryEditor.editEntry(0, 'UnicodeString').setValue(tabArray[i].title);
    var richTextEditor = dictionaryEditor.editEntry(1, 'RichText');
    richTextEditor.clear();
    tabArray[i].content(richTextEditor);
  }
};

var expectComponentDetailsToMatch = function(elem, tabArray) {
  elem.element(by.tagName('ul')).all(by.tagName('li')).then(
    function(titleElems) {
      expect(titleElems.length).toEqual(tabArray.length);
      elem.element(by.css('.tab-content')).all(by.xpath('./*'))
        .then(function(contentElems) {
          for (var i = 0; i < tabArray.length; i++) {
            // Click on each tab in turn to check its contents
            expect(titleElems[i].getText()).toMatch(tabArray[i].title);
            titleElems[i].click();
            forms.expectRichText(
              contentElems[i].element(by.css('.protractor-test-tab-content'))
            ).toMatch(tabArray[i].content);
          }
        });
    }
  );
};

exports.customizeComponent = customizeComponent;
exports.expectComponentDetailsToMatch = expectComponentDetailsToMatch;
