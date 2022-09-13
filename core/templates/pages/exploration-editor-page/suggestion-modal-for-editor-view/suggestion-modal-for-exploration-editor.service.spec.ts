// Copyright 2021 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit test for Suggestion Modal For Exploration Editor.
 */

import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { SuggestionModalForExplorationEditorService } from './suggestion-modal-for-exploration-editor.service';
import { ThreadDataBackendApiService } from '../feedback-tab/services/thread-data-backend-api.service';
import { ExplorationDataService } from '../services/exploration-data.service';
import { ExplorationStatesService } from '../services/exploration-states.service';
import { LoggerService } from 'services/contextual/logger.service';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { State } from 'domain/state/StateObjectFactory';

describe('Suggestion Modal For Exploration Editor', () => {
  let ngbModal: NgbModal;
  let smfees: SuggestionModalForExplorationEditorService;
  let activeThread;
  let extraParams;
  let threadDataBackendApiService: ThreadDataBackendApiService;
  let loggerService: LoggerService;
  let explorationDataService: ExplorationDataService;
  let explorationStatesService: ExplorationStatesService;
  let stateDict = {
    content: {
      content_id: 'content',
      html: 'content'
    },
    recorded_voiceovers: {
      voiceovers_mapping: {
        content: {},
        default_outcome: {},
        feedback_1: {},
        feedback_2: {}
      }
    },
    interaction: {
      id: 'TextInput',
      customization_args: {
        placeholder: {
          value: {
            content_id: 'ca_placeholder_0',
            unicode_str: ''
          }
        },
        rows: { value: 1 }
      },
      answer_groups: [{
        outcome: {
          dest: 'outcome 1',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'feedback_1',
            html: ''
          },
          labelled_as_correct: false,
          param_changes: [],
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null
        },
        rule_specs: [{
          rule_type: 'Equals',
          inputs: {
            x: {
              contentId: 'rule_input_0',
              normalizedStrSet: ['10']
            }
          }
        }],
      }, {
        outcome: {
          dest: 'outcome 2',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'feedback_2',
            html: ''
          },
          labelled_as_correct: false,
          param_changes: [],
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null
        },
        rule_specs: [{
          rule_type: 'Equals',
          inputs: {
            x: {
              contentId: 'rule_input_1',
              normalizedStrSet: ['5']
            }
          }
        }, {
          rule_type: 'Equals',
          inputs: {
            x: {
              contentId: 'rule_input_2',
              normalizedStrSet: ['6']
            }
          }
        }, {
          rule_type: 'FuzzyEquals',
          inputs: {
            x: {
              contentId: 'rule_input_3',
              normalizedStrSet: ['7']
            }
          }
        }],
      }],
      default_outcome: {
        dest: 'default',
        dest_if_really_stuck: null,
        feedback: {
          content_id: 'default_outcome',
          html: ''
        },
        labelled_as_correct: false,
        param_changes: [],
        refresher_exploration_id: null,
        missing_prerequisite_skill_id: null
      },
      hints: []
    },
    param_changes: [],
    solicit_answer_details: false,
    written_translations: {
      translations_mapping: {
        content: {},
        default_outcome: {},
        feedback_1: {},
        feedback_2: {}
      }
    }
  };

  class MockNgbModal {
    open() {
      return {
        result: Promise.resolve()
      };
    }
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: ExplorationDataService,
          useValue: {
            explorationId: '12345',
            data: {
              version: 1
            }
          }
        },
        {
          provide: NgbModal,
          useClass: MockNgbModal
        },
        SuggestionModalForExplorationEditorService
      ]
    });

    ngbModal = TestBed.inject(NgbModal);

    smfees = TestBed.inject(SuggestionModalForExplorationEditorService);
    threadDataBackendApiService = TestBed.inject(ThreadDataBackendApiService);
    explorationDataService = TestBed.inject(ExplorationDataService);
    explorationStatesService = TestBed.inject(ExplorationStatesService);
    loggerService = TestBed.inject(LoggerService);
    activeThread = {
      getSuggestion: () => {
        return {
          stateName: 'Hola'
        };
      },
      getSuggestionStateName: () => {},
      getSuggestionStatus: () => {},
      getReplacementHtmlFromSuggestion: () => {
        return '<p> Replacement HTML </p>';
      },
      threadId: 'id',
    };
    extraParams = {
      activeThread: activeThread,
      isSuggestionHandled: () => {},
      hasUnsavedChanges: () => {},
      isSuggestionValid: () => {},
      setActiveThread: () => {}
    };
    spyOn(explorationStatesService, 'setState');
    spyOn(explorationStatesService, 'getState').and.returnValue({
      content: new SubtitledHtml('html', 'html')
    } as State);

    explorationDataService.data = {
      states: {
        Hola: stateDict
      },
      version: 10
    };
  });


  it('should open suggestion modal', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        currentContent: '',
        newContent: '',
        suggestionIsHandled: '',
        suggestionIsValid: false,
        suggestionStatus: false,
        threadUibModalInstance: '',
        unsavedChangesExist: '',
      },
      result: Promise.resolve({
        action: 'accept',
        audioUpdateRequired: true
      })
    } as NgbModalRef);
    spyOn(threadDataBackendApiService, 'resolveSuggestionAsync')
      .and.returnValue(Promise.resolve(null));

    smfees.showSuggestionModal('edit_exploration_state_content', extraParams);
    tick();

    expect(explorationDataService.data.version).toBe(11);
    expect(explorationStatesService.setState).toHaveBeenCalled();
  }));

  it('should error if there is problem while resolving suggestion', () => {
    spyOn(threadDataBackendApiService, 'resolveSuggestionAsync')
      .and.returnValue(Promise.reject());
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        currentContent: null,
        newContent: null,
        suggestionIsHandled: null,
        suggestionIsValid: false,
        suggestionStatus: false,
        threadUibModalInstance: null,
        unsavedChangesExist: null,
      },
      result: Promise.resolve({
        action: 'accept',
        audioUpdateRequired: true
      })
    } as NgbModalRef);
    spyOn(loggerService, 'error').and.stub();
    smfees.showSuggestionModal('edit_exploration_state_content', extraParams);

    expect(
      loggerService.error).not.toHaveBeenCalled();
  });

  it('should throw error on trying to show suggestion of a' +
    ' non-existent thread', () => {
    extraParams.activeThread = undefined;

    expect(() => {
      smfees.showSuggestionModal('edit_exploration_state_content', extraParams);
    }).toThrowError('Trying to show suggestion of a non-existent thread.');
  });
});
