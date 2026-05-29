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
 * @fileoverview Unit tests for CertificateOfferingAddTopicItemsComponent.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';

import {CertificateOfferingAddTopicItemsComponent} from './certificate-offering-add-topic-items.component';
import {CertificateAssessmentOfferingData} from 'domain/certificate-assessment/certificate-assessment-offering.model';

describe('Certificate Offering Add Topic Items Component', () => {
  let component: CertificateOfferingAddTopicItemsComponent;
  let fixture: ComponentFixture<CertificateOfferingAddTopicItemsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CertificateOfferingAddTopicItemsComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      CertificateOfferingAddTopicItemsComponent
    );
    component = fixture.componentInstance;
    component.certificateAssessmentOffering =
      CertificateAssessmentOfferingData.createEmpty();
    fixture.detectChanges();
  });

  it('should emit events correctly when clicking next button', () => {
    const topicDataChangeSpy = spyOn(component.topicDataChange, 'emit');
    const navigateSpy = spyOn(
      component.navigateToReviewAndAvailabilitySection,
      'emit'
    );
    component.certificateAssessmentOffering.topicData = {topic_id_1: 5};

    component.onNextClicked();

    expect(topicDataChangeSpy).toHaveBeenCalledWith({topic_id_1: 5});
    expect(navigateSpy).toHaveBeenCalled();
  });

  it('should emit events correctly when clicking back button', () => {
    const topicDataChangeSpy = spyOn(component.topicDataChange, 'emit');
    const navigateSpy = spyOn(component.navigateToDetailsSection, 'emit');
    component.certificateAssessmentOffering.topicData = {topic_id_2: 10};

    component.onBackClicked();

    expect(topicDataChangeSpy).toHaveBeenCalledWith({topic_id_2: 10});
    expect(navigateSpy).toHaveBeenCalled();
  });
});
