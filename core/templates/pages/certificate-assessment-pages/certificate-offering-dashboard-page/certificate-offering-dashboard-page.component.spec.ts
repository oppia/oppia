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
 * @fileoverview Unit tests for CertificateOfferingDashboardPageComponent.
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {CertificateOfferingDashboardPageComponent} from './certificate-offering-dashboard-page.component';

describe('CertificateOfferingDashboardPageComponent', () => {
  let component: CertificateOfferingDashboardPageComponent;
  let fixture: ComponentFixture<CertificateOfferingDashboardPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CertificateOfferingDashboardPageComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(
      CertificateOfferingDashboardPageComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component instance', () => {
    expect(component instanceof CertificateOfferingDashboardPageComponent).toBe(
      true
    );
  });
});
