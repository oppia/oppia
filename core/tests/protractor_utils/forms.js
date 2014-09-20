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
 * @fileoverview Utilities for interacting with forms when carrrying
 * out end-to-end testing with protractor.
 *
 * @author Jacob Davis (jacobdavis11@gmail.com)
 */

// elem is the element within which the list occurs.
var editList = function(elem) {
  // Returns the list-entry with the given index
  var _retrieveEntry = function(entryNum) {
    return elem.element(by.repeater('item in localValue track by $index').
      row(entryNum));
  };
  // NOTE: this returns a promise, not an integer.
  var _getLength = function() {
    return elem.all(by.repeater('item in localValue track by $index')).
        then(function(items) {
      return items.length;
    });
  };

  return {
    editUnicodeEntry: function(entryNum) {
      return editUnicode(_retrieveEntry(entryNum));
    },
    editRichTextEntry: function(entryNum) {
      return editRichText(_retrieveEntry(entryNum));
    },
    // This returns the element of the appended entry, for further manipulation
    appendEntry: function(appendButtonText) {
      var listLength = _getLength();
      var appendButtonText = appendButtonText || 'Add element';
      elem.element(by.buttonText(appendButtonText)).click();
      return _retrieveEntry(listLength);
    }
  };
};

var editUnicode = function(elem) {
  return {
    setText: function(text) {
      elem.element(by.tagName('input')).clear();
      elem.element(by.tagName('input')).sendKeys(text);
    }
  };
};

var editReal = function(elem) {
  return {
    setValue: function(value) {
      elem.element(by.tagName('input')).clear();
      elem.element(by.tagName('input')).sendKeys(text);
    }
  };
};

var editRichText = function(elem) {
  var _appendContentText = function(text) {
    elem.element(by.tagName('rich-text-editor')).element(by.tagName('iframe')).
      sendKeys(text);
  };
  var _clickContentMenuButton = function(className) {
    elem.element(by.css('.wysiwyg')).element(by.css('.' + className)).click();
  };

  return {
    clear: function() {
      elem.element(by.tagName('rich-text-editor')).element(by.tagName('body')).
        clear();
    },
    appendPlainText: function(text) {
      _appendContentText(text);
    },
    appendBoldText: function(text) {
      _clickContentMenuButton('bold');
      _appendContentText(text);
      _clickContentMenuButton('bold');
    },
    appendItalicText: function(text) {
      _clickContentMenuButton('italic');
      _appendContentText(text);
      _clickContentMenuButton('italic');
    },
    appendUnderlineText: function(text) {
      _clickContentMenuButton('underline');
      _appendContentText(text);
      _clickContentMenuButton('underline');
    },
    appendOrderedList: function(textArray) {
      _appendContentText('\n');
      _clickContentMenuButton('insertOrderedList');
      for (var i = 0; i < textArray.length; i++) {
        _appendContentText(textArray[i] + '\n');
      }
      _clickContentMenuButton('insertOrderedList');
    },
    appendUnorderedList: function(textArray) {
      _appendContentText('\n');
      _clickContentMenuButton('insertUnorderedList');
      for (var i = 0; i < textArray.length; i++) {
        _appendContentText(textArray[i] + '\n');
      }
      _clickContentMenuButton('insertUnorderedList');
    },
    appendHorizontalRule: function() {
      _clickContentMenuButton('insertHorizontalRule');
    }
  };
};

var editAutocompleteDropdown = function(elem) {
  return {
    setText: function(text) {
      elem.element(by.css('.select2-container')).click();
      // NOTE: the input field is top-level in the DOM rather than below the
      // container.
      element(by.css('.select2-input')).sendKeys(text + '\n');
    }
  };
};

exports.editUnicode = editUnicode;
exports.editReal = editReal;
exports.editList = editList;
exports.editRichText = editRichText;
exports.editAutocompleteDropdown = editAutocompleteDropdown;