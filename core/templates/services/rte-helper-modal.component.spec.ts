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
 * @fileoverview Unit tests for RteHelperModalController.
 */

import {
  TestBed,
  ComponentFixture,
  waitForAsync,
  fakeAsync,
  flush,
} from '@angular/core/testing';
import {AppConstants} from 'app.constants';
import {RteHelperModalComponent} from './rte-helper-modal.component';
import {ExternalRteSaveService} from './external-rte-save.service';
import {AlertsService} from './alerts.service';
import {PageContextService} from './page-context.service';
import {ImageLocalStorageService} from './image-local-storage.service';
import {AssetsBackendApiService} from './assets-backend-api.service';
import {ImageUploadHelperService} from './image-upload-helper.service';
import {SharedFormsModule} from 'components/forms/shared-forms.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {DirectivesModule} from 'directives/directives.module';
import {NgbActiveModal, NgbModalModule} from '@ng-bootstrap/ng-bootstrap';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {EventEmitter} from '@angular/core';
import {
  TranslateFakeLoader,
  TranslateLoader,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';

describe('RteHelperModalComponent', () => {
  let component: RteHelperModalComponent;
  let fixture: ComponentFixture<RteHelperModalComponent>;
  let pageContextService: PageContextService;
  let assetsBackendApiService: AssetsBackendApiService;
  let imageUploadHelperService: ImageUploadHelperService;
  let alertsService: AlertsService;
  let mockExternalRteSaveEventEmitter = new EventEmitter();
  let activeModal: NgbActiveModal;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        SharedFormsModule,
        FormsModule,
        ReactiveFormsModule,
        DirectivesModule,
        NgbModalModule,
        HttpClientTestingModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateFakeLoader,
          },
        }),
      ],
      declarations: [RteHelperModalComponent],
      providers: [
        AlertsService,
        PageContextService,
        ImageLocalStorageService,
        AssetsBackendApiService,
        ImageUploadHelperService,
        {
          provide: NgbActiveModal,
          useValue: jasmine.createSpyObj('activeModal', ['close', 'dismiss']),
        },
        {
          provide: ExternalRteSaveService,
          useValue: {onExternalRteSave: mockExternalRteSaveEventEmitter},
        },
        TranslateService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RteHelperModalComponent);
    component = fixture.componentInstance;
    pageContextService = TestBed.inject(PageContextService);
    assetsBackendApiService = TestBed.inject(AssetsBackendApiService);
    imageUploadHelperService = TestBed.inject(ImageUploadHelperService);
    alertsService = TestBed.inject(AlertsService);
    activeModal = TestBed.inject(NgbActiveModal);
  });

  describe('when customization args has a valid youtube video', function () {
    var customizationArgSpecs = [
      {
        name: 'heading',
        default_value: 'default value',
      },
      {
        name: 'video_id',
        default_value: 'https://www.youtube.com/watch?v=Ntcw0H0hwPU',
      },
    ];

    beforeEach(() => {
      fixture = TestBed.createComponent(RteHelperModalComponent);
      component = fixture.componentInstance;
      component.componentId = 'video';
      component.attrsCustomizationArgsDict = {
        heading: 'This value is not default.',
      };
      component.customizationArgSpecs = customizationArgSpecs;
    });

    it('should load modal correctly', fakeAsync(() => {
      expect(component.customizationArgSpecs).toEqual(customizationArgSpecs);
      expect(component.modalIsLoading).toBe(true);
      component.ngOnInit();
      flush();
      expect(component.modalIsLoading).toBe(false);
    }));

    it('should close modal when clicking on cancel button', fakeAsync(() => {
      component.ngOnInit();
      flush();
      component.cancel();
      expect(activeModal.dismiss).toHaveBeenCalledWith(false);
    }));

    it('should save modal customization args when closing it', fakeAsync(() => {
      spyOn(mockExternalRteSaveEventEmitter, 'emit').and.callThrough();
      spyOn(pageContextService, 'getEntityType').and.returnValue('exploration');
      component.ngOnInit();
      flush();
      component.onCustomizationArgsFormChange(
        component.attrsCustomizationArgsDict.heading
      );
      expect(component.isErrorMessageNonempty()).toBe(false);
      component.save();
      flush();
      expect(mockExternalRteSaveEventEmitter.emit).toHaveBeenCalled();
      expect(activeModal.close).toHaveBeenCalledWith({
        heading: 'This value is not default.',
        video_id: 'Ntcw0H0hwPU',
      });
    }));
  });

  describe('when there are validation errors in any form control', function () {
    var customizationArgSpecs = [
      {
        name: 'alt',
        default_value: 'def',
        schema: {
          type: 'unicode',
          validators: [
            {
              id: 'has_length_at_least',
              min_value: 5,
            },
          ],
        },
      },
    ];

    beforeEach(() => {
      fixture = TestBed.createComponent(RteHelperModalComponent);
      component = fixture.componentInstance;
      component.attrsCustomizationArgsDict = {
        heading: 'This value is not default.',
      };
      component.customizationArgSpecs = customizationArgSpecs;
    });

    it('should disable save button', fakeAsync(() => {
      component.ngOnInit();
      flush();
    }));
  });

  describe('when the editor is Math expression editor', function () {
    var customizationArgSpecs = [
      {
        name: 'math_content',
        default_value: {
          raw_latex: '',
          svg_filename: '',
        },
      },
    ];

    beforeEach(() => {
      fixture = TestBed.createComponent(RteHelperModalComponent);
      component = fixture.componentInstance;
      component.componentId = 'math';
      component.attrsCustomizationArgsDict = {
        math_content: {
          raw_latex: '',
          svg_filename: '',
        },
      };
      component.customizationArgSpecs = customizationArgSpecs;
    });

    it('should load modal correctly', fakeAsync(() => {
      expect(component.customizationArgSpecs).toEqual(customizationArgSpecs);
      expect(component.componentId).toBe('math');
      expect(component.modalIsLoading).toBe(true);
      component.ngOnInit();
      flush();
      expect(component.modalIsLoading).toBe(false);
    }));

    it('should close modal when clicking on cancel button', fakeAsync(() => {
      component.ngOnInit();
      flush();
      component.cancel();
      expect(activeModal.dismiss).toHaveBeenCalledWith(false);
    }));

    it('should close modal when clicking on cancel button when it is newly created', fakeAsync(() => {
      component.ngOnInit();
      component.componentIsNewlyCreated = true;
      flush();
      component.cancel();
      expect(activeModal.dismiss).toHaveBeenCalledWith(true);
    }));

    it('should save modal customization args when closing it', fakeAsync(() => {
      spyOn(mockExternalRteSaveEventEmitter, 'emit').and.callThrough();
      spyOn(pageContextService, 'getImageSaveDestination').and.returnValue(
        AppConstants.IMAGE_SAVE_DESTINATION_SERVER
      );
      spyOn(pageContextService, 'getEntityType').and.returnValue('exploration');
      component.ngOnInit();
      flush();

      component.customizationArgsForm.value[0] = {
        raw_latex: 'x^2',
        svgFile: 'Svg Data',
        svg_filename: 'mathImage.svg',
        mathExpressionSvgIsBeingProcessed: true,
      };
      component.onCustomizationArgsFormChange(
        component.customizationArgsForm.value
      );
      expect(component.isErrorMessageNonempty()).toBe(true);
      component.customizationArgsForm.value[0].mathExpressionSvgIsBeingProcessed =
        false;
      component.onCustomizationArgsFormChange(
        component.customizationArgsForm.value
      );
      expect(component.isErrorMessageNonempty()).toBe(false);
      var response = {
        filename: 'mathImage.svg',
      };
      var imageFile = new Blob();
      spyOn(assetsBackendApiService, 'saveMathExpressionImage').and.returnValue(
        Promise.resolve(response)
      );
      spyOn(
        imageUploadHelperService,
        'convertImageDataToImageFile'
      ).and.returnValue(imageFile);
      component.save();
      flush();

      expect(mockExternalRteSaveEventEmitter.emit).toHaveBeenCalled();
      expect(activeModal.close).toHaveBeenCalledWith({
        math_content: {
          raw_latex: 'x^2',
          svg_filename: 'mathImage.svg',
        },
      });
    }));

    it('should handle being unable to communicate to server and show error while saving', fakeAsync(() => {
      spyOn(alertsService, 'addWarning');
      spyOn(mockExternalRteSaveEventEmitter, 'emit').and.callThrough();
      spyOn(pageContextService, 'getImageSaveDestination').and.returnValue(
        AppConstants.IMAGE_SAVE_DESTINATION_SERVER
      );
      spyOn(pageContextService, 'getEntityType').and.returnValue('exploration');
      component.ngOnInit();
      flush();

      component.customizationArgsForm.value[0] = {
        raw_latex: 'x^2',
        svgFile: 'Svg Data',
        svg_filename: 'mathImage.svg',
        mathExpressionSvgIsBeingProcessed: false,
      };

      var response = {
        error: 'Error communicating with server.',
      };
      var imageFile = new Blob();
      spyOn(assetsBackendApiService, 'saveMathExpressionImage').and.returnValue(
        Promise.reject(response)
      );
      spyOn(
        imageUploadHelperService,
        'convertImageDataToImageFile'
      ).and.returnValue(imageFile);
      component.save();
      flush();

      expect(mockExternalRteSaveEventEmitter.emit).toHaveBeenCalled();
      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'Error communicating with server.'
      );
      expect(activeModal.dismiss).toHaveBeenCalledWith('cancel');
    }));

    it('should cancel the modal when math SVG exceeds 100 KB', fakeAsync(() => {
      spyOn(mockExternalRteSaveEventEmitter, 'emit').and.callThrough();
      spyOn(pageContextService, 'getEntityType').and.returnValue('exploration');
      component.ngOnInit();
      flush();
      component.customizationArgsForm.value[0] = {
        raw_latex: 'x^2 + y^2 + x^2 + y^2 + x^2 + y^2 + x^2 + y^2 + x^2',
        svgFile: 'Svg Data',
        svg_filename: 'mathImage.svg',
      };
      component.onCustomizationArgsFormChange(
        component.customizationArgsForm.value
      );
      var imageFile = new Blob([new ArrayBuffer(102 * 1024)], {
        type: 'application/octet-stream',
      });
      spyOn(
        imageUploadHelperService,
        'convertImageDataToImageFile'
      ).and.returnValue(imageFile);
      component.save();
      flush();

      expect(mockExternalRteSaveEventEmitter.emit).toHaveBeenCalled();
      expect(activeModal.dismiss).toHaveBeenCalledWith('cancel');
    }));

    it('should cancel the modal when SVG exceeds 1 MB for blog post', fakeAsync(() => {
      spyOn(mockExternalRteSaveEventEmitter, 'emit').and.callThrough();
      spyOn(pageContextService, 'getEntityType').and.returnValue(
        AppConstants.ENTITY_TYPE.BLOG_POST
      );
      component.ngOnInit();
      flush();
      component.customizationArgsForm.value[0] = {
        raw_latex: 'x^2 + y^2 + x^2 + y^2 + x^2 + y^2 + x^2 + y^2 + x^2',
        svgFile: 'Svg Data',
        svg_filename: 'mathImage.svg',
      };
      component.onCustomizationArgsFormChange(
        component.customizationArgsForm.value
      );
      var imageFile = new Blob([new ArrayBuffer(102 * 1024 * 1024)], {
        type: 'application/octet-stream',
      });

      spyOn(
        imageUploadHelperService,
        'convertImageDataToImageFile'
      ).and.returnValue(imageFile);
      component.save();
      flush();

      expect(mockExternalRteSaveEventEmitter.emit).toHaveBeenCalled();
      expect(activeModal.dismiss).toHaveBeenCalledWith('cancel');
    }));

    it(
      'should cancel the modal when if the rawLatex or filename field is' +
        'empty for a math expression',
      fakeAsync(() => {
        spyOn(mockExternalRteSaveEventEmitter, 'emit').and.callThrough();
        spyOn(pageContextService, 'getEntityType').and.returnValue(
          'exploration'
        );
        component.ngOnInit();
        flush();
        component.customizationArgsForm.value[0] = {
          raw_latex: '',
          svgFile: null,
          svg_filename: '',
        };
        component.onCustomizationArgsFormChange(
          component.customizationArgsForm.value
        );
        component.save();
        flush();

        expect(mockExternalRteSaveEventEmitter.emit).toHaveBeenCalled();
        expect(activeModal.dismiss).toHaveBeenCalledWith('cancel');
      })
    );

    it('should save modal customization args while in local storage', fakeAsync(() => {
      spyOn(mockExternalRteSaveEventEmitter, 'emit').and.callThrough();
      spyOn(pageContextService, 'getEntityType').and.returnValue('exploration');
      component.ngOnInit();
      flush();
      component.customizationArgsForm.value[0] = {
        raw_latex: 'x^2',
        svgFile: 'Svg Data',
        svg_filename: 'mathImage.svg',
        mathExpressionSvgIsBeingProcessed: true,
      };
      component.onCustomizationArgsFormChange(
        component.customizationArgsForm.value
      );

      var imageFile = new Blob();
      spyOn(pageContextService, 'getImageSaveDestination').and.returnValue(
        AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE
      );
      spyOn(
        imageUploadHelperService,
        'convertImageDataToImageFile'
      ).and.returnValue(imageFile);

      component.save();
      flush();

      expect(mockExternalRteSaveEventEmitter.emit).toHaveBeenCalled();
      expect(activeModal.close).toHaveBeenCalledWith({
        math_content: {
          raw_latex: 'x^2',
          svg_filename: 'mathImage.svg',
        },
      });
    }));
  });

  describe('when the editor is Link editor', function () {
    const customizationArgSpecs = [
      {
        name: 'url',
        default_value: 'google.com',
      },
      {
        name: 'text',
        default_value: '',
      },
    ];

    beforeEach(() => {
      fixture = TestBed.createComponent(RteHelperModalComponent);
      component = fixture.componentInstance;
      component.componentId = 'link';
      component.attrsCustomizationArgsDict = {
        url: 'google.com',
        text: 'google.com',
      };
      component.customizationArgSpecs = customizationArgSpecs;
    });

    it('should load modal correctly', fakeAsync(() => {
      expect(component.customizationArgSpecs).toEqual(customizationArgSpecs);
      expect(component.componentId).toBe('link');
    }));

    it('should disable save button when text may be misleading', fakeAsync(() => {
      const URLs = [
        'malicious.com',
        'www.malicious.com',
        'https://malicious.com',
        'https://www.malicious.com',
      ];
      const texts = ['google.com', 'friendly.org', 'https://www.happy.gov'];

      for (const URL of URLs) {
        for (const text of texts) {
          component.ngOnInit();
          flush();
          component.customizationArgsForm.value[0] = URL;
          component.customizationArgsForm.value[1] = text;

          component.onCustomizationArgsFormChange(
            component.customizationArgsForm.value
          );
          expect(component.isErrorMessageNonempty()).toBe(true);
        }
      }
    }));

    it('should enable save button when text matches url', fakeAsync(() => {
      component.ngOnInit();
      flush();
      component.customizationArgsForm.value[0] = 'www.google.com';
      component.customizationArgsForm.value[1] = 'https://google.com';

      expect(component.isErrorMessageNonempty()).toBe(false);
    }));

    it('should enable save butoon when text is not a URL', fakeAsync(() => {
      component.ngOnInit();
      flush();
      component.customizationArgsForm.value[0] = 'www.google.com';
      component.customizationArgsForm.value[1] = 'click here';
      component.onCustomizationArgsFormChange(
        component.customizationArgsForm.value
      );
      expect(component.isErrorMessageNonempty()).toBe(false);
    }));

    it('should save modal customization args when closing it', fakeAsync(() => {
      spyOn(mockExternalRteSaveEventEmitter, 'emit').and.callThrough();
      spyOn(pageContextService, 'getEntityType').and.returnValue('exploration');
      component.ngOnInit();
      flush();
      expect(component.isErrorMessageNonempty()).toBe(false);

      component.save();

      expect(mockExternalRteSaveEventEmitter.emit).toHaveBeenCalled();
      expect(activeModal.close).toHaveBeenCalledWith({
        url: 'google.com',
        text: 'google.com',
      });
    }));

    it('should display error message when link exceeds length limit', fakeAsync(() => {
      component.ngOnInit();
      flush();
      component.customizationArgsForm.value[0] =
        'asdfasdfasdfasdfasdfasdfasfdasfasdfasdfasdfasdfasdfasdfasafdssdfgsdfgsdfgasdfasdfzxcvzxcvzxcvasdfasdfasdfzxcvzxcvzxcvzxcvasdfgsadfasdfzxcvzxcvzxcvasdfasdfasdfzxcvzxcvasdfdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdf.com';
      component.customizationArgsForm.value[1] = 'click';
      component.onCustomizationArgsFormChange(
        component.customizationArgsForm.value
      );
      expect(component.isErrorMessageNonempty()).toBe(true);
    }));

    it('should display error message when text exceeds length limit', fakeAsync(() => {
      component.ngOnInit();
      flush();
      component.customizationArgsForm.value[0] = 'google.com';
      component.customizationArgsForm.value[1] =
        'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate';
      component.onCustomizationArgsFormChange(
        component.customizationArgsForm.value
      );
      expect(component.isErrorMessageNonempty()).toBe(true);
    }));
  });

  describe("when customization args doesn't have a valid youtube video", function () {
    var customizationArgSpecs = [
      {
        name: 'video_id',
        default_value: 'https://www.youtube.com/watch?v=Ntcw0H0hwPU',
      },
      {
        name: 'start',
        default_value: 0,
      },
      {
        name: 'end',
        default_value: 10,
      },
      {
        name: 'autoplay',
        default_value: false,
      },
    ];

    beforeEach(() => {
      fixture = TestBed.createComponent(RteHelperModalComponent);
      component = fixture.componentInstance;
      (component.componentId = 'video'),
        (component.attrsCustomizationArgsDict = {
          video_id: 'Ntcw0H0hwPU',
          start: 0,
          end: 10,
          autoplay: false,
        });
      component.customizationArgSpecs = customizationArgSpecs;
    });
    it('should disable save button and display error message', fakeAsync(() => {
      component.ngOnInit();
      flush();

      component.customizationArgsForm.value[0] = '';
      component.onCustomizationArgsFormChange(
        component.customizationArgsForm.value
      );
      expect(component.isErrorMessageNonempty()).toBe(true);
      expect(component.errorMessage).toBe(
        'Please ensure that the Youtube URL or id is valid.'
      );
      flush();
    }));
  });

  describe('when the editor is updated', function () {
    var customizationArgSpecs = [
      {
        name: 'filepath',
        default_value: '',
      },
      {
        name: 'caption',
        default_value: '',
      },
      {
        name: 'alt',
        default_value: '',
      },
    ];

    beforeEach(() => {
      fixture = TestBed.createComponent(RteHelperModalComponent);
      component = fixture.componentInstance;
      component.attrsCustomizationArgsDict = {
        alt: '',
        caption: '',
        filepath: '',
      };
      component.customizationArgSpecs = customizationArgSpecs;
    });

    it('should call onCustomizationArgsFormChange when customizationArgsForm value changes', fakeAsync(() => {
      component.ngOnInit();
      flush();
      spyOn(component, 'onCustomizationArgsFormChange').and.callThrough();

      component.customizationArgsForm.setValue({
        0: 'alt',
        1: 'caption',
        2: 'filepath',
      });

      expect(component.onCustomizationArgsFormChange).toHaveBeenCalledWith({
        0: 'alt',
        1: 'caption',
        2: 'filepath',
      });
    }));
  });

  describe('when delete is clicked', function () {
    var customizationArgSpecs = [
      {
        name: 'filepath',
        default_value: '',
      },
      {
        name: 'caption',
        default_value: '',
      },
      {
        name: 'alt',
        default_value: '',
      },
    ];

    beforeEach(() => {
      fixture = TestBed.createComponent(RteHelperModalComponent);
      component = fixture.componentInstance;
      component.componentId = 'link';
      component.attrsCustomizationArgsDict = {
        alt: '',
        caption: '',
        filepath: '',
      };
      component.customizationArgSpecs = customizationArgSpecs;
    });

    it('should delete the RTE component', fakeAsync(() => {
      component.ngOnInit();
      flush();
      component.delete();
      expect(activeModal.dismiss).toHaveBeenCalledWith(true);
    }));
  });

  describe('when there are validation errors in link form control', function () {
    var customizationArgSpecs = [
      {
        name: 'url',
        default_value: 'oppia.org',
      },
      {
        name: 'text',
        default_value: 'oppia',
      },
    ];

    beforeEach(() => {
      fixture = TestBed.createComponent(RteHelperModalComponent);
      component = fixture.componentInstance;
      (component.componentId = 'link'),
        (component.attrsCustomizationArgsDict = {
          url: 'oppia.org',
          text: 'oppia',
        });
      component.customizationArgSpecs = customizationArgSpecs;
    });

    it('should disable save button and display error message', fakeAsync(() => {
      component.ngOnInit();
      flush();
      component.customizationArgsForm.value[0] = 'oppia.org';
      component.customizationArgsForm.value[1] = 'oppia.com';
      component.onCustomizationArgsFormChange(
        component.customizationArgsForm.value
      );
      expect(component.isErrorMessageNonempty()).toBe(true);
      expect(component.errorMessage).toBe(
        'It seems like clicking on this link will lead the user to a ' +
          'different URL than the text specifies. Please change the text.'
      );
      flush();
    }));
  });

  describe('when the text is empty in link form control', function () {
    var customizationArgSpecs = [
      {
        name: 'url',
        default_value: 'oppia.org',
      },
      {
        name: 'text',
        default_value: ' ',
      },
    ];

    beforeEach(() => {
      fixture = TestBed.createComponent(RteHelperModalComponent);
      component = fixture.componentInstance;
      (component.componentId = 'link'),
        (component.attrsCustomizationArgsDict = {
          url: 'oppia.org',
          text: ' ',
        });
      component.customizationArgSpecs = customizationArgSpecs;
    });

    it('should make the text equal to url when text is empty', fakeAsync(() => {
      component.ngOnInit();
      flush();
      component.customizationArgsForm.value[0] = 'oppia.org';
      component.customizationArgsForm.value[1] = '';
      component.onCustomizationArgsFormChange(
        component.customizationArgsForm.value
      );
      expect(component.isErrorMessageNonempty()).toBe(false);
      expect(component.customizationArgsForm.value[1]).toBe('oppia.org');
      flush();
    }));

    it('should make the text equal to url when text contain only whitespace', fakeAsync(() => {
      component.ngOnInit();
      flush();
      component.customizationArgsForm.value[0] = 'oppia.org';
      component.customizationArgsForm.value[1] = ' ';
      component.onCustomizationArgsFormChange(
        component.customizationArgsForm.value
      );
      expect(component.isErrorMessageNonempty()).toBe(false);
      expect(component.customizationArgsForm.value[1]).toBe('oppia.org');
      flush();
    }));

    it('should make the text equal to url when text contain only whitespace', fakeAsync(() => {
      const whitespaceChars =
        '\u0009\u000A\u000B\u000C\u000D\u0020\u00A0\u1680\u2000' +
        '\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008' +
        '\u2009\u200A\u2028\u2029\u202F\u205F\u3000';

      component.ngOnInit();
      flush();
      component.customizationArgsForm.value[0] = 'oppia.org';
      component.customizationArgsForm.value[1] = whitespaceChars;
      component.onCustomizationArgsFormChange(
        component.customizationArgsForm.value
      );
      expect(component.isErrorMessageNonempty()).toBe(false);
      expect(component.customizationArgsForm.value[1]).toBe('oppia.org');
      flush();
    }));
  });

  describe('when there are validation errors in video form control', function () {
    var customizationArgSpecs = [
      {
        name: 'video_id',
        default_value: 'https://www.youtube.com/watch?v=Ntcw0H0hwPU',
      },
      {
        name: 'start',
        default_value: 0,
      },
      {
        name: 'end',
        default_value: 0,
      },
      {
        name: 'autoplay',
        default_value: false,
      },
    ];

    beforeEach(() => {
      fixture = TestBed.createComponent(RteHelperModalComponent);
      component = fixture.componentInstance;
      (component.componentId = 'video'),
        (component.attrsCustomizationArgsDict = {
          video_id: 'Ntcw0H0hwPU',
          start: 0,
          end: 0,
          autoplay: false,
        });
      component.customizationArgSpecs = customizationArgSpecs;
    });

    it('should disable save button and display error message', fakeAsync(() => {
      component.ngOnInit();
      flush();

      component.customizationArgsForm.value[1] = 10;
      component.customizationArgsForm.value[2] = 0;
      component.onCustomizationArgsFormChange(
        component.customizationArgsForm.value
      );
      expect(component.isErrorMessageNonempty()).toBe(true);
      expect(component.errorMessage).toBe(
        'Please ensure that the start time of the video is earlier than ' +
          'the end time.'
      );
      flush();
    }));
  });

  describe('when there are validation errors in tabs form control', function () {
    var customizationArgSpecs = [
      {
        name: 'tab_contents',
        default_value: [
          {
            title: 'Tab 1',
            content: 'Content for Tab 1',
          },
          {
            title: 'Tab 2',
            content: 'Content for Tab 2',
          },
        ],
      },
    ];

    beforeEach(() => {
      fixture = TestBed.createComponent(RteHelperModalComponent);
      component = fixture.componentInstance;
      (component.componentId = 'tabs'),
        (component.attrsCustomizationArgsDict = {
          tabs_contents: [
            {
              title: 'Tab 1',
              content: 'Content for Tab 1',
            },
            {
              title: 'Tab 2',
              content: 'Content for Tab 2',
            },
          ],
        });
      component.customizationArgSpecs = customizationArgSpecs;
    });

    it('should disable save button and display error message', fakeAsync(() => {
      component.ngOnInit();
      flush();
      component.customizationArgsForm.value[0][0].title = '';
      component.onCustomizationArgsFormChange(
        component.customizationArgsForm.value
      );
      expect(component.isErrorMessageNonempty()).toBe(true);
      expect(component.errorMessage).toBe(
        'Please ensure that the title of tab 1 is filled.'
      );
      flush();
    }));

    it('should disable save button and display error message', fakeAsync(() => {
      component.ngOnInit();
      flush();
      component.customizationArgsForm.value[0][0].title = 'Tab 1';
      component.customizationArgsForm.value[0][1].content = '';
      component.onCustomizationArgsFormChange(
        component.customizationArgsForm.value
      );
      expect(component.isErrorMessageNonempty()).toBe(true);
      expect(component.errorMessage).toBe(
        'Please ensure that the content of tab 2 is filled.'
      );
      flush();
    }));

    it('should display error message when heading length exceeds limit', fakeAsync(() => {
      component.ngOnInit();
      flush();
      component.customizationArgsForm.value[0][0].title =
        'asdfasdfasdfasdfasdfasdfasfdasfasdfasdfasdfasdfaszxcvzxcvzxcvzxdfgdsfgsdfgsdfgvbxcvbcvzxcvsdfsdafzxcvzxcvzxcvzxcvzxcvsdzfasdafzxcvzxcvzxcvdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfcom';
      (component.customizationArgsForm.value[0][1].content =
        'Lorem ipsum dolor sit amet'),
        component.onCustomizationArgsFormChange(
          component.customizationArgsForm.value
        );
      expect(component.isErrorMessageNonempty()).toBe(true);
      flush();
    }));

    it('should display error message when content length exceeds limit', fakeAsync(() => {
      component.ngOnInit();
      flush();
      component.customizationArgsForm.value[0][0].title = 'Tab 1';
      component.customizationArgsForm.value[0][1].content =
        'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate';
      component.onCustomizationArgsFormChange(
        component.customizationArgsForm.value
      );
      expect(component.isErrorMessageNonempty()).toBe(true);
      flush();
    }));
  });

  describe('when there are validation errors in collapsible form control', function () {
    var customizationArgSpecs = [
      {
        name: 'heading',
        default_value: 'Collapsible 1',
      },
      {
        name: 'content',
        default_value: 'Hello',
      },
    ];

    beforeEach(() => {
      fixture = TestBed.createComponent(RteHelperModalComponent);
      component = fixture.componentInstance;
      (component.componentId = 'collapsible'),
        (component.attrsCustomizationArgsDict = {
          heading: 'Collapsible 1',
          content: 'Hello',
        });
      component.customizationArgSpecs = customizationArgSpecs;
    });

    it('should display error message when heading length exceeds limit', fakeAsync(() => {
      component.ngOnInit();
      flush();
      component.customizationArgsForm.value[0] =
        'sdfgsdfgsdfgasdfasdfasdfasdfasdfasdfasfdasfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfgasdfasdfxzcvzxcvasdfsdafzxcvzxcvzxcvzxccvasdfasdfzxcvasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfcom';
      component.customizationArgsForm.value[1] = 'Hello!';
      component.onCustomizationArgsFormChange(
        component.customizationArgsForm.value
      );
      expect(component.isErrorMessageNonempty()).toBe(true);
      flush();
    }));

    it('should display error message when content length exceeds limit', fakeAsync(() => {
      component.ngOnInit();
      flush();
      component.customizationArgsForm.value[0] = 'Collapsible 1';
      component.customizationArgsForm.value[1] =
        'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate';
      component.onCustomizationArgsFormChange(
        component.customizationArgsForm.value
      );
      expect(component.isErrorMessageNonempty()).toBe(true);
      flush();
    }));
  });

  describe('when there are validation errors in workedexample form control', function () {
    var customizationArgSpecs = [
      {
        name: 'question',
        default_value: 'sample question',
      },
      {
        name: 'answer',
        default_value: 'sample answer',
      },
    ];

    beforeEach(() => {
      fixture = TestBed.createComponent(RteHelperModalComponent);
      component = fixture.componentInstance;
      (component.componentId = 'workedexample'),
        (component.attrsCustomizationArgsDict = {
          heading: 'sample question',
          content: 'sample answer',
        });
      component.customizationArgSpecs = customizationArgSpecs;
    });

    it('should display error message when question length exceeds limit', fakeAsync(() => {
      component.ngOnInit();
      flush();
      component.customizationArgsForm.value[0] =
        'sdfgsdfgsdfgasdfasdfasdfasdfasdfasdfasfdasfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfgasdfasdfxzcvzxcvasdfsdafzxcvzxcvzxcvzxccvasdfasdfzxcvasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfcomsdfgsdfgsdfgasdfasdfasdfasdfasdfasdfasfdasfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfgasdfasdfxzcvzxcvasdfsdafzxcvzxcvzxcvzxccvasdfasdfzxcvasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfcomsdfgsdfgsdfgasdfasdfasdfasdfasdfasdfasfdasfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfgasdfasdfxzcvzxcvasdfsdafzxcvzxcvzxcvzxccvasdfasdfzxcvasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfcomsdfgsdfgsdfgasdfasdfasdfasdfasdfasdfasfdasfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfgasdfasdfxzcvzxcvasdfsdafzxcvzxcvzxcvzxccvasdfasdfzxcvasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfcom';
      component.customizationArgsForm.value[1] = 'Hello!';
      component.onCustomizationArgsFormChange(
        component.customizationArgsForm.value
      );
      expect(component.isErrorMessageNonempty()).toBe(true);
      flush();
    }));

    it('should display error message when answer length exceeds limit', fakeAsync(() => {
      component.ngOnInit();
      flush();
      component.customizationArgsForm.value[0] = 'question 1';
      component.customizationArgsForm.value[1] =
        'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputatesdfgsdfgsdfgasdfasdfasdfasdfasdfasdfasfdasfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfgasdfasdfxzcvzxcvasdfsdafzxcvzxcvzxcvzxccvasdfasdfzxcvasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfcomsdfgsdfgsdfgasdfasdfasdfasdfasdfasdfasfdasfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfgasdfasdfxzcvzxcvasdfsdafzxcvzxcvzxcvzxccvasdfasdfzxcvasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfcom';
      component.onCustomizationArgsFormChange(
        component.customizationArgsForm.value
      );
      expect(component.isErrorMessageNonempty()).toBe(true);
      flush();
    }));
  });
});
