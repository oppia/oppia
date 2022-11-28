// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for thanks for donating modal component.
 */

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { MockTranslatePipe } from 'tests/unit-test-utils';
import { ThanksForDonatingModalComponent } from './thanks-for-donating-modal.component';

class MockActiveModal {
  dismiss(): void {
    return;
  }

  close(): void {
    return;
  }
}

describe('Thanks For Donating Modal Component', () => {
  let component: ThanksForDonatingModalComponent;
  let fixture: ComponentFixture<ThanksForDonatingModalComponent>;
  let ngbActiveModal: NgbActiveModal;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [MockTranslatePipe, ThanksForDonatingModalComponent],
      providers: [
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal
        }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ThanksForDonatingModalComponent);
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
  });

  it('should close modal', () => {
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();

    component.dismiss();

    expect(dismissSpy).toHaveBeenCalled();
  });
});
