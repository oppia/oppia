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
 * @fileoverview Unit tests for certificate offering available page component.
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {RouterTestingModule} from '@angular/router/testing';
import {AvailableCertificateOfferingPageComponent} from './certificate-offering-available-page.component';
import {NO_ERRORS_SCHEMA} from '@angular/core';

describe('AvailableCertificateOfferingPageComponent', () => {
  let component: AvailableCertificateOfferingPageComponent;
  let fixture: ComponentFixture<AvailableCertificateOfferingPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [AvailableCertificateOfferingPageComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(
      AvailableCertificateOfferingPageComponent
    );
    component = fixture.componentInstance;
    component.classroomUrlFragment = 'math';
  });

  it('should render the certificate offering content', () => {
    fixture.detectChanges();

    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button')
    ).map(button => (button as HTMLButtonElement).textContent?.trim() || '');

    expect(buttons.includes('Continue to Assessment')).toBe(true);
    expect(
      fixture.nativeElement.querySelector('h1[tabindex="0"]').textContent.trim()
    ).toBe('Certificate Assessment');
  });

  it('should render a tile for each available certificate', () => {
    fixture.detectChanges();
    const tiles = fixture.nativeElement.querySelectorAll(
      '.oppia-certificate-offering-available-page-tile'
    );
    expect(tiles.length).toBe(component.availableCertificates.length);
  });

  it('should show the correct status label and date for each certificate', () => {
    fixture.detectChanges();
    const statusEls = Array.from(
      fixture.nativeElement.querySelectorAll(
        '.oppia-certificate-offering-available-page-status'
      )
    ).map(el => (el as HTMLElement).textContent?.trim());

    expect(statusEls).toEqual(['Passed', 'Not Attempted', 'Not Passed']);

    const dateEls = Array.from(
      fixture.nativeElement.querySelectorAll(
        '.oppia-certificate-offering-available-page-status-date'
      )
    ).map(el => (el as HTMLElement).textContent?.trim());

    expect(dateEls).toEqual([
      'Passed on Jan 16, 2026',
      'Failed on Feb 2, 2026',
    ]);
  });

  it('should link assessment buttons to the certificate assessment page', () => {
    fixture.detectChanges();
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button')
    ) as HTMLButtonElement[];
    const assessmentButtons = buttons.filter(b =>
      ['Continue to Assessment', 'Retry Assessment'].includes(
        b.textContent?.trim() || ''
      )
    );

    expect(assessmentButtons.length).toBe(
      component.availableCertificates.length
    );
    assessmentButtons.forEach(button => {
      expect(button.getAttribute('ng-reflect-router-link')).toContain(
        '/certificate-assessment'
      );
    });
  });

  it('should show a Check Score button for passed and failed certificates', () => {
    fixture.detectChanges();
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button')
    ) as HTMLButtonElement[];
    const checkScoreButtons = buttons.filter(
      b => b.textContent?.trim() === 'Check Score'
    );
    const passedOrFailedCount = component.availableCertificates.filter(
      c => c.status === 'passed' || c.status === 'failed'
    ).length;

    expect(checkScoreButtons.length).toBe(passedOrFailedCount);
  });

  it('should route the Exit button to the classroom page', () => {
    fixture.detectChanges();
    const exitButton = fixture.nativeElement.querySelector(
      '.oppia-certificate-offering-available-page-exit-button'
    ) as HTMLButtonElement;

    expect(exitButton.textContent?.trim()).toBe('Exit');
    expect(exitButton.getAttribute('ng-reflect-router-link')).toContain('math');
  });

  it('should build the certificate assessment route with the certificate id', () => {
    expect(component.getCertificateAssessmentRoute('some_cert_id')).toEqual([
      '/certificate-assessment',
      'some_cert_id',
    ]);
  });
});
