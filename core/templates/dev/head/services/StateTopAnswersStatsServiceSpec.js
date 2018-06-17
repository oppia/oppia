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
    this.ecs = $injector.get('ExplorationContextService');
    this.ess = $injector.get('ExplorationStatesService');

    spyOn(this.ecs, 'getExplorationId').and.returnValue('7');
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
      var spyStateAdded = spyOn(this.ess, 'registerOnStateAddedCallback');
      var spyStateDeleted = spyOn(this.ess, 'registerOnStateDeletedCallback');
      var spyStateRenamed = spyOn(this.ess, 'registerOnStateRenamedCallback');
      var spyStateInteractionAnswerGroupsSaved =
        spyOn(this.ess, 'registerOnStateInteractionAnswerGroupsSavedCallback');

      this.stas.init({answers: {}});
      expect(spyStateAdded).toHaveBeenCalled();
      expect(spyStateDeleted).toHaveBeenCalled();
      expect(spyStateRenamed).toHaveBeenCalled();
      expect(spyStateInteractionAnswerGroupsSaved).toHaveBeenCalled();
    });
  });
});
