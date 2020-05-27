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
    let outputGraph = ruleInputTypeFactory.graphInstance(inputGraph);
    let outputNotes = ruleInputTypeFactory.graphInstance(inputNotes);
    let outputFraction = ruleInputTypeFactory.graphInstance(inputFraction);
    let outputNumberWithUnits = ruleInputTypeFactory.graphInstance(
      inputNumberWithUnits);
    let outputString = ruleInputTypeFactory.graphInstance(inputString);
    let outputNumber = ruleInputTypeFactory.graphInstance(inputNumber);
    let outputStringArray = ruleInputTypeFactory.graphInstance(
      inputStringArray);
    let outputStringArrayArray = ruleInputTypeFactory.graphInstance(
      inputStringArrayArray);
    let outputnumberArray = ruleInputTypeFactory.graphInstance(
      inputnumberArray);

    expect(outputGraph).toEqual({
      vertices: new Array(10)
    });
    expect(outputNotes).toEqual(undefined);
    expect(outputFraction).toEqual(undefined);
    expect(outputNumberWithUnits).toEqual(undefined);
    expect(outputString).toEqual(undefined);
    expect(outputNumber).toEqual(undefined);
    expect(outputStringArray).toEqual(undefined);
    expect(outputStringArrayArray).toEqual(undefined);
    expect(outputnumberArray).toEqual(undefined);
  });

  it('should correctly identify notes', () => {
    let outputGraph = ruleInputTypeFactory.notesInstance(inputGraph);
    let outputEmptyArray = ruleInputTypeFactory.notesInstance([]);
    let outputNotes = ruleInputTypeFactory.notesInstance(inputNotes);
    let outputFraction = ruleInputTypeFactory.notesInstance(inputFraction);
    let outputNumberWithUnits = ruleInputTypeFactory.notesInstance(
      inputNumberWithUnits);
    let outputString = ruleInputTypeFactory.notesInstance(inputString);
    let outputNumber = ruleInputTypeFactory.notesInstance(inputNumber);
    let outputStringArray = ruleInputTypeFactory.notesInstance(
      inputStringArray);
    let outputStringArrayArray = ruleInputTypeFactory.notesInstance(
      inputStringArrayArray);
    let outputnumberArray = ruleInputTypeFactory.notesInstance(
      inputnumberArray);

    expect(outputGraph).toEqual(undefined);
    expect(outputEmptyArray).toEqual([]);
    expect(outputNotes).toEqual([{
      readableNoteName: 'E4',
      noteDuration: {
        num: 1,
        den: 1
      }
    }]);
    expect(outputFraction).toEqual(undefined);
    expect(outputNumberWithUnits).toEqual(undefined);
    expect(outputString).toEqual(undefined);
    expect(outputNumber).toEqual(undefined);
    expect(outputStringArray).toEqual(undefined);
    expect(outputStringArrayArray).toEqual(undefined);
    expect(outputnumberArray).toEqual(undefined);
  });

  it('should correctly identify fraction', () => {
    let outputGraph = ruleInputTypeFactory.fractionInstance(inputGraph);
    let outputNotes = ruleInputTypeFactory.fractionInstance(inputNotes);
    let outputFraction = ruleInputTypeFactory.fractionInstance(inputFraction);
    let outputNumberWithUnits = ruleInputTypeFactory.fractionInstance(
      inputNumberWithUnits);
    let outputString = ruleInputTypeFactory.fractionInstance(inputString);
    let outputNumber = ruleInputTypeFactory.fractionInstance(inputNumber);
    let outputStringArray = ruleInputTypeFactory.fractionInstance(
      inputStringArray);
    let outputStringArrayArray = ruleInputTypeFactory.fractionInstance(
      inputStringArrayArray);
    let outputnumberArray = ruleInputTypeFactory.fractionInstance(
      inputnumberArray);

    expect(outputGraph).toEqual(undefined);
    expect(outputNotes).toEqual(undefined);
    expect(outputFraction).toEqual({
      isNegative: false,
      wholeNumber: 0,
      numerator: 1,
      denominator: 1
    });
    expect(outputNumberWithUnits).toEqual(undefined);
    expect(outputString).toEqual(undefined);
    expect(outputNumber).toEqual(undefined);
    expect(outputStringArray).toEqual(undefined);
    expect(outputStringArrayArray).toEqual(undefined);
    expect(outputnumberArray).toEqual(undefined);
  });

  it('should correctly identify number with units', () => {
    let outputGraph = ruleInputTypeFactory.numberWithUnitsInstance(inputGraph);
    let outputNotes = ruleInputTypeFactory.numberWithUnitsInstance(inputNotes);
    let outputFraction = ruleInputTypeFactory.numberWithUnitsInstance(
      inputFraction);
    let outputNumberWithUnits = ruleInputTypeFactory.numberWithUnitsInstance(
      inputNumberWithUnits);
    let outputString = ruleInputTypeFactory.numberWithUnitsInstance(
      inputString);
    let outputNumber = ruleInputTypeFactory.numberWithUnitsInstance(
      inputNumber);
    let outputStringArray = ruleInputTypeFactory.numberWithUnitsInstance(
      inputStringArray);
    let outputStringArrayArray = ruleInputTypeFactory.numberWithUnitsInstance(
      inputStringArrayArray);
    let outputnumberArray = ruleInputTypeFactory.numberWithUnitsInstance(
      inputnumberArray);

    expect(outputGraph).toEqual(undefined);
    expect(outputNotes).toEqual(undefined);
    expect(outputFraction).toEqual(undefined);
    expect(outputNumberWithUnits).toEqual({
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
    expect(outputString).toEqual(undefined);
    expect(outputNumber).toEqual(undefined);
    expect(outputStringArray).toEqual(undefined);
    expect(outputStringArrayArray).toEqual(undefined);
    expect(outputnumberArray).toEqual(undefined);
  });

  it('should correctly identify string', () => {
    let outputGraph = ruleInputTypeFactory.stringInstance(inputGraph);
    let outputNotes = ruleInputTypeFactory.stringInstance(inputNotes);
    let outputFraction = ruleInputTypeFactory.stringInstance(
      inputFraction);
    let outputNumberWithUnits = ruleInputTypeFactory.stringInstance(
      inputNumberWithUnits);
    let outputString = ruleInputTypeFactory.stringInstance(
      inputString);
    let outputNumber = ruleInputTypeFactory.stringInstance(
      inputNumber);
    let outputStringArray = ruleInputTypeFactory.stringInstance(
      inputStringArray);
    let outputStringArrayArray = ruleInputTypeFactory.stringInstance(
      inputStringArrayArray);
    let outputnumberArray = ruleInputTypeFactory.stringInstance(
      inputnumberArray);

    expect(outputGraph).toEqual(undefined);
    expect(outputNotes).toEqual(undefined);
    expect(outputFraction).toEqual(undefined);
    expect(outputNumberWithUnits).toEqual(undefined);
    expect(outputString).toEqual('string');
    expect(outputNumber).toEqual(undefined);
    expect(outputStringArray).toEqual(undefined);
    expect(outputStringArrayArray).toEqual(undefined);
    expect(outputnumberArray).toEqual(undefined);
  });

  it('should correctly identify number', () => {
    let outputGraph = ruleInputTypeFactory.numberInstance(inputGraph);
    let outputNotes = ruleInputTypeFactory.numberInstance(inputNotes);
    let outputFraction = ruleInputTypeFactory.numberInstance(
      inputFraction);
    let outputNumberWithUnits = ruleInputTypeFactory.numberInstance(
      inputNumberWithUnits);
    let outputString = ruleInputTypeFactory.numberInstance(
      inputString);
    let outputNumber = ruleInputTypeFactory.numberInstance(
      inputNumber);
    let outputStringArray = ruleInputTypeFactory.numberInstance(
      inputStringArray);
    let outputStringArrayArray = ruleInputTypeFactory.numberInstance(
      inputStringArrayArray);
    let outputnumberArray = ruleInputTypeFactory.numberInstance(
      inputnumberArray);

    expect(outputGraph).toEqual(undefined);
    expect(outputNotes).toEqual(undefined);
    expect(outputFraction).toEqual(undefined);
    expect(outputNumberWithUnits).toEqual(undefined);
    expect(outputString).toEqual(undefined);
    expect(outputNumber).toEqual(0);
    expect(outputStringArray).toEqual(undefined);
    expect(outputStringArrayArray).toEqual(undefined);
    expect(outputnumberArray).toEqual(undefined);
  });

  it('should correctly identify string array', () => {
    let outputGraph = ruleInputTypeFactory.stringArrayInstance(inputGraph);
    let outputNotes = ruleInputTypeFactory.stringArrayInstance(inputNotes);
    let outputFraction = ruleInputTypeFactory.stringArrayInstance(
      inputFraction);
    let outputNumberWithUnits = ruleInputTypeFactory.stringArrayInstance(
      inputNumberWithUnits);
    let outputString = ruleInputTypeFactory.stringArrayInstance(
      inputString);
    let outputNumber = ruleInputTypeFactory.stringArrayInstance(
      inputNumber);
    let outputStringArray = ruleInputTypeFactory.stringArrayInstance(
      inputStringArray);
    let outputStringArrayArray = ruleInputTypeFactory.stringArrayInstance(
      inputStringArrayArray);
    let outputnumberArray = ruleInputTypeFactory.stringArrayInstance(
      inputnumberArray);

    expect(outputGraph).toEqual(undefined);
    expect(outputNotes).toEqual(undefined);
    expect(outputFraction).toEqual(undefined);
    expect(outputNumberWithUnits).toEqual(undefined);
    expect(outputString).toEqual(undefined);
    expect(outputNumber).toEqual(undefined);
    expect(outputStringArray).toEqual(['string1', 'string2']);
    expect(outputStringArrayArray).toEqual(undefined);
    expect(outputnumberArray).toEqual(undefined);
  });

  it('should correctly identify string array array', () => {
    let outputGraph = ruleInputTypeFactory.stringArrayArrayInstance(inputGraph);
    let outputNotes = ruleInputTypeFactory.stringArrayArrayInstance(inputNotes);
    let outputFraction = ruleInputTypeFactory.stringArrayArrayInstance(
      inputFraction);
    let outputNumberWithUnits = ruleInputTypeFactory.stringArrayArrayInstance(
      inputNumberWithUnits);
    let outputString = ruleInputTypeFactory.stringArrayArrayInstance(
      inputString);
    let outputNumber = ruleInputTypeFactory.stringArrayArrayInstance(
      inputNumber);
    let outputStringArray = ruleInputTypeFactory.stringArrayArrayInstance(
      inputStringArray);
    let outputStringArrayArray = ruleInputTypeFactory.stringArrayArrayInstance(
      inputStringArrayArray);
    let outputnumberArray = ruleInputTypeFactory.stringArrayArrayInstance(
      inputnumberArray);

    expect(outputGraph).toEqual(undefined);
    expect(outputNotes).toEqual(undefined);
    expect(outputFraction).toEqual(undefined);
    expect(outputNumberWithUnits).toEqual(undefined);
    expect(outputString).toEqual(undefined);
    expect(outputNumber).toEqual(undefined);
    expect(outputStringArray).toEqual(undefined);
    expect(outputStringArrayArray).toEqual([['a', 'b'], ['d'], ['c']]);
    expect(outputnumberArray).toEqual(undefined);
  });

  it('should correctly identify number array', () => {
    let outputGraph = ruleInputTypeFactory.numberArrayInstance(inputGraph);
    let outputNotes = ruleInputTypeFactory.numberArrayInstance(inputNotes);
    let outputFraction = ruleInputTypeFactory.numberArrayInstance(
      inputFraction);
    let outputNumberWithUnits = ruleInputTypeFactory.numberArrayInstance(
      inputNumberWithUnits);
    let outputString = ruleInputTypeFactory.numberArrayInstance(
      inputString);
    let outputNumber = ruleInputTypeFactory.numberArrayInstance(
      inputNumber);
    let outputStringArray = ruleInputTypeFactory.numberArrayInstance(
      inputStringArray);
    let outputStringArrayArray = ruleInputTypeFactory.numberArrayInstance(
      inputStringArrayArray);
    let outputnumberArray = ruleInputTypeFactory.numberArrayInstance(
      inputnumberArray);

    expect(outputGraph).toEqual(undefined);
    expect(outputNotes).toEqual(undefined);
    expect(outputFraction).toEqual(undefined);
    expect(outputNumberWithUnits).toEqual(undefined);
    expect(outputString).toEqual(undefined);
    expect(outputNumber).toEqual(undefined);
    expect(outputStringArray).toEqual(undefined);
    expect(outputStringArrayArray).toEqual(undefined);
    expect(outputnumberArray).toEqual([0]);
  });
});
