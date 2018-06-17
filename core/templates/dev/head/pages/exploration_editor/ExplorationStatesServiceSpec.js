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
    this.ecs = $injector.get('ExplorationContextService');
    spyOn(this.ecs, 'getExplorationId').and.returnValue('7');
  }));

  describe('.init', function() {
    // TODO.
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
            id: 'TextInput',
          },
          classifier_model_id: 0,
          content_ids_to_audio_translations: {}
        }
      });
    });

    describe('.registerOnStateAddedCallback', function() {
      beforeEach(inject(function($injector) {
        this.cls = $injector.get('ChangeListService');
        // Don't let ChangeListService.addState run in this unit-test since it
        // the service is not configured properly in this describe block.
        spyOn(this.cls, 'addState');
      }));

      it('callsback when a new state is added', function() {
        var callbackSpy = jasmine.createSpy('callback');

        this.ess.registerOnStateAddedCallback(callbackSpy);
        this.ess.addState('foo');

        expect(callbackSpy).toHaveBeenCalledWith('foo');
      });
    });

    describe('.registerOnStateDeletedCallback', function() {
      beforeEach(inject(function($injector) {
        // Don't let ChangeListService.deleteState run in this unit-test since
        // it the service is not configured properly in this describe block.
        this.cls = $injector.get('ChangeListService');
        spyOn(this.cls, 'deleteState');
        // When ExplorationStatesService tries to show the confirm-delete modal,
        // have it immediately confirm.
        this.$uibModal = $injector.get('$uibModal');
        spyOn(this.$uibModal, 'open').and.callFake(function(stateName) {
          return {result: Promise.resolve(stateName)};
        });
      }));

      it('callsback when a new state is deleted', function() {
        var callbackSpy = jasmine.createSpy('callback');

        this.ess.registerOnStateDeletedCallback(callbackSpy);
        promise = this.ess.deleteState('Hola');

        promise.then(function() {
          expect(callbackSpy).toHaveBeenCalledWith('Hola');
        });
      });
    });

    describe('.registerOnStateRenamedCallback', function() {
    });

    describe('.registerOnStateInteractionAnswerGroupsSaved', function() {
    });
  });
});
