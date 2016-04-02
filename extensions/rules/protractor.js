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
 * @fileoverview Utilities for interacting with rules during protractor
 * tests.
 */

var DESCRIPTIONS = {
  CheckedProof: {
    Correct: 'is correct',
    NotCorrect: 'is not correct',
    NotCorrectByCategory: 'is not correct due to {{c|LogicErrorCategory}}'
  },
  CodeEvaluation: {
    OutputEquals: 'has output equal to {{x|UnicodeString}} (collapsing spaces)',
    ResultsInError: 'results in an error when run'
  },
  CoordTwoDim: {
    Within: 'is within {{d|Real}} of {{p|CoordTwoDim}}',
    NotWithin: 'is not within {{d|Real}} of {{p|CoordTwoDim}}'
  },
  MusicPhrase: {
    Equals: 'is equal to {{x|MusicPhrase}}',
    IsLongerThan: 'has more than {{k|NonnegativeInt}} notes',
    HasLengthInclusivelyBetween: 'has between {{a|NonnegativeInt}} and ' +
      '{{b|NonnegativeInt}} notes, inclusive',
    IsEqualToExceptFor: 'is equal to {{x|MusicPhrase}} except for ' +
      '{{k|NonnegativeInt}} notes',
    IsTranspositionOf: 'is a transposition of {{x|MusicPhrase}} by {{y|Int}} ' +
      'semitones',
    IsTranspositionOfExceptFor: 'is a transposition of {{x|MusicPhrase}} by ' +
      '{{y|Int}} semitones except for {{k|NonnegativeInt}} notes'
  },
  NonnegativeInt: {
    Equals: 'is equal to {{x|NonnegativeInt}}'
  },
  NormalizedString: {
    Equals: 'is equal to {{x|NormalizedString}}',
    CaseSensitiveEquals: 'is equal to {{x|NormalizedString}}, taking case ' +
      'into account',
    StartsWith: 'starts with {{x|NormalizedString}}',
    Contains: 'contains {{x|NormalizedString}}',
    FuzzyEquals: 'is equal to {{x|NormalizedString}}, misspelled by at most ' +
      'one character'
  },
  Real: {
    Equals: 'is equal to {{x|Real}}',
    IsLessThan: 'is less than {{x|Real}}',
    IsGreaterThan: 'is greater than {{x|Real}}',
    IsLessThanOrEqualTo: 'is less than or equal to {{x|Real}}',
    IsGreaterThanOrEqualTo: 'is greater than or equal to {{x|Real}}',
    IsInclusivelyBetween: 'is between {{a|Real}} and {{b|Real}}, inclusive',
    IsWithinTolerance: 'is within {{tol|Real}} of {{x|Real}}'
  },
  SetOfUnicodeString: {
    Equals: 'is equal to {{x|SetOfUnicodeString}}',
    IsSubsetOf: 'is a proper subset of {{x|SetOfUnicodeString}}',
    IsSupersetOf: 'is a proper superset of {{x|SetOfUnicodeString}}',
    HasElementsIn: 'has elements in common with {{x|SetOfUnicodeString}}',
    HasElementsNotIn: 'has elements not in {{x|SetOfUnicodeString}}',
    OmitsElementsIn: 'omits some elements of {{x|SetOfUnicodeString}}',
    IsDisjointFrom: 'has no elements in common with {{x|SetOfUnicodeString}}'
  },
  UnicodeString: {
    Equals: 'is equal to {{x|UnicodeString}}',
    CaseSensitiveEquals: 'is equal to {{x|UnicodeString}}, taking case into ' +
      'account',
    StartsWith: 'starts with {{x|UnicodeString}}',
    Contains: 'contains {{x|UnicodeString}}',
    MatchesBase64EncodedFile: 'has same content as the file located at ' +
      '{{filepath|UnicodeString}}'
  }
};

var getDescription = function(objectName, ruleName) {
  if (ruleName === 'Default') {
    return (
      objectName ? 'When no other rule applies' :
      'When the button is clicked');
  }

  if (DESCRIPTIONS.hasOwnProperty(objectName)) {
    if (DESCRIPTIONS[objectName].hasOwnProperty(ruleName)) {
      return DESCRIPTIONS[objectName][ruleName];
    } else {
      throw Error('Unknown rule: ' + ruleName);
    }
  } else {
    throw Error('Could not find rule for object: ' + objectName);
  }
};

exports.getDescription = getDescription;
