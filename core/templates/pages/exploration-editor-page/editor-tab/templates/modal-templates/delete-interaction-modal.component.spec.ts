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
 * @fileoverview Unit tests for Delete Interaction Modal.
 */

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DeleteInteractionModalComponent } from './delete-interaction-modal.component';

describe('Delete Hint Modal Component', () => {
  let fixture: ComponentFixture<DeleteInteractionModalComponent>;
  let componentInstance: DeleteInteractionModalComponent;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        DeleteInteractionModalComponent
      ],
      providers: [
        NgbActiveModal
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteInteractionModalComponent);
    componentInstance = fixture.componentInstance;
  });

  // This component have no more frontend tests as it inherits the
  // ConfirmOrCancelModalComponent and doesn't have any additional
  // functionality. Please see the ConfirmOrCancelModalComponent for more tests.
  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });
});
