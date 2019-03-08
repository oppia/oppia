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
    this.stass = $injector.get('StateTopAnswersStatsService');
    this.ess = $injector.get('ExplorationStatesService');

    this.ess.init({
      Hola: {
        content: {
          content_id: 'content',
          html: ''
        },
        param_changes: [],
        interaction: {
          answer_groups: [{
            rule_specs: [{rule_type: 'Contains', inputs: {x: 'hola'}}],
            outcome: {
              dest: 'Me Llamo',
              feedback: {
                content_id: 'feedback_1',
                html: 'buen trabajo!'
              },
              labelled_as_correct: true
            }
          }],
          default_outcome: {
            dest: 'Hola',
            feedback: {
              content_id: 'default_outcome',
              html: 'try again!'
            },
            labelled_as_correct: false
          },
          hints: [],
          id: 'TextInput',
        },
        classifier_model_id: 0,
        content_ids_to_audio_translations: {
          content: {},
          default_outcome: {},
          feedback_1: {}
        },
        written_translations: {
          translations_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {}
          }
        }
      }
    });

    spyOn($injector.get('ContextService'), 'getExplorationId')
      .and.returnValue('7');
  }));

  describe('.isInitialized', function() {
    it('begins uninitialized', function() {
      expect(this.stass.isInitialized()).toBe(false);
    });

    it('is true after call to .init', function() {
      this.stass.init({answers: {}});

      expect(this.stass.isInitialized()).toBe(true);
    });
  });

  describe('.init', function() {
    it('correctly identifies unaddressed issues', function() {
      this.stass.init({
        answers: {
          Hola: [
            {answer: 'hola', frequency: 7},
            {answer: 'adios', frequency: 4},
            {answer: 'que?', frequency: 2},
          ]
        }
      });

      var stateStats = this.stass.getStateStats('Hola');
      expect(stateStats).toContain(joC({answer: 'hola', isAddressed: true}));
      expect(stateStats).toContain(joC({answer: 'adios', isAddressed: false}));
      expect(stateStats).toContain(joC({answer: 'que?', isAddressed: false}));
    });

    it('maintains frequency in order', function() {
      this.stass.init({
        answers: {
          Hola: [
            {answer: 'hola', frequency: 7},
            {answer: 'adios', frequency: 4},
            {answer: 'que?', frequency: 2},
          ]
        }
      });

      expect(this.stass.getStateStats('Hola')).toEqual([
        joC({answer: 'hola', frequency: 7}),
        joC({answer: 'adios', frequency: 4}),
        joC({answer: 'que?', frequency: 2}),
      ]);
    });

    it('throws when fetching stats about non-existent states', function() {
      expect(function() {
        this.stass.getStateStats('Me Llamo');
      }).toThrow();
      expect(function() {
        this.stass.getUnresolvedStateStats('Me Llamo');
      }).toThrow();
    });

    it('registers handlers to ExplorationStatesService', function() {
      var expectedRegistrationFunctions = [
        spyOn(this.ess, 'registerOnStateAddedCallback'),
        spyOn(this.ess, 'registerOnStateDeletedCallback'),
        spyOn(this.ess, 'registerOnStateRenamedCallback'),
        spyOn(this.ess, 'registerOnStateAnswerGroupsSavedCallback')
      ];

      this.stass.init({answers: {}});

      expectedRegistrationFunctions.forEach(function(registrationFunction) {
        expect(registrationFunction).toHaveBeenCalled();
      });
    });

    it('does not register duplicate handlers if called again', function() {
      var expectedRegistrationFunctions = [
        spyOn(this.ess, 'registerOnStateAddedCallback'),
        spyOn(this.ess, 'registerOnStateDeletedCallback'),
        spyOn(this.ess, 'registerOnStateRenamedCallback'),
        spyOn(this.ess, 'registerOnStateAnswerGroupsSavedCallback')
      ];

      this.stass.init({answers: {}});
      // Second call should not add more callbacks.
      this.stass.init({answers: {}});

      expectedRegistrationFunctions.forEach(function(registrationFunction) {
        expect(registrationFunction.calls.count()).toEqual(1);
      });
    });
  });

  describe('.hasStateStats', function() {
    it('is false when uninitialized', function() {
      expect(this.stass.isInitialized()).toBe(false);
      expect(this.stass.hasStateStats('Hola')).toBe(false);
    });

    it('is true when the state contains answers', function() {
      this.stass.init({answers: {Hola: [{answer: 'hola', frequency: 3}]}});

      expect(this.stass.hasStateStats('Hola')).toBe(true);
    });

    it('is true even when the state contains no answers', function() {
      this.stass.init({answers: {Hola: []}});

      expect(this.stass.hasStateStats('Hola')).toBe(true);
    });

    it('is false when the state does not exist', function() {
      this.stass.init({answers: {Hola: [{answer: 'hola', frequency: 3}]}});

      expect(this.stass.hasStateStats('Me Llamo')).toBe(false);
    });
  });

  describe('.getStateNamesWithStats', function() {
    it('only returns state names that have stats', function() {
      this.stass.init({answers: {Hola: [{answer: 'hola', frequency: 3}]}});

      expect(this.stass.getStateNamesWithStats()).toEqual(['Hola']);
    });
  });

  describe('Cache Maintenance', function() {
    beforeEach(inject(function($injector) {
      // ChangeListService will need its calls mocked out since it isn't
      // configured correctly in, or interesting to, the tests of this block.
      this.cls = $injector.get('ChangeListService');
    }));
    beforeEach(function() {
      this.stass.init({
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
          this.stass.getStateStats('Me Llamo');
        }).toThrow();
        expect(function() {
          this.stass.getUnresolvedStateStats('Me Llamo');
        }).toThrow();

        this.ess.addState('Me Llamo');

        expect(this.stass.getStateStats('Me Llamo')).toEqual([]);
        expect(this.stass.getUnresolvedStateStats('Me Llamo')).toEqual([]);
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
          this.stass.getStateStats('Hola');
        }).toThrow();
        expect(function() {
          this.stass.getUnresolvedStateStats('Hola');
        }).toThrow();
      });
    });

    describe('State Renaming', function() {
      beforeEach(function() {
        // Disable ChangeListService.renameState.
        spyOn(this.cls, 'renameState');
      });

      it('only recognizes the renamed state', function() {
        var oldStats = this.stass.getStateStats('Hola');
        var oldUnresolvedStats = this.stass.getUnresolvedStateStats('Hola');

        this.ess.renameState('Hola', 'Bonjour');

        expect(this.stass.getStateStats('Bonjour')).toBe(oldStats);
        expect(this.stass.getUnresolvedStateStats('Bonjour'))
          .toBe(oldUnresolvedStats);

        expect(function() {
          this.stass.getStateStats('Hola');
        }).toThrow();
        expect(function() {
          this.stass.getUnresolvedStateStats('Hola');
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
        expect(this.stass.getUnresolvedStateStats('Hola'))
          .toContain(joC({answer: 'adios'}));

        var newAnswerGroups = angular.copy(
          this.ess.getState('Hola').interaction.answerGroups);
        newAnswerGroups[0].rules = [
          this.rof.createNew('Contains', {x: 'adios'})
        ];
        this.ess.saveInteractionAnswerGroups('Hola', newAnswerGroups);

        expect(this.stass.getUnresolvedStateStats('Hola'))
          .not.toContain(joC({answer: 'adios'}));
      });

      it('recognizes newly unresolved answers', function() {
        expect(this.stass.getUnresolvedStateStats('Hola'))
          .not.toContain(joC({answer: 'hola'}));

        var newAnswerGroups = angular.copy(
          this.ess.getState('Hola').interaction.answerGroups);
        newAnswerGroups[0].rules = [
          this.rof.createNew('Contains', {x: 'bonjour'})
        ];
        this.ess.saveInteractionAnswerGroups('Hola', newAnswerGroups);

        expect(this.stass.getUnresolvedStateStats('Hola'))
          .toContain(joC({answer: 'hola'}));
      });
    });
  });
});
