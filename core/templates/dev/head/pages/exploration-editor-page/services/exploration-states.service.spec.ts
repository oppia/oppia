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

require('components/state-editor/state-editor-properties-services/' +
  'state-solicit-answer-details.service.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');

describe('ExplorationStatesService', function() {
  var $q = null;
  var $rootScope = null;
  var $uibModal = null;
  var ChangeListService = null;
  var ContextService = null;
  var ExplorationStatesService = null;
  var StateSolicitAnswerDetailsService = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function(
      _$q_, _$rootScope_, _$uibModal_, _ChangeListService_, _ContextService_,
      _ExplorationStatesService_, _StateSolicitAnswerDetailsService_) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    $uibModal = _$uibModal_;
    ChangeListService = _ChangeListService_;
    ContextService = _ContextService_;
    ExplorationStatesService = _ExplorationStatesService_;
    StateSolicitAnswerDetailsService = _StateSolicitAnswerDetailsService_;
  }));

  beforeEach(function() {
    this.EXP_ID = '7';
    spyOn(ContextService, 'getExplorationId').and.returnValue(this.EXP_ID);

    ExplorationStatesService.init({
      Hola: {
        content: {content_id: 'content', html: ''},
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {},
          },
        },
        param_changes: [],
        interaction: {
          answer_groups: [{
            rule_specs: [{rule_type: 'Contains', inputs: {x: 'hola'}}],
            outcome: {
              dest: 'Me Llamo',
              feedback: {
                content_id: 'feedback_1',
                html: 'buen trabajo!',
              },
              labelled_as_correct: true,
            },
          }],
          default_outcome: {
            dest: 'Hola',
            feedback: {
              content_id: 'default_outcome',
              html: 'try again!',
            },
            labelled_as_correct: false,
          },
          hints: [],
          id: 'TextInput',
          solution: null,
        },
        solicit_answer_details: false,
        written_translations: {
          translations_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {},
          },
        },
        classifier_model_id: 0,
      },
    });
  });

  describe('Callback Registration', function() {
    describe('.registerOnStateAddedCallback', function() {
      it('callsback when a new state is added', function() {
        var spy = jasmine.createSpy('callback');
        spyOn(ChangeListService, 'addState');

        ExplorationStatesService.registerOnStateAddedCallback(spy);
        ExplorationStatesService.addState('Me Llamo');

        expect(spy).toHaveBeenCalledWith('Me Llamo');
      });
    });

    describe('.registerOnStateDeletedCallback', function() {
      it('callsback when a state is deleted', function(done) {
        spyOn($uibModal, 'open').and.callFake(function() {
          return {result: $q.resolve()};
        });
        spyOn(ChangeListService, 'deleteState');

        var spy = jasmine.createSpy('callback');
        ExplorationStatesService.registerOnStateDeletedCallback(spy);

        ExplorationStatesService.deleteState('Hola').then(function() {
          expect(spy).toHaveBeenCalledWith('Hola');
        }).then(done, done.fail);
        $rootScope.$digest();
      });
    });

    describe('.registerOnStateRenamedCallback', function() {
      it('callsback when a state is renamed', function() {
        var spy = jasmine.createSpy('callback');
        spyOn(ChangeListService, 'renameState');

        ExplorationStatesService.registerOnStateRenamedCallback(spy);
        ExplorationStatesService.renameState('Hola', 'Bonjour');

        expect(spy).toHaveBeenCalledWith('Hola', 'Bonjour');
      });
    });

    describe('.registerOnStateInteractionSaved', function() {
      it('callsback when answer groups of a state are saved', function() {
        var spy = jasmine.createSpy('callback');
        spyOn(ChangeListService, 'editStateProperty');

        ExplorationStatesService.registerOnStateInteractionSavedCallback(spy);
        ExplorationStatesService.saveInteractionAnswerGroups('Hola', []);

        expect(spy).toHaveBeenCalledWith('Hola');
      });
    });
  });

  it('should save the solicitAnswerDetails correctly', function() {
    expect(
      ExplorationStatesService.getSolicitAnswerDetailsMemento(
        'Hola', 'solicit_answer_details')).toEqual(false);
    spyOn(ChangeListService, 'editStateProperty');
    ExplorationStatesService.saveSolicitAnswerDetails('Hola', true);
    expect(ChangeListService.editStateProperty).toHaveBeenCalledWith(
      'Hola', 'solicit_answer_details', true, false);
    expect(ExplorationStatesService.getSolicitAnswerDetailsMemento(
      'Hola', 'solicit_answer_details')).toEqual(true);
  });
});
