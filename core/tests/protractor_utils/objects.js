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
 * @fileoverview Utilities for interacting with object editor when carrrying
 * out end-to-end testing with protractor.
 *
 * @author Jacob Davis (jacobdavis11@gmail.com)
 */

var editList = function(elem) {
  var _retrieveEntry = function(entryNum) {
    return elem.element(by.repeater('item in localValue track by $index').
      row(entryNum));
  };
  // NOTE: this returns a promise, not an integer.
  var _getLength = function() {
    return elem.element.all(by.repeater('item in localValue track by $index')).
      then(function(items) {
        return items.length;
    });
  }
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
      var appendButtonText = appendButtonText || 'Add List Element'
      elem.element(by.buttonText(appendButtonText)).click();
      return _retrieveEntry(listLength);
    },
    deleteEntry: function(entryNum) {
      // TODO: FIX AND TEST!
      elem.element(by.repeater('item in localValue track by $index').
        row(entryNum)).child(2).element(by.tagName('button')).click();
    }
  };
};

// Some unicode editors require clicking "Edit" first and other do not; the
// needToClickEdit boolean indicates which this is.
var editUnicode = function(elem, needToClickEdit) {
  return {
    setText: function(text) {
      if (needToClickEdit) {
        elem.element(by.linkText('Edit')).click();
      }
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
  // It may or may not be necessary to click (Edit) to open the editor.
  // TODO: FIX & reinstate
  //try {
  //  elem.element(by.linkText('Edit')).click();
  //} catch(err) {}
  var _appendContentText = function(text) {
    elem.element(by.tagName('rich-text-editor')).element(by.tagName('iframe')).
      sendKeys(text);
  };
  var _clickContentMenu = function(className) {
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
      _clickContentMenu('bold');
      _appendContentText(text);
      _clickContentMenu('bold');
    },
    appendItalicText: function(text) {
      _clickContentMenu('italic');
      _appendContentText(text);
      _clickContentMenu('italic');
    },
    appendUnderlineText: function(text) {
      _clickContentMenu('underline');
      _appendContentText(text);
      _clickContentMenu('underline');
    },
    appendOrderedList: function(textArray) {
      _appendContentText('\n');
      _clickContentMenu('insertOrderedList');
      for (var i = 0; i < textArray.length; i++) {
        _appendContentText(textArray[i] + '\n');
      }
      _clickContentMenu('insertOrderedList');
    },
    appendUnorderedList: function(textArray) {
      _appendContentText('\n');
      _clickContentMenu('insertUnorderedList');
      for (var i = 0; i < textArray.length; i++) {
        _appendContentText(textArray[i] + '\n');
      }
      _clickContentMenu('insertUnorderedList');
    },
    appendHorizontalRule: function() {
      _clickContentMenu('insertHorizontalRule');
    }
  };
};

var editDropdown = function(elem) {
  return {
    sendText: function(text) {
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
exports.editDropdown = editDropdown;