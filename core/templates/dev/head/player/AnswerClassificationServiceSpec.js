// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the answer classification service
 */

describe('Answer classification service', function() {
  beforeEach(module('oppia'));

  beforeEach(module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

  var acs, $httpBackend, successHandler, failHandler, $rootScope, state;
  beforeEach(inject(function($injector) {
    acs = $injector.get('answerClassificationService');
    sof = $injector.get('StateObjectFactory');
    $httpBackend = $injector.get('$httpBackend');
    $rootScope = $injector.get('$rootScope');
    successHandler = jasmine.createSpy('success');
    failHandler = jasmine.createSpy('fail');

    state = sof.create('stateName', {
      content: [{
        type: 'text',
        value: 'content'
      }],
      interaction: {
        answer_groups: [{
          outcome: 'outcome 1',
          rule_specs: [{
            inputs: {
              x: 10
            },
            rule_type: 'Equals'
          }]
        }, {
          outcome: 'outcome 2',
          rule_specs: [{
            inputs: {
              x: 5
            },
            rule_type: 'Equals'
          }, {
            inputs: {
              x: 7
            },
            rule_type: 'NotEquals'
          }]
        }],
        default_outcome: 'default'
      },
      param_changes: []
    });
  }));

  var explorationId = 'exploration';

  var rules = {
    Equals: function(answer, inputs) {
      return inputs.x === answer;
    },
    NotEquals: function(answer, inputs) {
      return inputs.x !== answer;
    }
  };

  it('should query the backend when no frontend rules are provided',
      function() {
    var backendClassifiedOutcome = {
      outcome: 'outcome',
      answer_group_index: 0,
      rule_spec_index: 0
    };
    var expectedClassificationResult = {
      outcome: 'outcome',
      answerGroupIndex: 0,
      ruleSpecIndex: 0
    };
    $httpBackend.expectPOST(
      '/explorehandler/classify/' + explorationId).respond(
      backendClassifiedOutcome);
    acs.getMatchingClassificationResult(explorationId, state, 0, false).
      then(successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalledWith(expectedClassificationResult);
    expect(failHandler).not.toHaveBeenCalled();

    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should return the first matching answer group and first matching rule' +
     'spec', function() {
    acs.getMatchingClassificationResult(
      explorationId, state, 10, false, rules).then(successHandler, failHandler);
    $rootScope.$digest();
    expect(successHandler).toHaveBeenCalledWith({
      outcome: 'outcome 1',
      answerGroupIndex: 0,
      ruleSpecIndex: 0
    });
    expect(failHandler).not.toHaveBeenCalled();

    acs.getMatchingClassificationResult(
      explorationId, state, 5, false, rules).then(successHandler, failHandler);
    $rootScope.$digest();
    expect(successHandler).toHaveBeenCalledWith({
      outcome: 'outcome 2',
      answerGroupIndex: 1,
      ruleSpecIndex: 0
    });
    expect(failHandler).not.toHaveBeenCalled();

    acs.getMatchingClassificationResult(
      explorationId, state, 6, false, rules).then(successHandler, failHandler);
    $rootScope.$digest();
    expect(successHandler).toHaveBeenCalledWith({
      outcome: 'outcome 2',
      answerGroupIndex: 1,
      ruleSpecIndex: 1
    });
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should return the default rule if no answer group matches', function() {
    acs.getMatchingClassificationResult(
      explorationId, state, 7, false, rules).then(successHandler, failHandler);
    $rootScope.$digest();
    expect(successHandler).toHaveBeenCalledWith({
      outcome: 'default',
      answerGroupIndex: 2,
      ruleSpecIndex: 0
    });
    expect(failHandler).not.toHaveBeenCalled();
  });
});
