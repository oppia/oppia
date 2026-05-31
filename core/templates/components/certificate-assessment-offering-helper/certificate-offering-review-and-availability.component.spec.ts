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
 * @fileoverview Unit tests for CertificateOfferingReviewAndAvailabilityComponent.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';

import {CertificateOfferingReviewAndAvailabilityComponent} from './certificate-offering-review-and-availability.component';
import {CertificateAssessmentOfferingData} from 'domain/certificate-assessment/certificate-assessment-offering.model';

describe('Certificate Offering Review And Availability Component', () => {
  let component: CertificateOfferingReviewAndAvailabilityComponent;
  let fixture: ComponentFixture<CertificateOfferingReviewAndAvailabilityComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CertificateOfferingReviewAndAvailabilityComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      CertificateOfferingReviewAndAvailabilityComponent
    );
    component = fixture.componentInstance;
    component.certificateAssessmentOffering =
      CertificateAssessmentOfferingData.createEmpty();
    fixture.detectChanges();
  });

  it('should get correct save button text depending on mode', () => {
    component.isEditMode = false;
    expect(component.getSaveButtonText()).toEqual('Save Certificate');

    component.isEditMode = true;
    expect(component.getSaveButtonText()).toEqual('Update Certificate');
  });

  it('should emit save event when clicking save button', () => {
    const saveSpy = spyOn(component.saveCertificateOffering, 'emit');

    component.onSaveClicked();

    expect(saveSpy).toHaveBeenCalled();
  });

  it('should emit back navigation event when clicking back button', () => {
    const navigateSpy = spyOn(component.navigateToAddTopicsSection, 'emit');

    component.onBackClicked();

    expect(navigateSpy).toHaveBeenCalled();
  });
});
