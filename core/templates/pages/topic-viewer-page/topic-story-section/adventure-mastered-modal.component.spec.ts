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
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {ElementRef} from '@angular/core';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import {MockTranslatePipe} from 'tests/unit-test-utils';

import {AdventureMasteredModalComponent} from './adventure-mastered-modal.component';

describe('AdventureMasteredModalComponent', () => {
  let component: AdventureMasteredModalComponent;
  let fixture: ComponentFixture<AdventureMasteredModalComponent>;
  let ngbActiveModal: jasmine.SpyObj<NgbActiveModal>;

  const createMockDialog = (
    focusableElements: HTMLElement[] = []
  ): HTMLElement => {
    const dialogElement = document.createElement('div');
    spyOn(dialogElement, 'focus');
    focusableElements.forEach(element => dialogElement.appendChild(element));
    return dialogElement;
  };

  const createMockFocusableElement = (): HTMLElement => {
    const element = document.createElement('button');
    spyOn(element, 'focus');
    return element;
  };

  beforeEach(waitForAsync(() => {
    ngbActiveModal = jasmine.createSpyObj('NgbActiveModal', [
      'close',
      'dismiss',
    ]);

    TestBed.configureTestingModule({
      declarations: [AdventureMasteredModalComponent, MockTranslatePipe],
      providers: [{provide: NgbActiveModal, useValue: ngbActiveModal}],
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

  it('should close the modal when onContinue is called', () => {
    component.onContinue();

    expect(ngbActiveModal.close).toHaveBeenCalled();
  });

  it('should close the modal when Escape is pressed', () => {
    component.onDocumentKeydown(new KeyboardEvent('keydown', {key: 'Escape'}));

    expect(ngbActiveModal.close).toHaveBeenCalled();
  });

  it('should ignore non-Escape keys', () => {
    component.onDocumentKeydown(new KeyboardEvent('keydown', {key: 'Enter'}));

    expect(ngbActiveModal.close).not.toHaveBeenCalled();
  });

  it('should move focus into the dialog on init', fakeAsync(() => {
    const previouslyFocusedElement = jasmine.createSpyObj<HTMLElement>(
      'previouslyFocusedElement',
      ['focus']
    );
    const dialogElement = createMockDialog();
    spyOnProperty(document, 'activeElement', 'get').and.returnValue(
      previouslyFocusedElement
    );
    Reflect.set(component, 'dialog', new ElementRef(dialogElement));

    component.ngOnInit();
    tick(0);

    expect(dialogElement.focus).toHaveBeenCalled();
    expect(Reflect.get(component, 'modalFocusRestoreElement')).toBe(
      previouslyFocusedElement
    );
  }));

  it('should restore focus to the element that opened the modal on continue', () => {
    const previouslyFocusedElement = jasmine.createSpyObj<HTMLElement>(
      'previouslyFocusedElement',
      ['focus']
    );
    Reflect.set(
      component,
      'modalFocusRestoreElement',
      previouslyFocusedElement
    );

    component.onContinue();

    expect(previouslyFocusedElement.focus).toHaveBeenCalled();
    expect(Reflect.get(component, 'modalFocusRestoreElement')).toBeNull();
  });

  it('should move focus to the first focusable element on Tab from the last one', () => {
    const firstFocusableElement = createMockFocusableElement();
    const lastFocusableElement = createMockFocusableElement();
    const dialogElement = createMockDialog([
      firstFocusableElement,
      lastFocusableElement,
    ]);
    Reflect.set(component, 'dialog', new ElementRef(dialogElement));
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

  it('should move focus to the last focusable element on Shift+Tab from the first one', () => {
    const firstFocusableElement = createMockFocusableElement();
    const lastFocusableElement = createMockFocusableElement();
    const dialogElement = createMockDialog([
      firstFocusableElement,
      lastFocusableElement,
    ]);
    Reflect.set(component, 'dialog', new ElementRef(dialogElement));
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

  it('should move focus to the last focusable element on Shift+Tab when the dialog is focused', () => {
    const firstFocusableElement = createMockFocusableElement();
    const lastFocusableElement = createMockFocusableElement();
    const dialogElement = createMockDialog([
      firstFocusableElement,
      lastFocusableElement,
    ]);
    Reflect.set(component, 'dialog', new ElementRef(dialogElement));
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

  it('should do nothing on Tab when no dialog is rendered', () => {
    Reflect.deleteProperty(component, 'dialog');

    const tabEvent = new KeyboardEvent('keydown', {key: 'Tab'});
    spyOn(tabEvent, 'preventDefault');

    component.onDialogTab(tabEvent);

    expect(tabEvent.preventDefault).not.toHaveBeenCalled();
  });

  it('should prevent Tab navigation when the dialog has no focusable elements', () => {
    Reflect.set(component, 'dialog', new ElementRef(createMockDialog()));

    const tabEvent = new KeyboardEvent('keydown', {key: 'Tab'});
    spyOn(tabEvent, 'preventDefault');

    component.onDialogTab(tabEvent);

    expect(tabEvent.preventDefault).toHaveBeenCalled();
  });

  it('should do nothing when a non-Tab key is pressed on the dialog', () => {
    Reflect.set(component, 'dialog', new ElementRef(createMockDialog()));

    const enterEvent = new KeyboardEvent('keydown', {key: 'Enter'});
    spyOn(enterEvent, 'preventDefault');

    component.onDialogTab(enterEvent);

    expect(enterEvent.preventDefault).not.toHaveBeenCalled();
  });

  it('should close the modal without restoring focus when no element was saved', () => {
    Reflect.set(component, 'modalFocusRestoreElement', null);

    component.onContinue();

    expect(ngbActiveModal.close).toHaveBeenCalled();
    expect(Reflect.get(component, 'modalFocusRestoreElement')).toBeNull();
  });

  it('should dismiss the modal when cancel is called without bottomSheetRef', () => {
    component.cancel();

    expect(ngbActiveModal.dismiss).toHaveBeenCalledWith('cancel');
  });

  describe('when opened as MatBottomSheet', () => {
    let bottomSheetRef: jasmine.SpyObj<
      MatBottomSheetRef<AdventureMasteredModalComponent>
    >;

    beforeEach(waitForAsync(() => {
      bottomSheetRef = jasmine.createSpyObj('MatBottomSheetRef', ['dismiss']);

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        declarations: [AdventureMasteredModalComponent, MockTranslatePipe],
        providers: [
          {provide: NgbActiveModal, useValue: ngbActiveModal},
          {provide: MatBottomSheetRef, useValue: bottomSheetRef},
          {
            provide: MAT_BOTTOM_SHEET_DATA,
            useValue: {
              title: 'Adventure 1 mastered',
              message: 'You have completed all lessons',
            },
          },
        ],
      }).compileComponents();
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(AdventureMasteredModalComponent);
      component = fixture.componentInstance;
    });

    it('should read data from MAT_BOTTOM_SHEET_DATA', () => {
      expect(component.title).toBe('Adventure 1 mastered');
      expect(component.message).toBe('You have completed all lessons');
    });

    it('should dismiss the bottom sheet on confirm', () => {
      component.onContinue();

      expect(bottomSheetRef.dismiss).toHaveBeenCalledWith('confirm');
    });

    it('should dismiss the bottom sheet on cancel', () => {
      component.cancel();

      expect(bottomSheetRef.dismiss).toHaveBeenCalledWith('cancel');
    });
  });
});
