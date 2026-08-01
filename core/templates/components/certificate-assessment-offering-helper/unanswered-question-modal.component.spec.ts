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
 * @fileoverview Unit tests for UnansweredQuestionModalComponent.
 */

import {Pipe} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';

import {UnansweredQuestionModalComponent} from './unanswered-question-modal.component';

@Pipe({name: 'translate'})
class MockTranslatePipe {
  transform(
    value: string,
    params?: {unansweredQuestionCount?: number}
  ): string {
    if (params && params.unansweredQuestionCount !== undefined) {
      return `${value}: ${params.unansweredQuestionCount}`;
    }
    return value;
  }
}

describe('UnansweredQuestionModalComponent', () => {
  let component: UnansweredQuestionModalComponent;
  let fixture: ComponentFixture<UnansweredQuestionModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UnansweredQuestionModalComponent, MockTranslatePipe],
    }).compileComponents();

    fixture = TestBed.createComponent(UnansweredQuestionModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should expose dialog semantics with title and description references', () => {
    const card = fixture.debugElement.query(By.css('.assessment-modal-card'));
    const title = fixture.debugElement.query(
      By.css('#unanswered-question-modal-title')
    );
    const message = fixture.debugElement.query(
      By.css('#unanswered-question-modal-message')
    );

    expect(card.attributes['role']).toBe('dialog');
    expect(card.attributes['aria-modal']).toBe('true');
    expect(card.attributes['aria-labelledby']).toBe(
      'unanswered-question-modal-title'
    );
    expect(card.attributes['aria-describedby']).toBe(
      'unanswered-question-modal-message'
    );
    expect(card.attributes['tabindex']).toBe('-1');
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
    component['previouslyFocusedElement'] = triggerElement;

    component.ngOnDestroy();

    expect(document.activeElement).toBe(triggerElement);
    document.body.removeChild(triggerElement);
  });

  it('should not restore focus when no element was focused before', () => {
    component['previouslyFocusedElement'] = null;

    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('should wrap focus forward to the first element from the last', () => {
    const closeButton = fixture.debugElement.query(
      By.css('.assessment-modal-close-button')
    ).nativeElement as HTMLElement;
    const submitButton = fixture.debugElement.query(
      By.css('.assessment-modal-action-button')
    ).nativeElement as HTMLElement;
    submitButton.focus();
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
    const submitButton = fixture.debugElement.query(
      By.css('.assessment-modal-action-button')
    ).nativeElement as HTMLElement;
    closeButton.focus();
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
    });
    const preventDefaultSpy = spyOn(event, 'preventDefault');

    component.trapFocus(event);

    expect(document.activeElement).toBe(submitButton);
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should not wrap focus when tabbing forward from a middle element', () => {
    const goBackButton = fixture.debugElement.query(
      By.css('.assessment-modal-inline-key')
    ).nativeElement as HTMLElement;
    goBackButton.focus();
    const event = new KeyboardEvent('keydown', {key: 'Tab'});

    component.trapFocus(event);

    expect(document.activeElement).toBe(goBackButton);
  });

  it('should not wrap focus when tabbing backward from a middle element', () => {
    const goBackButton = fixture.debugElement.query(
      By.css('.assessment-modal-inline-key')
    ).nativeElement as HTMLElement;
    goBackButton.focus();
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
    });

    component.trapFocus(event);

    expect(document.activeElement).toBe(goBackButton);
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

  it('should emit submitAnyway when onSubmitAnyway is called', () => {
    spyOn(component.submitAnyway, 'emit');

    component.onSubmitAnyway();

    expect(component.submitAnyway.emit).toHaveBeenCalled();
  });

  it('should emit goBackToAssessment when onGoBackToAssessment is called', () => {
    spyOn(component.goBackToAssessment, 'emit');

    component.onGoBackToAssessment();

    expect(component.goBackToAssessment.emit).toHaveBeenCalled();
  });

  it('should emit goBackToAssessment when the header close button is clicked', () => {
    spyOn(component.goBackToAssessment, 'emit');
    const closeButton = fixture.debugElement.query(
      By.css('.assessment-modal-close-button')
    );

    closeButton.triggerEventHandler('click', null);

    expect(component.goBackToAssessment.emit).toHaveBeenCalled();
  });

  it('should emit goBackToAssessment when the inline go-back button is clicked', () => {
    spyOn(component.goBackToAssessment, 'emit');
    const goBackButton = fixture.debugElement.query(
      By.css('.assessment-modal-inline-key')
    );

    goBackButton.triggerEventHandler('click', null);

    expect(component.goBackToAssessment.emit).toHaveBeenCalled();
  });

  it('should emit submitAnyway when the submit button is clicked', () => {
    spyOn(component.submitAnyway, 'emit');
    const submitButton = fixture.debugElement.query(
      By.css('.assessment-modal-action-button')
    );

    submitButton.triggerEventHandler('click', null);

    expect(component.submitAnyway.emit).toHaveBeenCalled();
  });

  it('should render the unanswered question count provided via the input', () => {
    let message = fixture.debugElement.query(
      By.css('#unanswered-question-modal-message')
    );
    expect(message.nativeElement.textContent).toContain('3');

    component.unansweredQuestionCount = 5;
    fixture.detectChanges();
    message = fixture.debugElement.query(
      By.css('#unanswered-question-modal-message')
    );
    expect(message.nativeElement.textContent).toContain('5');
  });
});
