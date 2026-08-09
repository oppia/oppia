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
 * @fileoverview Unit tests for MyCertificatesTabComponent.
 */

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterTestingModule} from '@angular/router/testing';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {MyCertificatesTabComponent} from './my-certificates-tab.component';

describe('MyCertificatesTabComponent', () => {
  let component: MyCertificatesTabComponent;
  let fixture: ComponentFixture<MyCertificatesTabComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CommonModule, RouterTestingModule],
      declarations: [MyCertificatesTabComponent, MockTranslatePipe],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MyCertificatesTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display all stub attempts by default', () => {
    expect(component.filteredAttempts.length).toBe(3);
    expect(component.filteredAttempts[0].attempt_id).toBe('stub_attempt_id_1');
  });

  it('should filter attempts by passed status', () => {
    component.selectedFilter = 'passed';
    expect(component.filteredAttempts.length).toBe(2);
    expect(
      component.filteredAttempts.every(attempt => component.isPassed(attempt))
    ).toBeTrue();
  });

  it('should filter attempts by not passed status', () => {
    component.selectedFilter = 'not_passed';
    expect(component.filteredAttempts.length).toBe(1);
    expect(component.isPassed(component.filteredAttempts[0])).toBeFalse();
  });

  it('should update the selected filter on filter change', () => {
    const selectElement = fixture.nativeElement.querySelector(
      '#certificate-attempt-status-filter'
    );
    selectElement.value = 'passed';
    selectElement.dispatchEvent(new Event('change'));
    expect(component.selectedFilter).toBe('passed');
  });

  it('should derive the passed status from the score threshold', () => {
    expect(component.isPassed(component.certificateAttempts[0])).toBeTrue();
    expect(component.isPassed(component.certificateAttempts[2])).toBeFalse();
  });

  it('should map classroom ids to subject names', () => {
    expect(component.getSubject('math')).toBe(
      'I18N_LIBRARY_CATEGORIES_MATHEMATICS'
    );
    expect(component.getSubject('science')).toBe(
      'I18N_LIBRARY_CATEGORIES_SCIENCE'
    );
    expect(component.getSubject('unknown_id')).toBe('unknown_id');
  });

  it('should derive the status label i18n keys from the score', () => {
    expect(component.getStatusLabel(component.certificateAttempts[0])).toBe(
      'I18N_LEARNER_DASHBOARD_MY_CERTIFICATES_PASSED'
    );
    expect(component.getStatusLabel(component.certificateAttempts[2])).toBe(
      'I18N_LEARNER_DASHBOARD_MY_CERTIFICATES_NOT_PASSED'
    );
  });

  it('should render a link to the result page for each attempt', () => {
    const links = fixture.nativeElement.querySelectorAll(
      '.certificate-title-link'
    );
    expect(links.length).toBe(3);
    expect(links[0].getAttribute('href')).toBe(
      '/certificate-assessment-result/stub_attempt_id_1'
    );
    expect(links[1].getAttribute('href')).toBe(
      '/certificate-assessment-result/stub_attempt_id_2'
    );
  });
});
