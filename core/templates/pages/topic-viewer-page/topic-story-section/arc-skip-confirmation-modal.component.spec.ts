// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for ArcSkipConfirmationModalComponent.
 */

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';

import {MockTranslatePipe} from 'tests/unit-test-utils';

import {ArcSkipConfirmationModalComponent} from './arc-skip-confirmation-modal.component';

describe('ArcSkipConfirmationModalComponent', () => {
  let component: ArcSkipConfirmationModalComponent;
  let fixture: ComponentFixture<ArcSkipConfirmationModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ArcSkipConfirmationModalComponent, MockTranslatePipe],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ArcSkipConfirmationModalComponent);
    component = fixture.componentInstance;
    component.adventureLabel = 'Adventure 2';
    component.confirmationMessage = 'Adventure 1 will be skipped';
  });

  it('should emit cancel when onCancel is called', () => {
    spyOn(component.cancel, 'emit');

    component.onCancel();

    expect(component.cancel.emit).toHaveBeenCalled();
  });

  it('should emit confirm when onConfirm is called', () => {
    spyOn(component.confirm, 'emit');

    component.onConfirm();

    expect(component.confirm.emit).toHaveBeenCalled();
  });

  it('should emit cancel when the backdrop is clicked', () => {
    spyOn(component.cancel, 'emit');

    component.onBackdropClick();

    expect(component.cancel.emit).toHaveBeenCalled();
  });

  it('should emit cancel when Escape is pressed', () => {
    spyOn(component.cancel, 'emit');

    component.onDocumentKeydown(new KeyboardEvent('keydown', {key: 'Escape'}));

    expect(component.cancel.emit).toHaveBeenCalled();
  });

  it('should ignore non-Escape keys', () => {
    spyOn(component.cancel, 'emit');

    component.onDocumentKeydown(new KeyboardEvent('keydown', {key: 'Enter'}));

    expect(component.cancel.emit).not.toHaveBeenCalled();
  });
});
