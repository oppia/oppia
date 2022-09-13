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
 * @fileoverview Unit tests for UploadActivityModalComponent.
 */

import { AlertsService } from 'services/alerts.service';
import { ComponentFixture, fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UploadActivityModalComponent } from './upload-activity-modal.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

class MockActiveModal {
  dismiss(): void {
    return;
  }

  close(): void {
    return;
  }
}

class MockAlertsService {
  addWarning() {
    return null;
  }
}

describe('Upload Activity Modal Component', () => {
  let component: UploadActivityModalComponent;
  let fixture: ComponentFixture<UploadActivityModalComponent>;
  let alertsService: AlertsService;
  let ngbActiveModal: NgbActiveModal;

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [UploadActivityModalComponent],
      providers: [
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal
        },
        {
          provide: AlertsService,
          useClass: MockAlertsService
        }
      ]
    }).compileComponents().then(() => {
      fixture = TestBed.createComponent(
        UploadActivityModalComponent);
      component = fixture.componentInstance;
    });
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    alertsService = TestBed.inject(AlertsService);
  }));

  it('should close modal when saving activity', fakeAsync(() => {
    const dismissSpy = spyOn(ngbActiveModal, 'close').and.callThrough();

    let file = {
      size: 100,
      name: 'file.mp3'
    };
    // TODO(#10113): Refactor the code to not use the DOM methods.

    // This throws "Argument of type '() => { files: { size: number;
    // name: string; }[]; }' is not assignable to parameter of type
    // '(elementId: string) => HTMLElement'.". This is because the
    // actual 'getElementById' returns more properties than just "files".
    // We need to suppress this error because we need only "files"
    // property for testing.
    // @ts-expect-error
    spyOn(document, 'getElementById').and.callFake(() => {
      return {
        files: [file]
      };
    });
    component.save();
    expect(dismissSpy).toHaveBeenCalledWith({
      yamlFile: file
    });
  }));

  it('should not save activity when file is empty', fakeAsync(() => {
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();
    spyOn(alertsService, 'addWarning').and.callThrough();
    // TODO(#10113): Refactor the code to not use the DOM methods.

    // This throws "Argument of type '() => { files: { size: number;
    // name: string; }[]; }' is not assignable to parameter of type
    // '(elementId: string) => HTMLElement'.". This is because the
    // actual 'getElementById' returns more properties than just "files".
    // We need to suppress this error because we need only "files"
    // property for testing.
    // @ts-expect-error
    spyOn(document, 'getElementById').and.callFake(() => {
      return {
        files: []
      };
    });
    component.save();
    flushMicrotasks();
    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Empty file detected.');
    expect(dismissSpy).not.toHaveBeenCalled();
  }));

  it('should dismiss modal', () => {
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();
    component.cancel();
    expect(dismissSpy).toHaveBeenCalled();
  });

  it('should throw error if no label is found for uploading files', () => {
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();
    spyOn(document, 'getElementById').and.returnValue(null);
    expect(() => {
      component.save();
    }).toThrowError('No label found for uploading files.');
    expect(dismissSpy).not.toHaveBeenCalled();
  });

  it('should throw error if no files are uploaded', () => {
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();
    // This throws "Argument of type '() => { files: { size: number;
    // name: string; }[]; }' is not assignable to parameter of type
    // '(elementId: string) => HTMLElement'.". This is because the
    // actual 'getElementById' returns more properties than just "files".
    // We need to suppress this error because we need only "files"
    // property for testing.
    // @ts-expect-error
    spyOn(document, 'getElementById').and.callFake(() => {
      return {
        files: null
      };
    });
    expect(() => {
      component.save();
    }).toThrowError('No files found.');
    expect(dismissSpy).not.toHaveBeenCalled();
  });
});
