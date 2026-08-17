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

import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {ElementRef} from '@angular/core';

import {MockTranslatePipe} from 'tests/unit-test-utils';

import {ArcSkipConfirmationModalComponent} from './arc-skip-confirmation-modal.component';

describe('ArcSkipConfirmationModalComponent', () => {
  let component: ArcSkipConfirmationModalComponent;
  let fixture: ComponentFixture<ArcSkipConfirmationModalComponent>;

  const createMockDialog = (
    focusableElements: HTMLElement[] = []
  ): HTMLElement => {
    const dialogElement = document.createElement('div');
    spyOn(dialogElement, 'focus');
    spyOn(dialogElement, 'querySelectorAll').and.returnValue(
      focusableElements as NodeListOf<HTMLElement>
    );
    return dialogElement;
  };

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

  it('should save active element and focus dialog on init', fakeAsync(() => {
    const previouslyFocusedElement = jasmine.createSpyObj<HTMLElement>(
      'previouslyFocusedElement',
      ['focus']
    );
    const dialogElement = createMockDialog();
    spyOnProperty(document, 'activeElement', 'get').and.returnValue(
      previouslyFocusedElement
    );
    component['dialog'] = new ElementRef(dialogElement);

    component.ngOnInit();
    tick(0);

    expect(dialogElement.focus).toHaveBeenCalled();
    expect(component['modalFocusRestoreElement']).toBe(
      previouslyFocusedElement
    );
  }));

  it('should restore focus on cancel', () => {
    const previouslyFocusedElement = jasmine.createSpyObj<HTMLElement>(
      'previouslyFocusedElement',
      ['focus']
    );
    component['modalFocusRestoreElement'] = previouslyFocusedElement;
    spyOn(component.cancel, 'emit');

    component.onCancel();

    expect(previouslyFocusedElement.focus).toHaveBeenCalled();
    expect(component['modalFocusRestoreElement']).toBeNull();
  });

  it('should restore focus on confirm', () => {
    const previouslyFocusedElement = jasmine.createSpyObj<HTMLElement>(
      'previouslyFocusedElement',
      ['focus']
    );
    component['modalFocusRestoreElement'] = previouslyFocusedElement;
    spyOn(component.confirm, 'emit');

    component.onConfirm();

    expect(previouslyFocusedElement.focus).toHaveBeenCalled();
    expect(component['modalFocusRestoreElement']).toBeNull();
  });

  it('should focus dialog on Tab when active element is last focusable', () => {
    const firstFocusableElement = jasmine.createSpyObj<HTMLElement>(
      'firstFocusableElement',
      ['focus']
    );
    const lastFocusableElement = jasmine.createSpyObj<HTMLElement>(
      'lastFocusableElement',
      ['focus']
    );
    const dialogElement = createMockDialog([
      firstFocusableElement,
      lastFocusableElement,
    ]);
    component['dialog'] = new ElementRef(dialogElement);
    spyOnProperty(document, 'activeElement', 'get').and.returnValue(
      lastFocusableElement
    );

    const tabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      cancelable: true,
    });
    spyOn(tabEvent, 'preventDefault');

    component.onDialogTab(tabEvent);

    expect(firstFocusableElement.focus).toHaveBeenCalled();
    expect(tabEvent.preventDefault).toHaveBeenCalled();
  });

  it('should focus last element on Shift+Tab when active element is first focusable', () => {
    const firstFocusableElement = jasmine.createSpyObj<HTMLElement>(
      'firstFocusableElement',
      ['focus']
    );
    const lastFocusableElement = jasmine.createSpyObj<HTMLElement>(
      'lastFocusableElement',
      ['focus']
    );
    const dialogElement = createMockDialog([
      firstFocusableElement,
      lastFocusableElement,
    ]);
    component['dialog'] = new ElementRef(dialogElement);
    spyOnProperty(document, 'activeElement', 'get').and.returnValue(
      firstFocusableElement
    );

    const shiftTabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      cancelable: true,
    });
    spyOn(shiftTabEvent, 'preventDefault');

    component.onDialogTab(shiftTabEvent);

    expect(lastFocusableElement.focus).toHaveBeenCalled();
    expect(shiftTabEvent.preventDefault).toHaveBeenCalled();
  });

  it('should focus last element on Shift+Tab when active element is the dialog', () => {
    const firstFocusableElement = jasmine.createSpyObj<HTMLElement>(
      'firstFocusableElement',
      ['focus']
    );
    const lastFocusableElement = jasmine.createSpyObj<HTMLElement>(
      'lastFocusableElement',
      ['focus']
    );
    const dialogElement = createMockDialog([
      firstFocusableElement,
      lastFocusableElement,
    ]);
    component['dialog'] = new ElementRef(dialogElement);
    spyOnProperty(document, 'activeElement', 'get').and.returnValue(
      dialogElement
    );

    const shiftTabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      cancelable: true,
    });
    spyOn(shiftTabEvent, 'preventDefault');

    component.onDialogTab(shiftTabEvent);

    expect(lastFocusableElement.focus).toHaveBeenCalled();
    expect(shiftTabEvent.preventDefault).toHaveBeenCalled();
  });

  it('should do nothing on Tab when dialog element is not set', () => {
    component['dialog'] = undefined!;

    const tabEvent = new KeyboardEvent('keydown', {key: 'Tab'});
    spyOn(tabEvent, 'preventDefault');

    component.onDialogTab(tabEvent);

    expect(tabEvent.preventDefault).not.toHaveBeenCalled();
  });

  it('should prevent default on Tab when no focusable elements exist', () => {
    component['dialog'] = new ElementRef(createMockDialog());

    const tabEvent = new KeyboardEvent('keydown', {key: 'Tab'});
    spyOn(tabEvent, 'preventDefault');

    component.onDialogTab(tabEvent);

    expect(tabEvent.preventDefault).toHaveBeenCalled();
  });

  it('should ignore non-Tab key in onDialogTab', () => {
    component['dialog'] = new ElementRef(createMockDialog());

    const enterEvent = new KeyboardEvent('keydown', {key: 'Enter'});
    spyOn(enterEvent, 'preventDefault');

    component.onDialogTab(enterEvent);

    expect(enterEvent.preventDefault).not.toHaveBeenCalled();
  });

  it('should emit cancel without restoring focus when no element was saved', () => {
    component['modalFocusRestoreElement'] = null;
    spyOn(component.cancel, 'emit');

    component.onCancel();

    expect(component.cancel.emit).toHaveBeenCalled();
    expect(component['modalFocusRestoreElement']).toBeNull();
  });
});
