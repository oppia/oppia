// Copyright 2026 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for TimeExpiredModalComponent.
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';

import {TimeExpiredModalComponent} from './time-expired-modal.component';
import {MockTranslatePipe} from 'tests/unit-test-utils';

describe('TimeExpiredModalComponent', () => {
  let component: TimeExpiredModalComponent;
  let fixture: ComponentFixture<TimeExpiredModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TimeExpiredModalComponent, MockTranslatePipe],
    }).compileComponents();

    fixture = TestBed.createComponent(TimeExpiredModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should expose dialog semantics with title and description references', () => {
    const card = fixture.debugElement.query(By.css('.assessment-modal-card'));
    const title = fixture.debugElement.query(
      By.css('#time-expired-modal-title')
    );
    const message = fixture.debugElement.query(
      By.css('#time-expired-modal-message')
    );

    expect(card.attributes.role).toBe('dialog');
    expect(card.attributes['aria-modal']).toBe('true');
    expect(card.attributes['aria-labelledby']).toBe('time-expired-modal-title');
    expect(card.attributes['aria-describedby']).toBe(
      'time-expired-modal-message'
    );
    expect(card.attributes.tabindex).toBe('-1');
    expect(title).toBeTruthy();
    expect(message).toBeTruthy();
  });

  it('should focus the modal card when the modal is initialized', () => {
    expect(document.activeElement).toBe(
      component.assessmentModalCard.nativeElement
    );
  });

  it('should restore focus to the previously focused element on destroy', () => {
    const triggerElement = document.createElement('button');
    document.body.appendChild(triggerElement);
    // Disabled dot-notation as previouslyFocusedElement is a private property
    // and hence cannot be accessed without this syntax.
    // eslint-disable-next-line dot-notation
    component['previouslyFocusedElement'] = triggerElement;

    component.ngOnDestroy();

    expect(document.activeElement).toBe(triggerElement);
    document.body.removeChild(triggerElement);
  });

  it('should not restore focus when no element was focused before', () => {
    // Disabled dot-notation as previouslyFocusedElement is a private property
    // and hence cannot be accessed without this syntax.
    // eslint-disable-next-line dot-notation
    component['previouslyFocusedElement'] = null;

    expect(() => component.ngOnDestroy()).not.toThrowError();
  });

  it('should wrap focus forward to the first element from the last', () => {
    const closeButton = fixture.debugElement.query(
      By.css('.assessment-modal-close-button')
    ).nativeElement as HTMLElement;
    const viewResultsButton = fixture.debugElement.query(
      By.css('.assessment-modal-action-button')
    ).nativeElement as HTMLElement;
    viewResultsButton.focus();
    const event = new KeyboardEvent('keydown', {key: 'Tab'});
    const preventDefaultSpy = spyOn(event, 'preventDefault');

    component.trapFocus(event);

    expect(document.activeElement).toBe(closeButton);
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should wrap focus backward to the last element from the first', () => {
    const closeButton = fixture.debugElement.query(
      By.css('.assessment-modal-close-button')
    ).nativeElement as HTMLElement;
    const viewResultsButton = fixture.debugElement.query(
      By.css('.assessment-modal-action-button')
    ).nativeElement as HTMLElement;
    closeButton.focus();
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
    });
    const preventDefaultSpy = spyOn(event, 'preventDefault');

    component.trapFocus(event);

    expect(document.activeElement).toBe(viewResultsButton);
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should not wrap focus when tabbing forward from a non-last element', () => {
    const closeButton = fixture.debugElement.query(
      By.css('.assessment-modal-close-button')
    ).nativeElement as HTMLElement;
    closeButton.focus();
    const event = new KeyboardEvent('keydown', {key: 'Tab'});

    component.trapFocus(event);

    expect(document.activeElement).toBe(closeButton);
  });

  it('should not wrap focus when tabbing backward from a non-first element', () => {
    const viewResultsButton = fixture.debugElement.query(
      By.css('.assessment-modal-action-button')
    ).nativeElement as HTMLElement;
    viewResultsButton.focus();
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
    });

    component.trapFocus(event);

    expect(document.activeElement).toBe(viewResultsButton);
  });

  it('should do nothing for non-Tab key events', () => {
    const closeButton = fixture.debugElement.query(
      By.css('.assessment-modal-close-button')
    ).nativeElement as HTMLElement;
    closeButton.focus();
    const event = new KeyboardEvent('keydown', {key: 'Enter'});

    component.trapFocus(event);

    expect(document.activeElement).toBe(closeButton);
  });

  it('should emit close when onClose is called', () => {
    spyOn(component.close, 'emit');

    component.onClose();

    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should emit close when the header close button is clicked', () => {
    spyOn(component.close, 'emit');
    const closeButton = fixture.debugElement.query(
      By.css('.assessment-modal-close-button')
    );

    closeButton.triggerEventHandler('click', null);

    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should emit viewResult when onViewResult is called', () => {
    spyOn(component.viewResult, 'emit');

    component.onViewResult();

    expect(component.viewResult.emit).toHaveBeenCalled();
  });

  it('should emit viewResult when the action button is clicked', () => {
    spyOn(component.viewResult, 'emit');
    const viewResultsButton = fixture.debugElement.query(
      By.css('.assessment-modal-action-button')
    );

    viewResultsButton.triggerEventHandler('click', null);

    expect(component.viewResult.emit).toHaveBeenCalled();
  });
});
