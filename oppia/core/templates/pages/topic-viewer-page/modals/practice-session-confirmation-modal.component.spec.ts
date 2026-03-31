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
 * @fileoverview Unit tests for practice session confirmation modal component.
 */

import {ComponentFixture, waitForAsync, TestBed} from '@angular/core/testing';
import {PracticeSessionConfirmationModal} from './practice-session-confirmation-modal.component';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {MockTranslatePipe} from 'tests/unit-test-utils';

describe('Practice session confirmation modal component', function () {
  let component: PracticeSessionConfirmationModal;
  let fixture: ComponentFixture<PracticeSessionConfirmationModal>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [PracticeSessionConfirmationModal, MockTranslatePipe],
      providers: [NgbActiveModal],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PracticeSessionConfirmationModal);
    component = fixture.componentInstance;
  });

  it('should check if component is initialized', () => {
    expect(component).toBeDefined();
  });
});
