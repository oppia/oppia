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
 * @fileoverview Unit tests for thanks for subscribing modal component.
 */

import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import {MockTranslatePipe} from 'tests/unit-test-utils';
import {ThanksForSubscribingModalComponent} from './thanks-for-subscribing-modal.component';

class MockActiveModal {
  dismiss(): void {
    return;
  }

  close(): void {
    return;
  }
}

describe('Thanks for subscribing modal component', function () {
  let component: ThanksForSubscribingModalComponent;
  let fixture: ComponentFixture<ThanksForSubscribingModalComponent>;
  let ngbActiveModal: NgbActiveModal;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MockTranslatePipe, ThanksForSubscribingModalComponent],
      providers: [
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ThanksForSubscribingModalComponent);
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
  });

  it('should close modal', () => {
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();

    component.dismiss();

    expect(dismissSpy).toHaveBeenCalled();
  });
});
