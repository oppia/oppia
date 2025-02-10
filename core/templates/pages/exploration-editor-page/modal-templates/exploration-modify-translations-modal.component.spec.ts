// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for modify translations modal component.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  waitForAsync,
  TestBed,
  tick,
  fakeAsync,
} from '@angular/core/testing';
import {
  NgbActiveModal,
  NgbModal,
  NgbModalRef,
} from '@ng-bootstrap/ng-bootstrap';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ModifyTranslationsModalComponent} from './exploration-modify-translations-modal.component';
import {EntityTranslationsService} from 'services/entity-translations.services';
import {EntityTranslation} from 'domain/translation/EntityTranslationObjectFactory';
import {TranslatedContent} from 'domain/exploration/TranslatedContentObjectFactory';
import {ChangeListService} from '../services/change-list.service';
import {ContextService} from 'services/context.service';
import {TranslationLanguageService} from '../translation-tab/services/translation-language.service';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {FormsModule} from '@angular/forms';
import {ModifyTranslationOpportunity} from 'pages/contributor-dashboard-page/modal-templates/translation-modal.component';

class MockNgbModalRef {
  componentInstance = {
    modifyTranslationOpportunity: ModifyTranslationOpportunity,
  };
}

describe('Modify Translations Modal Component', function () {
  let component: ModifyTranslationsModalComponent;
  let fixture: ComponentFixture<ModifyTranslationsModalComponent>;
  let entityTranslationsService: EntityTranslationsService;
  let changeListService: ChangeListService;
  let contextService: ContextService;
  let ngbModal: NgbModal;
  let ngbActiveModal: NgbActiveModal;
  let translationLanguageService: TranslationLanguageService;
  let stateEditorService: StateEditorService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule, HttpClientTestingModule],
      declarations: [ModifyTranslationsModalComponent],
      providers: [NgbActiveModal],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModifyTranslationsModalComponent);
    component = fixture.componentInstance;
    entityTranslationsService = TestBed.inject(EntityTranslationsService);
    changeListService = TestBed.inject(ChangeListService);
    contextService = TestBed.inject(ContextService);
    ngbModal = TestBed.inject(NgbModal);
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    translationLanguageService = TestBed.inject(TranslationLanguageService);
    stateEditorService = TestBed.inject(StateEditorService);

    entityTranslationsService.languageCodeToLatestEntityTranslations = {
      hi: EntityTranslation.createFromBackendDict({
        entity_id: 'expId',
        entity_type: 'exploration',
        entity_version: 5,
        language_code: 'hi',
        translations: {
          content1: {
            content_value: 'This is text one.',
            content_format: 'html',
            needs_update: false,
          },
          content2: {
            content_value: 'This is text two.',
            content_format: 'html',
            needs_update: false,
          },
          content3: {
            content_value: 'This is text three.',
            content_format: 'html',
            needs_update: false,
          },
          rule1: {
            content_value: 'Rule 1',
            content_format: 'set_of_unicode_string',
            needs_update: false,
          },
        },
      }),
    };
  });

  it('should check component is initialized', () => {
    expect(component).toBeDefined();
  });

  describe('when initializing content translations', () => {
    it('should use latest translations from entity translations service', fakeAsync(() => {
      spyOn(contextService, 'getExplorationId').and.returnValue('expId');
      let expectedTranslation = TranslatedContent.createFromBackendDict({
        content_value: 'This is text one.',
        content_format: 'html',
        needs_update: false,
      });
      expect(component.contentTranslations).toEqual({});

      component.contentId = 'content1';
      component.ngOnInit();
      tick();

      expect(component.contentTranslations).toEqual({
        hi: expectedTranslation,
      });
    }));
  });

  it('should initialize the languageIsCheckedStatusDict properly', fakeAsync(() => {
    spyOn(contextService, 'getExplorationId').and.returnValue('expId');
    component.contentId = 'content1';

    component.ngOnInit();
    tick();

    expect(component.languageIsCheckedStatusDict).toEqual({
      hi: false,
    });
  }));

  it('should determine if data format is set of strings', fakeAsync(() => {
    spyOn(contextService, 'getExplorationId').and.returnValue('expId');
    component.contentId = 'content1';
    component.ngOnInit();

    expect(component.isSetOfStringDataFormat()).toBeFalse();

    component.contentId = 'rule1';
    component.ngOnInit();

    expect(component.isSetOfStringDataFormat()).toBeTrue();
  }));

  it('should handle translations being removed', () => {
    spyOn(contextService, 'getExplorationId').and.returnValue('expId');
    spyOn(changeListService, 'getTranslationChangeList').and.returnValue([
      {
        cmd: 'remove_translations',
        content_id: 'content4',
      },
    ]);
    expect(component.contentTranslations).toEqual({});

    component.contentId = 'content4';
    component.ngOnInit();
    expect(component.contentTranslations).toEqual({});
  });

  it('should get language name from language code', () => {
    const languageCode = 'en';
    expect(component.getLanguageName(languageCode)).toBe('English');
  });

  it('should update translations from response of translation editor modal', fakeAsync(() => {
    const testTranslation = 'New test translation in Hindi';
    spyOn(contextService, 'getExplorationId').and.returnValue('expId');
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: MockNgbModalRef,
      result: Promise.resolve(testTranslation),
    } as NgbModalRef);

    spyOn(stateEditorService, 'getActiveStateName').and.returnValue(
      'Introduction'
    );
    spyOn(translationLanguageService, 'setActiveLanguageCode');

    component.contentId = 'content1';
    component.ngOnInit();
    tick();

    component.openTranslationEditor('hi');
    tick();

    expect(ngbModal.open).toHaveBeenCalled();
    expect(
      translationLanguageService.setActiveLanguageCode
    ).toHaveBeenCalledWith('hi');
    expect(component.contentTranslations.hi.translation).toEqual(
      testTranslation
    );
  }));

  it('should add changes to the change list for checked translations', fakeAsync(() => {
    const testTranslation = 'Test translation 2 in Hindi';
    spyOn(contextService, 'getExplorationId').and.returnValue('expId');
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: MockNgbModalRef,
      result: Promise.resolve(testTranslation),
    } as NgbModalRef);
    spyOn(changeListService, 'editTranslation');

    let changedTranslation = TranslatedContent.createFromBackendDict({
      content_value: testTranslation,
      content_format: 'html',
      needs_update: false,
    });

    component.contentId = 'content1';
    component.ngOnInit();
    tick();

    component.openTranslationEditor('hi');
    tick();

    expect(ngbModal.open).toHaveBeenCalled();
    expect(component.contentTranslations.hi.translation).toEqual(
      testTranslation
    );

    component.languageIsCheckedStatusDict = {
      hi: true,
    };
    component.confirm();

    expect(changeListService.editTranslation).toHaveBeenCalledWith(
      component.contentId,
      'hi',
      changedTranslation
    );
  }));

  it('should mark as needing update in the change list for unchecked translations', fakeAsync(() => {
    const testTranslation = 'Test translation 2 in Hindi';
    spyOn(contextService, 'getExplorationId').and.returnValue('expId');
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: MockNgbModalRef,
      result: Promise.resolve(testTranslation),
    } as NgbModalRef);
    spyOn(changeListService, 'markTranslationAsNeedingUpdateForLanguage');

    component.contentId = 'content1';
    component.ngOnInit();
    tick();

    component.openTranslationEditor('hi');
    tick();

    expect(ngbModal.open).toHaveBeenCalled();
    expect(component.contentTranslations.hi.translation).toEqual(
      testTranslation
    );

    component.languageIsCheckedStatusDict = {
      hi: false,
    };
    component.confirm();

    expect(
      changeListService.markTranslationAsNeedingUpdateForLanguage
    ).toHaveBeenCalledWith(component.contentId, 'hi');
  }));

  it('should dismiss the modal when cancel is called', () => {
    spyOn(ngbActiveModal, 'dismiss');
    component.cancel();

    expect(ngbActiveModal.dismiss).toHaveBeenCalled();
  });

  it('should update displayed translation content of modal', () => {
    component.contentId = 'content1';
    component.contentTranslations = {
      hi: TranslatedContent.createFromBackendDict({
        content_value: 'This text will need an update.',
        content_format: 'html',
        needs_update: false,
      }),
    };
    expect(component.translationsHaveLoaded).toBeFalse();

    component.updateTranslationDisplayContent();

    expect(component.languageIsCheckedStatusDict).toEqual({
      hi: false,
    });
    expect(component.translationsHaveLoaded).toBeTrue();
  });
});
