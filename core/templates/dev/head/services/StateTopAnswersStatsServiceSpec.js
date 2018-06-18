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
    this.stas = $injector.get('StateTopAnswersStatsService');
    this.ess = $injector.get('ExplorationStatesService');

    this.ess.init({
      Hola: {
        content: '',
        param_changes: [],
        interaction: {
          answer_groups: [{
            rule_specs: [{rule_type: 'Contains', inputs: {x: 'hola'}}],
            outcome: {
              dest: 'Me Llamo',
              feedback: {html: 'buen trabajo!'},
              labelled_as_correct: true
            }
          }],
          default_outcome: {
            dest: 'Hola',
            feedback: {html: 'try again!'},
            labelled_as_correct: false
          },
          hints: [],
          id: 'TextInput',
        },
        classifier_model_id: 0,
        content_ids_to_audio_translations: {}
      }
    });

    spyOn($injector.get('ExplorationContextService'), 'getExplorationId')
      .and.returnValue('7');
  }));

  describe('.isInitialized', function() {
    it('begins uninitialized', function() {
      expect(this.stas.isInitialized()).toBe(false);
    });

    it('is true after call to .init', function() {
      this.stas.init({answers: {}});

      expect(this.stas.isInitialized()).toBe(true);
    });
  });

  describe('.init', function() {
    it('correctly identifies unaddressed issues', function() {
      this.stas.init({
        answers: {
          Hola: [
            {answer: 'hola', frequency: 7},
            {answer: 'adios', frequency: 4},
            {answer: 'que?', frequency: 2},
          ]
        }
      });

      var stateStats = this.stas.getStateStats('Hola');
      expect(stateStats).toContain(joC({answer: 'hola', isAddressed: true}));
      expect(stateStats).toContain(joC({answer: 'adios', isAddressed: false}));
      expect(stateStats).toContain(joC({answer: 'que?', isAddressed: false}));
    });

    it('maintains frequency in order', function() {
      this.stas.init({
        answers: {
          Hola: [
            {answer: 'hola', frequency: 7},
            {answer: 'adios', frequency: 4},
            {answer: 'que?', frequency: 2},
          ]
        }
      });

      expect(this.stas.getStateStats('Hola')).toEqual([
        joC({answer: 'hola', frequency: 7}),
        joC({answer: 'adios', frequency: 4}),
        joC({answer: 'que?', frequency: 2}),
      ]);
    });

    it('registers handlers to ExplorationStatesService', function() {
      var expectedRegistrationFunctions = [
        spyOn(this.ess, 'registerOnStateAddedCallback'),
        spyOn(this.ess, 'registerOnStateDeletedCallback'),
        spyOn(this.ess, 'registerOnStateRenamedCallback'),
        spyOn(this.ess, 'registerOnStateInteractionAnswerGroupsSavedCallback')
      ];

      this.stas.init({answers: {}});

      expectedRegistrationFunctions.forEach(function(registrationFunction) {
        expect(registrationFunction).toHaveBeenCalled();
      });
    });

    it('throws when fetching stats about non-existent states', function() {
      expect(function() {
        this.stas.getStateStats('Me Llamo');
      }).toThrow();
    });
  });

  describe('Cache Maintenance', function() {
    beforeEach(inject(function($injector) {
      // ChangeListService will need its calls mocked out since it isn't
      // configured correctly in, or interesting to, the tests of this block.
      this.cls = $injector.get('ChangeListService');
    }));
    beforeEach(function() {
      this.stas.init({
        answers: {
          Hola: [
            {answer: 'hola', frequency: 7},
            {answer: 'adios', frequency: 4},
            {answer: 'que?', frequency: 2},
          ]
        }
      });
    });

    describe('State Addition', function() {
      beforeEach(function() {
        // Disable ChangeListService.addState.
        spyOn(this.cls, 'addState');
      });

      it('creates a new empty list of stats for the new state', function() {
        expect(function() {
          this.stas.getStateStats('Me Llamo');
        }).toThrow();
        expect(function() {
          this.stas.getUnresolvedStateStats('Me Llamo');
        }).toThrow();

        this.ess.addState('Me Llamo');

        expect(this.stas.getStateStats('Me Llamo')).toEqual([]);
        expect(this.stas.getUnresolvedStateStats('Me Llamo')).toEqual([]);
      });
    });

    describe('State Deletion', function() {
      beforeEach(function() {
        // Disable ChangeListService.deleteState.
        spyOn(this.cls, 'deleteState');
      });

      it('throws an error after deleting the stats', function() {
        this.ess.deleteState('Hola');

        expect(function() {
          this.stas.getStateStats('Hola');
        }).toThrow();
        expect(function() {
          this.stas.getUnresolvedStateStats('Hola');
        }).toThrow();
      });
    });

    describe('State Renaming', function() {
      beforeEach(function() {
        // Disable ChangeListService.renameState.
        spyOn(this.cls, 'renameState');
      });

      it('only recognizes the renamed state', function() {
        var oldStats = this.stas.getStateStats('Hola');
        var oldUnresolvedStats = this.stas.getUnresolvedStateStats('Hola');

        this.ess.renameState('Hola', 'Bonjour');

        expect(this.stas.getStateStats('Bonjour')).toBe(oldStats);
        expect(this.stas.getUnresolvedStateStats('Bonjour'))
          .toBe(oldUnresolvedStats);

        expect(function() {
          this.stas.getStateStats('Hola');
        }).toThrow();
        expect(function() {
          this.stas.getUnresolvedStateStats('Hola');
        }).toThrow();
      });
    });

    describe('State Answer Groups Changes', function() {
      beforeEach(function() {
        // Disable ChangeListService.editStateProperty.
        spyOn(this.cls, 'editStateProperty');
      });
      beforeEach(inject(function($injector) {
        this.rof = $injector.get('RuleObjectFactory');
      }));

      it('recognizes newly resolved answers', function() {
        expect(this.stas.getUnresolvedStateStats('Hola'))
          .toContain(joC({answer: 'adios'}));

        var newAnswerGroups = angular.copy(
          this.ess.getState('Hola').interaction.answerGroups);
        newAnswerGroups[0].rules.push(
          this.rof.createNew('Contains', {x: 'adios'}));
        this.ess.saveInteractionAnswerGroups('Hola', newAnswerGroups);

        expect(this.stas.getUnresolvedStateStats('Hola'))
          .not.toContain(joC({answer: 'adios'}));
      });

      it('recognizes newly unresolved answers', function() {
        expect(this.stas.getUnresolvedStateStats('Hola'))
          .not.toContain(joC({answer: 'hola'}));

        var newAnswerGroups = angular.copy(
          this.ess.getState('Hola').interaction.answerGroups);
        newAnswerGroups[0].rules = [
          this.rof.createNew('Contains', {x: 'bonjour'})
        ];
        this.ess.saveInteractionAnswerGroups('Hola', newAnswerGroups);

        expect(this.stas.getUnresolvedStateStats('Hola'))
          .toContain(joC({answer: 'hola'}));
      });
    });
  });
});
