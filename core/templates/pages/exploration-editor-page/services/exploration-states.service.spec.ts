// Copyright 2021 The Oppia Authors. All Rights Reserved.
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

import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
import { ChangeListService } from './change-list.service';
import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

class MockNgbModalRef {
  componentInstance = {
    deleteStateName: null
  };
}

require(
  'components/state-editor/state-editor-properties-services/' +
  'state-solicit-answer-details.service.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');

describe('ExplorationStatesService', function() {
  var $rootScope = null;
  let ngbModal: NgbModal = null;
  let changeListService: ChangeListService = null;
  var ContextService = null;
  var ExplorationStatesService = null;

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('NgbModal', {
      open: () => {
        return {
          componentInstance: MockNgbModalRef,
          result: Promise.resolve('Hola')
        };
      }
    });
  }));
  importAllAngularServices();

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ChangeListService
      ]
    });
  });

  beforeEach(() => {
    ngbModal = TestBed.inject(NgbModal);
    changeListService = TestBed.inject(ChangeListService);
  });

  beforeEach(angular.mock.inject(function(
      _$q_, _$rootScope_, _$uibModal_, _ContextService_,
      _ExplorationStatesService_) {
    $rootScope = _$rootScope_;
    ContextService = _ContextService_;
    ExplorationStatesService = _ExplorationStatesService_;
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
            rule_input: {}
          },
        },
        param_changes: [],
        interaction: {
          answer_groups: [{
            rule_specs: [{
              rule_type: 'Contains',
              inputs: {x: {
                contentId: 'rule_input',
                normalizedStrSet: ['hola']
              }}
            }],
            outcome: {
              dest: 'Me Llamo',
              feedback: {
                content_id: 'feedback_1',
                html: 'buen trabajo!',
              },
              labelled_as_correct: true,
            },
          }],
          customization_args: {
            placeholder: {
              value: {
                content_id: 'ca_placeholder_0',
                unicode_str: ''
              }
            },
            rows: { value: 1 }
          },
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
        linked_skill_id: null,
        solicit_answer_details: false,
        written_translations: {
          translations_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {},
            rule_input: {}
          },
        },
        classifier_model_id: 0,
      },
    });
  });

  describe('Callback Registration', function() {
    describe('.registerOnStateAddedCallback', function() {
      it('should callback when a new state is added', fakeAsync(() => {
        spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
          return ({
            componentInstance: NgbModalRef,
            result: Promise.resolve()
          } as NgbModalRef);
        });
        var spy = jasmine.createSpy('callback');
        spyOn(changeListService, 'addState');

        ExplorationStatesService.registerOnStateAddedCallback(spy);
        ExplorationStatesService.addState('Me Llamo');

        expect(spy).toHaveBeenCalledWith('Me Llamo');
      }));
    });

    describe('.registerOnStateDeletedCallback', function() {
      it('should callback when a state is deleted', fakeAsync(() => {
        spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
          return ({
            componentInstance: MockNgbModalRef,
            result: Promise.resolve('Hola')
          } as NgbModalRef);
        });
        spyOn(changeListService, 'deleteState');

        var spy = jasmine.createSpy('callback');
        ExplorationStatesService.registerOnStateDeletedCallback(spy);
        ExplorationStatesService.deleteState('Hola');
        flushMicrotasks();

        expect(spy).toHaveBeenCalledWith('Hola');
        $rootScope.$digest();
      }));
    });

    describe('.registerOnStateRenamedCallback', function() {
      it('should callback when a state is renamed', function() {
        var spy = jasmine.createSpy('callback');
        spyOn(changeListService, 'renameState');

        ExplorationStatesService.registerOnStateRenamedCallback(spy);
        ExplorationStatesService.renameState('Hola', 'Bonjour');

        expect(spy).toHaveBeenCalledWith('Hola', 'Bonjour');
      });
    });

    describe('.registerOnStateInteractionSaved', function() {
      it('should callback when answer groups of a state are saved',
        function() {
          var spy = jasmine.createSpy('callback');
          spyOn(changeListService, 'editStateProperty');

          ExplorationStatesService.registerOnStateInteractionSavedCallback(spy);
          ExplorationStatesService.saveInteractionAnswerGroups('Hola', []);

          expect(spy)
            .toHaveBeenCalledWith(ExplorationStatesService.getState('Hola'));
        });
    });
  });

  it('should save the solicitAnswerDetails correctly', function() {
    expect(
      ExplorationStatesService.getSolicitAnswerDetailsMemento(
        'Hola', 'solicit_answer_details')).toEqual(false);
    const changeListSpy = spyOn(changeListService, 'editStateProperty');
    ExplorationStatesService.saveSolicitAnswerDetails('Hola', true);
    expect(changeListSpy).toHaveBeenCalledWith(
      'Hola', 'solicit_answer_details', true, false);
    expect(ExplorationStatesService.getSolicitAnswerDetailsMemento(
      'Hola', 'solicit_answer_details')).toEqual(true);
  });
});
