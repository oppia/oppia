// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for stateTranslationEditor.
 */

import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { StateWrittenTranslationsService } from 'components/state-editor/state-editor-properties-services/state-written-translations.service';
import { WrittenTranslation, WrittenTranslationObjectFactory } from 'domain/exploration/WrittenTranslationObjectFactory';
import { State, StateBackendDict, StateObjectFactory } from 'domain/state/StateObjectFactory';
import { ExplorationStatesService } from 'pages/exploration-editor-page/services/exploration-states.service';
import { EditabilityService } from 'services/editability.service';
import { ExternalSaveService } from 'services/external-save.service';
import { TranslationLanguageService } from '../services/translation-language.service';
import { TranslationTabActiveContentIdService } from '../services/translation-tab-active-content-id.service';
import { StateTranslationEditorComponent } from './state-translation-editor.component';
import { MarkAudioAsNeedingUpdateModalComponent } from 'components/forms/forms-templates/mark-audio-as-needing-update-modal.component';
import { WrittenTranslations } from 'domain/exploration/WrittenTranslationsObjectFactory';
import { Voiceover } from 'domain/exploration/voiceover.model';
import { RecordedVoiceovers } from 'domain/exploration/recorded-voiceovers.model';

class MockNgbModal {
  open() {
    return {
      result: Promise.resolve()
    };
  }
}

class MockExplorationStatesService {
  getState(value) {
    return {
      recordedVoiceovers: {
        getLanguageCodes: (value) => {
          return ['en'];
        },
        getAllContentIds: () => {
          return [];
        },
        toggleNeedsUpdateAttribute: (value, value2) => {},
        getVoiceover: (value, value2) => {
          return {
            needsUpdate: false
          };
        }
      }
    };
  }

  getInteractionIdMemento() {
    return '';
  }

  isInitialized() {
    return true;
  }

  getStateNames() {
    return [''];
  }

  getRecordedVoiceoversMemento() {
    return {
      getLanguageCodes: () => {
        return [];
      },

      getAllContentIds: () => {
        return [];
      }
    };
  }

  getSolutionMemento() {
    return null;
  }

  saveRecordedVoiceovers() {}

  saveWrittenTranslation() {}

  markWrittenTranslationAsNeedingUpdate() {}
}

describe('State Translation Editor Component', () => {
  let component: StateTranslationEditorComponent;
  let fixture: ComponentFixture<StateTranslationEditorComponent>;
  let ngbModal: NgbModal;
  let editabilityService: EditabilityService;
  let explorationStatesService: ExplorationStatesService;
  let stateEditorService: StateEditorService;
  let stateObjectFactory: StateObjectFactory;
  let stateWrittenTranslationsService: StateWrittenTranslationsService;
  let translationLanguageService: TranslationLanguageService;
  let translationTabActiveContentIdService:
    TranslationTabActiveContentIdService;
  let writtenTranslationObjectFactory: WrittenTranslationObjectFactory;

  let mockActiveContentIdChangedEventEmitter = new EventEmitter<string>();
  let mockActiveLanguageChangedEventEmitter = new EventEmitter<void>();
  let mockExternalSaveEventEmitter = new EventEmitter<void>();
  let stateName: string = 'State1';
  let state = {
    classifier_model_id: '1',
    content: {
      content_id: 'content1',
      html: 'This is a html text'
    },
    interaction: {
      answer_groups: [
        {
          outcome: {
            dest: 'outcome 1',
            dest_if_really_stuck: null,
            feedback: {
              content_id: 'content2',
              html: ''
            },
            labelled_as_correct: true,
            missing_prerequisite_skill_id: null,
            param_changes: [],
            refresher_exploration_id: null
          },
          rule_specs: [],
          tagged_skill_misconception_id: '',
          training_data: null,
        }, {
          outcome: {
            dest: 'outcome 2',
            dest_if_really_stuck: null,
            feedback: {
              content_id: 'content3',
              html: ''
            },
            labelled_as_correct: true,
            missing_prerequisite_skill_id: null,
            param_changes: [],
            refresher_exploration_id: null
          },
          rule_specs: [],
          tagged_skill_misconception_id: '',
          training_data: null,
        }
      ],
      default_outcome: null,
      confirmed_unclassified_answers: null,
      customization_args: {},
      hints: [],
      id: null,
      solution: {
        answer_is_exclusive: false,
        correct_answer: 'This is the correct answer',
        explanation: {
          content_id: 'content1',
          html: 'This is a html text'
        }
      }
    },
    linked_skill_id: null,
    param_changes: [],
    recorded_voiceovers: {
      voiceovers_mapping: {
        content_1: {
          en: {
            needs_update: false,
            duration_secs: null,
            filename: null,
            file_size_bytes: null,
          },
          es: {
            needs_update: true,
            duration_secs: null,
            filename: null,
            file_size_bytes: null,
          }
        }
      }
    },
    solicit_answer_details: true,
    written_translations: {
      translations_mapping: {}
    },
    card_is_checkpoint: null,
    next_content_id_index: null,
  } as StateBackendDict;
  let stateObj = null;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        StateTranslationEditorComponent,
        MarkAudioAsNeedingUpdateModalComponent
      ],
      providers: [
        {
          provide: NgbModal,
          useClass: MockNgbModal
        },
        {
          provide: ExplorationStatesService,
          useClass: MockExplorationStatesService
        },
        {
          provide: ExternalSaveService,
          useValue: {
            onExternalSave: mockExternalSaveEventEmitter
          }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StateTranslationEditorComponent);
    component = fixture.componentInstance;

    stateEditorService = TestBed.inject(StateEditorService);
    stateObjectFactory = TestBed.inject(StateObjectFactory);
    ngbModal = TestBed.inject(NgbModal);
    editabilityService = TestBed.inject(EditabilityService);
    explorationStatesService = TestBed.inject(ExplorationStatesService);
    spyOn(explorationStatesService, 'saveWrittenTranslation').and.callFake(
      () => {});

    translationLanguageService = TestBed.inject(TranslationLanguageService);
    translationTabActiveContentIdService = TestBed.inject(
      TranslationTabActiveContentIdService);
    stateWrittenTranslationsService = TestBed.inject(
      StateWrittenTranslationsService);
    writtenTranslationObjectFactory = TestBed.inject(
      WrittenTranslationObjectFactory);

    spyOn(stateEditorService, 'getActiveStateName').and.returnValue(
      stateName);
    spyOn(editabilityService, 'isEditable').and.returnValue(true);
    stateObj = stateObjectFactory.createFromBackendDict(
      stateName, state);
    spyOn(
      translationLanguageService, 'getActiveLanguageDirection')
      .and.returnValue('left');
    spyOnProperty(
      translationLanguageService, 'onActiveLanguageChanged').and.returnValue(
      mockActiveLanguageChangedEventEmitter);
    spyOn(translationLanguageService, 'getActiveLanguageCode')
      .and.returnValue('en');
    spyOnProperty(
      translationTabActiveContentIdService,
      'onActiveContentIdChanged').and.returnValue(
      mockActiveLanguageChangedEventEmitter);

    stateWrittenTranslationsService.init(stateName, {
      hasWrittenTranslation: () => true,
      getWrittenTranslation: () => (
        writtenTranslationObjectFactory.createFromBackendDict({
          data_format: 'html',
          translation: 'This is a html',
          needs_update: true
        })
      ) as WrittenTranslation,
      updateWrittenTranslation: () => {},
      translationsMapping: null,
      _writtenTranslationObjectFactory: null,
      getAllContentIds: null,
      markAllTranslationsAsNeedingUpdate: null,
      getLanguageCodes: null,
      hasUnflaggedWrittenTranslations: null,
      addContentId: null,
      deleteContentId: null,
      addWrittenTranslation: null,
      toggleNeedsUpdateAttribute: null,
      toBackendDict: null
    } as WrittenTranslations);

    component.ngOnInit();
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  describe('when has written translation', () => {
    it('should initialize component properties after controller is initialized',
      () => {
        expect(component.translationEditorIsOpen).toBe(false);
        expect(component.activeWrittenTranslation).toEqual(
          writtenTranslationObjectFactory.createFromBackendDict({
            data_format: 'html',
            translation: 'This is a html',
            needs_update: true
          }));
      });

    it('should not update state\'s recorded voiceovers after broadcasting' +
      ' externalSave when written translation doesn\'t need udpdate',
    fakeAsync(() => {
      component.openTranslationEditor();
      expect(component.translationEditorIsOpen).toBe(true);
      stateWrittenTranslationsService.displayed = {
        hasWrittenTranslation: () => true,
        getWrittenTranslation: () => (
          writtenTranslationObjectFactory.createFromBackendDict({
            data_format: 'html',
            translation: 'This is a second html',
            needs_update: true
          })
        ),
        updateWrittenTranslation: () => {},
        translationsMapping: null,
        _writtenTranslationObjectFactory: null,
        getAllContentIds: null,
        markAllTranslationsAsNeedingUpdate: null,
        getLanguageCodes: null,
        hasUnflaggedWrittenTranslations: null,
        addContentId: null,
        deleteContentId: null,
        addWrittenTranslation: null,
        toggleNeedsUpdateAttribute: null,
        toBackendDict: null
      } as WrittenTranslations;
      spyOn(translationTabActiveContentIdService, 'getActiveContentId').and
        .returnValue('content_1');
      spyOn(ngbModal, 'open').and.returnValue({
        result: Promise.resolve()
      } as NgbModalRef);

      mockExternalSaveEventEmitter.emit();
      tick();

      expect(ngbModal.open).toHaveBeenCalled();
    }));

    it('should update state\'s recorded voiceovers after broadcasting' +
      ' externalSave event when closing modal', fakeAsync(() => {
      component.openTranslationEditor();
      tick();

      expect(component.translationEditorIsOpen).toBe(true);

      stateWrittenTranslationsService.displayed = {
        hasWrittenTranslation: () => true,
        getWrittenTranslation: () => (
          writtenTranslationObjectFactory.createFromBackendDict({
            data_format: 'html',
            translation: 'This is a second html',
            needs_update: true
          })
        ),
        updateWrittenTranslation: () => {},
        translationsMapping: null,
        _writtenTranslationObjectFactory: null,
        getAllContentIds: null,
        markAllTranslationsAsNeedingUpdate: null,
        getLanguageCodes: null,
        hasUnflaggedWrittenTranslations: null,
        addContentId: null,
        deleteContentId: null,
        addWrittenTranslation: null,
        toggleNeedsUpdateAttribute: null,
        toBackendDict: null
      } as WrittenTranslations;
      spyOn(translationTabActiveContentIdService, 'getActiveContentId').and
        .returnValue('content_1');
      spyOn(ngbModal, 'open').and.returnValue({
        result: Promise.resolve()
      } as NgbModalRef);
      expect(
        stateObj.recordedVoiceovers.getBindableVoiceovers('content_1')
          .en.needsUpdate).toBe(false);

      mockExternalSaveEventEmitter.emit();
      tick();

      expect(
        stateObj.recordedVoiceovers.getBindableVoiceovers('content_1')
          .en.needsUpdate).toBe(false);
    }));

    it('should update state\'s recorded voiceovers after broadcasting' +
    ' externalSave event when dismissing modal', () => {
      component.openTranslationEditor();
      expect(component.translationEditorIsOpen).toBe(true);
      stateWrittenTranslationsService.displayed = {
        hasWrittenTranslation: () => true,
        getWrittenTranslation: () => (
          writtenTranslationObjectFactory.createFromBackendDict({
            data_format: 'html',
            translation: 'This is a second html',
            needs_update: true
          })
        ),
        updateWrittenTranslation: () => {},
        translationsMapping: null,
        _writtenTranslationObjectFactory: null,
        getAllContentIds: null,
        markAllTranslationsAsNeedingUpdate: null,
        getLanguageCodes: null,
        hasUnflaggedWrittenTranslations: null,
        addContentId: null,
        deleteContentId: null,
        addWrittenTranslation: null,
        toggleNeedsUpdateAttribute: null,
        toBackendDict: null
      } as WrittenTranslations;
      spyOn(translationTabActiveContentIdService, 'getActiveContentId').and
        .returnValue('content_1');
      spyOn(ngbModal, 'open').and.returnValue({
        result: Promise.reject()
      } as NgbModalRef);

      expect(
        stateObj.recordedVoiceovers.getBindableVoiceovers('content_1')
          .en.needsUpdate).toBe(false);

      mockExternalSaveEventEmitter.emit();

      expect(
        stateObj.recordedVoiceovers.getBindableVoiceovers('content_1')
          .en.needsUpdate).toBe(false);
    });

    it('should update written translation html when clicking on save' +
      ' translation button', () => {
      spyOn(
        stateWrittenTranslationsService.displayed,
        'updateWrittenTranslation').and.callThrough();
      component.onSaveTranslationButtonClicked();

      expect(
        stateWrittenTranslationsService.displayed.updateWrittenTranslation)
        .toHaveBeenCalled();
    });

    it('should cancel edit and restore values', () => {
      stateWrittenTranslationsService.displayed = {
        hasWrittenTranslation: () => true,
        getWrittenTranslation: () => (
          writtenTranslationObjectFactory.createFromBackendDict({
            data_format: 'html',
            translation: 'This is a second html',
            needs_update: true
          })
        ),
        updateWrittenTranslation: () => {},
        translationsMapping: null,
        _writtenTranslationObjectFactory: null,
        getAllContentIds: null,
        markAllTranslationsAsNeedingUpdate: null,
        getLanguageCodes: null,
        hasUnflaggedWrittenTranslations: null,
        addContentId: null,
        deleteContentId: null,
        addWrittenTranslation: null,
        toggleNeedsUpdateAttribute: null,
        toBackendDict: null
      } as WrittenTranslations;
      component.cancelEdit();

      expect(
        stateWrittenTranslationsService.displayed.getWrittenTranslation(
          null, null).getTranslation()
      ).toBe('This is a html');
    });

    it('should init editor when changing active content id language',
      () => {
        mockActiveContentIdChangedEventEmitter.emit('html');
        expect(component.translationEditorIsOpen).toBe(false);
        expect(component.activeWrittenTranslation).toEqual(
          writtenTranslationObjectFactory.createFromBackendDict({
            data_format: 'html',
            translation: 'This is a html',
            needs_update: true
          }));
      });

    it('should init editor when changing active language', () => {
      mockActiveLanguageChangedEventEmitter.emit();
      expect(component.translationEditorIsOpen).toBe(false);
      expect(component.activeWrittenTranslation).toEqual(
        writtenTranslationObjectFactory.createFromBackendDict({
          data_format: 'html',
          translation: 'This is a html',
          needs_update: true
        }));
    });
  });

  describe('when hasn\'t written translation', () => {
    it('should add written translation html when clicking on save' +
    ' translation button', () => {
      stateWrittenTranslationsService.displayed = {
        hasWrittenTranslation(value1, value2) {
          return false;
        },
        addWrittenTranslation(value1, value2, value3, value4) {}
      } as WrittenTranslations;

      spyOn(component, 'saveTranslation')
        .and.stub();
      spyOn(
        stateWrittenTranslationsService.displayed,
        'addWrittenTranslation').and.callThrough();
      spyOn(translationTabActiveContentIdService, 'getActiveContentId').and
        .returnValue('content_1');
      component.onSaveTranslationButtonClicked();

      expect(
        component.saveTranslation).toHaveBeenCalled();
    });

    it('should mark translation as needing update', () => {
      component.activeWrittenTranslation = {
        needsUpdate: false
      } as WrittenTranslation;
      spyOn(
        explorationStatesService, 'markWrittenTranslationAsNeedingUpdate');
      component.activeWrittenTranslation = (
        writtenTranslationObjectFactory.createNew('set_of_unicode_string'));
      expect(component.activeWrittenTranslation.needsUpdate).toBeFalse();

      component.markAsNeedingUpdate();

      expect(
        explorationStatesService.markWrittenTranslationAsNeedingUpdate
      ).toHaveBeenCalled();
      expect(component.activeWrittenTranslation.needsUpdate).toBeTrue();
    });

    it('should mark audio as needing update', () => {
      spyOn(explorationStatesService, 'getState').and.returnValue({
        recordedVoiceovers: {
          getLanguageCodes: (value) => {
            return ['en'];
          },
          getAllContentIds: () => {
            return [];
          },
          toggleNeedsUpdateAttribute: (value, value2) => {},
          getVoiceover: (value1, value2) => {
            return {
              needsUpdate: true
            } as Voiceover;
          }
        } as RecordedVoiceovers
      } as State);

      component.showMarkAudioAsNeedingUpdateModalIfRequired(null, 'en');
    });

    it('should open translation editor when it is editable', () => {
      spyOn(writtenTranslationObjectFactory, 'createNew').and.returnValue(null);
      spyOn(component, 'isEditable').and.returnValue(true);

      component.activeWrittenTranslation = null;
      component.openTranslationEditor();

      expect(component.translationEditorIsOpen).toBe(true);
      expect(component.activeWrittenTranslation).toEqual(null);
    });
  });
});
