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

    const titleElement = fixture.nativeElement.querySelector(
      '.arc-skip-confirmation-title'
    );
    const messageElement = fixture.nativeElement.querySelector(
      '.arc-skip-confirmation-message'
    );

    expect(titleElement.textContent).toContain(
      'I18N_TOPIC_VIEWER_ARC_SKIP_CONFIRMATION_TITLE'
    );
    expect(messageElement.textContent).toContain('Adventure 1 will be skipped');
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

  it('should emit cancel when the cancel button is clicked', () => {
    spyOn(component.cancel, 'emit');
    fixture.detectChanges();

    fixture.nativeElement
      .querySelector('.arc-skip-confirmation-cancel')
      .click();

    expect(component.cancel.emit).toHaveBeenCalled();
  });

  it('should emit cancel when the close button is clicked', () => {
    spyOn(component.cancel, 'emit');
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.arc-skip-confirmation-close').click();

    expect(component.cancel.emit).toHaveBeenCalled();
  });

  it('should emit confirm when the proceed button is clicked', () => {
    spyOn(component.confirm, 'emit');
    fixture.detectChanges();

    fixture.nativeElement
      .querySelector('.arc-skip-confirmation-proceed')
      .click();

    expect(component.confirm.emit).toHaveBeenCalled();
  });

  it('should emit cancel when the backdrop is clicked', () => {
    spyOn(component.cancel, 'emit');
    fixture.detectChanges();

    fixture.nativeElement
      .querySelector('.arc-skip-confirmation-modal-backdrop')
      .click();

    expect(component.cancel.emit).toHaveBeenCalled();
  });

  it('should not emit cancel when the dialog body is clicked', () => {
    spyOn(component.cancel, 'emit');
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.arc-skip-confirmation-modal').click();

    expect(component.cancel.emit).not.toHaveBeenCalled();
  });

  it('should emit cancel when Escape is pressed', () => {
    spyOn(component.cancel, 'emit');
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}));

    expect(component.cancel.emit).toHaveBeenCalled();
  });

  it('should ignore non-Escape keys', () => {
    spyOn(component.cancel, 'emit');
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter'}));

    expect(component.cancel.emit).not.toHaveBeenCalled();
  });

  it('should move focus into the dialog on init', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const dialogElement = fixture.nativeElement.querySelector(
      '.arc-skip-confirmation-modal'
    );
    expect(document.activeElement).toBe(dialogElement);
  }));

  it('should restore focus to the trigger element when cancelled', fakeAsync(() => {
    const triggerElement = document.createElement('button');
    document.body.appendChild(triggerElement);
    triggerElement.focus();

    fixture.detectChanges();
    tick();

    fixture.nativeElement
      .querySelector('.arc-skip-confirmation-cancel')
      .click();

    expect(document.activeElement).toBe(triggerElement);
    document.body.removeChild(triggerElement);
  }));

  it('should trap Tab focus within the dialog', () => {
    fixture.detectChanges();

    const dialogElement = fixture.nativeElement.querySelector(
      '.arc-skip-confirmation-modal'
    );
    const buttons = dialogElement.querySelectorAll('button');

    (buttons[buttons.length - 1] as HTMLElement).focus();
    dialogElement.dispatchEvent(
      new KeyboardEvent('keydown', {key: 'Tab', bubbles: true})
    );
    expect(document.activeElement).toBe(buttons[0]);

    (buttons[1] as HTMLElement).focus();
    dialogElement.dispatchEvent(
      new KeyboardEvent('keydown', {key: 'Tab', bubbles: true})
    );
    expect(document.activeElement).toBe(buttons[1]);

    (buttons[0] as HTMLElement).focus();
    dialogElement.dispatchEvent(
      new KeyboardEvent('keydown', {key: 'Tab', shiftKey: true, bubbles: true})
    );
    expect(document.activeElement).toBe(buttons[buttons.length - 1]);
  });

  it('should move focus to the last element on Shift+Tab when the dialog is focused', () => {
    fixture.detectChanges();

    const dialogElement = fixture.nativeElement.querySelector(
      '.arc-skip-confirmation-modal'
    );
    const buttons = dialogElement.querySelectorAll('button');

    dialogElement.focus();
    dialogElement.dispatchEvent(
      new KeyboardEvent('keydown', {key: 'Tab', shiftKey: true, bubbles: true})
    );

    expect(document.activeElement).toBe(buttons[buttons.length - 1]);
  });

  it('should prevent Tab navigation when the dialog has no focusable elements', () => {
    fixture.detectChanges();

    const dialogElement = fixture.nativeElement.querySelector(
      '.arc-skip-confirmation-modal'
    );
    dialogElement.querySelectorAll('button').forEach(button => button.remove());

    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      cancelable: true,
      bubbles: true,
    });
    dialogElement.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it('should do nothing on Tab when no dialog is rendered', () => {
    const event = new KeyboardEvent('keydown', {key: 'Tab', cancelable: true});

    component.onDialogTab(event);

    expect(event.defaultPrevented).toBe(false);
  });

  it('should do nothing when a non-Tab key is pressed on the dialog', () => {
    fixture.detectChanges();

    const dialogElement = fixture.nativeElement.querySelector(
      '.arc-skip-confirmation-modal'
    );
    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      cancelable: true,
    });
    dialogElement.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });
});
