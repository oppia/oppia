// Copyright 2026 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for MasteryChallengeLockedModalComponent.
 */

import {TestBed, waitForAsync} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import {MockTranslateModule} from 'tests/unit-test-utils';
import {MasteryChallengeLockedModalComponent} from './mastery-challenge-locked-modal.component';

describe('MasteryChallengeLockedModalComponent', () => {
  let component: MasteryChallengeLockedModalComponent;
  let ngbActiveModal: NgbActiveModal;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [MasteryChallengeLockedModalComponent, MockTranslateModule],
      providers: [NgbActiveModal],
    }).compileComponents();

    const fixture = TestBed.createComponent(
      MasteryChallengeLockedModalComponent
    );
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
  }));

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should close the modal when cancel is called', () => {
    spyOn(ngbActiveModal, 'dismiss');

    component.cancel();

    expect(ngbActiveModal.dismiss).toHaveBeenCalledWith('cancel');
  });

  it('should close the modal when confirm is called', () => {
    spyOn(ngbActiveModal, 'close');

    component.confirm();

    expect(ngbActiveModal.close).toHaveBeenCalled();
  });
});
