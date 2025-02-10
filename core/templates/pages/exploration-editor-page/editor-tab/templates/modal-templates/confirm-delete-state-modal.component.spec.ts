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
 * @fileoverview Unit tests for ConfirmDeleteStateModalComponent.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ConfirmDeleteStateModalComponent} from './confirm-delete-state-modal.component';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

describe('Confirm Delete State Modal Component', function () {
  let component: ConfirmDeleteStateModalComponent;
  let fixture: ComponentFixture<ConfirmDeleteStateModalComponent>;
  let deleteStateName = 'Introduction';

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ConfirmDeleteStateModalComponent],
      providers: [
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmDeleteStateModalComponent);
    component = fixture.componentInstance;
    component.deleteStateName = deleteStateName;

    fixture.detectChanges();
  });

  it('should initialize properties after component is initialized', () => {
    expect(component.deleteStateWarningText).toBe(
      'Are you sure you want to delete the card "Introduction"?'
    );
  });
});
