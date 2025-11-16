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

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {ChangeDetectorRef, ElementRef, NO_ERRORS_SCHEMA} from '@angular/core';

import {
  ComponentFixture,
  fakeAsync,
  flushMicrotasks,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {NgbModal, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {AppConstants} from 'app.constants';
import {CkEditorCopyContentService} from 'components/ck-editor-helpers/ck-editor-copy-content.service';
import {OppiaAngularRootComponent} from 'components/oppia-angular-root.component';
import {
  TranslationModalComponent,
  TranslationOpportunity,
} from 'pages/contributor-dashboard-page/modal-templates/translation-modal.component';
import {TranslationLanguageService} from 'pages/exploration-editor-page/translation-tab/services/translation-language.service';
import {PageContextService} from 'services/page-context.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {
  ImageLocalStorageService,
  ImagesData,
} from 'services/image-local-storage.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {UserService} from 'services/user.service';
import {TranslateTextService} from '../services/translate-text.service';
import {WrapTextWithEllipsisPipe} from 'filters/string-utility-filters/wrap-text-with-ellipsis.pipe';
// This throws "TS2307". We need to
// suppress this error because rte-text-components are not strictly typed yet.
// @ts-ignore
import {RteOutputDisplayComponent} from 'rich_text_components/rte-output-display.component';
import {TranslatedContent} from 'domain/exploration/translated-content.model';
import {ConfirmTranslationExitModalComponent} from 'components/translation-suggestion-page/confirm-translation-exit-modal/confirm-translation-exit-modal.component';
import {WindowRef} from 'services/contextual/window-ref.service';

enum ExpansionTabType {
  CONTENT,
  TRANSLATION,
}

class MockChangeDetectorRef {
  detectChanges(): void {}
}

class MockConfirmTranslationExitModal {
  componentInstance = {};
  result = Promise.resolve();
  close(): void {}
  dismiss(): void {}
}

class MockImageLocalStorageService {
  private storedImages: Map<string, ImagesData> = new Map();

  getStoredImagesData(): ImagesData[] {
    return Array.from(this.storedImages.values());
  }

  flushStoredImagesData(): void {
    this.storedImages.clear();
  }

  getFilenameToBase64MappingAsync(): Promise<Record<string, string>> {
    return Promise.resolve({});
  }
}

describe('Translation Modal Component', () => {
  let pageContextService: PageContextService;
  let translateTextService: TranslateTextService;
  let translationLanguageService: TranslationLanguageService;
  let ckEditorCopyContentService: CkEditorCopyContentService;
  let siteAnalyticsService: SiteAnalyticsService;
  let imageLocalStorageService: ImageLocalStorageService;
  let getUserContributionRightsDataAsyncSpy: jasmine.Spy;
  let userService: UserService;
  let activeModal: NgbActiveModal;
  let httpTestingController: HttpTestingController;
  let fixture: ComponentFixture<TranslationModalComponent>;
  let component: TranslationModalComponent;
  let changeDetectorRef: MockChangeDetectorRef = new MockChangeDetectorRef();
  let wds: WindowDimensionsService;
  let ngbModal: NgbModal;
  let mockModalRef: MockConfirmTranslationExitModal;
  let windowRef: WindowRef;
  let mockWindow: {
    addEventListener: jasmine.Spy;
    removeEventListener: jasmine.Spy;
    gtag: jasmine.Spy;
  };

  const opportunity: TranslationOpportunity = {
    id: '1',
    heading: 'Heading',
    subheading: 'subheading',
    progressPercentage: '20',
    actionButtonTitle: 'Action Button',
    inReviewCount: 12,
    totalCount: 50,
    translationsCount: 20,
  };
  const getContentTranslatableItemWithText = (text: string) => {
    return {
      content_format: 'html',
      content_value: text,
      content_type: 'content',
      interaction_id: null,
      rule_type: null,
    };
  };

  beforeEach(waitForAsync(() => {
    mockModalRef = new MockConfirmTranslationExitModal();
    mockWindow = {
      addEventListener: jasmine.createSpy('addEventListener'),
      removeEventListener: jasmine.createSpy('removeEventListener'),
      gtag: jasmine.createSpy('gtag'),
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        TranslationModalComponent,
        WrapTextWithEllipsisPipe,
        ConfirmTranslationExitModalComponent,
      ],
      providers: [
        NgbActiveModal,
        {
          provide: ChangeDetectorRef,
          useValue: changeDetectorRef,
        },
        {
          provide: NgbModal,
          useValue: {
            open: () => mockModalRef,
          },
        },
        {
          provide: ConfirmTranslationExitModalComponent,
          useClass: MockConfirmTranslationExitModal,
        },
        {
          provide: WindowRef,
          useValue: {nativeWindow: mockWindow},
        },
        {
          provide: ImageLocalStorageService,
          useClass: MockImageLocalStorageService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    OppiaAngularRootComponent.pageContextService =
      TestBed.inject(PageContextService);
    pageContextService = OppiaAngularRootComponent.pageContextService;
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
    translationLanguageService = TestBed.inject(TranslationLanguageService);
    translationLanguageService.setActiveLanguageCode('es');
    userService = TestBed.inject(UserService);
    wds = TestBed.inject(WindowDimensionsService);
    ngbModal = TestBed.inject(NgbModal);
    component.contentContainer = new ElementRef({offsetHeight: 150});
    component.translationContainer = new ElementRef({offsetHeight: 150});
    component.contentPanel = new RteOutputDisplayComponent(
      // This throws "Argument of type 'null' is not assignable to parameter of
      // type 'ViewContainerRef'." We need to suppress this error because of
      // the need to test validations. This is because the component is not
      // strictly typed yet.
      // @ts-ignore
      null,
      null,
      new ElementRef({offsetHeight: 200}),
      null
    );
    getUserContributionRightsDataAsyncSpy = spyOn(
      userService,
      'getUserContributionRightsDataAsync'
    );
    getUserContributionRightsDataAsyncSpy.and.returnValue(
      Promise.resolve({
        can_suggest_questions: false,
        can_review_translation_for_language_codes: ['ar'],
        can_review_voiceover_for_language_codes: [],
        can_review_questions: false,
      })
    );
    windowRef = TestBed.inject(WindowRef);
    mockWindow = windowRef.nativeWindow;
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

  it('should return the ExoansionTabType enum', () => {
    let enumVariable = component.expansionTabType;
    expect(typeof enumVariable === typeof ExpansionTabType);
  });

  it('should expand the content area', () => {
    spyOn(component, 'toggleExpansionState').and.callThrough();
    // The content area is contracted by default.
    expect(component.isContentExpanded).toBeFalse();

    // The content area should expand when the users clicks
    // on the 'View More' button.
    component.toggleExpansionState(ExpansionTabType.CONTENT);

    expect(component.isContentExpanded).toBeTrue();
  });

  it('should contract the content area', () => {
    spyOn(component, 'toggleExpansionState').and.callThrough();
    component.isContentExpanded = true;

    // The content area should contract when the users clicks
    // on the 'View Less' button.
    component.toggleExpansionState(ExpansionTabType.CONTENT);

    expect(component.isContentExpanded).toBeFalse();
  });

  it('should expand the translation area', () => {
    spyOn(component, 'toggleExpansionState').and.callThrough();
    // The translation area is contracted by default.
    expect(component.isTranslationExpanded).toBeTrue();

    // The translation area should expand when the users clicks
    // on the 'View More' button.
    component.toggleExpansionState(ExpansionTabType.TRANSLATION);

    expect(component.isTranslationExpanded).toBeFalse();
  });

  it('should contract the translation area', () => {
    spyOn(component, 'toggleExpansionState').and.callThrough();
    component.isTranslationExpanded = false;

    // The translation area should contract when the users clicks
    // on the 'View Less' button.
    component.toggleExpansionState(ExpansionTabType.TRANSLATION);

    expect(component.isTranslationExpanded).toBeTrue();
  });

  it('should correctly determine whether the content data is overflowing', fakeAsync(() => {
    // Pre-check.
    // The default values for the overflow states are false.
    expect(component.isContentOverflowing).toBeFalse();

    // Setup.
    component.contentPanel.elementRef.nativeElement.offsetHeight = 100;
    component.contentContainer.nativeElement.offsetHeight = 150;

    // Action.
    component.computePanelOverflowState();
    tick(501);

    // Expectations.
    expect(component.isContentOverflowing).toBeFalse();
    // Change panel height to simulate changing of the modal data.
    component.contentPanel.elementRef.nativeElement.offsetHeight = 300;

    // Action.
    component.computePanelOverflowState();
    tick(501);

    // Expectations.
    expect(component.isContentOverflowing).toBeTrue();
  }));

  it('should correctly determine whether the editor is overflowing', fakeAsync(() => {
    // Pre-check.
    // The default values for the overflow states are false.
    expect(component.isTranslationOverflowing).toBeFalse();

    // Setup.
    spyOn(wds, 'getHeight').and.returnValue(100);
    component.translationContainer.nativeElement.offsetHeight = 25;

    // Action.
    component.computeTranslationEditorOverflowState();
    tick(501);

    // Expectations.
    expect(component.isTranslationOverflowing).toBeFalse();
    // Change panel height to simulate changing of the modal data.
    component.translationContainer.nativeElement.offsetHeight = 300;

    // Action.
    component.computeTranslationEditorOverflowState();
    tick(501);

    // Expectations.
    expect(component.isTranslationOverflowing).toBeTrue();
  }));

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
          (expId, languageCode, successCallback) => successCallback()
        );
        component.ngOnInit();
      }));

      it('should set the schema constant correctly', () => {
        expect(component.getHtmlSchema().ui_config.languageDirection).toBe(
          'rtl'
        );
      });
    });

    describe('with an ltr language', () => {
      beforeEach(fakeAsync(() => {
        translationLanguageService.setActiveLanguageCode('es');
        spyOn(translateTextService, 'init').and.callFake(
          (expId, languageCode, successCallback) => successCallback()
        );
        component.ngOnInit();
      }));

      it('should set the schema constant correctly', () => {
        expect(component.getHtmlSchema().ui_config.languageDirection).toBe(
          'ltr'
        );
      });

      it('should throw error if contribution rights is null', fakeAsync(() => {
        getUserContributionRightsDataAsyncSpy.and.returnValue(
          Promise.resolve(null)
        );
        expect(() => {
          component.ngOnInit();
          tick();
        }).toThrowError();
      }));
    });

    it('should set context correctly', fakeAsync(() => {
      pageContextService.removeCustomEntityContext();
      pageContextService.resetImageSaveDestination();
      spyOn(translateTextService, 'init').and.callFake(
        (expId, languageCode, successCallback) => successCallback()
      );
      component.ngOnInit();
      expect(pageContextService.getEntityType()).toBe(
        AppConstants.ENTITY_TYPE.EXPLORATION
      );
      expect(pageContextService.getEntityId()).toBe('1');
      expect(pageContextService.getImageSaveDestination()).toBe(
        AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE
      );
    }));

    it('should compute panel overflow after the view has initialized', () => {
      spyOn(component, 'computePanelOverflowState');

      component.ngAfterViewInit();

      expect(component.computePanelOverflowState).toHaveBeenCalled();
    });

    it('should compute editor overflow after the view has changed', () => {
      spyOn(component, 'computeTranslationEditorOverflowState');

      component.ngAfterContentChecked();

      expect(
        component.computeTranslationEditorOverflowState
      ).toHaveBeenCalled();
    });

    it('should initialize translateTextService', fakeAsync(() => {
      spyOn(translateTextService, 'init').and.callThrough();
      spyOn(translateTextService, 'getTextToTranslate').and.callThrough();
      spyOn(
        translateTextService,
        'getPreviousTextToTranslate'
      ).and.callThrough();
      component.ngOnInit();
      expect(component.loadingData).toBeTrue();
      expect(translateTextService.init).toHaveBeenCalled();

      const sampleStateWiseContentMapping = {
        stateName1: {contentId1: getContentTranslatableItemWithText('text1')},
        stateName2: {contentId2: getContentTranslatableItemWithText('text2')},
      };

      const req = httpTestingController.expectOne(
        '/gettranslatabletexthandler?exp_id=1&language_code=es'
      );
      expect(req.request.method).toEqual('GET');
      req.flush({
        state_names_to_content_id_mapping: sampleStateWiseContentMapping,
        version: 1,
      });
      flushMicrotasks();
      expect(component.loadingData).toBeFalse();
      expect(translateTextService.getTextToTranslate).toHaveBeenCalled();

      expect(component.textToTranslate).toBe('text1');
      expect(component.moreAvailable).toBeTrue();
      component.skipActiveTranslation();
      component.returnToPreviousTranslation();
      expect(
        translateTextService.getPreviousTextToTranslate
      ).toHaveBeenCalled();
      expect(component.textToTranslate).toBe('text1');
      // The value of moreAvailable will be set to true when the operation
      // is viewing a previous translation. If the value is false, the
      // 'save and close' button is shown. This should happen only on the
      // last translation.
      expect(component.moreAvailable).toBeTrue();
    }));

    it('should set the schema constant based on the active language', fakeAsync(() => {
      translationLanguageService.setActiveLanguageCode('ar');
      spyOn(translateTextService, 'init').and.callFake(
        (expId, languageCode, successCallback) => successCallback()
      );
      component.ngOnInit();
      expect(component.getHtmlSchema().ui_config.language).toBe('ar');
    }));

    it('should get the unicode schema', () => {
      expect(component.getUnicodeSchema()).toEqual({type: 'unicode'});
    });

    it('should get the set of strings schema', () => {
      expect(component.getSetOfStringsSchema()).toEqual({
        type: 'list',
        items: {
          type: 'unicode',
        },
      });
    });

    it('should utilize the modify translations opportunity when available', () => {
      let translationContent = TranslatedContent.createFromBackendDict({
        content_value: 'Current translated content.',
        content_format: 'html',
        needs_update: false,
      });
      component.modifyTranslationOpportunity = {
        id: 'expId',
        contentId: 'content_0',
        heading: 'Update Translation',
        subheading: 'Introduction',
        textToTranslate: 'Current content in English.',
        currentContentTranslation: translationContent,
      };
      component.opportunity = null;

      component.ngOnInit();

      expect(component.subheading).toBe('Introduction');
      expect(component.heading).toBe('Update Translation');
      expect(component.textToTranslate).toBe('Current content in English.');
      expect(component.activeContentType).toBe('content');
      expect(component.activeWrittenTranslation).toBe(
        'Current translated content.'
      );
      expect(component.activeDataFormat).toBe('html');
    });
  });

  describe('when clicking on the translatable content', () => {
    const nonParagraphTarget: HTMLElement = document.createElement('div');
    const mathTarget: HTMLElement = document.createElement(
      'oppia-noninteractive-math'
    );
    let paragraphTarget: HTMLElement;
    let broadcastSpy: jasmine.Spy<(target: HTMLElement) => void>;
    let propagationSpy: jasmine.Spy<() => void>;
    beforeEach(fakeAsync(() => {
      paragraphTarget = document.createElement('p');
      spyOn(translateTextService, 'init').and.callFake(
        (expId, languageCode, successCallback) => successCallback()
      );
      broadcastSpy = spyOn(
        ckEditorCopyContentService,
        'broadcastCopy'
      ).and.stub();

      component.ngOnInit();
      nonParagraphTarget.onclick = function (this, ev) {
        propagationSpy = spyOn(ev, 'stopPropagation').and.stub();
        component.onContentClick(ev);
      };
      paragraphTarget.onclick = function (this, ev) {
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
          stateName2: {contentId2: getContentTranslatableItemWithText('text2')},
        };

        const req = httpTestingController.expectOne(
          '/gettranslatabletexthandler?exp_id=1&language_code=es'
        );
        expect(req.request.method).toEqual('GET');
        req.flush({
          state_names_to_content_id_mapping: sampleStateWiseContentMapping,
          version: 1,
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
    let expectedPayload: Object;
    let imagesData: ImagesData[];
    beforeEach(fakeAsync(() => {
      expectedPayload = {
        suggestion_type: 'translate_content',
        target_type: 'exploration',
        description: 'Adds translation',
        target_id: '1',
        target_version_at_submission: 1,
        change_cmd: {
          cmd: 'add_written_translation',
          content_id: 'contentId1',
          state_name: 'stateName1',
          language_code: 'es',
          content_html: 'text1',
          translation_html: 'texto1',
          data_format: 'html',
        },
        files: {},
      };
      component.ngOnInit();
      tick();

      const sampleStateWiseContentMapping = {
        stateName1: {contentId1: getContentTranslatableItemWithText('text1')},
        stateName2: {
          contentId2: {
            content_format: 'unicode',
            content_value: 'input',
            content_type: 'interaction',
            interaction_id: 'TextInput',
            rule_type: null,
          },
          contentId3: {
            content_format: 'unicode',
            content_value: 'Continue',
            content_type: 'ca',
            interaction_id: 'Continue',
            rule_type: null,
          },
          contentId4: {
            content_format: 'set_of_normalized_string',
            content_value: ['answer1', 'answer2', 'answer3'],
            content_type: 'rule',
            interaction_id: 'TextInput',
            rule_type: 'Contains',
          },
        },
      };

      const req = httpTestingController.expectOne(
        '/gettranslatabletexthandler?exp_id=1&language_code=es'
      );
      expect(req.request.method).toEqual('GET');
      req.flush({
        state_names_to_content_id_mapping: sampleStateWiseContentMapping,
        version: 1,
      });
      flushMicrotasks();
      component.activeWrittenTranslation = 'texto1';
    }));

    it('should remove paragraph error', fakeAsync(() => {
      component.hadCopyParagraphError = true;

      component.suggestTranslatedText();
      tick();

      const req = httpTestingController.expectOne('/suggestionhandler/');
      expect(component.hadCopyParagraphError).toEqual(false);
      expect(req.request.method).toEqual('POST');
      expect(req.request.body.getAll('payload')[0]).toEqual(
        JSON.stringify(expectedPayload)
      );
      req.flush({});
      flushMicrotasks();
    }));

    it('should correctly submit a translation suggestion', fakeAsync(() => {
      component.suggestTranslatedText();
      tick();

      const req = httpTestingController.expectOne('/suggestionhandler/');
      expect(req.request.method).toEqual('POST');
      expect(req.request.body.getAll('payload')[0]).toEqual(
        JSON.stringify(expectedPayload)
      );
      req.flush({});
      flushMicrotasks();
    }));

    describe('when already uploading a translation', () => {
      it('should not submit the translation', fakeAsync(() => {
        spyOn(translateTextService, 'suggestTranslatedText').and.callThrough();
        spyOn(
          imageLocalStorageService,
          'getFilenameToBase64MappingAsync'
        ).and.returnValue(Promise.resolve({}));

        component.suggestTranslatedText();
        component.uploadingTranslation = true;
        component.suggestTranslatedText();
        tick();

        const req = httpTestingController.expectOne('/suggestionhandler/');
        expect(req.request.method).toEqual('POST');
        expect(req.request.body.getAll('payload')[0]).toEqual(
          JSON.stringify(expectedPayload)
        );
        req.flush({});
        flushMicrotasks();
        expect(
          translateTextService.suggestTranslatedText
        ).toHaveBeenCalledTimes(1);
      }));
    });

    describe('when skipping translations', () => {
      it('should update activeContentType', fakeAsync(() => {
        component.skipActiveTranslation();
        tick();
        expect(component.activeContentType).toBe('TextInput interaction');
        component.skipActiveTranslation();
        tick();
        expect(component.activeContentType).toBe('label');
        component.skipActiveTranslation();
        tick();
        expect(component.activeContentType).toBe('input rule');
      }));
    });

    describe('when suggesting the last available text', () => {
      beforeEach(fakeAsync(() => {
        expectedPayload = {
          suggestion_type: 'translate_content',
          target_type: 'exploration',
          description: 'Adds translation',
          target_id: '1',
          target_version_at_submission: 1,
          change_cmd: {
            cmd: 'add_written_translation',
            content_id: 'contentId4',
            state_name: 'stateName2',
            language_code: 'es',
            content_html: ['answer1', 'answer2', 'answer3'],
            translation_html: ['answero1', 'answero2', 'answero3'],
            data_format: 'set_of_normalized_string',
          },
          files: {},
        };

        mockModalRef.result = Promise.resolve();

        component.skipActiveTranslation();
        tick();
        component.skipActiveTranslation();
        tick();
        component.skipActiveTranslation();
        tick();

        component.activeWrittenTranslation = [
          'answero1',
          'answero2',
          'answero3',
        ];
        component.moreAvailable = false;
      }));

      it('should close the modal', fakeAsync(() => {
        spyOn(component.activeModal, 'close');
        spyOn(
          imageLocalStorageService,
          'getFilenameToBase64MappingAsync'
        ).and.returnValue(Promise.resolve({}));

        mockModalRef.result = Promise.resolve();

        component.suggestTranslatedText();
        tick();

        const req = httpTestingController.expectOne('/suggestionhandler/');
        expect(req.request.method).toEqual('POST');
        expect(req.request.body.getAll('payload')[0]).toEqual(
          JSON.stringify(expectedPayload)
        );
        req.flush({});
        flushMicrotasks();

        expect(component.activeModal.close).toHaveBeenCalled();
      }));
    });

    it('should flush stored image data', fakeAsync(() => {
      imagesData = [
        {
          filename: 'imageFilename1',
          imageBlob: new Blob(['imageBlob1']),
        },
        {
          filename: 'imageFilename2',
          imageBlob: new Blob(['imageBlob2']),
        },
      ];
      const imageToBase64Mapping = {
        imageFilename1: 'img1Base64',
        imageFilename2: 'img2Base64',
      };
      spyOn(imageLocalStorageService, 'getStoredImagesData').and.returnValue(
        imagesData
      );
      spyOn(
        imageLocalStorageService,
        'getFilenameToBase64MappingAsync'
      ).and.returnValue(Promise.resolve(imageToBase64Mapping));

      mockModalRef.result = Promise.resolve();

      component.suggestTranslatedText();
      tick();
      flushMicrotasks();

      const req = httpTestingController.expectOne('/suggestionhandler/');
      const files = JSON.parse(req.request.body.getAll('payload')[0]).files;
      expect(req.request.method).toEqual('POST');
      expect(files.imageFilename1).toContain('img1Base64');
      expect(files.imageFilename2).toContain('img2Base64');
      req.flush({});
      flushMicrotasks();
    }));

    it('should reset the image save destination', fakeAsync(() => {
      spyOn(
        imageLocalStorageService,
        'getFilenameToBase64MappingAsync'
      ).and.returnValue(Promise.resolve({}));
      component.suggestTranslatedText();
      tick();
      let req = httpTestingController.expectOne('/suggestionhandler/');
      expect(req.request.method).toEqual('POST');
      expect(req.request.body.getAll('payload')[0]).toEqual(
        JSON.stringify(expectedPayload)
      );
      req.flush(
        {
          error: 'Error',
        },
        {
          status: 500,
          statusText: 'Internal Server Error',
        }
      );
      flushMicrotasks();
      component.suggestTranslatedText();
      tick();
      req = httpTestingController.expectOne('/suggestionhandler/');
      req.flush({});
      expect(pageContextService.getImageSaveDestination()).toBe(
        AppConstants.IMAGE_SAVE_DESTINATION_SERVER
      );
    }));

    it('should not reset the image save destination', fakeAsync(() => {
      spyOn(translateTextService, 'suggestTranslatedText').and.stub();
      spyOn(
        imageLocalStorageService,
        'getFilenameToBase64MappingAsync'
      ).and.returnValue(Promise.resolve({}));
      expect(pageContextService.getImageSaveDestination()).toBe(
        AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE
      );

      mockModalRef.result = Promise.resolve();

      component.suggestTranslatedText();
      tick();
      expect(pageContextService.getImageSaveDestination()).toBe(
        AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE
      );
    }));

    it('should register a contributor dashboard submit suggestion event', fakeAsync(() => {
      spyOn(
        siteAnalyticsService,
        'registerContributorDashboardSubmitSuggestionEvent'
      );
      spyOn(translateTextService, 'suggestTranslatedText').and.stub();

      mockModalRef.result = Promise.resolve();

      component.suggestTranslatedText();
      tick();

      expect(
        siteAnalyticsService.registerContributorDashboardSubmitSuggestionEvent
      ).toHaveBeenCalledWith('Translation');
    }));

    describe('when currently loading data', () => {
      it('should not submit the translation', () => {
        component.loadingData = true;
        spyOn(translateTextService, 'suggestTranslatedText').and.callThrough();

        component.suggestTranslatedText();

        expect(
          translateTextService.suggestTranslatedText
        ).toHaveBeenCalledTimes(0);
      });
    });

    describe('when alt text is not changed in copied images', () => {
      it('should not submit the translation', () => {
        component.textToTranslate =
          '<oppia-noninteractive-image alt-with-' +
          'value="&amp;quot;Image description&amp;quot;" caption-with-value=' +
          '"&amp;quot;Image caption&amp;quot;" filepath-with-value="&amp;quot' +
          ';img_20210129_210552_zbv0mdty94_height_54_width_490.png&amp;quot;"' +
          '></oppia-noninteractive-image>';
        component.activeWrittenTranslation =
          '<oppia-noninteractive-' +
          'image alt-with-value="&amp;quot;Image description&amp;quot;' +
          '" caption-with-value="&amp;quot;New caption&amp;quot;"' +
          ' filepath-with-value="&amp;quot;img_20210129_210552_zbv0mdty9' +
          '4_height_54_width_490.png&amp;quot;"></oppia-noninteractive-image>';
        spyOn(translateTextService, 'suggestTranslatedText').and.callThrough();

        component.suggestTranslatedText();

        expect(
          translateTextService.suggestTranslatedText
        ).toHaveBeenCalledTimes(0);
      });
    });

    describe('when caption is not changed in copied images', () => {
      it('should not submit the translation', () => {
        component.textToTranslate =
          '<oppia-noninteractive-image alt-with-' +
          'value="&amp;quot;Image description&amp;quot;" caption-with-value=' +
          '"&amp;quot;Image caption&amp;quot;" filepath-with-value="&amp;quot' +
          ';img_20210129_210552_zbv0mdty94_height_54_width_490.png&amp;quot;"' +
          '></oppia-noninteractive-image>';
        component.activeWrittenTranslation =
          '<oppia-noninteractive' +
          '-image alt-with-value="&amp;quot;New description&amp;quot;"' +
          ' caption-with-value="&amp;quot;Image caption&amp;quot;"' +
          ' filepath-with-value="&amp;quot:img_20210129_210552_zbv0mdty9' +
          '4_height_54_width_490.png&amp;quot;"></oppia-noninteractive-image>';
        spyOn(translateTextService, 'suggestTranslatedText').and.callThrough();

        component.suggestTranslatedText();

        expect(
          translateTextService.suggestTranslatedText
        ).toHaveBeenCalledTimes(0);
      });
    });

    describe(
      'when translation elements are not matching with the elements ' +
        'of the text to translate',
      () => {
        it('should not submit the translation', () => {
          component.textToTranslate =
            '<p>First para</p><p>Second para</p><oppia-noninteractive-math>' +
            '</oppia-noninteractive-math><oppia-noninteractive-skillreview>' +
            '</oppia-noninteractive-skillreview>';
          component.activeWrittenTranslation =
            '<p>First para</p>' +
            '<p><oppia-noninteractive-math></oppia-noninteractive-math></p>';
          spyOn(
            translateTextService,
            'suggestTranslatedText'
          ).and.callThrough();

          component.suggestTranslatedText();

          expect(
            translateTextService.suggestTranslatedText
          ).toHaveBeenCalledTimes(0);
        });
      }
    );
  });

  it('should close modal and return the new translation when updating translated text', () => {
    spyOn(activeModal, 'close');
    spyOn(component, 'canTranslatedTextBeSubmitted').and.returnValue(true);
    component.activeWrittenTranslation = 'Test translation';
    component.updateTranslatedText();

    expect(activeModal.close).toHaveBeenCalledWith('Test translation');
  });

  it('should not close modal if new translated text cannot be submitted', () => {
    spyOn(activeModal, 'close');
    component.activeWrittenTranslation = 'Test translation';
    component.updateTranslatedText();

    expect(activeModal.close).not.toHaveBeenCalled();
  });

  describe('when handling unsaved changes', () => {
    beforeEach(() => {
      component.activeWrittenTranslation = 'Some unsaved text';
    });

    describe('when skipping translation', () => {
      it('should open confirmation modal and skip on confirm', fakeAsync(() => {
        spyOn(ngbModal, 'open').and.callThrough();
        spyOn(translateTextService, 'getTextToTranslate').and.returnValue({
          text: 'next text',
          more: true,
          status: 'active',
          translation: '',
          dataFormat: 'html',
          contentType: 'content',
        });

        component.skipActiveTranslation();
        tick();

        expect(ngbModal.open).toHaveBeenCalledWith(
          ConfirmTranslationExitModalComponent,
          {backdrop: 'static'}
        );

        mockModalRef.result = Promise.resolve();
        tick();
        flushMicrotasks();

        expect(component.activeWrittenTranslation).toBe('');
        expect(translateTextService.getTextToTranslate).toHaveBeenCalled();
      }));

      it('should open confirmation modal and not skip on cancel', fakeAsync(() => {
        const originalText = 'Some unsaved text';
        component.activeWrittenTranslation = originalText;

        spyOn(ngbModal, 'open').and.returnValue(mockModalRef);
        const getTextSpy = spyOn(translateTextService, 'getTextToTranslate');

        mockModalRef.result = Promise.reject();
        component.skipActiveTranslation();
        tick();
        expect(ngbModal.open).toHaveBeenCalledWith(
          ConfirmTranslationExitModalComponent,
          {backdrop: 'static'}
        );

        tick();
        flushMicrotasks();

        expect(component.activeWrittenTranslation).toBe(originalText);
        expect(getTextSpy).not.toHaveBeenCalled();
      }));
    });

    describe('when closing modal', () => {
      it('should open confirmation modal and close on confirm', fakeAsync(() => {
        spyOn(ngbModal, 'open').and.callThrough();
        spyOn(component.activeModal, 'close');

        component.close();
        tick();

        expect(ngbModal.open).toHaveBeenCalledWith(
          ConfirmTranslationExitModalComponent,
          {backdrop: 'static'}
        );

        mockModalRef.result = Promise.resolve();
        tick();
        flushMicrotasks();

        expect(component.activeModal.close).toHaveBeenCalled();
      }));

      it('should open confirmation modal and not close on cancel', fakeAsync(() => {
        component.activeWrittenTranslation = 'Unsaved text';

        spyOn(ngbModal, 'open').and.returnValue(mockModalRef);
        const closeSpy = spyOn(component.activeModal, 'close');

        mockModalRef.result = Promise.reject();

        component.close();
        tick();

        expect(ngbModal.open).toHaveBeenCalledWith(
          ConfirmTranslationExitModalComponent,
          {backdrop: 'static'}
        );

        tick();
        flushMicrotasks();

        expect(closeSpy).not.toHaveBeenCalled();
      }));
    });

    describe('when handling unsaved changes when browser tab/window is closed', () => {
      interface MockWindow {
        addEventListener: jasmine.Spy;
        removeEventListener: jasmine.Spy;
      }

      let mockWindow: MockWindow;
      let mockEvent: BeforeUnloadEvent;
      let preventDefaultSpy: jasmine.Spy;
      let translationLanguageService: TranslationLanguageService;

      beforeEach(() => {
        TestBed.resetTestingModule();
        mockWindow = {
          addEventListener: jasmine.createSpy('addEventListener'),
          removeEventListener: jasmine.createSpy('removeEventListener'),
        };

        preventDefaultSpy = jasmine.createSpy('preventDefault');
        mockEvent = {
          preventDefault: preventDefaultSpy,
          returnValue: '',
        } as unknown as BeforeUnloadEvent;

        TestBed.configureTestingModule({
          imports: [HttpClientTestingModule],
          declarations: [
            TranslationModalComponent,
            WrapTextWithEllipsisPipe,
            ConfirmTranslationExitModalComponent,
          ],
          providers: [
            NgbActiveModal,
            TranslationLanguageService,
            {
              provide: ChangeDetectorRef,
              useValue: changeDetectorRef,
            },
            {
              provide: NgbModal,
              useValue: {
                open: () => mockModalRef,
              },
            },
            {
              provide: ConfirmTranslationExitModalComponent,
              useClass: MockConfirmTranslationExitModal,
            },
            {
              provide: WindowRef,
              useValue: {nativeWindow: mockWindow},
            },
            {
              provide: TranslateTextService,
              useValue: {
                init: (
                  expId: string,
                  languageCode: string,
                  successCallback: () => void
                ) => {
                  successCallback();
                },
                getTextToTranslate: () => ({
                  text: 'Sample text',
                  more: true,
                  status: 'active',
                  translation: '',
                  dataFormat: 'html',
                  contentType: 'content',
                }),
                getPreviousTextToTranslate: () => ({
                  text: 'Previous text',
                  more: true,
                  status: 'active',
                  translation: '',
                  dataFormat: 'html',
                  contentType: 'content',
                }),
              },
            },
            {
              provide: UserService,
              useValue: {
                getUserContributionRightsDataAsync: () =>
                  Promise.resolve({
                    can_review_translation_for_language_codes: ['ar'],
                  }),
              },
            },
            {
              provide: PageContextService,
              useValue: {
                setImageSaveDestinationToLocalStorage: () => {},
                setCustomEntityContext: () => {},
                getEntityType: () => 'exploration',
                getEntityId: () => '1',
                getImageSaveDestination: () => 'localStorage',
              },
            },
          ],
          schemas: [NO_ERRORS_SCHEMA],
        });

        fixture = TestBed.createComponent(TranslationModalComponent);
        component = fixture.componentInstance;
        component.opportunity = opportunity;
        translationLanguageService = TestBed.inject(TranslationLanguageService);
        translationLanguageService.setActiveLanguageCode('es');
      });

      it('should have beforeUnloadHandler initialized as a function returning undefined', () => {
        const mockEvent = {
          preventDefault: () => {},
          returnValue: '',
        } as BeforeUnloadEvent;

        interface ComponentWithPrivateMembers
          extends TranslationModalComponent {
          beforeUnloadHandler: (e: BeforeUnloadEvent) => string | undefined;
        }

        const componentWithPrivateAccess =
          component as ComponentWithPrivateMembers;
        expect(
          componentWithPrivateAccess.beforeUnloadHandler(mockEvent)
        ).toBeUndefined();
      });

      it('should initialize beforeUnloadHandler to return undefined by default', fakeAsync(() => {
        component.ngOnInit();
        tick();

        const handler = mockWindow.addEventListener.calls.argsFor(0)[1];
        const mockEvent = {
          preventDefault: () => {},
          returnValue: '',
        } as BeforeUnloadEvent;

        component.activeWrittenTranslation = '';
        expect(handler(mockEvent)).toBeUndefined();
      }));

      it('should add beforeunload event listener on init', fakeAsync(() => {
        component.ngOnInit();
        tick();
        expect(mockWindow.addEventListener).toHaveBeenCalledWith(
          'beforeunload',
          jasmine.any(Function)
        );
      }));

      it('should remove beforeunload event listener on destroy', fakeAsync(() => {
        component.ngOnInit();
        tick();
        const handler = mockWindow.addEventListener.calls.argsFor(0)[1];
        component.ngOnDestroy();
        expect(mockWindow.removeEventListener).toHaveBeenCalledWith(
          'beforeunload',
          handler
        );
      }));

      it('should not show confirmation dialog when there are no unsaved changes', fakeAsync(() => {
        component.ngOnInit();
        tick();
        const handler = mockWindow.addEventListener.calls.argsFor(0)[1];
        component.activeWrittenTranslation = '';
        handler(mockEvent);
        expect(preventDefaultSpy).not.toHaveBeenCalled();
        expect(mockEvent.returnValue).toBe('');
      }));

      it('should show confirmation dialog when there are unsaved changes', fakeAsync(() => {
        component.ngOnInit();
        tick();
        const handler = mockWindow.addEventListener.calls.argsFor(0)[1];
        component.activeWrittenTranslation = 'Some unsaved text';
        handler(mockEvent);
        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(mockEvent.returnValue).toBe('');
      }));
    });

    describe('when no unsaved changes', () => {
      beforeEach(() => {
        component.activeWrittenTranslation = '';
      });

      it('should skip without showing confirmation modal', fakeAsync(() => {
        spyOn(ngbModal, 'open');
        spyOn(translateTextService, 'getTextToTranslate').and.returnValue({
          text: 'next text',
          more: true,
          status: 'active',
          translation: '',
          dataFormat: 'html',
          contentType: 'content',
        });

        component.skipActiveTranslation();
        tick();

        expect(ngbModal.open).not.toHaveBeenCalled();
        expect(translateTextService.getTextToTranslate).toHaveBeenCalled();
      }));

      it('should close without showing confirmation modal', fakeAsync(() => {
        spyOn(ngbModal, 'open');
        spyOn(component.activeModal, 'close');

        component.close();
        tick();

        expect(ngbModal.open).not.toHaveBeenCalled();
        expect(component.activeModal.close).toHaveBeenCalled();
      }));
    });
  });
});
