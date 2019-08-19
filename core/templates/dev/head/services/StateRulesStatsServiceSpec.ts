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

// TODO(#7222): Remove the following block of unnnecessary imports once
// StateRulesStatsService.ts is upgraded to Angular 8.
import { AngularNameService } from
  'pages/exploration-editor-page/services/angular-name.service';
import { AnswerClassificationResultObjectFactory } from
  'domain/classifier/AnswerClassificationResultObjectFactory';
import { ClassifierObjectFactory } from
  'domain/classifier/ClassifierObjectFactory';
import { FractionObjectFactory } from 'domain/objects/FractionObjectFactory';
import { StateClassifierMappingService } from
  'pages/exploration-player-page/services/state-classifier-mapping.service';
// ^^^ This block is to be removed.

require('App.ts');
require('services/StateRulesStatsService.ts');

describe('State Rules Stats Service', function() {
  var StateRulesStatsService = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('AngularNameService', new AngularNameService());
    $provide.value(
      'AnswerClassificationResultObjectFactory',
      new AnswerClassificationResultObjectFactory());
    $provide.value('FractionObjectFactory', new FractionObjectFactory());
  }));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('ClassifierObjectFactory', new ClassifierObjectFactory());
    $provide.value(
      'StateClassifierMappingService', new StateClassifierMappingService(
        new ClassifierObjectFactory()));
  }));
  beforeEach(angular.mock.inject(function($injector) {
    StateRulesStatsService = $injector.get('StateRulesStatsService');
  }));

  it(
    'should claim text-input interaction states support issues overview',
    function() {
      // Only including properties required to identify supported states.
      var TEXT_INPUT_STATE = {interaction: {id: 'TextInput'}};

      expect(
        StateRulesStatsService.stateSupportsImprovementsOverview(
          TEXT_INPUT_STATE)
      ).toBe(true);
    });

  describe('Stats Computation', function() {
    var $httpBackend = null;
    beforeEach(angular.mock.inject(function($injector) {
      $httpBackend = $injector.get('$httpBackend');
    }));
    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    var EXPLORATION_ID = '7';
    beforeEach(angular.mock.inject(function(ContextService) {
      spyOn(
        ContextService, 'getExplorationId'
      ).and.returnValue(EXPLORATION_ID);
    }));

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
      $httpBackend.expectGET('/createhandler/state_rules_stats/7/Hola').respond(
        HOLA_STATE_RULES_STATS_RESPONSE
      );

      StateRulesStatsService.computeStateRulesStats(
        HOLA_STATE
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
      $httpBackend.expectGET('/createhandler/state_rules_stats/7/Hola').respond(
        HOLA_STATE_RULES_STATS_RESPONSE);

      StateRulesStatsService.computeStateRulesStats(HOLA_STATE).then(
        successHandler, failureHandler);
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

    it('should convert FractionInput into readable strings', function() {
      var successHandler = jasmine.createSpy('success');
      var failureHandler = jasmine.createSpy('failure');

      $httpBackend.expectGET(
        '/createhandler/state_rules_stats/7/Fraction').respond(
        {visualizations_info: [{
          data: [
            {
              answer: {
                isNegative: false,
                wholeNumber: 0,
                numerator: 1,
                denominator: 2
              },
              frequency: 3
            },
            {
              answer: {
                isNegative: false,
                wholeNumber: 0,
                numerator: 0,
                denominator: 1
              },
              frequency: 5
            }]
        }]});

      StateRulesStatsService.computeStateRulesStats(
        {name: 'Fraction', interaction: {id: 'FractionInput'}}).then(
        successHandler, failureHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(
        jasmine.objectContaining({
          visualizations_info: [jasmine.objectContaining({
            data: [
              jasmine.objectContaining({ answer: '1/2' }),
              jasmine.objectContaining({ answer: '0' })
            ]
          })]
        })
      );
    });

    it('should not fetch or return answers for null interactions', function() {
      var MOCK_STATE = {name: 'Hola', interaction: {id: null}};
      var successHandler = jasmine.createSpy('success');
      var failureHandler = jasmine.createSpy('failure');

      StateRulesStatsService.computeStateRulesStats(MOCK_STATE)
        .then(successHandler, failureHandler);

      expect($httpBackend.flush).toThrowError(/No pending request to flush/);
      expect(successHandler).toHaveBeenCalledWith(jasmine.objectContaining({
        visualizations_info: [],
      }));
      expect(failureHandler).not.toHaveBeenCalled();
    });
  });
});
