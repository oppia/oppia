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

import {ChangeListService} from './change-list.service';
import {fakeAsync, flushMicrotasks, TestBed} from '@angular/core/testing';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {ContextService} from 'services/context.service';
import {ExplorationStatesService} from './exploration-states.service';
import {
  AnswerGroup,
  AnswerGroupObjectFactory,
} from 'domain/exploration/AnswerGroupObjectFactory';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {GenerateContentIdService} from 'services/generate-content-id.service';

class MockNgbModalRef {
  componentInstance = {
    deleteStateName: null,
  };
}

class MockNgbModal {
  open() {
    return {
      componentInstance: MockNgbModalRef,
      result: Promise.resolve('Hola'),
    };
  }
}

describe('ExplorationStatesService', () => {
  let ngbModal: NgbModal;
  let changeListService: ChangeListService;
  let contextService: ContextService;
  let explorationStatesService: ExplorationStatesService;
  let answerGroupObjectFactory: AnswerGroupObjectFactory;
  let answerGroup: AnswerGroup;
  let generateContentIdService: GenerateContentIdService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ChangeListService,
        {
          provide: NgbModal,
          useClass: MockNgbModal,
        },
      ],
    });
  });

  beforeEach(() => {
    ngbModal = TestBed.inject(NgbModal);
    changeListService = TestBed.inject(ChangeListService);
    contextService = TestBed.inject(ContextService);
    explorationStatesService = TestBed.inject(ExplorationStatesService);
    answerGroupObjectFactory = TestBed.inject(AnswerGroupObjectFactory);
    generateContentIdService = TestBed.inject(GenerateContentIdService);
    generateContentIdService.init(
      () => 0,
      () => {}
    );
  });

  beforeEach(() => {
    let EXP_ID = '7';
    spyOn(contextService, 'getExplorationId').and.returnValue(EXP_ID);

    answerGroup = answerGroupObjectFactory.createFromBackendDict(
      {
        rule_specs: [
          {
            rule_type: 'Contains',
            inputs: {
              x: {
                contentId: 'rule_input',
                normalizedStrSet: ['hola'],
              },
            },
          },
        ],
        outcome: {
          dest: 'Me Llamo',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'feedback_1',
            html: 'buen trabajo!',
          },
          labelled_as_correct: true,
          param_changes: [],
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null,
        },
        training_data: [],
        tagged_skill_misconception_id: null,
      },
      'TextInput'
    );

    explorationStatesService.init(
      {
        Hola: {
          content: {content_id: 'content', html: ''},
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {},
              rule_input: {},
            },
          },
          param_changes: [],
          interaction: {
            confirmed_unclassified_answers: [],
            answer_groups: [answerGroup.toBackendDict()],
            customization_args: {
              placeholder: {
                value: {
                  content_id: 'ca_placeholder_0',
                  unicode_str: '',
                },
              },
              rows: {value: 1},
              catchMisspellings: {
                value: false,
              },
            },
            default_outcome: {
              dest: 'Me Llamo',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'feedback_1',
                html: 'buen trabajo!',
              },
              labelled_as_correct: true,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
            },
            hints: [],
            id: 'TextInput',
            solution: null,
          },
          linked_skill_id: null,
          solicit_answer_details: false,
          classifier_model_id: '0',
          card_is_checkpoint: false,
        },
      },
      false
    );
  });

  describe('Callback Registration', () => {
    describe('.registerOnStateAddedCallback', () => {
      it('should callback when a new state is added', fakeAsync(() => {
        spyOn(ngbModal, 'open').and.callFake(() => {
          return {
            componentInstance: NgbModalRef,
            result: Promise.resolve(),
          } as NgbModalRef;
        });
        let spy = jasmine.createSpy('callback');
        spyOn(changeListService, 'addState');

        explorationStatesService.registerOnStateAddedCallback(spy);
        explorationStatesService.addState('Me Llamo', () => {});

        expect(spy).toHaveBeenCalledWith('Me Llamo');
      }));
    });

    describe('.registerOnStateDeletedCallback', () => {
      it('should callback when a state is deleted', fakeAsync(() => {
        spyOn(ngbModal, 'open').and.callFake(() => {
          return {
            componentInstance: MockNgbModalRef,
            result: Promise.resolve('Hola'),
          } as NgbModalRef;
        });
        spyOn(changeListService, 'deleteState');

        let spy = jasmine.createSpy('callback');
        explorationStatesService.registerOnStateDeletedCallback(spy);
        explorationStatesService.deleteState('Hola');
        flushMicrotasks();

        expect(spy).toHaveBeenCalledWith('Hola');
        flushMicrotasks();
      }));
    });

    describe('.registerOnStateRenamedCallback', () => {
      it('should callback when a state is renamed', () => {
        let spy = jasmine.createSpy('callback');
        spyOn(changeListService, 'renameState');

        explorationStatesService.registerOnStateRenamedCallback(spy);
        explorationStatesService.renameState('Hola', 'Bonjour');

        expect(spy).toHaveBeenCalledWith('Hola', 'Bonjour');
      });
    });

    describe('.registerOnStateInteractionSaved', () => {
      it('should callback when answer groups of a state are saved', () => {
        let spy = jasmine.createSpy('callback');
        spyOn(changeListService, 'editStateProperty');

        explorationStatesService.registerOnStateInteractionSavedCallback(spy);
        explorationStatesService.saveInteractionAnswerGroups('Hola', [
          answerGroup,
        ]);

        expect(spy).toHaveBeenCalledWith(
          explorationStatesService.getState('Hola')
        );
      });
    });
  });

  it('should save the solicitAnswerDetails correctly', () => {
    expect(
      explorationStatesService.getSolicitAnswerDetailsMemento('Hola')
    ).toEqual(false);
    const changeListSpy = spyOn(changeListService, 'editStateProperty');
    explorationStatesService.saveSolicitAnswerDetails('Hola', true);
    expect(changeListSpy).toHaveBeenCalledWith(
      'Hola',
      'solicit_answer_details',
      true,
      false
    );
    expect(
      explorationStatesService.getSolicitAnswerDetailsMemento('Hola')
    ).toBeTrue();
  });
});
