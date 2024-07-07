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

import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {State, StateObjectFactory} from 'domain/state/StateObjectFactory';
import {ExplorationStatesService} from 'pages/exploration-editor-page/services/exploration-states.service';
import {EditabilityService} from 'services/editability.service';
import {ExternalSaveService} from 'services/external-save.service';
import {TranslationLanguageService} from '../services/translation-language.service';
import {TranslationTabActiveContentIdService} from '../services/translation-tab-active-content-id.service';
import {StateTranslationEditorComponent} from './state-translation-editor.component';
import {MarkAudioAsNeedingUpdateModalComponent} from 'components/forms/forms-templates/mark-audio-as-needing-update-modal.component';
import {RecordedVoiceovers} from 'domain/exploration/recorded-voiceovers.model';
import {ChangeListService} from 'pages/exploration-editor-page/services/change-list.service';
import {TranslatedContent} from 'domain/exploration/TranslatedContentObjectFactory';
import {EntityTranslationsService} from 'services/entity-translations.services';
import {EntityTranslation} from 'domain/translation/EntityTranslationObjectFactory';
import {TranslationStatusService} from '../services/translation-status.service';
import {ContextService} from 'services/context.service';

class MockNgbModalRef {
  result: Promise<void> = Promise.resolve();
}

class MockNgbModal {
  open() {
    return new MockNgbModalRef();
  }
}

describe('State Translation Editor Component', () => {
  let component: StateTranslationEditorComponent;
  let fixture: ComponentFixture<StateTranslationEditorComponent>;
  let ngbModal: NgbModal;
  let editabilityService: EditabilityService;
  let entityTranslationsService: EntityTranslationsService;
  let changeListService: ChangeListService;
  let explorationStatesService: ExplorationStatesService;
  let stateObjectFactory: StateObjectFactory;
  let translationLanguageService: TranslationLanguageService;
  let externalSaveService: ExternalSaveService;
  let translationTabActiveContentIdService: TranslationTabActiveContentIdService;
  let translationStatusService: TranslationStatusService;
  let state: State;
  let contextService: ContextService;

  let mockActiveLanguageChangedEventEmitter = new EventEmitter<void>();
  let mockActiveLanguageIdChangedEventEmitter = new EventEmitter<string>();

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        StateTranslationEditorComponent,
        MarkAudioAsNeedingUpdateModalComponent,
      ],
      providers: [
        {
          provide: NgbModal,
          useClass: MockNgbModal,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StateTranslationEditorComponent);
    component = fixture.componentInstance;

    ngbModal = TestBed.inject(NgbModal);
    changeListService = TestBed.inject(ChangeListService);
    entityTranslationsService = TestBed.inject(EntityTranslationsService);
    translationLanguageService = TestBed.inject(TranslationLanguageService);
    externalSaveService = TestBed.inject(ExternalSaveService);
    translationTabActiveContentIdService = TestBed.inject(
      TranslationTabActiveContentIdService
    );
    editabilityService = TestBed.inject(EditabilityService);
    explorationStatesService = TestBed.inject(ExplorationStatesService);
    stateObjectFactory = TestBed.inject(StateObjectFactory);
    translationStatusService = TestBed.inject(TranslationStatusService);
    contextService = TestBed.inject(ContextService);

    state = stateObjectFactory.createDefaultState(
      '',
      'content1',
      'default_outcome'
    );
    state.content.html = 'This is a html text1';
    spyOn(explorationStatesService, 'getState').and.returnValue(state);

    spyOn(contextService, 'getExplorationId').and.returnValue('exp1');
    spyOn(contextService, 'getExplorationVersion').and.returnValue(5);
    spyOn(
      translationTabActiveContentIdService,
      'getActiveContentId'
    ).and.returnValue('content1');
    // SpyOn(editabilityService, 'isEditable').and.returnValue(true);
    spyOn(
      translationLanguageService,
      'getActiveLanguageDirection'
    ).and.returnValue('left');
    spyOnProperty(
      translationLanguageService,
      'onActiveLanguageChanged'
    ).and.returnValue(mockActiveLanguageChangedEventEmitter);
    spyOn(translationLanguageService, 'getActiveLanguageCode').and.returnValue(
      'hi'
    );
    spyOnProperty(
      translationTabActiveContentIdService,
      'onActiveContentIdChanged'
    ).and.returnValue(mockActiveLanguageIdChangedEventEmitter);
    entityTranslationsService.languageCodeToLatestEntityTranslations = {
      hi: EntityTranslation.createFromBackendDict({
        entity_id: 'id',
        entity_type: 'type',
        entity_version: 5,
        language_code: 'hi',
        translations: {
          content1: {
            content_value: 'This is a html text1 in hindi',
            needs_update: false,
            content_format: 'html',
          },
          content2: {
            content_value: 'This is a html text2 in hindi',
            needs_update: false,
            content_format: 'html',
          },
          content3: {
            content_value: 'This is a html text3 in hindi',
            needs_update: false,
            content_format: 'html',
          },
        },
      }),
    };

    component.ngOnInit();
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
    fixture.destroy();
  });

  describe('on clicking save button', () => {
    it('should open model asking whether voiceover needs update', () => {
      state.recordedVoiceovers = RecordedVoiceovers.createFromBackendDict({
        voiceovers_mapping: {
          content1: {
            hi: {
              filename: 'filename1.mp3',
              file_size_bytes: 100,
              needs_update: false,
              duration_secs: 10,
            },
          },
        },
      });
      spyOn(ngbModal, 'open').and.callThrough();

      component.onSaveTranslationButtonClicked();

      expect(ngbModal.open).toHaveBeenCalledWith(
        MarkAudioAsNeedingUpdateModalComponent,
        {
          backdrop: 'static',
        }
      );
    });

    it('should not open the modal if voiceover already needs update', () => {
      state.recordedVoiceovers = RecordedVoiceovers.createFromBackendDict({
        voiceovers_mapping: {
          content1: {
            hi: {
              filename: 'filename1.mp3',
              file_size_bytes: 100,
              needs_update: true,
              duration_secs: 10,
            },
          },
        },
      });
      spyOn(ngbModal, 'open');

      component.onSaveTranslationButtonClicked();

      expect(ngbModal.open).not.toHaveBeenCalled();
    });

    it('should accept NO on voiceover needs update modal', () => {
      state.recordedVoiceovers = RecordedVoiceovers.createFromBackendDict({
        voiceovers_mapping: {
          content1: {
            hi: {
              filename: 'filename1.mp3',
              file_size_bytes: 100,
              needs_update: false,
              duration_secs: 10,
            },
          },
        },
      });
      const mockNgbModalRef = new MockNgbModalRef();
      mockNgbModalRef.result = Promise.reject();
      spyOn(ngbModal, 'open').and.returnValue(mockNgbModalRef as NgbModalRef);

      component.onSaveTranslationButtonClicked();

      expect(ngbModal.open).toHaveBeenCalledWith(
        MarkAudioAsNeedingUpdateModalComponent,
        {backdrop: 'static'}
      );
    });

    it('should add editTranslation changes to draft change list', () => {
      spyOn(changeListService, 'editTranslation');
      (
        translationLanguageService.getActiveLanguageCode as jasmine.Spy
      ).and.returnValue('fr');
      component.activeWrittenTranslation = TranslatedContent.createNew('html');
      component.activeWrittenTranslation.translation = 'Test translation';
      component.onSaveTranslationButtonClicked();
      expect(changeListService.editTranslation).toHaveBeenCalled();
    });

    it('should remove translation if edited translation is blank', () => {
      spyOn(changeListService, 'editTranslation');
      expect(
        entityTranslationsService.languageCodeToLatestEntityTranslations.hi.translationMapping.hasOwnProperty(
          'content1'
        )
      ).toBeTrue();

      component.activeWrittenTranslation = TranslatedContent.createNew('html');
      component.activeWrittenTranslation.translation = '';
      component.onSaveTranslationButtonClicked();

      expect(changeListService.editTranslation).toHaveBeenCalled();
      expect(
        entityTranslationsService.languageCodeToLatestEntityTranslations.hi.translationMapping.hasOwnProperty(
          'content1'
        )
      ).toBeFalse();
    });

    it('should refresh the translation status', () => {
      spyOn(translationStatusService, 'refresh');
      component.onSaveTranslationButtonClicked();
      expect(translationStatusService.refresh).toHaveBeenCalled();
    });
  });

  describe('on opening translation editor', () => {
    describe('when translation is editable', () => {
      beforeEach(() => {
        spyOn(editabilityService, 'isEditable').and.returnValue(true);
      });

      it('should set translationEditorIsOpen', () => {
        component.translationEditorIsOpen = false;
        component.openTranslationEditor();
        expect(component.translationEditorIsOpen).toBe(true);
      });

      it('should intialize active translation if it does not exist', () => {
        component.activeWrittenTranslation = null;
        component.dataFormat = 'html';
        component.openTranslationEditor();
        expect(component.activeWrittenTranslation).toEqual(
          TranslatedContent.createNew('html')
        );
      });
    });

    describe('when translation is not editable', () => {
      beforeEach(() => {
        spyOn(editabilityService, 'isEditable').and.returnValue(false);
      });

      it('should not change translationEditorIsOpen', () => {
        component.translationEditorIsOpen = false;
        component.openTranslationEditor();
        expect(component.translationEditorIsOpen).toBe(false);
      });
    });
  });

  describe('on closing translation editor', () => {
    it('should set translationEditorIsOpen to false', () => {
      component.translationEditorIsOpen = true;
      component.cancelEdit();
      expect(component.translationEditorIsOpen).toBe(false);
    });
  });

  describe('on clicking mark as needs update', () => {
    it('should set needsUpdate to true', () => {
      component.activeWrittenTranslation = TranslatedContent.createNew('html');
      component.activeWrittenTranslation.needsUpdate = false;
      component.markAsNeedingUpdate();
      expect(component.activeWrittenTranslation.needsUpdate).toBe(true);
    });

    it('should add changes to draft change list', () => {
      spyOn(changeListService, 'editTranslation');
      component.markAsNeedingUpdate();
      expect(changeListService.editTranslation).toHaveBeenCalled();
    });

    it('should refresh translation status', () => {
      spyOn(translationStatusService, 'refresh');
      component.markAsNeedingUpdate();
      expect(translationStatusService.refresh).toHaveBeenCalled();
    });
  });

  it('should init editor on language change', () => {
    spyOn(component, 'initEditor');

    translationLanguageService.onActiveLanguageChanged.emit();
    fixture.detectChanges();

    expect(component.initEditor).toHaveBeenCalled();
  });

  it(
    'should init editor and update data ' +
      'format on active content id change',
    () => {
      component.dataFormat = 'html';
      spyOn(component, 'initEditor');

      translationTabActiveContentIdService.onActiveContentIdChanged.emit(
        'unicode'
      );
      fixture.detectChanges();

      expect(component.dataFormat).toEqual('unicode');
      expect(component.initEditor).toHaveBeenCalled();
    }
  );

  it('should create new active translation if needed when initializing editor', () => {
    entityTranslationsService.languageCodeToLatestEntityTranslations = {};
    component.dataFormat = 'html';
    component.initEditor();
    expect(component.activeWrittenTranslation).toEqual(
      TranslatedContent.createNew('html')
    );
  });

  it('should save translation if translation editor is open', () => {
    component.translationEditorIsOpen = true;
    spyOn(component, 'saveTranslation');

    externalSaveService.onExternalSave.emit();
    fixture.detectChanges();

    expect(component.saveTranslation).toHaveBeenCalled();
  });

  it('should not save translation if translation editor is open', () => {
    component.translationEditorIsOpen = false;
    spyOn(component, 'saveTranslation');

    externalSaveService.onExternalSave.emit();
    fixture.detectChanges();

    expect(component.saveTranslation).not.toHaveBeenCalled();
  });
});
