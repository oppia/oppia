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
 */

var forms = require('../../core/tests/protractor_utils/forms.js');

// NOTE: all editors for objects that are used as parameters in a rule must
// implement a setValue() function to which a single argument can be sent
// that will completely determine the object.

var BooleanEditor = function(elem) {
  return {
    setValue: function(value) {
      elem.element(by.tagName('input')).isSelected().then(
        function(currentValue) {
          if (value !== currentValue) {
            elem.element(by.tagName('input')).click();
          }
        }
      );
    }
  };
};

var CoordTwoDim = function(elem) {
  return {
    // The 'coordinates' arg is a two-element list whose elements represent
    // latitude and longitude respectively.
    setValue: function(coordinates) {
      elem.all(by.tagName('input')).first().clear();
      elem.all(by.tagName('input')).first().sendKeys(coordinates[0]);
      elem.all(by.tagName('input')).last().clear();
      elem.all(by.tagName('input')).last().sendKeys(coordinates[1]);
    }
  };
};

var FilepathEditor = function(elem) {
  return {
    upload: function(filepath) {
      // TODO (Jacob) Modify filepath relative to the directory from which the
      // protractor code is operating.
      elem.element(by.css('.protractor-test-file-upload')).sendKeys(filepath);
    },
    setName: function(name) {
      elem.element(by.css('.protractor-test-file-name')).clear();
      elem.element(by.css('.protractor-test-file-name')).sendKeys(name);
    }
  };
};

var FractionEditor = function(elem) {
  return {
    setValue: function(value) {
      elem.element(by.tagName('input')).clear();
      elem.element(by.tagName('input')).sendKeys(value);
    },
    expectValueToBe: function(expectedValue) {
      elem.element(by.tagName('input')).getAttribute('value').then(
        function(value) {
          expect(value).toEqual(expectedValue);
        }
      );
    }
  };
};

var IntEditor = function(elem) {
  return {
    setValue: function(value) {
      elem.element(by.tagName('input')).clear();
      elem.element(by.tagName('input')).sendKeys(value);
    },
    expectValueToBe: function(expectedValue) {
      elem.element(by.tagName('input')).getAttribute('value').then(
        function(value) {
          expect(value).toEqual(expectedValue);
        }
      );
    }
  };
};

var MathLatexStringEditor = function(elem) {
  return {
    setValue: function(rawLatex) {
      elem.element(by.tagName('textarea')).clear();
      elem.element(by.tagName('textarea')).sendKeys(rawLatex);
    }
  };
};

var NonnegativeIntEditor = function(elem) {
  return {
    setValue: function(value) {
      elem.element(by.tagName('input')).clear();
      elem.element(by.tagName('input')).sendKeys(value);
    },
    expectValueToBe: function(expectedValue) {
      elem.element(by.tagName('input')).getAttribute('value').then(
        function(value) {
          expect(value).toEqual(expectedValue);
        }
      );
    }
  };
};

var NormalizedStringEditor = function(elem) {
  return {
    setValue: function(value) {
      elem.element(by.tagName('input')).clear();
      elem.element(by.tagName('input')).sendKeys(value);
    },
    expectValueToBe: function(expectedValue) {
      elem.element(by.tagName('input')).getAttribute('value').then(
        function(value) {
          expect(value).toEqual(expectedValue);
        }
      );
    }
  };
};

var NumberWithUnitsEditor = function(elem) {
  return {
    setValue: function(value) {
      elem.element(by.tagName('input')).clear();
      elem.element(by.tagName('input')).sendKeys(value);
    },
    expectValueToBe: function(expectedValue) {
      elem.element(by.tagName('input')).getAttribute('value').then(
        function(value) {
          expect(value).toEqual(expectedValue);
        }
      );
    }
  };
};

var ParameterNameEditor = function(elem) {
  return {
    setValue: function(text) {
      elem.element(by.cssContainingText('option', text)).click();
    }
  };
};

var SanitizedUrlEditor = function(elem) {
  return {
    setValue: function(text) {
      elem.element(by.tagName('input')).clear();
      elem.element(by.tagName('input')).sendKeys(text);
    },
    expectValueToBe: function(expectedValue) {
      elem.element(by.tagName('input')).getAttribute('value').then(
        function(value) {
          expect(value).toEqual(expectedValue);
        }
      );
    }
  };
};

var UnicodeStringEditor = function(elem) {
  return {
    setValue: function(text) {
      elem.element(by.tagName('input')).clear();
      elem.element(by.tagName('input')).sendKeys(text);
    },
    expectValueToBe: function(expectedValue) {
      elem.element(by.tagName('input')).getAttribute('value').then(
        function(value) {
          expect(value).toEqual(expectedValue);
        }
      );
    }
  };
};

var OBJECT_EDITORS = {
  Boolean: BooleanEditor,
  CoordTwoDim: CoordTwoDim,
  Filepath: FilepathEditor,
  Fraction: FractionEditor,
  Int: IntEditor,
  MathLatexString: MathLatexStringEditor,
  NonnegativeInt: NonnegativeIntEditor,
  NormalizedString: NormalizedStringEditor,
  NumberWithUnits: NumberWithUnitsEditor,
  ParameterName: ParameterNameEditor,
  SanitizedUrl: SanitizedUrlEditor,
  UnicodeString: UnicodeStringEditor
};

exports.BooleanEditor = BooleanEditor;
exports.CoordTwoDim = CoordTwoDim;
exports.FractionEditor = FractionEditor;
exports.FilepathEditor = FilepathEditor;
exports.IntEditor = IntEditor;
exports.MathLatexStringEditor = MathLatexStringEditor;
exports.NonnegativeIntEditor = NonnegativeIntEditor;
exports.NormalizedStringEditor = NormalizedStringEditor;
exports.NumberWithUnitsEditor = NumberWithUnitsEditor;
exports.ParameterNameEditor = ParameterNameEditor;
exports.SanitizedUrlEditor = SanitizedUrlEditor;
exports.UnicodeStringEditor = UnicodeStringEditor;

exports.OBJECT_EDITORS = OBJECT_EDITORS;
