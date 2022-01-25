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
 * @fileoverview Unit tests for TranslationModalComponent.
*/

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';

import { ComponentFixture, fakeAsync, flushMicrotasks, TestBed, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AppConstants } from 'app.constants';
import { CkEditorCopyContentService } from 'components/ck-editor-helpers/ck-editor-copy-content.service';
import { OppiaAngularRootComponent } from 'components/oppia-angular-root.component';
import { TranslationModalComponent, TranslationOpportunity } from 'pages/contributor-dashboard-page/modal-templates/translation-modal.component';
import { TranslationLanguageService } from 'pages/exploration-editor-page/translation-tab/services/translation-language.service';
import { ContextService } from 'services/context.service';
import { ImageLocalStorageService } from 'services/image-local-storage.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { UserService } from 'services/user.service';
import { TranslateTextService } from '../services/translate-text.service';
import {TranslateTextBackendApiService} from '../services/translate-text-backend-api.service';

class MockChangeDetectorRef {
  detectChanges(): void {}
}

describe('Translation Modal Component', () => {
  let contextService: ContextService;
  let translateTextService: TranslateTextService;
  let translationLanguageService: TranslationLanguageService;
  let ckEditorCopyContentService: CkEditorCopyContentService;
  let siteAnalyticsService: SiteAnalyticsService;
  let imageLocalStorageService: ImageLocalStorageService;
  let translateTextBackendApiService: TranslateTextBackendApiService;
  let userService: UserService;
  let activeModal: NgbActiveModal;
  let httpTestingController: HttpTestingController;
  let fixture: ComponentFixture<TranslationModalComponent>;
  let component: TranslationModalComponent;
  let changeDetectorRef: MockChangeDetectorRef = new MockChangeDetectorRef();
  const opportunity: TranslationOpportunity = {
    id: '1',
    heading: 'Heading',
    subheading: 'subheading',
    progressPercentage: '20',
    actionButtonTitle: 'Action Button',
    inReviewCount: 12,
    totalCount: 50,
    translationsCount: 20
  };
  const getContentTranslatableItemWithText = (text) => {
    return {
      data_format: 'html',
      content: text,
      content_type: 'content',
      interaction_id: null,
      rule_type: null
    };
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [
        TranslationModalComponent
      ],
      providers: [
        NgbActiveModal,
        {
          provide: ChangeDetectorRef,
          useValue: changeDetectorRef
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    OppiaAngularRootComponent.contextService = TestBed.inject(ContextService);
    contextService = OppiaAngularRootComponent.contextService;
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TranslationModalComponent);
    component = fixture.componentInstance;
    component.opportunity = opportunity;
    httpTestingController = TestBed.inject(HttpTestingController);
    ckEditorCopyContentService = TestBed.inject(CkEditorCopyContentService);
    activeModal = TestBed.inject(NgbActiveModal);
    translateTextService = TestBed.inject(TranslateTextService);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
    imageLocalStorageService = TestBed.inject(ImageLocalStorageService);
    translateTextBackendApiService = TestBed.
      inject(TranslateTextBackendApiService);
    translationLanguageService = TestBed.inject(TranslationLanguageService);
    translationLanguageService.setActiveLanguageCode('es');
    userService = TestBed.inject(UserService);
    spyOn(
      userService,
      'getUserContributionRightsDataAsync')
      .and.returnValue(Promise.resolve(
        {
          can_review_translation_for_language_codes: ['ar'],
          can_review_voiceover_for_language_codes: [],
          can_review_questions: false
        }
      ));
  });

  it('should invoke change detection when html is updated', () => {
    component.activeWrittenTranslation = 'old';
    spyOn(changeDetectorRef, 'detectChanges').and.callThrough();
    component.updateHtml('new');
    expect(component.activeWrittenTranslation).toEqual('new');
  });

  it('should not invoke change detection when html is not updated', () => {
    component.activeWrittenTranslation = 'old';
    spyOn(changeDetectorRef, 'detectChanges').and.callThrough();
    component.updateHtml('old');
    expect(component.activeWrittenTranslation).toEqual('old');
    expect(changeDetectorRef.detectChanges).toHaveBeenCalledTimes(0);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should close', () => {
    spyOn(activeModal, 'close');
    component.close();
    expect(activeModal.close).toHaveBeenCalled();
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
      contextService.removeCustomEntityContext();
      contextService.resetImageSaveDestination();
      spyOn(translateTextService, 'init').and.callFake(
        (expId, languageCode, successCallback) => successCallback());
      component.ngOnInit();
      expect(contextService.getEntityType()).toBe(
        AppConstants.ENTITY_TYPE.EXPLORATION);
      expect(contextService.getEntityId()).toBe('1');
      expect(contextService.getImageSaveDestination()).toBe(
        AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE);
    }));

    it('should initialize translateTextService', fakeAsync(() => {
      spyOn(translateTextService, 'init').and.callThrough();
      spyOn(translateTextService, 'getTextToTranslate').and.callThrough();
      spyOn(translateTextService, 'getPreviousTextToTranslate')
        .and.callThrough();
      component.ngOnInit();
      expect(component.loadingData).toBeTrue();
      expect(translateTextService.init).toHaveBeenCalled();

      const sampleStateWiseContentMapping = {
        stateName1: {contentId1: getContentTranslatableItemWithText('text1')},
        stateName2: {contentId2: getContentTranslatableItemWithText('text2')}
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
      component.skipActiveTranslation();
      component.returnToPreviousTranslation();
      expect(translateTextService.getPreviousTextToTranslate)
        .toHaveBeenCalled();
      expect(component.textToTranslate).toBe('text1');
      // The value of moreAvailable will be set to true when the operation
      // is viewing a previous translation. If the value is false, the
      // 'save and close' button is shown. This should happen only on the
      // last translation.
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

    it('should get the unicode schema', () => {
      expect(component.getUnicodeSchema()).toEqual({type: 'unicode'});
    });

    it('should get the set of strings schema', () => {
      expect(component.getSetOfStringsSchema()).toEqual(
        {
          type: 'list',
          items: {
            type: 'unicode'
          }
        }
      );
    });
  });

  describe('when clicking on the translatable content', () => {
    const nonParagraphTarget: HTMLElement = document.createElement('div');
    const mathTarget: HTMLElement = document.createElement(
      'oppia-noninteractive-math');
    let paragraphTarget: HTMLElement;
    let broadcastSpy: jasmine.Spy<(target: HTMLElement) => void>;
    let propagationSpy: jasmine.Spy<() => void>;
    beforeEach(fakeAsync(() => {
      paragraphTarget = document.createElement('p');
      spyOn(translateTextService, 'init').and.callFake(
        (expId, languageCode, successCallback) => successCallback());
      broadcastSpy = spyOn(
        ckEditorCopyContentService, 'broadcastCopy').and.stub();

      component.ngOnInit();
      nonParagraphTarget.onclick = function(this, ev) {
        propagationSpy = spyOn(ev, 'stopPropagation').and.stub();
        component.onContentClick(ev);
      };
      paragraphTarget.onclick = function(this, ev) {
        propagationSpy = spyOn(ev, 'stopPropagation').and.stub();
        component.onContentClick(ev);
      };
    }));

    it('should not broadcast the clicked paragraph element', () => {
      paragraphTarget.click();
      expect(broadcastSpy).not.toHaveBeenCalledWith(paragraphTarget);
    });

    it('should broadcast the clicked non paragraph element', () => {
      nonParagraphTarget.click();
      expect(broadcastSpy).toHaveBeenCalledWith(nonParagraphTarget);
    });

    it('should broadcast the clicked math element', () => {
      paragraphTarget.append(mathTarget);
      paragraphTarget.click();
      expect(broadcastSpy).toHaveBeenCalledWith(paragraphTarget);
    });

    describe('when copy mode is active', () => {
      beforeEach(() => {
        ckEditorCopyContentService.toggleCopyMode();
      });

      it('should prevent default behavior', () => {
        nonParagraphTarget.click();
        expect(propagationSpy).toHaveBeenCalled();
      });
    });

    describe('when copy mode is inactive', () => {
      it('should not prevent default behavior', () => {
        nonParagraphTarget.click();
        expect(propagationSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('when skipping the active translation', () => {
    describe('when there is available text', () => {
      beforeEach(fakeAsync(() => {
        component.ngOnInit();

        const sampleStateWiseContentMapping = {
          stateName1: {contentId1: getContentTranslatableItemWithText('text1')},
          stateName2: {contentId2: getContentTranslatableItemWithText('text2')}
        };

        const req = httpTestingController.expectOne(
          '/gettranslatabletexthandler?exp_id=1&language_code=es');
        expect(req.request.method).toEqual('GET');
        req.flush({
          state_names_to_content_id_mapping: sampleStateWiseContentMapping,
          version: 1
        });
        flushMicrotasks();
        component.skipActiveTranslation();
      }));


      it('should retrieve remaining text and availability', () => {
        expect(component.textToTranslate).toBe('text2');
        expect(component.moreAvailable).toBeFalse();
      });
    });
  });

  describe('when suggesting translated text', () => {
    let expectedPayload, imagesData;
    beforeEach(fakeAsync(() => {
      expectedPayload = {
        suggestion_type: 'translate_content',
        target_type: 'exploration',
        description: 'Adds translation',
        target_id: '1',
        target_version_at_submission: 1,
        change: {
          cmd: 'add_written_translation',
          content_id: 'contentId1',
          state_name: 'stateName1',
          language_code: 'es',
          content_html: 'text1',
          translation_html: 'texto1',
          data_format: 'html'
        }
      };
      component.ngOnInit();

      const sampleStateWiseContentMapping = {
        stateName1: {contentId1: getContentTranslatableItemWithText('text1')},
        stateName2: {
          contentId2: {
            data_format: 'unicode',
            content: 'Continue',
            content_type: 'interaction',
            interaction_id: null,
            rule_type: null
          },
          contentId3: {
            data_format: 'set_of_normalized_string',
            content: ['answer1', 'answer2', 'answer3'],
            content_type: 'rule',
            interaction_id: 'TextInput',
            rule_type: 'Contains'
          }
        }
      };

      const req = httpTestingController.expectOne(
        '/gettranslatabletexthandler?exp_id=1&language_code=es');
      expect(req.request.method).toEqual('GET');
      req.flush({
        state_names_to_content_id_mapping: sampleStateWiseContentMapping,
        version: 1
      });
      flushMicrotasks();
      component.activeWrittenTranslation = 'texto1';
    }));

    it('should remove paragraph error', fakeAsync(() => {
      component.hadCopyParagraphError = true;

      component.suggestTranslatedText();

      flushMicrotasks();
      const req = httpTestingController.expectOne(
        '/suggestionhandler/');
      expect(component.hadCopyParagraphError).toEqual(false);
      expect(req.request.method).toEqual('POST');
      expect(req.request.body.getAll('payload')[0]).toEqual(
        JSON.stringify(expectedPayload));
      req.flush({});
      flushMicrotasks();
    }));

    it('should correctly submit a translation suggestion', fakeAsync(() => {
      component.suggestTranslatedText();

      flushMicrotasks();
      const req = httpTestingController.expectOne(
        '/suggestionhandler/');
      expect(req.request.method).toEqual('POST');
      expect(req.request.body.getAll('payload')[0]).toEqual(
        JSON.stringify(expectedPayload));
      req.flush({});
      flushMicrotasks();
    }));

    describe('when already uploading a translation', () => {
      it('should not submit the translation', fakeAsync(() => {
        spyOn(translateTextService, 'suggestTranslatedText').and.callThrough();

        component.suggestTranslatedText();
        component.suggestTranslatedText();

        const req = httpTestingController.expectOne(
          '/suggestionhandler/');
        expect(req.request.method).toEqual('POST');
        expect(req.request.body.getAll('payload')[0]).toEqual(
          JSON.stringify(expectedPayload));
        req.flush({});
        flushMicrotasks();
        // Prevention of concurrent suggestions also confirmed by "expectOne".
        expect(translateTextService.suggestTranslatedText)
          .toHaveBeenCalledTimes(1);
      }));
    });

    describe('when currently loading data', () => {
      it('should not submit the translation', () => {
        component.loadingData = true;
        spyOn(translateTextService, 'suggestTranslatedText').and.callThrough();

        component.suggestTranslatedText();

        expect(translateTextService.suggestTranslatedText)
          .toHaveBeenCalledTimes(0);
      });
    });

    describe('when alt text is not changed in copied images', () => {
      it('should not submit the translation', () => {
        component.textToTranslate = '<oppia-noninteractive-image alt-with-' +
          'value="&amp;quot;Image description&amp;quot;" caption-with-value=' +
          '"&amp;quot;Image caption&amp;quot;" filepath-with-value="&amp;quot' +
          ';img_20210129_210552_zbv0mdty94_height_54_width_490.png&amp;quot;"' +
          '></oppia-noninteractive-image>';
        component.activeWrittenTranslation = '<oppia-noninteractive-' +
          'image alt-with-value="&amp;quot;Image description&amp;quot;' +
          '" caption-with-value="&amp;quot;New caption&amp;quot;"' +
          ' filepath-with-value="&amp;quot;img_20210129_210552_zbv0mdty94' +
          '_height_54_width_490.png&amp;quot;"></oppia-noninteractive-image>';
        spyOn(translateTextService, 'suggestTranslatedText').and.callThrough();

        component.suggestTranslatedText();

        expect(translateTextService.suggestTranslatedText)
          .toHaveBeenCalledTimes(0);
      });
    });

    describe('when caption is not changed in copied images', () => {
      it('should not submit the translation', () => {
        component.textToTranslate = '<oppia-noninteractive-image alt-with-' +
          'value="&amp;quot;Image description&amp;quot;" caption-with-value=' +
          '"&amp;quot;Image caption&amp;quot;" filepath-with-value="&amp;quot' +
          ';img_20210129_210552_zbv0mdty94_height_54_width_490.png&amp;quot;"' +
          '></oppia-noninteractive-image>';
        component.activeWrittenTranslation = '<oppia-noninteractive' +
          '-image alt-with-value="&amp;quot;New description&amp;quot;"' +
          ' caption-with-value="&amp;quot;Image caption&amp;quot;"' +
          ' filepath-with-value="&amp;quot:img_20210129_210552_zbv0mdty9' +
          '4_height_54_width_490.png&amp;quot;"></oppia-noninteractive-image>';
        spyOn(translateTextService, 'suggestTranslatedText').and.callThrough();

        component.suggestTranslatedText();

        expect(translateTextService.suggestTranslatedText)
          .toHaveBeenCalledTimes(0);
      });
    });

    describe('when translation elements are not matching with the elements ' +
        'of the text to translate', () => {
      it('should not submit the translation', () => {
        // Original text contains math and skillreview custom tags.
        component.textToTranslate = (
          '<p>First para</p><p>Second para</p><oppia-noninteractive-math>' +
          '</oppia-noninteractive-math><oppia-noninteractive-skillreview>' +
          '</oppia-noninteractive-skillreview>');
        // Translated text contains only math custom tag.
        component.activeWrittenTranslation = (
          '<p>First para</p>' +
          '<p><oppia-noninteractive-math></oppia-noninteractive-math></p>');
        spyOn(translateTextService, 'suggestTranslatedText').and.callThrough();

        component.suggestTranslatedText();

        expect(translateTextService.suggestTranslatedText)
          .toHaveBeenCalledTimes(0);
      });
    });

    describe('when suggesting the last available text', () => {
      beforeEach(() => {
        expectedPayload = {
          suggestion_type: 'translate_content',
          target_type: 'exploration',
          description: 'Adds translation',
          target_id: '1',
          target_version_at_submission: 1,
          change: {
            cmd: 'add_written_translation',
            content_id: 'contentId3',
            state_name: 'stateName2',
            language_code: 'es',
            content_html: ['answer1', 'answer2', 'answer3'],
            translation_html: ['answero1', 'answero2', 'answero3'],
            data_format: 'set_of_normalized_string'
          }
        };
        component.skipActiveTranslation();
        component.skipActiveTranslation();
        component.activeWrittenTranslation = [
          'answero1', 'answero2', 'answero3'];
      });

      it('should close the modal', fakeAsync(() => {
        spyOn(component, 'close');
        component.suggestTranslatedText();

        const req = httpTestingController.expectOne(
          '/suggestionhandler/');
        expect(req.request.method).toEqual('POST');
        expect(req.request.body.getAll('payload')[0]).toEqual(
          JSON.stringify(expectedPayload));
        req.flush({});
        flushMicrotasks();
        expect(component.close).toHaveBeenCalled();
      }));
    });

    it('should register a contributor dashboard submit suggestion event',
      () => {
        spyOn(
          siteAnalyticsService,
          'registerContributorDashboardSubmitSuggestionEvent'
        );
        spyOn(translateTextService, 'suggestTranslatedText').and.stub();
        component.suggestTranslatedText();
      });

    it('should flush stored image data',
      fakeAsync(() => {
        imagesData = [{
          filename: 'imageFilename1',
          imageBlob: 'imageBlob1'
        }, {
          filename: 'imageFilename1',
          imageBlob: 'imageBlob2'
        }, {
          filename: 'imageFilename2',
          imageBlob: 'imageBlob1'
        }, {
          filename: 'imageFilename2',
          imageBlob: 'imageBlob2'
        }];
        spyOn(imageLocalStorageService, 'getStoredImagesData').and.returnValue(
          imagesData
        );
        spyOn(translateTextBackendApiService, 'blobtoBase64').and.returnValue(
          Promise.resolve(['imageBlob1', 'imageBlob2'])
        );
        component.suggestTranslatedText();
        flushMicrotasks();
        const req = httpTestingController.expectOne(
          '/suggestionhandler/');
        const files = JSON.parse(req.request.body.getAll('payload')[0]).files;
        expect(req.request.method).toEqual('POST');
        const filename1Blobs = files.imageFilename1;
        const filename2Blobs = files.imageFilename2;
        expect(filename1Blobs).toContain('imageBlob1');
        expect(filename1Blobs).toContain('imageBlob2');
        expect(filename2Blobs).toContain('imageBlob1');
        expect(filename2Blobs).toContain('imageBlob2');
        req.flush({});
        flushMicrotasks();
      }));

    it('should not reset the image save destination', () => {
      spyOn(translateTextService, 'suggestTranslatedText').and.stub();
      expect(contextService.getImageSaveDestination()).toBe(
        AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE);
      component.suggestTranslatedText();
      expect(contextService.getImageSaveDestination()).toBe(
        AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE);
    });

    it('should reset the image save destination', fakeAsync(() => {
      component.suggestTranslatedText();
      const req = httpTestingController.expectOne(
        '/suggestionhandler/');
      expect(req.request.method).toEqual('POST');
      expect(req.request.body.getAll('payload')[0]).toEqual(
        JSON.stringify(expectedPayload));
      req.flush({
        error: 'Error'
      }, {
        status: 500, statusText: 'Internal Server Error'
      });
      flushMicrotasks();
      component.suggestTranslatedText();
      expect(contextService.getImageSaveDestination()).toBe(
        AppConstants.IMAGE_SAVE_DESTINATION_SERVER);
    }));
  });
});
