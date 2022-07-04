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
  process.cwd() + '/core/tests/webdriverio_utils/waitFor.js');

var MathEditor = function(elem) {
  return {
    setValue: async function(text) {
      await waitFor.elementToBeClickable(
        elem, `"${elem.getTagName()}" takes too long to be clickable`);
      await elem.click();
      // The active guppy div will be the one that is created last which is why
      // we fetch the last element.
      var mathInputElem = $$('.e2e-test-guppy-div');
      lastElement = mathInputElem.length - 1;
      var present = await mathInputElem[lastElement].isExisting();
      if (present) {
        await mathInputElem.setValue(text);
      }
    },
    getValue: async function() {
      await waitFor.elementToBeClickable(
        elem, `"${elem.getTagName()}" takes too long to be clickable`);
      // The active guppy div will be the one that is created last which is why
      // we fetch the last element.
      var mathInputElem = $$(
        '.e2e-test-guppy-div');
      lastElement = mathInputElem.length - 1;
      var present = await mathInputElem[lastElement].isExisting();
      if (present) {
        var contentElem = mathInputElem.$('<annotation>');
        present = await contentElem.isExisting();
        if (present) {
          return await contentElem.getText();
        }
      }
    }
  };
};

var BooleanEditor = function(elem) {
  return {
    setValue: async function(value) {
      currentValue = await elem.$('<input>').isSelected();
      if (value !== currentValue) {
        await elem.$('<input>').click();
      }
    }
  };
};

var CoordTwoDim = function(elem) {
  return {
    // The 'coordinates' arg is a two-element list whose elements represent
    // latitude and longitude respectively.
    setValue: async function(coordinates) {
      var count = await elem.$$('<input>').length;
      await elem.$$('<input>')[0].clearValue();
      await elem.$$('<input>')[0].setValue(coordinates[0]);
      await elem.$$('<input>')[count - 1].clearValue();
      await elem.$$('<input>')[count - 1].setValue(coordinates[1]);
    }
  };
};

var FilepathEditor = function(elem) {
  return {
    upload: async function(filepath) {
      // TODO(Jacob): Modify filepath relative to the directory from which the
      // protractor code is operating.
      await elem.$('.e2e-test-file-upload')
        .setValue(filepath);
    },
    setName: async function(name) {
      await elem.$('.e2e-test-file-name').clearValue();
      await elem.$('.e2e-test-file-name').setValue(name);
    }
  };
};

var FractionEditor = function(elem) {
  return {
    setValue: async function(value) {
      await elem.$('<input>').clearValue();
      await elem.$('<input>').setValue(value);
    },
    expectValueToBe: async function(expectedValue) {
      var value = await elem.$('<input>').getAttribute('value');
      expect(value).toEqual(expectedValue);
    }
  };
};

var IntEditor = function(elem) {
  return {
    setValue: async function(value) {
      await elem.$('<input>').clearValue();
      await elem.$('<input>').setValue(value);
    },
    expectValueToBe: async function(expectedValue) {
      var value = await elem.$('<input>').getAttribute('value');
      expect(value).toEqual(expectedValue);
    }
  };
};

var MathExpressionContentEditor = function(elem) {
  return {
    setValue: async function(rawLatex) {
      await elem.$('<textarea>').clearValue();
      await elem.$('<textarea>').setValue(rawLatex);
    }
  };
};

var NonnegativeIntEditor = function(elem) {
  return {
    setValue: async function(value) {
      await elem.$('<input>').clearValue();
      await elem.$('<input>').setValue(value);
    },
    expectValueToBe: async function(expectedValue) {
      var value = await elem.$('<input>').getAttribute('value');
      expect(value).toEqual(expectedValue);
    }
  };
};

var NormalizedStringEditor = function(elem) {
  return {
    setValue: async function(value) {
      await elem.$('<input>').clearValue();
      await elem.$('<input>').setValue(value);
    },
    expectValueToBe: async function(expectedValue) {
      var value = await elem.$('<input>').getAttribute('value');
      expect(value).toEqual(expectedValue);
    }
  };
};

var NumberWithUnitsEditor = function(elem) {
  return {
    setValue: async function(value) {
      await elem.$('<input>').clearValue();
      await elem.$('<input>').setValue(value);
    },
    expectValueToBe: async function(expectedValue) {
      var value = await elem.$('<input>').getAttribute('value');
      expect(value).toEqual(expectedValue);
    }
  };
};

var ParameterNameEditor = function(elem) {
  return {
    setValue: async function(text) {
      await elem.$(`option=${text}`).click();
    }
  };
};

var PositiveIntEditor = function(elem) {
  return {
    setValue: async function(value) {
      await action.clear(
        'Positive Int Editor Input', elem.$('<input>'));
      await action.setValue(
        'Positive Int Editor Input', elem.$('<input>'), value);
    },
    expectValueToBe: async function(expectedValue) {
      await waitFor.visibilityOf(
        elem, `"${elem.getTagName()}" takes too long to be visible`);
      var value = await elem.$('<input>').getAttribute('value');
      expect(value).toEqual(expectedValue);
    }
  };
};

var RatioExpressionEditor = function(elem) {
  return {
    setValue: async function(value) {
      await elem.$('<input>').clearValue();
      await elem.$('<input>').setValue(value);
    },
    expectValueToBe: async function(expectedValue) {
      var value = await elem.$('<input>').getAttribute('value');
      expect(value).toEqual(expectedValue);
    }
  };
};

var SanitizedUrlEditor = function(elem) {
  return {
    setValue: async function(text) {
      await elem.$('<input>').clearValue();
      await elem.$('<input>').setValue(text);
    },
    expectValueToBe: async function(expectedValue) {
      var value = await elem.$('<input>').getAttribute('value');
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
      await elem.$(
        '.e2e-test-skill-name-input').setValue(skillDescription);
      await waitFor.visibilityOf(elem.$(
        '.e2e-test-rte-skill-selector-item'));
      await elem.$('.e2e-test-rte-skill-selector-item').click();
    }
  };
};

var UnicodeStringEditor = function(elem) {
  return {
    setValue: async function(text) {
      await elem.$('<input>').clearValue();
      await elem.$('<input>').setValue(text);
    },
    expectValueToBe: async function(expectedValue) {
      var value = await elem.$('<input>').getAttribute('value');
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
