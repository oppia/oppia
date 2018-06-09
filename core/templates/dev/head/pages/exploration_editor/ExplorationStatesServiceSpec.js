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
 * @fileoverview Factory for domain object which manages the states of an
 * exploration.
 */

var joC = jasmine.objectContaining;

describe('ExplorationStatesService', function() {
  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    this.ExplorationStatesService = $injector.get('ExplorationStatesService');
    this.StatesObjectFactory = $injector.get('StatesObjectFactory');
    this.OutcomeObjectFactory = $injector.get('OutcomeObjectFactory');
    this.AnswerGroupObjectFactory = $injector.get('AnswerGroupObjectFactory');

  }));

  beforeEach(inject(function(ExplorationContextService) {
    spyOn(ExplorationContextService, 'getExplorationId').and.returnValue('7');
  }));

  describe('Top Answer Statistics Management', function() {
    beforeEach(function() {
      this.EXP_STATES =
        this.StatesObjectFactory.createSampleBackendDict(['Hola']);
      this.EXP_STATES.Hola.interaction.id = 'TextInput';
      this.EXP_STATES.Hola.interaction.answer_groups = [{
        rule_specs: [{type: 'Contains', inputs: {x: 'hola'}}],
        outcome: this.OutcomeObjectFactory.createSampleBackendDict()
      }];
    });

    beforeEach(inject(function($injector) {
      this.$httpBackend = $injector.get('$httpBackend');
    }));
    afterEach(function() {
      this.$httpBackend.verifyNoOutstandingExpectation();
      this.$httpBackend.verifyNoOutstandingRequest();
    });

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

        this.ExplorationStatesService.init(this.EXP_STATES);
        this.$httpBackend.flush();

        var stateStats = this.ExplorationStatesService.getStateStats('Hola');
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

        this.ExplorationStatesService.init(this.EXP_STATES);
        this.$httpBackend.flush();

        expect(this.ExplorationStatesService.getStateStats('Hola')).toEqual([
          joC({answer: 'hola', frequency: 7}),
          joC({answer: 'adios', frequency: 4}),
          joC({answer: 'que?', frequency: 2}),
        ]);
      });
    });

    describe('.saveInteractionAnswerGroups', function() {
      it('correctly updates addressed info', function() {
        this.$httpBackend.expectGET(
          '/createhandler/state_answer_stats/7'
        ).respond({
          answers: {
            Hola: [{answer: 'adios', frequency: 4}]
          }
        });

        // Initially, 'adios' isn't addressed by the Hola state.
        this.ExplorationStatesService.init(this.EXP_STATES);
        this.$httpBackend.flush();

        expect(this.ExplorationStatesService.getStateStats('Hola')).toEqual([
          joC({answer: 'adios', isAddressed: false})
        ]);

        this.ExplorationStatesService.saveInteractionAnswerGroups('Hola', [
          this.AnswerGroupObjectFactory.createFromBackendDict({
            rule_specs: [{type: 'Equals', inputs: {x: 'adios'}}],
            outcome: this.OutcomeObjectFactory.createSampleBackendDict()
          })
        ]);

        expect(this.ExplorationStatesService.getStateStats('Hola')).toEqual([
          joC({answer: 'adios', isAddressed: true}),
        ]);
      });
    });
  });
});
