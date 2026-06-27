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
 * @fileoverview Unit tests for ertificate offering available page component.
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {RouterTestingModule} from '@angular/router/testing';
import {AvailableCertificateOfferingPageComponent} from './certificate-offering-available-page.component';

describe('AvailableCertificateOfferingPageComponent', () => {
  let component: AvailableCertificateOfferingPageComponent;
  let fixture: ComponentFixture<AvailableCertificateOfferingPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [AvailableCertificateOfferingPageComponent],
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

    expect(
      fixture.nativeElement
        .querySelector(
          '.oppia-certificate-offering-available-page__actions .btn.btn-primary'
        )
        .textContent.trim()
    ).toBe('Continue to assessment');
    expect(
      fixture.nativeElement
        .querySelector('.oppia-certificate-offering-available-page__panel h1')
        .textContent.trim()
    ).toBe('Available certificate offering');
  });
});
