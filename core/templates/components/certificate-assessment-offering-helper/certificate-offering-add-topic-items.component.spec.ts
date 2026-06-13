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

  it('should not emit next events when no topics are selected', () => {
    const topicDataChangeSpy = spyOn(component.topicDataChange, 'emit');
    const navigateSpy = spyOn(
      component.navigateToReviewAndAvailabilitySection,
      'emit'
    );

    component.onNextClicked();

    expect(topicDataChangeSpy).not.toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('should initialize selected topics from offering data', () => {
    component.selectedTopics = [];
    component.certificateAssessmentOffering.topicData = {
      topic_1: 1,
      topic_3: 2,
    };

    component.ngOnChanges({
      certificateAssessmentOffering: {
        currentValue: component.certificateAssessmentOffering,
        previousValue: CertificateAssessmentOfferingData.createEmpty(),
        firstChange: false,
        isFirstChange: () => false,
      },
    });

    expect(component.selectedTopics.map(topic => topic.id)).toEqual([
      'topic_1',
      'topic_3',
    ]);
  });

  it('should clear stale selected topics when offering data is empty', () => {
    component.selectedTopics = [component.availableTopics[0]];
    component.selectedTopicIds = new Set([component.availableTopics[0].id]);
    component.certificateAssessmentOffering.topicData = {};

    component.ngOnChanges({
      certificateAssessmentOffering: {
        currentValue: component.certificateAssessmentOffering,
        previousValue: {
          ...CertificateAssessmentOfferingData.createEmpty(),
          topicData: {topic_1: 1},
        },
        firstChange: false,
        isFirstChange: () => false,
      },
    });

    expect(component.selectedTopics).toEqual([]);
    expect(component.selectedTopicIds.size).toEqual(0);
  });

  it('should preserve topic order from topic data positions', () => {
    component.certificateAssessmentOffering.topicData = {
      topic_3: 2,
      topic_1: 1,
    };

    component.ngOnChanges({
      certificateAssessmentOffering: {
        currentValue: component.certificateAssessmentOffering,
        previousValue: CertificateAssessmentOfferingData.createEmpty(),
        firstChange: false,
        isFirstChange: () => false,
      },
    });

    expect(component.selectedTopics.map(topic => topic.id)).toEqual([
      'topic_1',
      'topic_3',
    ]);
  });

  it('should add and remove topics while syncing topic data', () => {
    const topic = component.availableTopics[0];

    component.toggleTopic(topic);

    expect(component.selectedTopics.map(selected => selected.id)).toEqual([
      topic.id,
    ]);
    expect(component.selectedTopicIds.has(topic.id)).toBeTrue();
    expect(component.certificateAssessmentOffering.topicData).toEqual({
      [topic.id]: 1,
    });

    component.toggleTopic(topic);

    expect(component.selectedTopics).toEqual([]);
    expect(component.selectedTopicIds.has(topic.id)).toBeFalse();
    expect(component.certificateAssessmentOffering.topicData).toEqual({});
  });

  it('should remove a selected topic and update topic data order', () => {
    const firstTopic = component.availableTopics[0];
    const secondTopic = component.availableTopics[1];
    component.selectedTopics = [firstTopic, secondTopic];
    component.certificateAssessmentOffering.topicData = {
      [firstTopic.id]: 1,
      [secondTopic.id]: 2,
    };

    component.removeSelectedTopic(firstTopic.id);

    expect(component.selectedTopics.map(topic => topic.id)).toEqual([
      secondTopic.id,
    ]);
    expect(component.certificateAssessmentOffering.topicData).toEqual({
      [secondTopic.id]: 1,
    });
  });

  it('should filter topics by title and classroom name', () => {
    component.searchQuery = 'science';

    expect(component.filteredTopics.map(topic => topic.id)).toEqual([
      'topic_6',
      'topic_7',
    ]);

    component.searchQuery = 'fractions';

    expect(component.filteredTopics.map(topic => topic.id)).toEqual([
      'topic_4',
    ]);
  });

  it('should show the empty selected-topics message when no topics are selected', () => {
    const emptyStateEl: HTMLElement | null =
      fixture.nativeElement.querySelector(
        '.oppia-certificate-offering-empty-selected-topics'
      );

    expect(emptyStateEl).not.toBeNull();
    expect(emptyStateEl?.textContent?.trim()).toBe(
      'You have not added any topic. Start by adding one!'
    );
  });
});
