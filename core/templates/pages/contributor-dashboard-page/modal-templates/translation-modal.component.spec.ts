// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for LoginRequiredModalComponent.
*/

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { ComponentFixture, fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AppConstants } from 'app.constants';
import { CkEditorCopyContentService } from 'components/ck-editor-helpers/ck-editor-copy-content-service';
import { SharedComponentsModule } from 'components/shared-component.module';
import { TranslationModalContent, TranslationOpportunityDict } from 'pages/contributor-dashboard-page/modal-templates/translation-modal.component';
import { TranslationLanguageService } from 'pages/exploration-editor-page/translation-tab/services/translation-language.service';
import { ContextService } from 'services/context.service';
import { TranslateTextService } from '../services/translate-text.service';

describe('Login Required Modal Content', () => {
  let contextService: ContextService;
  let translateTextService: TranslateTextService;
  let translationLanguageService: TranslationLanguageService;
  let ckEditorCopyContentService: CkEditorCopyContentService;
  let httpTestingController: HttpTestingController;
  let fixture: ComponentFixture<TranslationModalContent>;
  let component: TranslationModalContent;
  let opportunity: TranslationOpportunityDict = {
    id: '1',
    heading: 'Heading',
    subheading: 'subheading',
    progressPercentage: '20',
    actionButtonTitle: 'Action Button'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        SharedComponentsModule
      ],
      declarations: [
        TranslationModalContent
      ],
      providers: [
        NgbActiveModal
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    fixture = TestBed.createComponent(TranslationModalContent);
    component = fixture.componentInstance;
    component.opportunity = opportunity;
    httpTestingController = TestBed.inject(HttpTestingController);
    ckEditorCopyContentService = TestBed.inject(CkEditorCopyContentService);
    contextService = TestBed.inject(ContextService);
    translateTextService = TestBed.inject(TranslateTextService);
    translationLanguageService = TestBed.inject(TranslationLanguageService);
    translationLanguageService.setActiveLanguageCode('es');
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  describe('when initialized', () => {
    describe('with an rtl language', () => {
      beforeEach(fakeAsync(() => {
        translationLanguageService.setActiveLanguageCode('ar');
        spyOn(translateTextService, 'init').and.callFake(
          (expId, languageCode, successCallback) => successCallback());
        component.ngOnInit();
      }));

      it('should set the schema constant correctly', () => {
        expect(component.getHtmlSchema().ui_config.languageDirection)
          .toBe('rtl');
      });
    });

    describe('with an ltr language', () => {
      beforeEach(fakeAsync(() => {
        translationLanguageService.setActiveLanguageCode('es');
        spyOn(translateTextService, 'init').and.callFake(
          (expId, languageCode, successCallback) => successCallback());
        component.ngOnInit();
      }));

      it('should set the schema constant correctly', () => {
        expect(component.getHtmlSchema().ui_config.languageDirection)
          .toBe('ltr');
      });
    });

    it('should set context correctly', fakeAsync(() => {
      spyOn(translateTextService, 'init').and.callFake(
        (expId, languageCode, successCallback) => successCallback());
      component.ngOnInit();
      expect(contextService.getEntityType()).toBe(
        AppConstants.ENTITY_TYPE.EXPLORATION);
      expect(contextService.getEntityId()).toBe('1');
      expect(contextService.imageSaveDestination).toBe(
        AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE);
    }));

    it('should initialize translateTextService', fakeAsync(() => {
      spyOn(translateTextService, 'init').and.callThrough();
      spyOn(translateTextService, 'getTextToTranslate').and.callThrough();
      component.ngOnInit();
      expect(component.loadingData).toBeTrue();
      expect(translateTextService.init).toHaveBeenCalled();

      const sampleStateWiseContentMapping = {
        stateName1: {contentId1: 'text1'},
        stateName2: {contentId2: 'text2'}
      };

      const req = httpTestingController.expectOne(
        '/gettranslatabletexthandler?exp_id=1&language_code=es');
      expect(req.request.method).toEqual('GET');
      req.flush({
        state_names_to_content_id_mapping: sampleStateWiseContentMapping,
        version: 1
      });
      flushMicrotasks();
      expect(component.loadingData).toBeFalse();
      expect(translateTextService.getTextToTranslate).toHaveBeenCalled();

      expect(component.textToTranslate).toBe('text1');
      expect(component.moreAvailable).toBeTrue();
    }));

    it('should set the schema constant based on the active language', fakeAsync(
      () => {
        translationLanguageService.setActiveLanguageCode('ar');
        spyOn(translateTextService, 'init').and.callFake(
          (expId, languageCode, successCallback) => successCallback());
        component.ngOnInit();
        expect(component.getHtmlSchema().ui_config.language)
          .toBe('ar');
      }));
  });

  describe('when clicking on the translatable content', () => {
    let target: HTMLElement;
    let broadcastSpy: jasmine.Spy<(target: HTMLElement) => void>;
    let propagationSpy: jasmine.Spy<() => void>;
    beforeEach(fakeAsync(() => {
      spyOn(translateTextService, 'init').and.callFake(
        (expId, languageCode, successCallback) => successCallback());
      broadcastSpy = spyOn(
        ckEditorCopyContentService, 'broadcastCopy').and.stub();

      component.ngOnInit();
      target = document.createElement('div');
      target.onclick = function(this, ev) {
        propagationSpy = spyOn(ev, 'stopPropagation').and.stub();
        component.onContentClick(ev);
      };
    }));

    it('should broadcast the clicked element', () => {
      target.click();
      expect(broadcastSpy).toHaveBeenCalledWith(target);
    });
    describe('when copy mode is active', () => {
      beforeEach(() => {
        ckEditorCopyContentService.toggleCopyMode();
      });
      it('should prevent default behavior', () => {
        target.click();
        expect(propagationSpy).toHaveBeenCalled();
      });
    });

    describe('when copy mode is inactive', () => {
      it('should not prevent default behavior', () => {
        target.click();
        expect(propagationSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('clicking the skip button', () => {
    describe('when there is available text', () => {
      it('should retrieve remaining text availability', () => {
        // TODO
      });

      it('should set the active text to translate to the next available text',
        () => {
          // TODO
        });
    });

    describe('when there is no more available text', () => {
      it('should close the modal', () => {

      });
    });
  });

  describe('clicking save', () => {
    describe('when alreadhy uploading a translation', () => {
      it('should not submit the translation', () => {
        // TODO
      });
    });

    describe('when currently loading data', () => {
      it('should not submit the translation', () => {
        // TODO
      });
    });
  });

  describe('when clicking cancel', () => {
    it('should close the modal', () => {

    });
  });
});
