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
 * @fileoverview unit test for TypeChangeService.
 */


import { TestBed } from '@angular/core/testing';

import { TypeChangeService } from
  'services/type-change.service';
import { INumberWithUnitsBackendDict } from
  'domain/objects/NumberWithUnitsObjectFactory';
import { IFractionDict } from
  'domain/objects/FractionObjectFactory.ts';
/* eslint-disable max-len */
import { INote } from 'extensions/interactions/MusicNotesInput/directives/music-notes-input-rules.service';
/* eslint-enable max-len */
import { IGraphBackendDict } from
  'extensions/interactions/GraphInput/directives/graph-detail.service';

describe('TypeChangeService', () => {
  let typeChangeService: TypeChangeService = null;
  let inputGraph = {
    vertices: new Array(10)
  };
  let inputNotes = [{
    readableNoteName: 'E4',
    noteDuration: {
      num: 1,
      den: 1
    }
  }];
  let inputFraction = {
    isNegative: false,
    wholeNumber: 0,
    numerator: 1,
    denominator: 1
  };
  let inputNumberWithUnits = {
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
  let inputString = 'string';
  let inputNumber = 0;
  let inputStringArray = ['string1', 'string2'];
  let inputStringArrayArray = [['a', 'b'], ['d'], ['c']];
  let inputNumberArray = [0];

  beforeEach(() => {
    typeChangeService = TestBed.get(TypeChangeService);
  });

  it('should correctly change type to IGraphBackendDict', () => {
    let testVar: IGraphBackendDict = (
      typeChangeService.changeTypeToGraphBackendDict(inputGraph));
    expect(testVar).toEqual({
      vertices: new Array(10)
    });
  });

  it('should correctly change type to INote[]', () => {
    let testVar: INote[] = (
      typeChangeService.changeTypeToNoteArray(inputNotes));
    expect(testVar).toEqual([{
      readableNoteName: 'E4',
      noteDuration: {
        num: 1,
        den: 1
      }
    }]);
  });

  it('should correctly change type to IFractionDict', () => {
    let testVar: IFractionDict = (
      typeChangeService.changeTypeToFractionDict(inputFraction));
    expect(testVar).toEqual({
      isNegative: false,
      wholeNumber: 0,
      numerator: 1,
      denominator: 1
    });
  });

  it('should correctly change type to INumberWithUnitsBackendDict', () => {
    let testVar: INumberWithUnitsBackendDict = (
      typeChangeService.changeTypeToNumberWithUnitsBackendDict(
        inputNumberWithUnits));
    expect(testVar).toEqual({
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
    });
  });

  it('should correctly change type to string', () => {
    let testVar: string = (
      typeChangeService.changeTypeToString(inputString));
    expect(testVar).toEqual('string');
  });

  it('should correctly change type to number', () => {
    let testVar: number = (
      typeChangeService.changeTypeToNumber(inputNumber));
    expect(testVar).toEqual(0);
  });

  it('should correctly change type to string[]', () => {
    let testVar: string[] = (
      typeChangeService.changeTypeToStringArray(inputStringArray));
    expect(testVar).toEqual(['string1', 'string2']);
  });

  it('should correctly change type to string[][]', () => {
    let testVar: string[][] = (
      typeChangeService.changeTypeToStringArrayArray(inputStringArrayArray));
    expect(testVar).toEqual([['a', 'b'], ['d'], ['c']]);
  });

  it('should correctly change type to number[]', () => {
    let testVar: number[] = (
      typeChangeService.changeTypeToNumberArray(inputNumberArray));
    expect(testVar).toEqual([0]);
  });
});
