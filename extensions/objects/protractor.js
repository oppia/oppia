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
 * @fileoverview Utilities for interacting with objects during protractor
 * tests.
 *
 * @author Jacob Davis (jacobdavis11@gmail.com)
 */

var forms = require('../../core/tests/protractor_utils/forms.js');

var BooleanEditor = function(elem) {
  return {
    setValue: function(value) {
      elem.element(by.tagName('input')).isSelected().then(function(currentValue) {
        if (value !== currentValue) {
          elem.element(by.tagName('input')).click();
        }
      })
    }
  };
};

var FilepathEditor = function(elem) {
  return {
    upload: function(filepath) {
      // TODO: FIX AND TIDY!
      var absolutePath = require('path').resolve(__dirname, filepath);
      elem.element(by.css('.protractor-test-file-upload')).sendKeys(filepath);
    },
    setName: function(name) {
      elem.element(by.css('.protractor-test-file-name')).clear();
      elem.element(by.css('.protractor-test-file-name')).sendKeys(name);
    }
  };
};

var IntEditor = function(elem) {
  return {
    setValue: function(value) {
      elem.element(by.tagName('input')).clear();
      elem.element(by.tagName('input')).sendKeys(value);
    }
  };
};

var MathLatexStringEditor = function(elem) {
  return {
    setText: function(rawLatex) {
      elem.element(by.tagName('textarea')).clear();
      elem.element(by.tagName('textarea')).sendKeys(rawLatex);
    }
  };
};

var SanitizedUrlEditor = function(elem) {
  return {
    setText: function(text) {
      elem.element(by.tagName('input')).clear();
      elem.element(by.tagName('input')).sendKeys(text);
    }
  };
};

var UnicodeStringEditor = function(elem) {
  return {
    setText: function(text) {
      elem.element(by.tagName('input')).clear();
      elem.element(by.tagName('input')).sendKeys(text);
    }
  };
};

var OBJECT_EDITORS = {
  'Boolean': BooleanEditor,
  'Filepath': FilepathEditor,
  'Int': IntEditor,
  'MathLatexString': MathLatexStringEditor,
  'SanitizedUrl': SanitizedUrlEditor,
  'UnicodeString': UnicodeStringEditor
};

exports.BooleanEditor = BooleanEditor;
exports.FilepathEditor = FilepathEditor;
exports.IntEditor = IntEditor;
exports.MathLatexStringEditor = MathLatexStringEditor;
exports.SanitizedUrlEditor = SanitizedUrlEditor;
exports.UnicodeStringEditor = UnicodeStringEditor;

exports.OBJECT_EDITORS = OBJECT_EDITORS;