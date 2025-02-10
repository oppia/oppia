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
 * @fileoverview Utilities for interacting with objects during webdriverio
 * tests.
 */

// NOTE: all editors for objects that are used as parameters in a rule must
// implement a setValue() function to which a single argument can be sent
// that will completely determine the object.

var action = require(process.cwd() + '/core/tests/webdriverio_utils/action.js');
var forms = require(process.cwd() + '/core/tests/webdriverio_utils/forms.js');
var waitFor = require(
  process.cwd() + '/core/tests/webdriverio_utils/waitFor.js'
);

var MathEditor = function (elem) {
  return {
    setValue: async function (text) {
      await waitFor.elementToBeClickable(
        elem,
        `"${await elem.getTagName()}" takes too long to be clickable`
      );
      await action.click('Maths Editor', elem);
      // The active guppy div will be the one that is created last which is why
      // we fetch the last element.
      var mathInputElem = await $$('.e2e-test-guppy-div');
      lastElement = mathInputElem.length - 1;
      var present = await mathInputElem[lastElement].isExisting();
      if (present) {
        await action.addValue(
          'Maths Input Element',
          mathInputElem[lastElement],
          text
        );
      }
    },
    getValue: async function () {
      await waitFor.elementToBeClickable(
        elem,
        `"${elem.getTagName()}" takes too long to be clickable`
      );
      // The active guppy div will be the one that is created last which is why
      // we fetch the last element.
      var mathInputElem = await $$('.e2e-test-guppy-div');
      lastElement = mathInputElem.length - 1;
      var present = await mathInputElem[lastElement].isExisting();
      if (present) {
        var contentElem = await mathInputElem[lastElement].$('<annotation>');
        present = await contentElem.isExisting();
        if (present) {
          return await action.getText('Maths Input Element', contentElem);
        }
      }
    },
  };
};

var BooleanEditor = function (elem) {
  return {
    setValue: async function (value) {
      currentValue = await elem.$('<input>').isSelected();
      if (value !== currentValue) {
        await action.click('Boolean Editor', elem.$('<input>'));
      }
    },
  };
};

var CoordTwoDim = function (elem) {
  return {
    // The 'coordinates' arg is a two-element list whose elements represent
    // latitude and longitude respectively.
    setValue: async function (coordinates) {
      var coordTwoDimInput = await elem.$$('<input>');
      var count = coordTwoDimInput.length;
      await action.clear('Coord Two Dim Input', coordTwoDimInput[0]);
      await action.setValue(
        'Coord Two Dim Input',
        coordTwoDimInput[0],
        coordinates[0]
      );
      await action.clear('Coord Two Dim Input', coordTwoDimInput[count - 1]);
      await action.setValue(
        'Coord Two Dim Input',
        coordTwoDimInput[count - 1],
        coordinates[1]
      );
    },
  };
};

var FilepathEditor = function (elem) {
  return {
    upload: async function (filepath) {
      // TODO(Jacob): Modify filepath relative to the directory from which the
      // webdriverio code is operating.
      await action.setValue(
        'Filepath Editor Input',
        elem.$('.e2e-test-file-upload'),
        filepath
      );
    },
    setName: async function (name) {
      var fileNameInput = elem.$('.e2e-test-file-name');
      await action.clear('Filepath Editor Input', fileNameInput);
      await action.setValue('Filepath Editor Input', fileNameInput, name);
    },
  };
};

var FractionEditor = function (elem) {
  return {
    setValue: async function (value) {
      await action.clear('Fraction Editor Input', elem.$('<input>'));
      await action.setValue('Fraction Editor Input', elem.$('<input>'), value);
    },
    expectValueToBe: async function (expectedValue) {
      var value = await action.getAttribute(
        'Fraction Editor Input',
        elem.$('<input>'),
        'value'
      );
      expect(value).toEqual(expectedValue);
    },
  };
};

var IntEditor = function (elem) {
  return {
    setValue: async function (value) {
      await action.clear('Int Editor Input', elem.$('<input>'));
      await action.setValue('Int Editor Input', elem.$('<input>'), value);
    },
    expectValueToBe: async function (expectedValue) {
      var value = await action.getAttribute(
        'Int Editor Input',
        elem.$('<input>'),
        'value'
      );
      expect(value).toEqual(expectedValue);
    },
  };
};

var MathExpressionContentEditor = function (elem) {
  return {
    setValue: async function (rawLatex) {
      await action.clear(
        'MathExpression Content Editor Input',
        elem.$('<textarea>')
      );
      await action.setValue(
        'MathExpression Content Editor Input',
        elem.$('<textarea>'),
        rawLatex
      );
    },
  };
};

var NonnegativeIntEditor = function (elem) {
  return {
    setValue: async function (value) {
      await action.clear('Nonnegative Int Editor Input', elem.$('<input>'));
      await action.setValue(
        'Nonnegative Int Editor Input',
        elem.$('<input>'),
        value
      );
    },
    expectValueToBe: async function (expectedValue) {
      var value = await action.getAttribute(
        'Nonnegative Int Editor Input',
        elem.$('<input>'),
        'value'
      );
      expect(value).toEqual(expectedValue);
    },
  };
};

var NormalizedStringEditor = function (elem) {
  return {
    setValue: async function (value) {
      await action.clear('Normalized String Editor Input', elem.$('<input>'));
      await action.setValue(
        'Normalized String Editor Input',
        elem.$('<input>'),
        value
      );
    },
    expectValueToBe: async function (expectedValue) {
      var value = await action.getAttribute(
        'Normalized String Editor Input',
        elem.$('<input>'),
        'value'
      );
      expect(value).toEqual(expectedValue);
    },
  };
};

var NumberWithUnitsEditor = function (elem) {
  return {
    setValue: async function (value) {
      await action.clear('Number With Units Editor Input', elem.$('<input>'));
      await action.setValue(
        'Number With Units Editor Input',
        elem.$('<input>'),
        value
      );
    },
    expectValueToBe: async function (expectedValue) {
      var value = await action.getAttribute(
        'Number With Units Editor Input',
        elem.$('<input>'),
        'value'
      );
      expect(value).toEqual(expectedValue);
    },
  };
};

var ParameterNameEditor = function (elem) {
  return {
    setValue: async function (text) {
      var parameterSelector = await elem.$('<select>');
      await parameterSelector.selectByVisibleText(text);
    },
  };
};

var PositiveIntEditor = function (elem) {
  return {
    setValue: async function (value) {
      await action.clear('Positive Int Editor Input', elem.$('<input>'));
      await action.setValue(
        'Positive Int Editor Input',
        elem.$('<input>'),
        value
      );
    },
    expectValueToBe: async function (expectedValue) {
      await waitFor.visibilityOf(
        elem,
        `"${elem.getTagName()}" takes too long to be visible`
      );
      var value = await action.getAttribute(
        'Positive Int Editor Input',
        elem.$('<input>'),
        'value'
      );
      expect(value).toEqual(expectedValue);
    },
  };
};

var RatioExpressionEditor = function (elem) {
  return {
    setValue: async function (value) {
      await action.clear('Ratio Expression Editor Input', elem.$('<input>'));
      await action.setValue(
        'Ratio Expression Editor Input',
        elem.$('<input>'),
        value
      );
    },
    expectValueToBe: async function (expectedValue) {
      var value = await action.getAttribute(
        'Ratio Expression Editor Input',
        elem.$('<input>'),
        'value'
      );
      expect(value).toEqual(expectedValue);
    },
  };
};

var SanitizedUrlEditor = function (elem) {
  return {
    setValue: async function (text) {
      await action.clear('Sanitized Url Editor Input', elem.$('<input>'));
      await action.setValue(
        'Sanitized Url Editor Input',
        elem.$('<input>'),
        text
      );
    },
    expectValueToBe: async function (expectedValue) {
      var value = await action.getAttribute(
        'Sanitized Url Editor Input',
        elem.$('<input>'),
        'value'
      );
      expect(value).toEqual(expectedValue);
    },
  };
};

var TranslatableSetOfNormalizedStringEditor = function (elem) {
  return {
    setValue: async function (normalizedStrings) {
      // Clear all entries.
      await forms.ListEditor(elem).setLength(0);
      for (let i = 0; i < normalizedStrings.length; i++) {
        const normalizedStringEditor = await forms
          .ListEditor(elem)
          .addItem('NormalizedString');
        await normalizedStringEditor.setValue(normalizedStrings[i]);
      }
    },
  };
};

var SkillSelector = function (elem) {
  return {
    setValue: async function (skillDescription) {
      var skillSelectorInput = elem.$('.e2e-test-skill-name-input');
      var skillSelectorItem = elem.$('.e2e-test-rte-skill-selector-item');
      await action.setValue(
        'Skill Selector',
        skillSelectorInput,
        skillDescription
      );
      await waitFor.visibilityOf(skillSelectorItem);
      await action.click('Skill Selector', skillSelectorItem);
    },
  };
};

var UnicodeStringEditor = function (elem) {
  return {
    setValue: async function (text) {
      await action.clear('Unicode String Editor Input', elem.$('<input>'));
      await action.setValue(
        'Unicode String Editor Input',
        elem.$('<input>'),
        text
      );
    },
    getValue: async function () {
      return await action.getValue(
        'Unicode String Editor Input',
        elem.$('<input>')
      );
    },
    expectValueToBe: async function (expectedValue) {
      var value = await action.getAttribute(
        'Unicode Input Element',
        elem.$('<input>'),
        'value'
      );
      expect(value).toEqual(expectedValue);
    },
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
  UnicodeString: UnicodeStringEditor,
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
