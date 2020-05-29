// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview unit test for RuleInputTypeFactory.
 */

import { TestBed } from '@angular/core/testing';

import { RuleInputTypeFactory } from
  'domain/exploration/RuleInputTypeFactory';
import { IRuleInput } from
  'domain/exploration/RuleObjectFactory';

describe('RuleInputTypeFactory', () => {
  let ruleInputTypeFactory: RuleInputTypeFactory = null;
  let inputGraph: IRuleInput = null;
  let inputNotes: IRuleInput = null;
  let inputFraction: IRuleInput = null;
  let inputNumberWithUnits: IRuleInput = null;
  let inputString: IRuleInput = null;
  let inputNumber: IRuleInput = null;
  let inputStringArray: IRuleInput = null;
  let inputStringArrayArray: IRuleInput = null;
  let inputnumberArray: IRuleInput = null;

  beforeEach(() => {
    ruleInputTypeFactory = TestBed.get(RuleInputTypeFactory);
    inputGraph = {
      vertices: new Array(10)
    };
    inputNotes = [{
      readableNoteName: 'E4',
      noteDuration: {
        num: 1,
        den: 1
      }
    }];
    inputFraction = {
      isNegative: false,
      wholeNumber: 0,
      numerator: 1,
      denominator: 1
    };
    inputNumberWithUnits = {
      type: 'fraction',
      real: 0,
      fraction: inputFraction,
      units: [
        {
          unit: 'kg',
          exponent: 1
        },
        {
          unit: 'm',
          exponent: -2
        }]
    };
    inputString = 'string';
    inputNumber = 0;
    inputStringArray = ['string1', 'string2'];
    inputStringArrayArray = [['a', 'b'], ['d'], ['c']];
    inputnumberArray = [0];
  });

  it('should correctly identify graph', () => {
    expect(ruleInputTypeFactory.getGraphInstance(inputGraph)).toEqual({
      vertices: new Array(10)
    });
    expect(() => {
      ruleInputTypeFactory.getGraphInstance(inputNotes);
    }).toThrowError('variable is not of type IGraphBackendDict.');
    expect(() => {
      ruleInputTypeFactory.getGraphInstance(inputFraction);
    }).toThrowError('variable is not of type IGraphBackendDict.');
    expect(() => {
      ruleInputTypeFactory.getGraphInstance(inputNumberWithUnits);
    }).toThrowError('variable is not of type IGraphBackendDict.');
    expect(() => {
      ruleInputTypeFactory.getGraphInstance(inputString);
    }).toThrowError('variable is not of type IGraphBackendDict.');
    expect(() => {
      ruleInputTypeFactory.getGraphInstance(inputNumber);
    }).toThrowError('variable is not of type IGraphBackendDict.');
    expect(() => {
      ruleInputTypeFactory.getGraphInstance(inputStringArray);
    }).toThrowError('variable is not of type IGraphBackendDict.');
    expect(() => {
      ruleInputTypeFactory.getGraphInstance(inputStringArrayArray);
    }).toThrowError('variable is not of type IGraphBackendDict.');
    expect(() => {
      ruleInputTypeFactory.getGraphInstance(inputnumberArray);
    }).toThrowError('variable is not of type IGraphBackendDict.');
  });

  it('should correctly identify notes', () => {
    expect(ruleInputTypeFactory.getNotesInstance(inputNotes)).toEqual([{
      readableNoteName: 'E4',
      noteDuration: {
        num: 1,
        den: 1
      }
    }]);
    expect(ruleInputTypeFactory.getNotesInstance([])).toEqual([]);
    expect(() => {
      ruleInputTypeFactory.getNotesInstance(inputGraph);
    }).toThrowError('variable is not of type INote[].');
    expect(() => {
      ruleInputTypeFactory.getNotesInstance(inputFraction);
    }).toThrowError('variable is not of type INote[].');
    expect(() => {
      ruleInputTypeFactory.getNotesInstance(inputNumberWithUnits);
    }).toThrowError('variable is not of type INote[].');
    expect(() => {
      ruleInputTypeFactory.getNotesInstance(inputString);
    }).toThrowError('variable is not of type INote[].');
    expect(() => {
      ruleInputTypeFactory.getNotesInstance(inputNumber);
    }).toThrowError('variable is not of type INote[].');
    expect(() => {
      ruleInputTypeFactory.getNotesInstance(inputStringArray);
    }).toThrowError('variable is not of type INote[].');
    expect(() => {
      ruleInputTypeFactory.getNotesInstance(inputStringArrayArray);
    }).toThrowError('variable is not of type INote[].');
    expect(() => {
      ruleInputTypeFactory.getNotesInstance(inputnumberArray);
    }).toThrowError('variable is not of type INote[].');
  });

  it('should correctly identify fraction', () => {
    expect(ruleInputTypeFactory.getFractionInstance(inputFraction)).toEqual({
      isNegative: false,
      wholeNumber: 0,
      numerator: 1,
      denominator: 1
    });
    expect(() => {
      ruleInputTypeFactory.getFractionInstance(inputGraph);
    }).toThrowError('variable is not of type IFractionDict.');
    expect(() => {
      ruleInputTypeFactory.getFractionInstance(inputNotes);
    }).toThrowError('variable is not of type IFractionDict.');
    expect(() => {
      ruleInputTypeFactory.getFractionInstance(inputNumberWithUnits);
    }).toThrowError('variable is not of type IFractionDict.');
    expect(() => {
      ruleInputTypeFactory.getFractionInstance(inputString);
    }).toThrowError('variable is not of type IFractionDict.');
    expect(() => {
      ruleInputTypeFactory.getFractionInstance(inputNumber);
    }).toThrowError('variable is not of type IFractionDict.');
    expect(() => {
      ruleInputTypeFactory.getFractionInstance(inputStringArray);
    }).toThrowError('variable is not of type IFractionDict.');
    expect(() => {
      ruleInputTypeFactory.getFractionInstance(inputStringArrayArray);
    }).toThrowError('variable is not of type IFractionDict.');
    expect(() => {
      ruleInputTypeFactory.getFractionInstance(inputnumberArray);
    }).toThrowError('variable is not of type IFractionDict.');
  });

  it('should correctly identify number with units', () => {
    expect(ruleInputTypeFactory.getNumberWithUnitsInstance(
      inputNumberWithUnits)).toEqual({
      type: 'fraction',
      real: 0,
      fraction: {
        isNegative: false,
        wholeNumber: 0,
        numerator: 1,
        denominator: 1
      },
      units: [
        {
          unit: 'kg',
          exponent: 1
        },
        {
          unit: 'm',
          exponent: -2
        }]
    });
    expect(() => {
      ruleInputTypeFactory.getNumberWithUnitsInstance(inputGraph);
    }).toThrowError('variable is not of type INumberWithUnitsBackendDict.');
    expect(() => {
      ruleInputTypeFactory.getNumberWithUnitsInstance(inputNotes);
    }).toThrowError('variable is not of type INumberWithUnitsBackendDict.');
    expect(() => {
      ruleInputTypeFactory.getNumberWithUnitsInstance(inputFraction);
    }).toThrowError('variable is not of type INumberWithUnitsBackendDict.');
    expect(() => {
      ruleInputTypeFactory.getNumberWithUnitsInstance(inputString);
    }).toThrowError('variable is not of type INumberWithUnitsBackendDict.');
    expect(() => {
      ruleInputTypeFactory.getNumberWithUnitsInstance(inputNumber);
    }).toThrowError('variable is not of type INumberWithUnitsBackendDict.');
    expect(() => {
      ruleInputTypeFactory.getNumberWithUnitsInstance(inputStringArray);
    }).toThrowError('variable is not of type INumberWithUnitsBackendDict.');
    expect(() => {
      ruleInputTypeFactory.getNumberWithUnitsInstance(inputStringArrayArray);
    }).toThrowError('variable is not of type INumberWithUnitsBackendDict.');
    expect(() => {
      ruleInputTypeFactory.getNumberWithUnitsInstance(inputnumberArray);
    }).toThrowError('variable is not of type INumberWithUnitsBackendDict.');
  });

  it('should correctly identify string', () => {
    expect(ruleInputTypeFactory.getStringInstance(
      inputString)).toEqual('string');
    expect(() => {
      ruleInputTypeFactory.getStringInstance(inputGraph);
    }).toThrowError('variable is not of type string.');
    expect(() => {
      ruleInputTypeFactory.getStringInstance(inputNotes);
    }).toThrowError('variable is not of type string.');
    expect(() => {
      ruleInputTypeFactory.getStringInstance(inputFraction);
    }).toThrowError('variable is not of type string.');
    expect(() => {
      ruleInputTypeFactory.getStringInstance(inputNumberWithUnits);
    }).toThrowError('variable is not of type string.');
    expect(() => {
      ruleInputTypeFactory.getStringInstance(inputNumber);
    }).toThrowError('variable is not of type string.');
    expect(() => {
      ruleInputTypeFactory.getStringInstance(inputStringArray);
    }).toThrowError('variable is not of type string.');
    expect(() => {
      ruleInputTypeFactory.getStringInstance(inputStringArrayArray);
    }).toThrowError('variable is not of type string.');
    expect(() => {
      ruleInputTypeFactory.getStringInstance(inputnumberArray);
    }).toThrowError('variable is not of type string.');
  });

  it('should correctly identify number', () => {
    expect(ruleInputTypeFactory.getNumberInstance(
      inputNumber)).toEqual(0);
    expect(() => {
      ruleInputTypeFactory.getNumberInstance(inputGraph);
    }).toThrowError('variable is not of type number.');
    expect(() => {
      ruleInputTypeFactory.getNumberInstance(inputNotes);
    }).toThrowError('variable is not of type number.');
    expect(() => {
      ruleInputTypeFactory.getNumberInstance(inputFraction);
    }).toThrowError('variable is not of type number.');
    expect(() => {
      ruleInputTypeFactory.getNumberInstance(inputNumberWithUnits);
    }).toThrowError('variable is not of type number.');
    expect(() => {
      ruleInputTypeFactory.getNumberInstance(inputString);
    }).toThrowError('variable is not of type number.');
    expect(() => {
      ruleInputTypeFactory.getNumberInstance(inputStringArray);
    }).toThrowError('variable is not of type number.');
    expect(() => {
      ruleInputTypeFactory.getNumberInstance(inputStringArrayArray);
    }).toThrowError('variable is not of type number.');
    expect(() => {
      ruleInputTypeFactory.getNumberInstance(inputnumberArray);
    }).toThrowError('variable is not of type number.');
  });

  it('should correctly identify string array', () => {
    expect(ruleInputTypeFactory.getStringArrayInstance(
      inputStringArray)).toEqual(['string1', 'string2']);
    expect(() => {
      ruleInputTypeFactory.getStringArrayInstance(inputGraph);
    }).toThrowError('variable is not of type string[].');
    expect(() => {
      ruleInputTypeFactory.getStringArrayInstance(inputNotes);
    }).toThrowError('variable is not of type string[].');
    expect(() => {
      ruleInputTypeFactory.getStringArrayInstance(inputFraction);
    }).toThrowError('variable is not of type string[].');
    expect(() => {
      ruleInputTypeFactory.getStringArrayInstance(inputNumberWithUnits);
    }).toThrowError('variable is not of type string[].');
    expect(() => {
      ruleInputTypeFactory.getStringArrayInstance(inputString);
    }).toThrowError('variable is not of type string[].');
    expect(() => {
      ruleInputTypeFactory.getStringArrayInstance(inputNumber);
    }).toThrowError('variable is not of type string[].');
    expect(() => {
      ruleInputTypeFactory.getStringArrayInstance(inputStringArrayArray);
    }).toThrowError('variable is not of type string[].');
    expect(() => {
      ruleInputTypeFactory.getStringArrayInstance(inputnumberArray);
    }).toThrowError('variable is not of type string[].');
  });

  it('should correctly identify string array array', () => {
    expect(ruleInputTypeFactory.getStringArrayArrayInstance(
      inputStringArrayArray)).toEqual([['a', 'b'], ['d'], ['c']]);
    expect(() => {
      ruleInputTypeFactory.getStringArrayArrayInstance(inputGraph);
    }).toThrowError('variable is not of type string[][].');
    expect(() => {
      ruleInputTypeFactory.getStringArrayArrayInstance(inputNotes);
    }).toThrowError('variable is not of type string[][].');
    expect(() => {
      ruleInputTypeFactory.getStringArrayArrayInstance(inputFraction);
    }).toThrowError('variable is not of type string[][].');
    expect(() => {
      ruleInputTypeFactory.getStringArrayArrayInstance(inputNumberWithUnits);
    }).toThrowError('variable is not of type string[][].');
    expect(() => {
      ruleInputTypeFactory.getStringArrayArrayInstance(inputString);
    }).toThrowError('variable is not of type string[][].');
    expect(() => {
      ruleInputTypeFactory.getStringArrayArrayInstance(inputNumber);
    }).toThrowError('variable is not of type string[][].');
    expect(() => {
      ruleInputTypeFactory.getStringArrayArrayInstance(inputStringArray);
    }).toThrowError('variable is not of type string[][].');
    expect(() => {
      ruleInputTypeFactory.getStringArrayArrayInstance(inputnumberArray);
    }).toThrowError('variable is not of type string[][].');
  });

  it('should correctly identify number array', () => {
    expect(ruleInputTypeFactory.getNumberArrayInstance(
      inputnumberArray)).toEqual([0]);
    expect(() => {
      ruleInputTypeFactory.getNumberArrayInstance(inputGraph);
    }).toThrowError('variable is not of type number[].');
    expect(() => {
      ruleInputTypeFactory.getNumberArrayInstance(inputNotes);
    }).toThrowError('variable is not of type number[].');
    expect(() => {
      ruleInputTypeFactory.getNumberArrayInstance(inputFraction);
    }).toThrowError('variable is not of type number[].');
    expect(() => {
      ruleInputTypeFactory.getNumberArrayInstance(inputNumberWithUnits);
    }).toThrowError('variable is not of type number[].');
    expect(() => {
      ruleInputTypeFactory.getNumberArrayInstance(inputString);
    }).toThrowError('variable is not of type number[].');
    expect(() => {
      ruleInputTypeFactory.getNumberArrayInstance(inputNumber);
    }).toThrowError('variable is not of type number[].');
    expect(() => {
      ruleInputTypeFactory.getNumberArrayInstance(inputStringArray);
    }).toThrowError('variable is not of type number[].');
    expect(() => {
      ruleInputTypeFactory.getNumberArrayInstance(inputStringArrayArray);
    }).toThrowError('variable is not of type number[].');
  });
});
