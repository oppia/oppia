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

// NOTE: all editors for objects that are used as parameters in a rule must
// implement a setValue() function to which a single argument can be sent
// that will completely determine the object.
var action = require(process.cwd() + '/core/tests/protractor_utils/action.js');
var forms = require(process.cwd() + '/core/tests/protractor_utils/forms.js');
var waitFor = require(
  process.cwd() + '/core/tests/protractor_utils/waitFor.js');

var MathEditor = function(elem) {
  return {
    setValue: async function(text) {
      await waitFor.elementToBeClickable(
        elem, `"${elem.getTagName()}" takes too long to be clickable`);
      await elem.click();
      // The active guppy div will be the one that is created last which is why
      // we fetch the last element.
      var mathInputElem = element.all(by.css(
        '.e2e-test-guppy-div')).last();
      var present = await mathInputElem.isPresent();
      if (present) {
        await mathInputElem.sendKeys(text);
      }
    },
    getValue: async function() {
      await waitFor.elementToBeClickable(
        elem, `"${elem.getTagName()}" takes too long to be clickable`);
      // The active guppy div will be the one that is created last which is why
      // we fetch the last element.
      var mathInputElem = element.all(by.css(
        '.e2e-test-guppy-div')).last();
      var present = await mathInputElem.isPresent();
      if (present) {
        var contentElem = mathInputElem.element(by.tagName('annotation'));
        present = await contentElem.isPresent();
        if (present) {
          return contentElem.getText();
        }
      }
    }
  };
};

var BooleanEditor = function(elem) {
  return {
    setValue: async function(value) {
      currentValue = await elem.element(by.tagName('input')).isSelected();
      if (value !== currentValue) {
        await elem.element(by.tagName('input')).click();
      }
    }
  };
};

var CoordTwoDim = function(elem) {
  return {
    // The 'coordinates' arg is a two-element list whose elements represent
    // latitude and longitude respectively.
    setValue: async function(coordinates) {
      await elem.all(by.tagName('input')).first().clear();
      await elem.all(by.tagName('input')).first().sendKeys(coordinates[0]);
      await elem.all(by.tagName('input')).last().clear();
      await elem.all(by.tagName('input')).last().sendKeys(coordinates[1]);
    }
  };
};

var FilepathEditor = function(elem) {
  return {
    upload: async function(filepath) {
      // TODO(Jacob): Modify filepath relative to the directory from which the
      // protractor code is operating.
      await elem.element(by.css('.e2e-test-file-upload'))
        .sendKeys(filepath);
    },
    setName: async function(name) {
      await elem.element(by.css('.e2e-test-file-name')).clear();
      await elem.element(by.css('.e2e-test-file-name')).sendKeys(name);
    }
  };
};

var FractionEditor = function(elem) {
  return {
    setValue: async function(value) {
      await elem.element(by.tagName('input')).clear();
      await elem.element(by.tagName('input')).sendKeys(value);
    },
    expectValueToBe: async function(expectedValue) {
      var value = await elem.element(by.tagName('input')).getAttribute('value');
      expect(value).toEqual(expectedValue);
    }
  };
};

var IntEditor = function(elem) {
  return {
    setValue: async function(value) {
      await elem.element(by.tagName('input')).clear();
      await elem.element(by.tagName('input')).sendKeys(value);
    },
    expectValueToBe: async function(expectedValue) {
      var value = await elem.element(by.tagName('input')).getAttribute('value');
      expect(value).toEqual(expectedValue);
    }
  };
};

var MathExpressionContentEditor = function(elem) {
  return {
    setValue: async function(rawLatex) {
      await elem.element(by.tagName('textarea')).clear();
      await elem.element(by.tagName('textarea')).sendKeys(rawLatex);
    }
  };
};

var NonnegativeIntEditor = function(elem) {
  return {
    setValue: async function(value) {
      await elem.element(by.tagName('input')).clear();
      await elem.element(by.tagName('input')).sendKeys(value);
    },
    expectValueToBe: async function(expectedValue) {
      var value = await elem.element(by.tagName('input')).getAttribute('value');
      expect(value).toEqual(expectedValue);
    }
  };
};

var NormalizedStringEditor = function(elem) {
  return {
    setValue: async function(value) {
      await elem.element(by.tagName('input')).clear();
      await elem.element(by.tagName('input')).sendKeys(value);
    },
    expectValueToBe: async function(expectedValue) {
      var value = await elem.element(by.tagName('input')).getAttribute('value');
      expect(value).toEqual(expectedValue);
    }
  };
};

var NumberWithUnitsEditor = function(elem) {
  return {
    setValue: async function(value) {
      await elem.element(by.tagName('input')).clear();
      await elem.element(by.tagName('input')).sendKeys(value);
    },
    expectValueToBe: async function(expectedValue) {
      var value = await elem.element(by.tagName('input')).getAttribute('value');
      expect(value).toEqual(expectedValue);
    }
  };
};

var ParameterNameEditor = function(elem) {
  return {
    setValue: async function(text) {
      await elem.element(by.cssContainingText('option', text)).click();
    }
  };
};

var PositiveIntEditor = function(elem) {
  return {
    setValue: async function(value) {
      await action.clear(
        'Positive Int Editor Input', elem.element(by.tagName('input')));
      await action.sendKeys(
        'Positive Int Editor Input', elem.element(by.tagName('input')), value);
    },
    expectValueToBe: async function(expectedValue) {
      await waitFor.visibilityOf(
        elem, `"${elem.getTagName()}" takes too long to be visible`);
      var value = elem.element(by.tagName('input')).getAttribute('value');
      expect(value).toEqual(expectedValue);
    }
  };
};

var RatioExpressionEditor = function(elem) {
  return {
    setValue: async function(value) {
      await elem.element(by.tagName('input')).clear();
      await elem.element(by.tagName('input')).sendKeys(value);
    },
    expectValueToBe: async function(expectedValue) {
      var value = await elem.element(by.tagName('input')).getAttribute('value');
      expect(value).toEqual(expectedValue);
    }
  };
};

var SanitizedUrlEditor = function(elem) {
  return {
    setValue: async function(text) {
      await elem.element(by.tagName('input')).clear();
      await elem.element(by.tagName('input')).sendKeys(text);
    },
    expectValueToBe: async function(expectedValue) {
      var value = await elem.element(by.tagName('input')).getAttribute('value');
      expect(value).toEqual(expectedValue);
    }
  };
};

var TranslatableSetOfNormalizedStringEditor = function(elem) {
  return {
    setValue: async function(normalizedStrings) {
      // Clear all entries.
      await forms.ListEditor(elem).setLength(0);
      for (let i = 0; i < normalizedStrings.length; i++) {
        const normalizedStringEditor = await forms.ListEditor(elem).addItem(
          'NormalizedString');
        await normalizedStringEditor.setValue(normalizedStrings[i]);
      }
    }
  };
};

var SkillSelector = function(elem) {
  return {
    setValue: async function(skillDescription) {
      await elem.element(
        by.css('.e2e-test-skill-name-input')).sendKeys(skillDescription);
      await waitFor.visibilityOf(elem.element(
        by.css('.e2e-test-rte-skill-selector-item')));
      await elem.element(
        by.css('.e2e-test-rte-skill-selector-item')).click();
    }
  };
};

var UnicodeStringEditor = function(elem) {
  return {
    setValue: async function(text) {
      await elem.element(by.tagName('input')).clear();
      await elem.element(by.tagName('input')).sendKeys(text);
    },
    expectValueToBe: async function(expectedValue) {
      var value = await elem.element(by.tagName('input')).getAttribute('value');
      expect(value).toEqual(expectedValue);
    }
  };
};

var OBJECT_EDITORS = {
  AlgebraicExpression: MathEditor,
  Boolean: BooleanEditor,
  CoordTwoDim: CoordTwoDim,
  Filepath: FilepathEditor,
  Fraction: FractionEditor,
  Int: IntEditor,
  MathEquation: MathEditor,
  MathExpressionContent: MathExpressionContentEditor,
  NonnegativeInt: NonnegativeIntEditor,
  NormalizedString: NormalizedStringEditor,
  NumberWithUnits: NumberWithUnitsEditor,
  NumericExpression: MathEditor,
  ParameterName: ParameterNameEditor,
  PositionOfTerms: ParameterNameEditor,
  PositiveInt: PositiveIntEditor,
  RatioExpression: RatioExpressionEditor,
  SanitizedUrl: SanitizedUrlEditor,
  TranslatableSetOfNormalizedString: TranslatableSetOfNormalizedStringEditor,
  SkillSelector: SkillSelector,
  UnicodeString: UnicodeStringEditor
};

exports.MathEditor = MathEditor;
exports.BooleanEditor = BooleanEditor;
exports.CoordTwoDim = CoordTwoDim;
exports.FractionEditor = FractionEditor;
exports.FilepathEditor = FilepathEditor;
exports.IntEditor = IntEditor;
exports.MathExpressionContentEditor = MathExpressionContentEditor;
exports.NonnegativeIntEditor = NonnegativeIntEditor;
exports.NormalizedStringEditor = NormalizedStringEditor;
exports.NumberWithUnitsEditor = NumberWithUnitsEditor;
exports.ParameterNameEditor = ParameterNameEditor;
exports.PositiveIntEditor = PositiveIntEditor;
exports.RatioExpressionEditor = RatioExpressionEditor;
exports.SanitizedUrlEditor = SanitizedUrlEditor;
exports.SkillSelector = SkillSelector;
exports.UnicodeStringEditor = UnicodeStringEditor;

exports.OBJECT_EDITORS = OBJECT_EDITORS;
