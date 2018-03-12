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
 * @fileoverview Unit tests for state stats service.
 */

describe('State Stats Service', function() {
  var StateStatsService = null;

  beforeEach(module('oppia'));
  beforeEach(inject(function($injector) {
    StateStatsService = $injector.get('StateStatsService');
  }));

  it('should claim text-input interaction states support issues overview',
    function() {
      expect(
        StateStatsService.stateSupportsIssuesOverview({
          interaction: {id: 'TextInput'}
        })
      ).toBe(true);
    });

  describe('Stats Computation', function() {
    var $httpBackend = null;

    beforeEach(inject(function($injector) {
      $httpBackend = $injector.get('$httpBackend');
    }));

    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    var EXPLORATION_ID = '0';
    var HOLA_STATE = null;
    var HOLA_STATE_RULES_STATS_RESPONSE = null;

    beforeEach(function() {
      HOLA_STATE = {
        name: 'Hola',
        interaction: {
          answerGroups: [
            {rules: [{type: 'Equals', inputs: {x: 'hola!'}}]},
            {rules: [{type: 'Contains', inputs: {x: 'hola'}}]},
            {rules: [{type: 'FuzzyEquals', inputs: {x: 'hola'}}]}
          ],
          defaultOutcome: {dest: 'Hola'},
          id: 'TextInput'
        }
      };
      HOLA_STATE_RULES_STATS_RESPONSE = {
        visualizations_info: [{
          data: [
            {answer: 'Ni Hao', frequency: 2},
            {answer: 'Aloha', frequency: 1}
          ],
          id: 'FrequencyTable',
          addressed_info_is_supported: true,
        }]
      };
    });

    it('should work for TextInput', function() {
      var successHandler = jasmine.createSpy('success');
      var failureHandler = jasmine.createSpy('failure');
      $httpBackend.expectGET('/createhandler/state_rules_stats/0/Hola').respond(
        HOLA_STATE_RULES_STATS_RESPONSE
      );

      StateStatsService.computeStateStats(
        HOLA_STATE, EXPLORATION_ID
      ).then(successHandler, failureHandler);

      $httpBackend.flush();
      expect(successHandler).toHaveBeenCalledWith(
        jasmine.objectContaining({
          visualizations_info: [jasmine.objectContaining({
            data: [
              {answer: 'Ni Hao', frequency: 2, is_addressed: false},
              {answer: 'Aloha', frequency: 1, is_addressed: false}
            ],
          })]
        })
      );
      expect(failureHandler).not.toHaveBeenCalled();
    });
  });
});
