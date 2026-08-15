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
 * @fileoverview Unit tests for AdventureMasteredModalComponent.
 */

import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  waitForAsync,
} from '@angular/core/testing';

import {MockTranslatePipe} from 'tests/unit-test-utils';

import {AdventureMasteredModalComponent} from './adventure-mastered-modal.component';

describe('AdventureMasteredModalComponent', () => {
  let component: AdventureMasteredModalComponent;
  let fixture: ComponentFixture<AdventureMasteredModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AdventureMasteredModalComponent, MockTranslatePipe],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdventureMasteredModalComponent);
    component = fixture.componentInstance;
    component.title = 'Adventure 1 mastered';
    component.message = 'You have completed all lessons in this adventure';
  });

  it('should render the title, message and translated continue button', () => {
    fixture.detectChanges();

    expect(
      fixture.nativeElement
        .querySelector('.adventure-mastered-title')
        .textContent.trim()
    ).toBe('Adventure 1 mastered');
    expect(
      fixture.nativeElement
        .querySelector('.adventure-mastered-message')
        .textContent.trim()
    ).toBe('You have completed all lessons in this adventure');
    expect(
      fixture.nativeElement
        .querySelector('.adventure-mastered-continue')
        .textContent.trim()
    ).toBe('I18N_TOPIC_VIEWER_ADVENTURE_MASTERED_CONTINUE_BUTTON');
  });

  it('should emit continue when onContinue is called', () => {
    spyOn(component.continue, 'emit');

    component.onContinue();

    expect(component.continue.emit).toHaveBeenCalled();
  });

  it('should emit continue when Escape is pressed', () => {
    spyOn(component.continue, 'emit');

    component.onDocumentKeydown(new KeyboardEvent('keydown', {key: 'Escape'}));

    expect(component.continue.emit).toHaveBeenCalled();
  });

  it('should ignore non-Escape keys', () => {
    spyOn(component.continue, 'emit');

    component.onDocumentKeydown(new KeyboardEvent('keydown', {key: 'Enter'}));

    expect(component.continue.emit).not.toHaveBeenCalled();
  });

  it('should move focus into the dialog on init', fakeAsync(() => {
    fixture.detectChanges();
    const dialogElement = fixture.nativeElement.querySelector(
      '.adventure-mastered-modal'
    );
    spyOn(dialogElement, 'focus');

    tick();

    expect(dialogElement.focus).toHaveBeenCalled();
  }));

  it('should restore focus to the element that opened the modal on continue', () => {
    const triggerElement = document.createElement('button');
    document.body.appendChild(triggerElement);
    triggerElement.focus();
    spyOn(triggerElement, 'focus');

    fixture.detectChanges();
    component.onContinue();

    expect(triggerElement.focus).toHaveBeenCalled();
    document.body.removeChild(triggerElement);
  });

  it('should move focus to the first focusable element on Tab from the last one', () => {
    fixture.detectChanges();

    const dialogElement = fixture.nativeElement.querySelector(
      '.adventure-mastered-modal'
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
      '.adventure-mastered-modal'
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

  it('should prevent Tab navigation when the dialog has no focusable elements', () => {
    fixture.detectChanges();

    const dialogElement = fixture.nativeElement.querySelector(
      '.adventure-mastered-modal'
    );
    dialogElement.querySelectorAll('button').forEach(button => button.remove());

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
