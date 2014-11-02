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
 * @fileoverview Utilities for the using the Tabs widget during 
 * end-to-end testing with Protractor.js
 *
 * @author Jacob Davis (jacobdavis11@gmail.com)
 */

var forms = require('../../../../core/tests/protractor_utils/forms.js');

var customizeWidget = function(modal, tabTitles, tabContents) {
  expect(tabTitles.length === tabContents.length);
  var listEditor = forms.ListEditor(modal);

  listEditor.setLength(tabTitles.length);
  for (var i = 0; i < tabTitles.length; i++) {
    dictionaryEditor = listEditor.editEntry(i, 'Dictionary');
    dictionaryEditor.editEntry(0, 'UnicodeString').setText(tabTitles[i]);
    dictionaryEditor.editEntry(1, 'RichText').setPlainText(tabContents[i]);
  }
};

var customizeComplexWidget = function(modal, tabTitles, callbackFunctions) {
  expect(tabTitles.length === callbackFunctions.length);
  var listEditor = forms.ListEditor(modal);

  listEditor.setLength(tabTitles.length);
  for (var i = 0; i < tabTitles.length; i++) {
    dictionaryEditor = listEditor.editEntry(i, 'Dictionary');
    dictionaryEditor.editEntry(0, 'UnicodeString').setText(tabTitles[i]);
    callbackFunctions[i](dictionaryEditor.editEntry(1, 'RichText'));
  }
};

var expectComplexWidgetDetailsToMatch = function(elem, tabTitles, callbackFunctions) {
  elem.element(by.tagName('ul')).all(by.tagName('li')).then(function(titleElems) {
    expect(titleElems.length).toEqual(tabTitles.length);
    elem.element(by.css('.tab-content')).all(by.xpath('./*')).
        then(function(contentElems) {
      for (var i = 0; i < tabTitles.length; i++) {
        // Click on each tab in turn to check its contents
        expect(titleElems[i].getText()).toMatch(tabTitles[i]);
        titleElems[i].click();
        forms.expectRichText(
          contentElems[i].element(by.xpath('./span'))
        ).toMatch(callbackFunctions[i]);
      }
    });
  });
};

var expectWidgetDetailsToMatch = function(elem, tabTitles, tabContents) {
  expectComplexWidgetDetailsToMatch(
      elem, tabTitles, tabContents.map(function(content) {
    return function(checker) {
      checker.readPlainText(content);
    }
  }));
};

exports.customizeWidget = customizeWidget;
exports.customizeComplexWidget = customizeComplexWidget;
exports.expectWidgetDetailsToMatch = expectWidgetDetailsToMatch;
exports.expectComplexWidgetDetailsToMatch = expectComplexWidgetDetailsToMatch;