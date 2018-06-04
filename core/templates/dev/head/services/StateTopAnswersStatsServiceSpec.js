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
 * @fileoverview Factory for domain object which holds the list of top answer
 * statistics for a particular state.
 */

var joC = jasmine.objectContaining;

describe('StateTopAnswersStatsService', function() {
  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    this.StateTopAnswersStatsService =
      $injector.get('StateTopAnswersStatsService');
  }));

  beforeEach(inject(function($injector) {
    this.$httpBackend = $injector.get('$httpBackend');
  }));
  afterEach(function() {
    this.$httpBackend.verifyNoOutstandingExpectation();
    this.$httpBackend.verifyNoOutstandingRequest();
  });

  beforeEach(inject(function(ExplorationContextService) {
    spyOn(ExplorationContextService, 'getExplorationId').and.returnValue('7');
  }));

  beforeEach(inject(function(ExplorationStatesService) {
    this.EXP_STATES = {
      Hola: {
        name: 'Hola',
        interaction: {
          answerGroups: [{
            rules: [{type: 'Contains', inputs: {x: 'hola'}}],
            outcome: {dest: 'Me Llamo'}
          }],
          defaultOutcome: {dest: 'Hola'},
          id: 'TextInput'
        }
      }
    };

    var that = this;
    spyOn(ExplorationStatesService, 'getState').and.callFake(
      function(stateName) {
        return that.EXP_STATES[stateName];
      });
  }));

  describe('.init', function() {
    it('correctly identifies unaddressed issues', function() {
      this.$httpBackend.expectGET(
        '/createhandler/state_answer_stats/7'
      ).respond({
        answers: {
          Hola: [
            {answer: 'hola', frequency: 7},
            {answer: 'adios', frequency: 4},
            {answer: 'que?', frequency: 2},
          ]
        }
      });

      this.StateTopAnswersStatsService.init();
      this.$httpBackend.flush();
      var stateStats = this.StateTopAnswersStatsService.getStateStats('Hola');

      expect(stateStats).toContain(joC({answer: 'hola', isAddressed: true}));
      expect(stateStats).toContain(joC({answer: 'adios', isAddressed: false}));
      expect(stateStats).toContain(joC({answer: 'que?', isAddressed: false}));
    });

    it('maintains frequency in order', function() {
      this.$httpBackend.expectGET(
        '/createhandler/state_answer_stats/7'
      ).respond({
        answers: {
          Hola: [
            {answer: 'hola', frequency: 7},
            {answer: 'adios', frequency: 4},
            {answer: 'que?', frequency: 2},
          ]
        }
      });

      this.StateTopAnswersStatsService.init();
      this.$httpBackend.flush();

      expect(this.StateTopAnswersStatsService.getStateStats('Hola')).toEqual([
        joC({answer: 'hola', frequency: 7}),
        joC({answer: 'adios', frequency: 4}),
        joC({answer: 'que?', frequency: 2}),
      ]);
    });
  });

  describe('.refreshStateStats', function() {
    it('correctly updates addressed info', function() {
      this.$httpBackend.expectGET(
        '/createhandler/state_answer_stats/7'
      ).respond({
        answers: {
          Hola: [{answer: 'adios', frequency: 4}]
        }
      });

      // Initially, 'adios' isn't addressed by the Hola state.
      this.StateTopAnswersStatsService.init();
      this.$httpBackend.flush();

      expect(this.StateTopAnswersStatsService.getStateStats('Hola')).toEqual([
        joC({answer: 'adios', isAddressed: false})
      ]);

      this.EXP_STATES.Hola.interaction.answerGroups.push({
        rules: [{type: 'Equals', inputs: {x: 'adios'}}],
        outcome: {dest: 'Hola'}
      });
      // Now, 'adios' is addressed by the Hola state.
      this.StateTopAnswersStatsService.refreshStateStats('Hola');

      expect(this.StateTopAnswersStatsService.getStateStats('Hola')).toEqual([
        joC({answer: 'adios', isAddressed: true}),
      ]);
    });
  });
});
