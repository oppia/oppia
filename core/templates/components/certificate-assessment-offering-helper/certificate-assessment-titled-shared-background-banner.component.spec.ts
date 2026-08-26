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
 * @fileoverview Unit tests for
 * CertificateAssessmentTitledBackgroundBannerComponent.
 */

import {CommonModule} from '@angular/common';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA, Pipe, PipeTransform} from '@angular/core';

import {CertificateAssessmentTitledBackgroundBannerComponent} from './certificate-assessment-titled-shared-background-banner.component';

// Mock the 'translate' pipe used in the template so the TestBed can compile
// the component without pulling in the real i18n/translate module.
@Pipe({name: 'translate'})
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return `translated:${value}`;
  }
}

describe('CertificateAssessmentTitledBackgroundBannerComponent', () => {
  let component: CertificateAssessmentTitledBackgroundBannerComponent;
  let fixture: ComponentFixture<CertificateAssessmentTitledBackgroundBannerComponent>;

  const EXIT_BUTTON_KEY = 'I18N_CERTIFICATE_ASSESSMENT_EXIT_BUTTON';
  const BACK_BUTTON_KEY = 'I18N_CERTIFICATE_ASSESSMENT_BACK_BUTTON';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [
        CertificateAssessmentTitledBackgroundBannerComponent,
        MockTranslatePipe,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(
      CertificateAssessmentTitledBackgroundBannerComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should default title to an empty string', () => {
    expect(component.title).toBe('');
  });

  it('should allow title to be set via input binding', () => {
    component.title = 'I18N_CERTIFICATE_ASSESSMENT_TITLE';

    expect(component.title).toBe('I18N_CERTIFICATE_ASSESSMENT_TITLE');
  });

  it('should default buttonText to the exit button i18n key', () => {
    expect(component.buttonText).toBe(EXIT_BUTTON_KEY);
  });

  it('should allow buttonText to be overridden with the back button i18n key', () => {
    component.buttonText = BACK_BUTTON_KEY;

    expect(component.buttonText).toBe(BACK_BUTTON_KEY);
  });

  it('should allow buttonText to be set to an arbitrary i18n key', () => {
    component.buttonText = 'I18N_SOME_OTHER_BUTTON';

    expect(component.buttonText).toBe('I18N_SOME_OTHER_BUTTON');
  });

  it('should default buttonRoute to an empty array', () => {
    expect(component.buttonRoute).toEqual([]);
  });

  it('should allow buttonRoute to be set via input binding', () => {
    component.buttonRoute = ['/learn', 'math'];

    expect(component.buttonRoute).toEqual(['/learn', 'math']);
  });

  it('should render translated button text and aria-label', () => {
    component.buttonText = BACK_BUTTON_KEY;
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button');

    expect(button.textContent.trim()).toBe(`TRANSLATED:${BACK_BUTTON_KEY}`);
    expect(button.getAttribute('aria-label')).toBe(
      `TRANSLATED:${BACK_BUTTON_KEY}`
    );
  });
});
