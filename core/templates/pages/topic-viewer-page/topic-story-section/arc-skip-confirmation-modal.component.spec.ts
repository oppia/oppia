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
  TestBed,
  fakeAsync,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {By} from '@angular/platform-browser';

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

  it('should render the adventure label, confirmation message and translated texts', () => {
    fixture.detectChanges();

    expect(
      fixture.nativeElement
        .querySelector('.arc-skip-confirmation-title')
        .textContent.trim()
    ).toBe('I18N_TOPIC_VIEWER_ARC_SKIP_CONFIRMATION_TITLE');
    expect(
      fixture.nativeElement
        .querySelector('.arc-skip-confirmation-message')
        .textContent.trim()
    ).toBe('Adventure 1 will be skipped');
    expect(
      fixture.nativeElement
        .querySelector('.arc-skip-confirmation-cancel')
        .textContent.trim()
    ).toBe('I18N_MODAL_CANCEL_BUTTON');
    expect(
      fixture.nativeElement
        .querySelector('.arc-skip-confirmation-proceed')
        .textContent.trim()
    ).toBe('I18N_MODAL_CONTINUE_BUTTON');
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

  it('should stop click propagation when the dialog body is clicked', () => {
    fixture.detectChanges();

    const event = new Event('click');
    spyOn(event, 'stopPropagation');
    fixture.debugElement
      .query(By.css('.arc-skip-confirmation-modal'))
      .triggerEventHandler('click', event);

    expect(event.stopPropagation).toHaveBeenCalled();
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

  it('should move focus into the dialog on init', fakeAsync(() => {
    fixture.detectChanges();
    const dialogElement = fixture.nativeElement.querySelector(
      '.arc-skip-confirmation-modal'
    );
    spyOn(dialogElement, 'focus');

    tick();

    expect(dialogElement.focus).toHaveBeenCalled();
  }));

  it('should restore focus to the element that opened the modal on cancel', () => {
    const triggerElement = document.createElement('button');
    document.body.appendChild(triggerElement);
    triggerElement.focus();
    spyOn(triggerElement, 'focus');

    fixture.detectChanges();
    component.onCancel();

    expect(triggerElement.focus).toHaveBeenCalled();
    document.body.removeChild(triggerElement);
  });

  it('should move focus to the first focusable element on Tab from the last one', () => {
    fixture.detectChanges();

    const dialogElement = fixture.nativeElement.querySelector(
      '.arc-skip-confirmation-modal'
    );
    const buttons = dialogElement.querySelectorAll('button');
    const firstButton = buttons[0] as HTMLElement;
    (buttons[buttons.length - 1] as HTMLElement).focus();
    spyOn(firstButton, 'focus');

    component.onDialogTab(new KeyboardEvent('keydown', {key: 'Tab'}));

    expect(firstButton.focus).toHaveBeenCalled();
  });

  it('should move focus to the last focusable element on Shift+Tab from the first one', () => {
    fixture.detectChanges();

    const dialogElement = fixture.nativeElement.querySelector(
      '.arc-skip-confirmation-modal'
    );
    const buttons = dialogElement.querySelectorAll('button');
    const lastButton = buttons[buttons.length - 1] as HTMLElement;
    (buttons[0] as HTMLElement).focus();
    spyOn(lastButton, 'focus');

    component.onDialogTab(
      new KeyboardEvent('keydown', {key: 'Tab', shiftKey: true})
    );

    expect(lastButton.focus).toHaveBeenCalled();
  });

  it('should move focus to the last focusable element on Shift+Tab when the dialog is focused', () => {
    fixture.detectChanges();

    const dialogElement = fixture.nativeElement.querySelector(
      '.arc-skip-confirmation-modal'
    );
    const buttons = dialogElement.querySelectorAll('button');
    const lastButton = buttons[buttons.length - 1] as HTMLElement;
    dialogElement.focus();
    spyOn(lastButton, 'focus');

    component.onDialogTab(
      new KeyboardEvent('keydown', {key: 'Tab', shiftKey: true})
    );

    expect(lastButton.focus).toHaveBeenCalled();
  });

  it('should prevent Tab navigation when the dialog has no focusable elements', () => {
    fixture.detectChanges();

    const dialogElement = fixture.nativeElement.querySelector(
      '.arc-skip-confirmation-modal'
    );
    dialogElement
      .querySelectorAll('button')
      .forEach((button: HTMLElement) => button.remove());

    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      cancelable: true,
    });
    component.onDialogTab(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it('should do nothing on Tab when no dialog is rendered', () => {
    const event = new KeyboardEvent('keydown', {key: 'Tab', cancelable: true});

    component.onDialogTab(event);

    expect(event.defaultPrevented).toBe(false);
  });

  it('should do nothing when a non-Tab key is pressed on the dialog', () => {
    fixture.detectChanges();

    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      cancelable: true,
    });
    component.onDialogTab(event);

    expect(event.defaultPrevented).toBe(false);
  });
});
