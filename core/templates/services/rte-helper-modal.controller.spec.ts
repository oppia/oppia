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

import { TestBed, ComponentFixture, waitForAsync, fakeAsync, flush } from '@angular/core/testing';
import { RteHelperModalComponent } from './rte-helper-modal.controller';
import { ExternalRteSaveService } from './external-rte-save.service';
import { AlertsService } from './alerts.service';
import { ContextService } from './context.service';
import { ImageLocalStorageService } from './image-local-storage.service';
import { AssetsBackendApiService } from './assets-backend-api.service';
import { ImageUploadHelperService } from './image-upload-helper.service';
import { SharedFormsModule } from 'components/forms/shared-forms.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DirectivesModule } from 'directives/directives.module';
import { NgbActiveModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EventEmitter } from '@angular/core';
import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';

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
            useClass: TranslateFakeLoader
          }
        })
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
          useValue: jasmine.createSpyObj('activeModal', ['close', 'dismiss'])
        },
        {
          provide: ExternalRteSaveService,
          useValue: { onExternalRteSave: mockExternalRteSaveEventEmitter }
        },
        TranslateService
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RteHelperModalComponent);
    component = fixture.componentInstance;
    contextService = TestBed.inject(ContextService);
    activeModal = TestBed.inject(NgbActiveModal);
  });

  describe('when customization args has a valid youtube video', function() {
    var customizationArgSpecs = [{
      name: 'heading',
      default_value: 'default value'
    }, {
      name: 'video_id',
      default_value: 'https://www.youtube.com/watch?v=Ntcw0H0hwPU'
    }];


    beforeEach(() => {
      fixture = TestBed.createComponent(RteHelperModalComponent);
      component = fixture.componentInstance;
      component.attrsCustomizationArgsDict = {
        heading: 'This value is not default.'
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
      component.cancel();
      expect(activeModal.dismiss).toHaveBeenCalledWith(false);
    }));

    it('should save modal customization args when closing it', fakeAsync(() => {
      spyOn(mockExternalRteSaveEventEmitter, 'emit').and.callThrough();
      spyOn(contextService, 'getEntityType').and.returnValue('exploration');
      component.ngOnInit();
      flush();
      expect(component.disableSaveButtonForMathRte()).toBe(false);
      component.save();
      flush();
      expect(mockExternalRteSaveEventEmitter.emit).toHaveBeenCalled();
      expect(activeModal.close).toHaveBeenCalledWith({
        heading: 'This value is not default.',
        video_id: 'Ntcw0H0hwPU'
      });
    }));
  });
  describe('when there are validation errors in any form control', function() {
    var customizationArgSpecs = [{
      name: 'alt',
      default_value: 'def',
      schema: {
        type: 'unicode',
        validators: [{
          id: 'has_length_at_least',
          min_value: 5
        }]
      }
    }];

    beforeEach(() => {
      fixture = TestBed.createComponent(RteHelperModalComponent);
      component = fixture.componentInstance;
      component.attrsCustomizationArgsDict = {
        heading: 'This value is not default.'
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
});
