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

    expect(buttons.includes('Continue to assessment')).toBe(true);
    expect(
      fixture.nativeElement.querySelector('h1[tabindex="0"]').textContent.trim()
    ).toBe('Available certificate offering');
  });

  it('should link assessment buttons to the certificate assessment page', () => {
    fixture.detectChanges();

    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button')
    ) as HTMLButtonElement[];

    const assessmentButtons = buttons.filter(b =>
      ['Continue to assessment', 'Retry assessment'].includes(
        b.textContent?.trim() || ''
      )
    );

    expect(assessmentButtons.length).toBe(2);
    assessmentButtons.forEach(button => {
      expect(button.getAttribute('ng-reflect-router-link')).toContain(
        '/certificate-assessment'
      );
    });
  });
});
