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

import {Pipe, PipeTransform} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {NgbActiveModal, NgbModalModule} from '@ng-bootstrap/ng-bootstrap';

import {UnansweredQuestionModalComponent} from './unanswered-question-modal.component';

@Pipe({name: 'translate'})
class MockTranslatePipe implements PipeTransform {
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
  let ngbActiveModal: NgbActiveModal;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgbModalModule],
      declarations: [UnansweredQuestionModalComponent, MockTranslatePipe],
      providers: [NgbActiveModal],
    }).compileComponents();

    fixture = TestBed.createComponent(UnansweredQuestionModalComponent);
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    fixture.detectChanges();
  });

  it('should render the title and message', () => {
    const title = fixture.debugElement.query(
      By.css('#unanswered-question-modal-title')
    );
    const message = fixture.debugElement.query(
      By.css('#unanswered-question-modal-message')
    );

    expect(title).toBeTruthy();
    expect(message).toBeTruthy();
  });

  it('should render the unanswered warning icon as a standalone image', () => {
    const icon = fixture.debugElement.query(By.css('.assessment-modal-icon'));

    expect(icon).toBeTruthy();
    expect(icon.nativeElement.getAttribute('src')).toBe(
      '/assets/images/certificates/unanswered-warning-icon.svg'
    );
    expect(icon.nativeElement.getAttribute('alt')).toBe('');
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

  it('should dismiss the modal when goBackToAssessment is called', () => {
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss');

    component.goBackToAssessment();

    expect(dismissSpy).toHaveBeenCalled();
  });

  it('should dismiss the modal when the header close button is clicked', () => {
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss');
    const closeButton = fixture.debugElement.query(
      By.css('.assessment-modal-close-button')
    );

    closeButton.triggerEventHandler('click', null);

    expect(dismissSpy).toHaveBeenCalled();
  });

  it('should dismiss the modal when the inline go-back button is clicked', () => {
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss');
    const goBackButton = fixture.debugElement.query(
      By.css('.assessment-modal-inline-key')
    );

    goBackButton.triggerEventHandler('click', null);

    expect(dismissSpy).toHaveBeenCalled();
  });

  it('should close the modal when submitAnyway is called', () => {
    const closeSpy = spyOn(ngbActiveModal, 'close');

    component.submitAnyway();

    expect(closeSpy).toHaveBeenCalled();
  });

  it('should close the modal when the submit button is clicked', () => {
    const closeSpy = spyOn(ngbActiveModal, 'close');
    const submitButton = fixture.debugElement.query(
      By.css('.assessment-modal-action-button')
    );

    submitButton.triggerEventHandler('click', null);

    expect(closeSpy).toHaveBeenCalled();
  });
});
