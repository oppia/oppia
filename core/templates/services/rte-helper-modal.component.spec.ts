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
import {RteHelperModalComponent} from './rte-helper-modal.component';
import {ExternalRteSaveService} from './external-rte-save.service';
import {AlertsService} from './alerts.service';
import {ContextService} from './context.service';
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
  let contextService: ContextService;
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
        ContextService,
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
    contextService = TestBed.inject(ContextService);
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
      spyOn(contextService, 'getEntityType').and.returnValue('exploration');
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
      fixture.detectChanges();
      flush();
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
  });
});
