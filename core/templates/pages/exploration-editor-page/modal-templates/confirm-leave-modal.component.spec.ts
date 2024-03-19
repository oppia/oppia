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
 * @fileoverview Unit tests for confirm leave modal component.
 */

import {NO_ERRORS_SCHEMA, ElementRef} from '@angular/core';
import {ComponentFixture, waitForAsync, TestBed} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ConfirmLeaveModalComponent} from './confirm-leave-modal.component';

describe('Confirm Leave Modal Component', function () {
  let component: ConfirmLeaveModalComponent;
  let fixture: ComponentFixture<ConfirmLeaveModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ConfirmLeaveModalComponent],
      providers: [NgbActiveModal],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmLeaveModalComponent);
    component = fixture.componentInstance;
  });

  it('should check component is initialized', () => {
    expect(component).toBeDefined();
  });

  it('should focus on the header after loading', () => {
    const confirmHeaderRef = new ElementRef(document.createElement('h4'));
    component.confirmHeaderRef = confirmHeaderRef;
    spyOn(confirmHeaderRef.nativeElement, 'focus');

    component.ngAfterViewInit();

    expect(confirmHeaderRef.nativeElement.focus).toHaveBeenCalled();
  });
});
