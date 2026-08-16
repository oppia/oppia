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
 * @fileoverview Unit tests for CertificateOfferingProgressComponent.
 */

import {NO_ERRORS_SCHEMA, SimpleChange} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';

import {CertificateOfferingProgressComponent} from './certificate-offering-progress.component';
import {CERTIFICATE_OFFERING_SECTION_IDS} from './certificate-offering-section.model';

describe('Certificate Offering Progress Component', () => {
  let component: CertificateOfferingProgressComponent;
  let fixture: ComponentFixture<CertificateOfferingProgressComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CertificateOfferingProgressComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CertificateOfferingProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should return the correct furthest reached section number', () => {
    component.activeSection = CERTIFICATE_OFFERING_SECTION_IDS.DETAILS;
    expect(component.getFurthestReachedSectionNumber()).toEqual(1);

    component.activeSection = CERTIFICATE_OFFERING_SECTION_IDS.ADD_TOPIC_ITEMS;
    expect(component.getFurthestReachedSectionNumber()).toEqual(2);

    component.activeSection =
      CERTIFICATE_OFFERING_SECTION_IDS.REVIEW_AND_AVAILABILITY;
    expect(component.getFurthestReachedSectionNumber()).toEqual(3);
  });

  it('should return correct progress tab classes for each section', () => {
    component.activeSection = CERTIFICATE_OFFERING_SECTION_IDS.DETAILS;
    expect(component.getProgressTabStatusClass(1)).toEqual('active');
    expect(component.getProgressTabStatusClass(2)).toEqual('incomplete');
    expect(component.getProgressTabStatusClass(3)).toEqual('incomplete');

    component.activeSection = CERTIFICATE_OFFERING_SECTION_IDS.ADD_TOPIC_ITEMS;
    expect(component.getProgressTabStatusClass(1)).toEqual('completed');
    expect(component.getProgressTabStatusClass(2)).toEqual('active');
    expect(component.getProgressTabStatusClass(3)).toEqual('incomplete');

    component.activeSection =
      CERTIFICATE_OFFERING_SECTION_IDS.REVIEW_AND_AVAILABILITY;
    expect(component.getProgressTabStatusClass(1)).toEqual('completed');
    expect(component.getProgressTabStatusClass(2)).toEqual('completed');
    expect(component.getProgressTabStatusClass(3)).toEqual('active');
  });

  it('should cache progress statuses for template bindings', () => {
    component.activeSection = CERTIFICATE_OFFERING_SECTION_IDS.ADD_TOPIC_ITEMS;
    component.ngOnInit();

    expect(component.progressStatuses).toEqual([
      'completed',
      'active',
      'incomplete',
    ]);
  });

  it('should cache accessible labels for each step state', () => {
    component.activeSection = CERTIFICATE_OFFERING_SECTION_IDS.DETAILS;
    component.ngOnInit();

    expect(component.progressTabAriaLabels).toEqual([
      'Step 1: Add Certificate Details, current',
      'Step 2: Add Certificate Topics, incomplete',
      'Step 3: Review & Availability, incomplete',
    ]);

    component.activeSection = CERTIFICATE_OFFERING_SECTION_IDS.ADD_TOPIC_ITEMS;
    component.ngOnInit();

    expect(component.progressTabAriaLabels).toEqual([
      'Step 1: Add Certificate Details, completed',
      'Step 2: Add Certificate Topics, current',
      'Step 3: Review & Availability, incomplete',
    ]);
  });

  it('should update progress statuses when activeSection changes', () => {
    component.activeSection = CERTIFICATE_OFFERING_SECTION_IDS.DETAILS;
    component.ngOnInit();

    component.activeSection = CERTIFICATE_OFFERING_SECTION_IDS.ADD_TOPIC_ITEMS;
    component.ngOnChanges({
      activeSection: new SimpleChange(
        CERTIFICATE_OFFERING_SECTION_IDS.DETAILS,
        CERTIFICATE_OFFERING_SECTION_IDS.ADD_TOPIC_ITEMS,
        false
      ),
    });

    expect(component.progressStatuses).toEqual([
      'completed',
      'active',
      'incomplete',
    ]);
    expect(component.progressTabAriaLabels).toEqual([
      'Step 1: Add Certificate Details, completed',
      'Step 2: Add Certificate Topics, current',
      'Step 3: Review & Availability, incomplete',
    ]);
  });
});
