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

  describe('stale instances', function() {
    describe('constructor', function() {
      it('copies ordered frequency data of backend values', function() {
        var stateTopAnswerStatistics =
          new this.StateTopAnswerStatisticsFactory('Hola', [
            {answer: 'aloha', frequency: 5},
            {answer: 'adios', frequency: 3},
            {answer: 'ni hao', frequency: 2},
          ]);

        expect(stateTopAnswerStatistics.getAnswerStats()).toEqual([
          jasmine.objectContaining({answer: 'aloha', frequency: 5}),
          jasmine.objectContaining({answer: 'adios', frequency: 3}),
          jasmine.objectContaining({answer: 'ni hao', frequency: 2}),
        ]);
      });
    });
  });

  describe('fresh instances', function() {
    beforeEach(inject(function(ExplorationContextService) {
      spyOn(ExplorationContextService, 'getExplorationId').and.returnValue('7');
    }));

    beforeEach(inject(function(ExplorationStatesService) {
      // Only the 'Hola' state exists in this fake exploration.
      spyOn(ExplorationStatesService, 'getState').and.callFake(
        function(stateName) {
          if (stateName !== 'Hola') {
            throw new Error(stateName + ' does not exist.');
          }
          return {
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
        });
    }));

    describe('refreshIsAddressed', function() {
      it('makes isAddressed info fresh', function() {
        var stateTopAnswerStatistics =
          new this.StateTopAnswerStatisticsFactory('Hola', [
            {answer: 'hola', frequency: 5},
            {answer: 'adios', frequency: 3},
            {answer: 'ni hao', frequency: 2},
          ]);

        // Should be stale.
        expect(stateTopAnswerStatistics.getAnswerStats()).toEqual([
          jasmine.objectContaining({answer: 'hola', isAddressed: false}),
          jasmine.objectContaining({answer: 'adios', isAddressed: false}),
          jasmine.objectContaining({answer: 'ni hao', isAddressed: false}),
        ]);

        stateTopAnswerStatistics.refreshIsAddressed();

        // Should now be fresh.
        expect(stateTopAnswerStatistics.getAnswerStats()).toEqual([
          jasmine.objectContaining({answer: 'hola', isAddressed: true}),
          jasmine.objectContaining({answer: 'adios', isAddressed: false}),
          jasmine.objectContaining({answer: 'ni hao', isAddressed: false}),
        ]);
      });
    });

    describe('createFromBackendDict', function() {
      it('returns a fresh instance', function() {
        var stateTopAnswerStatistics =
          this.StateTopAnswerStatisticsFactory.createFromBackendDict('Hola', [
            {answer: 'hola', frequency: 5},
            {answer: 'adios', frequency: 3},
            {answer: 'ni hao', frequency: 2},
          ]);

        expect(stateTopAnswerStatistics.getAnswerStats()).toEqual([
          jasmine.objectContaining({answer: 'hola', isAddressed: true}),
          jasmine.objectContaining({answer: 'adios', isAddressed: false}),
          jasmine.objectContaining({answer: 'ni hao', isAddressed: false}),
        ]);
      });
    });
  });
});
