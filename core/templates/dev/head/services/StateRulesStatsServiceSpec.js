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
 * @fileoverview Unit tests for state rules stats service.
 */

describe('State Rules Stats Service', function() {
  var StateRulesStatsService = null;

  beforeEach(module('oppia'));
  beforeEach(inject(function($injector) {
    StateRulesStatsService = $injector.get('StateRulesStatsService');
  }));

  it(
    'should claim text-input interaction states support issues overview',
    function() {
      // Only including properties required to identify supported states.
      var TEXT_INPUT_STATE = {interaction: {id: 'TextInput'}};

      expect(
        StateRulesStatsService.stateSupportsIssuesOverview(TEXT_INPUT_STATE)
      ).toBe(true);
    });

  describe('Stats Computation', function() {
    var $httpBackend = null;
    var EXPLORATION_ID = '0';

    beforeEach(inject(function($injector) {
      $httpBackend = $injector.get('$httpBackend');
    }));

    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should respond with answer frequencies', function() {
      // Only including properties required for stat computation.
      var HOLA_STATE = {name: 'Hola', interaction: {id: 'TextInput'}};
      // Only including properties required for stat computation.
      var HOLA_STATE_RULES_STATS_RESPONSE = {
        visualizations_info: [{
          data: [
            {answer: 'Ni Hao', frequency: 5},
            {answer: 'Aloha', frequency: 3},
            {answer: 'Hola', frequency: 1}
          ]
        }]
      };
      var successHandler = jasmine.createSpy('success');
      var failureHandler = jasmine.createSpy('failure');
      $httpBackend.expectGET('/createhandler/state_rules_stats/0/Hola').respond(
        HOLA_STATE_RULES_STATS_RESPONSE
      );

      StateRulesStatsService.computeStateRulesStats(
        HOLA_STATE, EXPLORATION_ID
      ).then(successHandler, failureHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(
        jasmine.objectContaining({
          visualizations_info: [jasmine.objectContaining({
            data: [
              {answer: 'Ni Hao', frequency: 5},
              {answer: 'Aloha', frequency: 3},
              {answer: 'Hola', frequency: 1}
            ]
          })]
        })
      );
      expect(failureHandler).not.toHaveBeenCalled();
    });

    it('should handle addressed info for TextInput', function() {
      // Only including properties required for stat computation.
      var HOLA_STATE = {
        name: 'Hola',
        interaction: {
          answerGroups: [{
            rules: [{type: 'Equals', inputs: {x: 'hola!'}}],
            outcome: {dest: 'Me Llamo'}
          }, {
            rules: [{type: 'Contains', inputs: {x: 'hola'}}],
            outcome: {dest: 'Me Llamo'}
          }, {
            rules: [{type: 'FuzzyEquals', inputs: {x: 'hola'}}],
            outcome: {dest: 'Hola'}
          }],
          defaultOutcome: {dest: 'Hola'},
          id: 'TextInput'
        }
      };
      // Only including properties required for stat computation.
      var HOLA_STATE_RULES_STATS_RESPONSE = {
        visualizations_info: [{
          data: [{answer: 'Ni Hao'}, {answer: 'Aloha'}, {answer: 'Hola'}],
          addressed_info_is_supported: true
        }]
      };
      var successHandler = jasmine.createSpy('success');
      var failureHandler = jasmine.createSpy('failure');
      $httpBackend.expectGET('/createhandler/state_rules_stats/0/Hola').respond(
        HOLA_STATE_RULES_STATS_RESPONSE
      );

      StateRulesStatsService.computeStateRulesStats(
        HOLA_STATE, EXPLORATION_ID
      ).then(successHandler, failureHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(
        jasmine.objectContaining({
          visualizations_info: [jasmine.objectContaining({
            data: [
              jasmine.objectContaining({answer: 'Ni Hao', is_addressed: false}),
              jasmine.objectContaining({answer: 'Aloha', is_addressed: false}),
              jasmine.objectContaining({answer: 'Hola', is_addressed: true})
            ]
          })]
        })
      );
      expect(failureHandler).not.toHaveBeenCalled();
    });
  });
});
