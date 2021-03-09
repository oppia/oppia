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
 * @fileoverview Unit tests for ConfirmOrCancelModalController.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmOrCancelModalComponent } from './confirm-or-cancel-modal.component';


class MockActiveModal {
  dismiss(value): void {
    return;
  }

  close(value): void {
    return;
  }
}

describe('Confirm Or Cancel Modal Component', () => {
  let component: ConfirmOrCancelModalComponent;
  let fixture: ComponentFixture<ConfirmOrCancelModalComponent>;
  let ngbActiveModal: NgbActiveModal;
  let dismissSpy: jasmine.Spy;
  let closeSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConfirmOrCancelModalComponent],
      providers: [
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal
        }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(ConfirmOrCancelModalComponent);
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);

    dismissSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();
    closeSpy = spyOn(ngbActiveModal, 'close').and.callThrough();
  });

  it('should close modal with the correct value', function() {
    var message = 'closing';
    component.confirm(message);
    expect(closeSpy).toHaveBeenCalledWith(message);
  });

  it('should dismiss modal', function() {
    component.cancel();
    expect(dismissSpy).toHaveBeenCalledWith('cancel');
  });

  it('should dismiss modal with the correct value', function() {
    var message = 'canceling';
    component.cancel(message);
    expect(dismissSpy).toHaveBeenCalledWith(message);
  });
});
