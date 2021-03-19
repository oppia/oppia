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

import { AlertsService } from 'services/alerts.service';
import { TestBed } from
  '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UploadActivityModalComponent } from './upload-activity-modal.component';
/**
 * @fileoverview Unit tests for UploadActivityModalComponent.
 */

class MockActiveModal {
  close(value): void {
    return;
  }
}

xdescribe('Upload Activity Modal Controller', () => {
  let uploadActivityModalComponent = null;
  let alertsService: AlertsService;
  let ngbActiveModal: NgbActiveModal;
  let closeSpy: jasmine.Spy;

  beforeEach(() => {
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    closeSpy = spyOn(ngbActiveModal, 'close').and.callThrough();
    alertsService = TestBed.get(AlertsService);
    TestBed.configureTestingModule({
      declarations: [UploadActivityModalComponent],
      providers: [
        {
          provide: NgbActiveModal, useClass: MockActiveModal
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    let fixture = TestBed.createComponent(UploadActivityModalComponent);
    uploadActivityModalComponent = fixture.componentInstance;
  });

  beforeEach(() => {
    let fixture = TestBed.createComponent(UploadActivityModalComponent);
    uploadActivityModalComponent = fixture.componentInstance;
  });

  it('should close modal when saving activity', () => {
    var file = {
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
    uploadActivityModalComponent.save();

    expect(closeSpy).toHaveBeenCalledWith({
      yamlFile: file
    });
  });

  it('should not save activity when file is empty', () => {
    spyOn(alertsService, 'addWarning').and.callThrough();
    // TODO(#10113): Refactor the code to not use the DOM methods.
    // This throws "Argument of type '() => { files: { size: number;
    // name: string; }[]; }' is not assignable to parameter of type
    // '(elementId: string) => HTMLElement'.". This is because the
    // actual 'getElementById' returns more properties than just "files".
    // We need to suppress this error because we need only "files"
    // property for testing.
    // @ts-expect-error
    spyOn(document, 'getElementById').and.callFake(function() {
      return {
        files: []
      };
    });
    uploadActivityModalComponent.save();

    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Empty file detected.');
    expect(closeSpy).not.toHaveBeenCalled();
  });
});
