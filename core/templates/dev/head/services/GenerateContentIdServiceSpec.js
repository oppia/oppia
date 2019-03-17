// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for GenerateContentIdService.
 */

describe('GenerateContentIdService', function() {
  beforeEach(module('oppia', function($provide) {
    $provide.value('COMPONENT_NAME_FEEDBACK', 'feedback');
    $provide.value('COMPONENT_NAME_HINT', 'hint');
    $provide.value('COMPONENT_NAME_WORKED_EXAMPLE', 'worked_example');
  }));
  var gcis = null;
  var scitat = null;
  var citatof = null;
  var citatDict = {
    content: {},
    default_outcome: {},
    feedback_1: {},
    hint_1: {},
    solution: {}
  };

  var citatDictConceptCard = {
    explanation: {},
    worked_example_1: {}
  };

  beforeEach(inject(function($injector) {
    gcis = $injector.get('GenerateContentIdService');
    scitat = $injector.get('StateContentIdsToAudioTranslationsService');
    citatof = $injector.get('ContentIdsToAudioTranslationsObjectFactory');
    scitat.displayed = citatof.createFromBackendDict(citatDict);
  }));

  it('should generate content id for new feedbacks', function() {
    expect(
      gcis.getNextId(scitat.displayed.getAllContentId(), 'feedback'))
      .toEqual('feedback_2');
  });

  it('should generate content id for new hint', function() {
    expect(
      gcis.getNextId(scitat.displayed.getAllContentId(), 'hint'))
      .toEqual('hint_2');
  });

  it('should generate content id for new worked example', function() {
    scitat.displayed = citatof.createFromBackendDict(citatDictConceptCard);
    expect(
      gcis.getNextId(scitat.displayed.getAllContentId(), 'worked_example'))
      .toEqual('worked_example_2');
  });

  it('should throw error for unknown content id', function() {
    expect(function() {
      gcis.getNextId('xyz');
    }).toThrowError('Unknown component name provided.');
  });
});
