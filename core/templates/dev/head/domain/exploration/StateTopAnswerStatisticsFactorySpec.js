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
 * @fileoverview Unit tests for StateTopAnswerStatisticsFactory.
 */

describe('StateTopAnswerStatisticsFactory', function() {
  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    this.StateTopAnswerStatisticsFactory =
      $injector.get('StateTopAnswerStatisticsFactory');
  }));

  beforeEach(inject(function(ExplorationContextService) {
    spyOn(ExplorationContextService, 'getExplorationId').and.returnValue('7');
  }));

  beforeEach(inject(function(ExplorationStatesService) {
    var states = {
      Hola: {
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
      }
    };
    spyOn(ExplorationStatesService, 'getState').and.callFake(
      function(stateName) {
        return states[stateName];
      });
  }));

  describe('constructor', function() {
    it('copies ordered frequency data of backend values', function() {
      var stateTopAnswerStatistics =
        new this.StateTopAnswerStatisticsFactory('Hola', [
          {answer: 'hola', frequency: 5},
          {answer: 'adios', frequency: 3},
          {answer: 'que?', frequency: 2},
        ]);

      expect(stateTopAnswerStatistics.getAnswerStats()).toEqual([
        jasmine.objectContaining({answer: 'hola', frequency: 5}),
        jasmine.objectContaining({answer: 'adios', frequency: 3}),
        jasmine.objectContaining({answer: 'que?', frequency: 2}),
      ]);
    });
  });

  describe('Stale Instances', function() {
    describe('constructor', function() {
      it('leaves addressed stale', function() {
        var stateTopAnswerStatistics =
          new this.StateTopAnswerStatisticsFactory('Hola', [
            // 'hola' *is* an addressed answer.
            {answer: 'hola', frequency: 5},
            {answer: 'adios', frequency: 3},
            {answer: 'que?', frequency: 2},
          ]);

        expect(stateTopAnswerStatistics.getAnswerStats()).toEqual([
          // However, it is left stale to avoid backend calls.
          jasmine.objectContaining({answer: 'hola', isAddressed: false}),
          jasmine.objectContaining({answer: 'adios', isAddressed: false}),
          jasmine.objectContaining({answer: 'que?', isAddressed: false}),
        ]);
      });
    });
  });

  describe('Fresh Instances', function() {
    describe('refreshIsAddressed', function() {
      it('makes isAddressed info fresh', function() {
        var stateTopAnswerStatistics =
          new this.StateTopAnswerStatisticsFactory('Hola', [
            {answer: 'hola', frequency: 5},
            {answer: 'adios', frequency: 3},
            {answer: 'que?', frequency: 2},
          ]);

        // Should be stale.
        expect(stateTopAnswerStatistics.getAnswerStats()).toEqual([
          jasmine.objectContaining({answer: 'hola', isAddressed: false}),
          jasmine.objectContaining({answer: 'adios', isAddressed: false}),
          jasmine.objectContaining({answer: 'que?', isAddressed: false}),
        ]);

        stateTopAnswerStatistics.refreshIsAddressed();

        // Should now be fresh.
        expect(stateTopAnswerStatistics.getAnswerStats()).toEqual([
          jasmine.objectContaining({answer: 'hola', isAddressed: true}),
          jasmine.objectContaining({answer: 'adios', isAddressed: false}),
          jasmine.objectContaining({answer: 'que?', isAddressed: false}),
        ]);
      });
    });

    describe('createFromBackendDict', function() {
      it('returns a fresh instance', function() {
        var stateTopAnswerStatistics =
          this.StateTopAnswerStatisticsFactory.createFromBackendDict('Hola', [
            {answer: 'hola', frequency: 5},
            {answer: 'adios', frequency: 3},
            {answer: 'que?', frequency: 2},
          ]);

        expect(stateTopAnswerStatistics.getAnswerStats()).toEqual([
          jasmine.objectContaining({answer: 'hola', isAddressed: true}),
          jasmine.objectContaining({answer: 'adios', isAddressed: false}),
          jasmine.objectContaining({answer: 'que?', isAddressed: false}),
        ]);
      });
    });
  });
});
