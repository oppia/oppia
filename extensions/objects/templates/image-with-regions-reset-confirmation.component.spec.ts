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
 * @fileoverview Unit tests for Image with regions reset confirmation component.
 */

import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {ImageWithRegionsResetConfirmationModalComponent} from './image-with-regions-reset-confirmation.component';

class MockActiveModal {
  dismiss(): void {
    return;
  }

  close(): void {
    return;
  }
}

describe('Delete Misconception Modal Component', () => {
  let component: ImageWithRegionsResetConfirmationModalComponent;
  let fixture: ComponentFixture<ImageWithRegionsResetConfirmationModalComponent>;
  let ngbActiveModal: NgbActiveModal;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ImageWithRegionsResetConfirmationModalComponent],
      providers: [
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal,
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(
      ImageWithRegionsResetConfirmationModalComponent
    );
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
  }));

  it('should close the modal when confirmed', () => {
    const closeSpy = spyOn(ngbActiveModal, 'close').and.callThrough();
    component.confirm(1);
    expect(closeSpy).toHaveBeenCalled();
  });

  it('should close the modal when dismissed', () => {
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();
    component.cancel(1);
    expect(dismissSpy).toHaveBeenCalled();
  });
});
