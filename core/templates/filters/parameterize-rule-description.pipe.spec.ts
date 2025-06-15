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
 * @fileoverview ParameterizeRuleDescription Pipe for Oppia.
 */

import {ParameterizeRuleDescriptionPipe} from './parameterize-rule-description.pipe';
import {fakeAsync, TestBed, tick} from '@angular/core/testing';
import {Rule} from 'domain/exploration/rule.model';
import {TranslatableSetOfNormalizedString} from 'interactions/rule-input-defs';

describe('ParameterizeRuleDescriptionPipe', () => {
  let parameterizeRuleDescriptionPipe: ParameterizeRuleDescriptionPipe;
  let rule: Rule;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ParameterizeRuleDescriptionPipe],
    });
    parameterizeRuleDescriptionPipe = TestBed.inject(
      ParameterizeRuleDescriptionPipe
    );

    rule = Rule.createNew(
      'Equals',
      {
        Equals: {
          x: '2',
        },
      },
      {
        Equals: 'ruleSome',
      }
    );
  });

  it('should send black string when rule is null', () => {
    let result = parameterizeRuleDescriptionPipe.transform(
      null,
      'interactionId',
      []
    );

    expect(result).toEqual('');
  });

  it('should send black string when rule is null', () => {
    let result = parameterizeRuleDescriptionPipe.transform(
      rule,
      'interactionId',
      []
    );

    expect(result).toEqual('');
  });

  it('should send black string when rule is null', () => {
    let testRule = Rule.createNew(
      'none',
      {
        rule: {
          x: '2',
        },
      },
      {
        rule: 'ruleSome',
      }
    );

    let result = parameterizeRuleDescriptionPipe.transform(
      testRule,
      'Continue',
      []
    );

    expect(result).toEqual('');
  });

  it('should send black string when rule is null', () => {
    let result = parameterizeRuleDescriptionPipe.transform(
      rule,
      'NumericInput',
      [
        {
          val: 5,
          label: 'string',
        },
      ]
    );

    expect(result).toEqual('is equal to [INVALID]');
  });

  it('should correctly parameterize for TextInput', fakeAsync(() => {
    var rules = Rule.createNew(
      'Equals',
      {
        x: {
          normalizedStrSet: ['first', 'secound'],
          contentId: null,
        } as TranslatableSetOfNormalizedString,
      },
      {
        x: 'TextInput',
      }
    );
    var interactionIdMultipleChoice = 'TextInput';
    tick();

    let result = parameterizeRuleDescriptionPipe.transform(
      rules,
      interactionIdMultipleChoice,
      null
    );
    tick();

    expect(result).toEqual(
      'is equal to at least one of' +
        ' [first, secound], without taking case into account'
    );
  }));

  it('should correctly parameterize for Graph', () => {
    var rules = Rule.createNew(
      'IsIsomorphicTo',
      {
        inputs: {
          x: 0,
        },
      },
      {
        inputs: 'ruleSome',
      }
    );

    let result = parameterizeRuleDescriptionPipe.transform(
      rules,
      'GraphInput',
      null
    );

    expect(result).toEqual(
      'is isomorphic to [reference graph], including matching labels'
    );
  });

  it('should correctly parameterize for Fraction', () => {
    var rules = Rule.createNew(
      'IsEquivalentToAndInSimplestForm',
      {
        f: {
          isNegative: false,
          wholeNumber: 5,
          numerator: 2,
          denominator: 3,
        },
      },
      {
        f: 'ruleSome',
      }
    );

    let result = parameterizeRuleDescriptionPipe.transform(
      rules,
      'FractionInput',
      null
    );

    expect(result).toEqual('is equivalent to 5 2/3 and in simplest form');
  });

  it('should correctly parameterize for NumberWithUnits', () => {
    var rules = Rule.createNew(
      'IsEqualTo',
      {
        f: {
          type: 'string',
          real: 5,
          fraction: {
            isNegative: false,
            wholeNumber: 2,
            numerator: 3,
            denominator: 5,
          },
          units: [],
        },
      },
      {
        f: 'ruleSome',
      }
    );
    var interactionIdMultipleChoice = 'NumberWithUnits';

    let result = parameterizeRuleDescriptionPipe.transform(
      rules,
      interactionIdMultipleChoice,
      null
    );

    expect(result).toEqual('has the same value and units as ');
  });

  it('should correctly parameterize for MusicPhrase', () => {
    var rules = Rule.createNew(
      'IsEqualToExceptFor',
      {
        x: {
          0: {
            readableNoteName: '0',
          },
          1: {
            readableNoteName: '1',
          },
          2: {
            readableNoteName: '0',
          },
          3: {
            readableNoteName: '1',
          },
        },
        k: -5,
      },
      {
        x: 'ruleSome',
        k: '',
      }
    );

    let result = parameterizeRuleDescriptionPipe.transform(
      rules,
      'MusicNotesInput',
      null
    );

    expect(result).toEqual('is equal to [0, 1, 0, 1] except for -5 notes');
  });

  it('should correctly parameterize for InteractiveMap', () => {
    var rules = Rule.createNew(
      'Within',
      {
        d: 10,
        p: 9,
      },
      {
        d: '10',
        p: '9',
      }
    );

    let result = parameterizeRuleDescriptionPipe.transform(
      rules,
      'InteractiveMap',
      null
    );

    expect(result).toEqual('is within 10 km of (0°S, 0°W)');
  });

  it('should correctly parameterize for SetInput', () => {
    var rules = Rule.createNew(
      'Equals',
      {
        x: {
          unicodeStrSet: ['first', 'secound'],
          contentId: null,
        },
      },
      {
        x: 'ruleSome',
      }
    );

    let result = parameterizeRuleDescriptionPipe.transform(
      rules,
      'SetInput',
      null
    );

    expect(result).toEqual('is equal to [first, secound]');
  });

  it('should correctly parameterize for MathEquationInput', () => {
    var rules = Rule.createNew(
      'MatchesExactlyWith',
      {
        x: '2 + 3',
        y: 'rhs',
      },
      {
        x: '2 + 3',
        y: 'rhs',
      }
    );

    let result = parameterizeRuleDescriptionPipe.transform(
      rules,
      'MathEquationInput',
      null
    );

    expect(result).toEqual('matches exactly with 2 + 3 on Right Hand Side');
  });

  it('should correctly parameterize for RatioExpressionInput', () => {
    var rules = Rule.createNew(
      'Equals',
      {
        x: [2, 3],
      },
      {
        x: '[2 , 3]',
      }
    );

    let result = parameterizeRuleDescriptionPipe.transform(
      rules,
      'RatioExpressionInput',
      null
    );

    expect(result).toEqual('is equal to 2:3');
  });

  it(
    'should correctly parameterize for SetOfTranslatableHtmlContentIds' +
      ' with INVALID',
    () => {
      var rules = Rule.createNew(
        'Equals',
        {
          x: ['1', '2', '3', '4'],
        },
        {
          x: 'data',
        }
      );

      let result = parameterizeRuleDescriptionPipe.transform(
        rules,
        'ItemSelectionInput',
        [
          {
            val: 1,
            label: 'string',
          },
          {
            val: 5,
            label: 'string',
          },
        ]
      );

      expect(result).toEqual('is equal to [INVALID,INVALID,INVALID,INVALID]');
    }
  );

  it('should correctly parameterize for SetOfTranslatableHtmlContentIds', () => {
    var rules = Rule.createNew(
      'Equals',
      {
        x: ['1', '2'],
      },
      {
        x: 'data',
      }
    );

    let result = parameterizeRuleDescriptionPipe.transform(
      rules,
      'ItemSelectionInput',
      [
        {
          val: '1',
          label: 'one item',
        },
        {
          val: '2',
          label: 'two item',
        },
      ]
    );

    expect(result).toEqual('is equal to [one item,two item]');
  });

  it('should correctly parameterize for ListOfSetsOfTranslatableHtmlContentIds', () => {
    var rules = Rule.createNew(
      'IsEqualToOrdering',
      {
        x: [['1'], ['2']],
      },
      {
        x: 'data',
      }
    );

    let result = parameterizeRuleDescriptionPipe.transform(
      rules,
      'DragAndDropSortInput',
      [
        {
          val: '1',
          label: 'one item',
        },
        {
          val: '2',
          label: 'two item',
        },
      ]
    );

    expect(result).toEqual('is equal to ordering [[one item],[two item]]');
  });

  it(
    'should correctly parameterize for' +
      'ListOfSetsOfTranslatableHtmlContentIds with INVALID',
    () => {
      var rules = Rule.createNew(
        'IsEqualToOrdering',
        {
          x: [['1'], ['5']],
        },
        {
          x: 'data',
        }
      );

      let result = parameterizeRuleDescriptionPipe.transform(
        rules,
        'DragAndDropSortInput',
        [
          {
            val: 1,
            label: 'string',
          },
          {
            val: 5,
            label: 'string',
          },
        ]
      );

      expect(result).toEqual('is equal to ordering [[INVALID],[INVALID]]');
    }
  );

  it(
    'should correctly parameterize for' + 'DragAndDropPositiveInt with INVALID',
    () => {
      var rules = Rule.createNew(
        'HasElementXAtPositionY',
        {
          x: 'TranslatableHtmlContentId',
          y: '2',
        },
        {
          x: 'data',
          y: '3',
        }
      );

      let result = parameterizeRuleDescriptionPipe.transform(
        rules,
        'DragAndDropSortInput',
        [
          {
            val: 'none',
            label: 'string',
          },
          {
            val: 'TranslatableHtmlContentId',
            label: 'TranslatableHtmlContentId',
          },
        ]
      );

      expect(result).toEqual(
        "has element 'TranslatableHtmlContentId' at position 2"
      );
    }
  );
});
