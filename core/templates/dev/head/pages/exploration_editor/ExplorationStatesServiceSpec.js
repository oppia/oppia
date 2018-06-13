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
  }));

  describe('.init', function() {
  });

  describe('post-init functions', function() {
    beforeEach(function() {
      this.ess.init({
        Hola: {
          content: '',
          param_changes: [],
          interaction: {
            answer_groups: [{
              rule_specs: [{type: 'Contains', inputs: {x: 'hola'}}],
              outcome: {
                dest: 'Me Llamo',
                feedback: {html: 'buen trabajo!'}
              }
            }],
            defaultOutcome: {dest: 'Hola'},
            hints: [],
            id: 'TextInput'
          },
          classifier_model_id: 0,
          content_ids_to_audio_translations: {}
        }
      });
    });

    describe('.registerOnStateAddedCallback', function() {
      it('callsback when a new state is added', function() {
        /*
        var callbackSpy = jasmine.createSpy('callback');

        this.ess.registerOnStateAddedCallback(callbackSpy);
        this.ess.addState('foo');

        expect(callbackSpy).toHaveBeenCalledWith('foo');
      */
      });
    });

    describe('.registerOnStateDeletedCallback', function() {
    });

    describe('.registerOnStateRenamedCallback', function() {
    });

    describe('.registerOnStateInteractionAnswerGroupsSaved', function() {
    });
  });
});
