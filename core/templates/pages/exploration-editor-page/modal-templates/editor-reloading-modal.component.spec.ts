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
 * @fileoverview Unit tests for EditorReloadingModalController.
 */

import { ComponentFixture, waitForAsync, TestBed, fakeAsync, tick } from
  '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { EditorReloadingModalComponent } from './editor-reloading-modal.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

describe('Editor Reloading Modal Controller', () => {
  let component: EditorReloadingModalComponent;
  let fixture: ComponentFixture<EditorReloadingModalComponent>;
  let ngbActiveModal: NgbActiveModal;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        EditorReloadingModalComponent,
      ],
      providers: [
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditorReloadingModalComponent);
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    fixture.detectChanges();
  });

  it('should dismiss modal after waiting timeout to finish', fakeAsync(() => {
    spyOn(ngbActiveModal, 'dismiss');

    component.ngOnInit();

    expect(ngbActiveModal.dismiss).not.toHaveBeenCalled();

    tick(2501);

    expect(ngbActiveModal.dismiss).toHaveBeenCalled();
  }));
});
