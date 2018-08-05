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
 * @fileoverview Tests for ExplorationStatesService.
 */

describe('ExplorationStatesService', function() {
  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    this.ess = $injector.get('ExplorationStatesService');

    spyOn($injector.get('ContextService'), 'getExplorationId')
      .and.returnValue('7');
  }));

  describe('Callback Registration', function() {
    beforeEach(function() {
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
    });
    beforeEach(inject(function($injector) {
      // ChangeListService will need its calls mocked out since it isn't
      // configured correctly in, or interesting to, the tests of this block.
      this.cls = $injector.get('ChangeListService');
    }));

    describe('.registerOnStateAddedCallback', function() {
      beforeEach(function() {
        spyOn(this.cls, 'addState');
      });

      it('callsback when a new state is added', function() {
        var callbackSpy = jasmine.createSpy('callback');

        this.ess.registerOnStateAddedCallback(callbackSpy);
        this.ess.addState('Me Llamo');

        expect(callbackSpy).toHaveBeenCalledWith('Me Llamo');
      });
    });

    describe('.registerOnStateRenamedCallback', function() {
      beforeEach(function() {
        spyOn(this.cls, 'renameState');
      });

      it('callsback when a state is renamed', function() {
        var callbackSpy = jasmine.createSpy('callback');

        this.ess.registerOnStateRenamedCallback(callbackSpy);
        this.ess.renameState('Hola', 'Bonjour');

        expect(callbackSpy).toHaveBeenCalledWith('Hola', 'Bonjour');
      });
    });

    describe('.registerOnStateAnswerGroupsSaved', function() {
      beforeEach(function() {
        spyOn(this.cls, 'editStateProperty');
      });

      it('callsback when answer groups of a state are saved', function() {
        var callbackSpy = jasmine.createSpy('callback');

        this.ess.registerOnStateAnswerGroupsSavedCallback(callbackSpy);
        this.ess.saveInteractionAnswerGroups('Hola', []);

        expect(callbackSpy).toHaveBeenCalledWith('Hola');
      });
    });
  });
});
