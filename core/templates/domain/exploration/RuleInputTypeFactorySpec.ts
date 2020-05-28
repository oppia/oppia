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
    expect(ruleInputTypeFactory.graphInstance(inputGraph)).toEqual({
      vertices: new Array(10)
    });
    expect(() => {
      ruleInputTypeFactory.graphInstance(inputNotes);
    }).toThrowError('variable is not of type IGraphBackendDict.');
    expect(() => {
      ruleInputTypeFactory.graphInstance(inputFraction);
    }).toThrowError('variable is not of type IGraphBackendDict.');
    expect(() => {
      ruleInputTypeFactory.graphInstance(inputNumberWithUnits);
    }).toThrowError('variable is not of type IGraphBackendDict.');
    expect(() => {
      ruleInputTypeFactory.graphInstance(inputString);
    }).toThrowError('variable is not of type IGraphBackendDict.');
    expect(() => {
      ruleInputTypeFactory.graphInstance(inputNumber);
    }).toThrowError('variable is not of type IGraphBackendDict.');
    expect(() => {
      ruleInputTypeFactory.graphInstance(inputStringArray);
    }).toThrowError('variable is not of type IGraphBackendDict.');
    expect(() => {
      ruleInputTypeFactory.graphInstance(inputStringArrayArray);
    }).toThrowError('variable is not of type IGraphBackendDict.');
    expect(() => {
      ruleInputTypeFactory.graphInstance(inputnumberArray);
    }).toThrowError('variable is not of type IGraphBackendDict.');
  });

  it('should correctly identify notes', () => {
    expect(ruleInputTypeFactory.notesInstance(inputNotes)).toEqual([{
      readableNoteName: 'E4',
      noteDuration: {
        num: 1,
        den: 1
      }
    }]);
    expect(ruleInputTypeFactory.notesInstance([])).toEqual([]);
    expect(() => {
      ruleInputTypeFactory.notesInstance(inputGraph);
    }).toThrowError('variable is not of type INote[].');
    expect(() => {
      ruleInputTypeFactory.notesInstance(inputFraction);
    }).toThrowError('variable is not of type INote[].');
    expect(() => {
      ruleInputTypeFactory.notesInstance(inputNumberWithUnits);
    }).toThrowError('variable is not of type INote[].');
    expect(() => {
      ruleInputTypeFactory.notesInstance(inputString);
    }).toThrowError('variable is not of type INote[].');
    expect(() => {
      ruleInputTypeFactory.notesInstance(inputNumber);
    }).toThrowError('variable is not of type INote[].');
    expect(() => {
      ruleInputTypeFactory.notesInstance(inputStringArray);
    }).toThrowError('variable is not of type INote[].');
    expect(() => {
      ruleInputTypeFactory.notesInstance(inputStringArrayArray);
    }).toThrowError('variable is not of type INote[].');
    expect(() => {
      ruleInputTypeFactory.notesInstance(inputnumberArray);
    }).toThrowError('variable is not of type INote[].');
  });

  it('should correctly identify fraction', () => {
    expect(ruleInputTypeFactory.fractionInstance(inputFraction)).toEqual({
      isNegative: false,
      wholeNumber: 0,
      numerator: 1,
      denominator: 1
    });
    expect(() => {
      ruleInputTypeFactory.fractionInstance(inputGraph);
    }).toThrowError('variable is not of type IFractionDict.');
    expect(() => {
      ruleInputTypeFactory.fractionInstance(inputNotes);
    }).toThrowError('variable is not of type IFractionDict.');
    expect(() => {
      ruleInputTypeFactory.fractionInstance(inputNumberWithUnits);
    }).toThrowError('variable is not of type IFractionDict.');
    expect(() => {
      ruleInputTypeFactory.fractionInstance(inputString);
    }).toThrowError('variable is not of type IFractionDict.');
    expect(() => {
      ruleInputTypeFactory.fractionInstance(inputNumber);
    }).toThrowError('variable is not of type IFractionDict.');
    expect(() => {
      ruleInputTypeFactory.fractionInstance(inputStringArray);
    }).toThrowError('variable is not of type IFractionDict.');
    expect(() => {
      ruleInputTypeFactory.fractionInstance(inputStringArrayArray);
    }).toThrowError('variable is not of type IFractionDict.');
    expect(() => {
      ruleInputTypeFactory.fractionInstance(inputnumberArray);
    }).toThrowError('variable is not of type IFractionDict.');
  });

  it('should correctly identify number with units', () => {
    expect(ruleInputTypeFactory.numberWithUnitsInstance(
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
      ruleInputTypeFactory.numberWithUnitsInstance(inputGraph);
    }).toThrowError('variable is not of type INumberWithUnitsBackendDict.');
    expect(() => {
      ruleInputTypeFactory.numberWithUnitsInstance(inputNotes);
    }).toThrowError('variable is not of type INumberWithUnitsBackendDict.');
    expect(() => {
      ruleInputTypeFactory.numberWithUnitsInstance(inputFraction);
    }).toThrowError('variable is not of type INumberWithUnitsBackendDict.');
    expect(() => {
      ruleInputTypeFactory.numberWithUnitsInstance(inputString);
    }).toThrowError('variable is not of type INumberWithUnitsBackendDict.');
    expect(() => {
      ruleInputTypeFactory.numberWithUnitsInstance(inputNumber);
    }).toThrowError('variable is not of type INumberWithUnitsBackendDict.');
    expect(() => {
      ruleInputTypeFactory.numberWithUnitsInstance(inputStringArray);
    }).toThrowError('variable is not of type INumberWithUnitsBackendDict.');
    expect(() => {
      ruleInputTypeFactory.numberWithUnitsInstance(inputStringArrayArray);
    }).toThrowError('variable is not of type INumberWithUnitsBackendDict.');
    expect(() => {
      ruleInputTypeFactory.numberWithUnitsInstance(inputnumberArray);
    }).toThrowError('variable is not of type INumberWithUnitsBackendDict.');
  });

  it('should correctly identify string', () => {
    expect(ruleInputTypeFactory.stringInstance(
      inputString)).toEqual('string');
    expect(() => {
      ruleInputTypeFactory.stringInstance(inputGraph);
    }).toThrowError('variable is not of type string.');
    expect(() => {
      ruleInputTypeFactory.stringInstance(inputNotes);
    }).toThrowError('variable is not of type string.');
    expect(() => {
      ruleInputTypeFactory.stringInstance(inputFraction);
    }).toThrowError('variable is not of type string.');
    expect(() => {
      ruleInputTypeFactory.stringInstance(inputNumberWithUnits);
    }).toThrowError('variable is not of type string.');
    expect(() => {
      ruleInputTypeFactory.stringInstance(inputNumber);
    }).toThrowError('variable is not of type string.');
    expect(() => {
      ruleInputTypeFactory.stringInstance(inputStringArray);
    }).toThrowError('variable is not of type string.');
    expect(() => {
      ruleInputTypeFactory.stringInstance(inputStringArrayArray);
    }).toThrowError('variable is not of type string.');
    expect(() => {
      ruleInputTypeFactory.stringInstance(inputnumberArray);
    }).toThrowError('variable is not of type string.');
  });

  it('should correctly identify number', () => {
    expect(ruleInputTypeFactory.numberInstance(
      inputNumber)).toEqual(0);
    expect(() => {
      ruleInputTypeFactory.numberInstance(inputGraph);
    }).toThrowError('variable is not of type number.');
    expect(() => {
      ruleInputTypeFactory.numberInstance(inputNotes);
    }).toThrowError('variable is not of type number.');
    expect(() => {
      ruleInputTypeFactory.numberInstance(inputFraction);
    }).toThrowError('variable is not of type number.');
    expect(() => {
      ruleInputTypeFactory.numberInstance(inputNumberWithUnits);
    }).toThrowError('variable is not of type number.');
    expect(() => {
      ruleInputTypeFactory.numberInstance(inputString);
    }).toThrowError('variable is not of type number.');
    expect(() => {
      ruleInputTypeFactory.numberInstance(inputStringArray);
    }).toThrowError('variable is not of type number.');
    expect(() => {
      ruleInputTypeFactory.numberInstance(inputStringArrayArray);
    }).toThrowError('variable is not of type number.');
    expect(() => {
      ruleInputTypeFactory.numberInstance(inputnumberArray);
    }).toThrowError('variable is not of type number.');
  });

  it('should correctly identify string array', () => {
    expect(ruleInputTypeFactory.stringArrayInstance(
      inputStringArray)).toEqual(['string1', 'string2']);
    expect(() => {
      ruleInputTypeFactory.stringArrayInstance(inputGraph);
    }).toThrowError('variable is not of type string[].');
    expect(() => {
      ruleInputTypeFactory.stringArrayInstance(inputNotes);
    }).toThrowError('variable is not of type string[].');
    expect(() => {
      ruleInputTypeFactory.stringArrayInstance(inputFraction);
    }).toThrowError('variable is not of type string[].');
    expect(() => {
      ruleInputTypeFactory.stringArrayInstance(inputNumberWithUnits);
    }).toThrowError('variable is not of type string[].');
    expect(() => {
      ruleInputTypeFactory.stringArrayInstance(inputString);
    }).toThrowError('variable is not of type string[].');
    expect(() => {
      ruleInputTypeFactory.stringArrayInstance(inputNumber);
    }).toThrowError('variable is not of type string[].');
    expect(() => {
      ruleInputTypeFactory.stringArrayInstance(inputStringArrayArray);
    }).toThrowError('variable is not of type string[].');
    expect(() => {
      ruleInputTypeFactory.stringArrayInstance(inputnumberArray);
    }).toThrowError('variable is not of type string[].');
  });

  it('should correctly identify string array array', () => {
    expect(ruleInputTypeFactory.stringArrayArrayInstance(
      inputStringArrayArray)).toEqual([['a', 'b'], ['d'], ['c']]);
    expect(() => {
      ruleInputTypeFactory.stringArrayArrayInstance(inputGraph);
    }).toThrowError('variable is not of type string[][].');
    expect(() => {
      ruleInputTypeFactory.stringArrayArrayInstance(inputNotes);
    }).toThrowError('variable is not of type string[][].');
    expect(() => {
      ruleInputTypeFactory.stringArrayArrayInstance(inputFraction);
    }).toThrowError('variable is not of type string[][].');
    expect(() => {
      ruleInputTypeFactory.stringArrayArrayInstance(inputNumberWithUnits);
    }).toThrowError('variable is not of type string[][].');
    expect(() => {
      ruleInputTypeFactory.stringArrayArrayInstance(inputString);
    }).toThrowError('variable is not of type string[][].');
    expect(() => {
      ruleInputTypeFactory.stringArrayArrayInstance(inputNumber);
    }).toThrowError('variable is not of type string[][].');
    expect(() => {
      ruleInputTypeFactory.stringArrayArrayInstance(inputStringArray);
    }).toThrowError('variable is not of type string[][].');
    expect(() => {
      ruleInputTypeFactory.stringArrayArrayInstance(inputnumberArray);
    }).toThrowError('variable is not of type string[][].');
  });

  it('should correctly identify number array', () => {
    expect(ruleInputTypeFactory.numberArrayInstance(
      inputnumberArray)).toEqual([0]);
    expect(() => {
      ruleInputTypeFactory.numberArrayInstance(inputGraph);
    }).toThrowError('variable is not of type number[].');
    expect(() => {
      ruleInputTypeFactory.numberArrayInstance(inputNotes);
    }).toThrowError('variable is not of type number[].');
    expect(() => {
      ruleInputTypeFactory.numberArrayInstance(inputFraction);
    }).toThrowError('variable is not of type number[].');
    expect(() => {
      ruleInputTypeFactory.numberArrayInstance(inputNumberWithUnits);
    }).toThrowError('variable is not of type number[].');
    expect(() => {
      ruleInputTypeFactory.numberArrayInstance(inputString);
    }).toThrowError('variable is not of type number[].');
    expect(() => {
      ruleInputTypeFactory.numberArrayInstance(inputNumber);
    }).toThrowError('variable is not of type number[].');
    expect(() => {
      ruleInputTypeFactory.numberArrayInstance(inputStringArray);
    }).toThrowError('variable is not of type number[].');
    expect(() => {
      ruleInputTypeFactory.numberArrayInstance(inputStringArrayArray);
    }).toThrowError('variable is not of type number[].');
  });
});
