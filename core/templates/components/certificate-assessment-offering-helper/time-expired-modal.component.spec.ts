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
import {NgbActiveModal, NgbModalModule} from '@ng-bootstrap/ng-bootstrap';

import {TimeExpiredModalComponent} from './time-expired-modal.component';
import {MockTranslatePipe} from 'tests/unit-test-utils';

describe('TimeExpiredModalComponent', () => {
  let component: TimeExpiredModalComponent;
  let fixture: ComponentFixture<TimeExpiredModalComponent>;
  let ngbActiveModal: NgbActiveModal;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgbModalModule],
      declarations: [TimeExpiredModalComponent, MockTranslatePipe],
      providers: [NgbActiveModal],
    }).compileComponents();

    fixture = TestBed.createComponent(TimeExpiredModalComponent);
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    fixture.detectChanges();
  });

  it('should render the title and message', () => {
    const title = fixture.debugElement.query(
      By.css('#time-expired-modal-title')
    );
    const message = fixture.debugElement.query(
      By.css('#time-expired-modal-message')
    );

    expect(title).toBeTruthy();
    expect(message).toBeTruthy();
  });

  it('should render the time-up icon as a standalone image', () => {
    const icon = fixture.debugElement.query(By.css('.assessment-modal-icon'));

    expect(icon).toBeTruthy();
    expect(icon.nativeElement.getAttribute('src')).toBe(
      '/assets/images/certificates/time-up-icon.svg'
    );
    expect(icon.nativeElement.getAttribute('alt')).toBe('');
  });

  it('should dismiss the modal when dismiss is called', () => {
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss');

    component.dismiss();

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

  it('should close the modal when viewResults is called', () => {
    const closeSpy = spyOn(ngbActiveModal, 'close');

    component.viewResults();

    expect(closeSpy).toHaveBeenCalled();
  });

  it('should close the modal when the action button is clicked', () => {
    const closeSpy = spyOn(ngbActiveModal, 'close');
    const viewResultsButton = fixture.debugElement.query(
      By.css('.assessment-modal-action-button')
    );

    viewResultsButton.triggerEventHandler('click', null);

    expect(closeSpy).toHaveBeenCalled();
  });
});
