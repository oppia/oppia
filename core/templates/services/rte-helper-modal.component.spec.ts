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

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { fakeAsync, flushMicrotasks, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ObjectFormValidityChangeEvent } from 'app-events/app-events';
import { EventBusGroup } from 'app-events/event-bus.service';
import { AppConstants } from 'app.constants';
import { OppiaAngularRootComponent } from 'components/oppia-angular-root.component';
import { importAllAngularServices } from 'tests/unit-test-utils';
import { ContextService } from './context.service';
import { RteHelperModalComponent } from './rte-helper-modal.component';

describe('Rte Helper Modal Controller', function() {
  let changeDetectorRef = null;
  let contextService = null;
  let fixture = null;
  let component = null;

  importAllAngularServices();

  describe('when customization args has a valid youtube video', function() {
    let customizationArgSpecs = [{
      name: 'heading',
      default_value: 'default value'
    }, {
      name: 'video_id',
      default_value: 'https://www.youtube.com/watch?v=Ntcw0H0hwPU'
    }];

    beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [
          HttpClientTestingModule
        ],
        declarations: [RteHelperModalComponent],
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
      fixture = TestBed.createComponent(RteHelperModalComponent);
      component = fixture.componentInstance;
      component.customizationArgSpecs = customizationArgSpecs;
      component.attrsCustomizationArgsDict = {
        math_content: {
          raw_latex: '',
          svg_filename: ''
        },
        heading: 'This value is not default.'
      };
      component.ngOnInit();
    });

    it('should load modal correctly', fakeAsync(() => {
      expect(component.customizationArgSpecs).toEqual(customizationArgSpecs);
      component.ngOnInit();
      expect(component.modalIsLoading).toBe(true);
      tick(200);
      flushMicrotasks();
      expect(component.modalIsLoading).toBe(false);
    }));

    it('should close modal when clicking on cancel button', function() {
      spyOn(component.ngbActiveModal, 'dismiss');
      component.cancel();
      expect(component.ngbActiveModal.dismiss).toHaveBeenCalledWith('cancel');
    });

    it('should set/unset form validity', fakeAsync(() => {
      component.isValid = true;
      component.modalId = Symbol();
      const eventBusGroup = new EventBusGroup(component.eventBusService);
      eventBusGroup.emit(new ObjectFormValidityChangeEvent({
        value: false, modalId: component.modalId
      }));
      flushMicrotasks();
      expect(component.isValid).toBeFalse();

      eventBusGroup.emit(new ObjectFormValidityChangeEvent({
        value: true, modalId: component.modalId
      }));
      flushMicrotasks();
      expect(component.isValid).toBeTrue();
    }));

    it('should return schema object', function() {
      let schema = {
        type: 'int'
      };
      expect(component.getSchema(schema)).toEqual(schema);
    });

    it('should save modal customization args when closing it', function() {
      spyOn(component.ngbActiveModal, 'close');
      expect(component.disableSaveButtonForMathRte()).toBe(false);
      component.save();
      expect(component.ngbActiveModal.close).toHaveBeenCalledWith({
        heading: 'This value is not default.',
        video_id: 'Ntcw0H0hwPU'
      });
    });
  });

  describe('when the editor is Math expression editor', function() {
    let customizationArgSpecs = [{
      name: 'math_content',
      default_value: {
        raw_latex: '',
        svg_filename: ''
      }
    }];

    beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [
          HttpClientTestingModule
        ],
        declarations: [RteHelperModalComponent],
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
      fixture = TestBed.createComponent(RteHelperModalComponent);
      component = fixture.componentInstance;
      component.customizationArgSpecs = customizationArgSpecs;
      component.attrsCustomizationArgsDict = {
        math_content: {
          raw_latex: '',
          svg_filename: ''
        }
      };
      component.ngOnInit();
    });

    it('should load modal correctly', function() {
      expect(component.customizationArgSpecs).toEqual(customizationArgSpecs);
      expect(component.currentRteIsMathExpressionEditor).toBe(true);
    });

    it('should close modal when clicking on cancel button', function() {
      spyOn(component.ngbActiveModal, 'dismiss');
      component.cancel();
      expect(component.ngbActiveModal.dismiss).toHaveBeenCalledWith('cancel');
    });

    it('should save modal customization args when closing it', fakeAsync(() => {
      spyOn(component.ngbActiveModal, 'close');
      component.tmpCustomizationArgs = [{
        name: 'math_content',
        value: {
          raw_latex: 'x^2',
          svgFile: 'Svg Data',
          svg_filename: 'mathImage.svg',
          mathExpressionSvgIsBeingProcessed: true
        }
      }];
      expect(component.disableSaveButtonForMathRte()).toBe(true);
      component.tmpCustomizationArgs[0]
      .value.mathExpressionSvgIsBeingProcessed = false;
      expect(component.disableSaveButtonForMathRte()).toBe(false);
      var response = {
        filename: 'mathImage.svg'
      };
      var imageFile = new Blob();
      spyOn(
        component.assetsBackendApiService,
        'saveMathExpresionImage').and.returnValue(Promise.resolve(response));
      spyOn(
        component.imageUploadHelperService,
        'convertImageDataToImageFile').and.returnValue(imageFile);
      component.save();
      flushMicrotasks();
      expect(component.ngbActiveModal.close).toHaveBeenCalledWith({
        math_content: {
          raw_latex: 'x^2',
          svg_filename: 'mathImage.svg'
        }
      });
    }));

    it('should cancel the modal when saving of math SVG fails',
      fakeAsync(() => {
        spyOn(component.ngbActiveModal, 'dismiss');
        component.tmpCustomizationArgs = [{
          name: 'math_content',
          value: {
            raw_latex: 'x^2',
            svgFile: 'Svg Data',
            svg_filename: 'mathImage.svg'
          }
        }];
        var imageFile = new Blob();
        spyOn(
          component.assetsBackendApiService,
          'saveMathExpresionImage').and.returnValue(Promise.reject({}));
        spyOn(
          component.imageUploadHelperService,
          'convertImageDataToImageFile').and.returnValue(imageFile);
        component.save();
        flushMicrotasks();
        expect(component.ngbActiveModal.dismiss).toHaveBeenCalledWith('cancel');
      })
    );

    it('should cancel the modal when math SVG exceeds 100 KB', function() {
      spyOn(component.ngbActiveModal, 'dismiss');
      component.tmpCustomizationArgs = [{
        name: 'math_content',
        value: {
          raw_latex: 'x^2 + y^2 + x^2 + y^2 + x^2 + y^2 + x^2 + y^2 + x^2',
          svgFile: 'Svg Data',
          svg_filename: 'mathImage.svg'
        }
      }];
      var imageFile = (
        new Blob(
          [new ArrayBuffer(102 * 1024)], {type: 'application/octet-stream'}));
      spyOn(
        component.imageUploadHelperService,
        'convertImageDataToImageFile').and.returnValue(imageFile);
      component.save();
      expect(component.ngbActiveModal.dismiss).toHaveBeenCalledWith('cancel');
    });

    it('should cancel the modal when if the rawLatex or filename field is' +
       'empty for a math expression', function() {
      spyOn(component.ngbActiveModal, 'dismiss');
      component.tmpCustomizationArgs = [{
        name: 'math_content',
        value: {
          raw_latex: '',
          svgFile: null,
          svg_filename: ''
        }
      }];
      component.save();
      expect(component.ngbActiveModal.dismiss).toHaveBeenCalledWith('cancel');
    });

    it('should save modal customization args while in local storage',
      function() {
        spyOn(component.ngbActiveModal, 'close');
        component.tmpCustomizationArgs = [{
          name: 'math_content',
          value: {
            raw_latex: 'x^2',
            svgFile: 'Svg Data',
            svg_filename: 'mathImage.svg'
          }
        }];

        var imageFile = new Blob();
        spyOn(
          component.contextService,
          'getImageSaveDestination').and.returnValue(
            AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE);
        spyOn(
          component.imageUploadHelperService,
          'convertImageDataToImageFile').and.returnValue(imageFile);
        component.save();
        expect(component.ngbActiveModal.close).toHaveBeenCalledWith({
          math_content: {
            raw_latex: 'x^2',
            svg_filename: 'mathImage.svg'
          }
        });
      });
  });

  describe('when customization args doesn\'t have a valid youtube video',
    function() {
      let customizationArgSpecs = [{
        name: 'heading',
        default_value: 'default value'
      }, {
        name: 'video_id',
        default_value: 'https://www.youtube.com'
      }];

      beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
          imports: [
            HttpClientTestingModule
          ],
          declarations: [RteHelperModalComponent],
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
      }));

      beforeEach(() => {
        fixture = TestBed.createComponent(RteHelperModalComponent);
        component = fixture.componentInstance;
        component.customizationArgSpecs = customizationArgSpecs;
        component.attrsCustomizationArgsDict = {
          heading: {}
        };
        component.ngOnInit();
      });

      it('should load modal correctly', fakeAsync(() => {
        expect(component.customizationArgSpecs).toEqual(customizationArgSpecs);
        component.ngOnInit();
        expect(component.modalIsLoading).toBe(true);
        tick(200);
        flushMicrotasks();
        expect(component.modalIsLoading).toBe(false);
      }));

      it('should close modal when clicking on cancel button', function() {
        spyOn(component.ngbActiveModal, 'dismiss');
        component.cancel();
        expect(component.ngbActiveModal.dismiss).toHaveBeenCalledWith('cancel');
      });

      it('should save modal customization args when closing it', function() {
        spyOn(component.ngbActiveModal, 'close');
        spyOn(
          component.externalRteSaveService.onExternalRteSave,
          'emit'
        ).and.callThrough();
        component.save();
        expect(
          component.externalRteSaveService.onExternalRteSave.emit
        ).toHaveBeenCalled();
        expect(component.ngbActiveModal.close).toHaveBeenCalledWith({
          heading: {},
          video_id: 'https://www.youtube.com'
        });
      });
    });
});
