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
 * @fileoverview Unit tests for AssessmentIntroductionCardComponent.
 */

import {CommonModule} from '@angular/common';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA, Pipe, PipeTransform} from '@angular/core';

import {AssessmentIntroductionCardComponent} from './assessment-introduction-card.component';
import {ClassroomBackendApiService} from 'domain/classroom/classroom-backend-api.service';
import {ClassroomData} from 'domain/classroom/classroom-data.model';
import {CertificateAssessmentOfferingData} from 'domain/certificate-assessment/certificate-assessment.model';
import {CreatorTopicSummary} from 'domain/topic/creator-topic-summary.model';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';

// Mock the 'translate' pipe used in the template so the TestBed can compile
// the component without pulling in the real i18n/translate module.
@Pipe({name: 'translate'})
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe('AssessmentIntroductionCardComponent', () => {
  let component: AssessmentIntroductionCardComponent;
  let fixture: ComponentFixture<AssessmentIntroductionCardComponent>;
  let classroomBackendApiService: ClassroomBackendApiService;
  let assetsBackendApiService: AssetsBackendApiService;

  const createTopicSummary = (id: string, name: string): CreatorTopicSummary =>
    new CreatorTopicSummary(
      id,
      name,
      2,
      3,
      10,
      5,
      1,
      'en',
      'Description',
      1,
      0,
      0,
      0,
      false,
      false,
      true,
      null,
      'thumbnail.png',
      '#00645c',
      id,
      0,
      0,
      [],
      []
    );

  beforeEach(async () => {
    const classroomData = new ClassroomData(
      'math_classroom_01',
      'Math',
      'math',
      'feedback@example.com',
      [
        createTopicSummary('topic_place_values', 'Place Values'),
        createTopicSummary('topic_fractions', 'Fractions'),
      ],
      'Course details',
      'Topic list intro',
      'Teaser text',
      true,
      true,
      {filename: '', bg_color: '', size_in_bytes: 0},
      {filename: '', bg_color: '', size_in_bytes: 0},
      1
    );
    const classroomBackendApiServiceSpy = jasmine.createSpyObj(
      'ClassroomBackendApiService',
      ['getClassroomDataAsync', 'fetchClassroomDataAsync']
    );
    classroomBackendApiServiceSpy.getClassroomDataAsync.and.returnValue(
      Promise.resolve({classroomDict: {urlFragment: 'math'}})
    );
    classroomBackendApiServiceSpy.fetchClassroomDataAsync.and.returnValue(
      Promise.resolve(classroomData)
    );
    const assetsBackendApiServiceSpy = jasmine.createSpyObj(
      'AssetsBackendApiService',
      ['getThumbnailUrlForPreview']
    );
    assetsBackendApiServiceSpy.getThumbnailUrlForPreview.and.returnValue(
      'thumb://topic_place_values/thumbnail.png'
    );

    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [AssessmentIntroductionCardComponent, MockTranslatePipe],
      providers: [
        {
          provide: ClassroomBackendApiService,
          useValue: classroomBackendApiServiceSpy,
        },
        {
          provide: AssetsBackendApiService,
          useValue: assetsBackendApiServiceSpy,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AssessmentIntroductionCardComponent);
    component = fixture.componentInstance;
    classroomBackendApiService = TestBed.inject(ClassroomBackendApiService);
    assetsBackendApiService = TestBed.inject(AssetsBackendApiService);
    component.certificateOffering = new CertificateAssessmentOfferingData(
      'cert-123',
      'Everyday Arithmetic & Number Confidence',
      'This certificate recognizes your ability to work confidently with numbers.',
      'math_classroom_01',
      {topic_place_values: 1},
      12,
      60,
      [
        'Understanding of numbers and their relationships',
        'Ability to perform basic arithmetic accurately',
      ],
      'Available',
      1
    );
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load the classroom url fragment from the offering classroom', async () => {
    await fixture.whenStable();

    expect(
      classroomBackendApiService.getClassroomDataAsync
    ).toHaveBeenCalledWith('math_classroom_01');
    expect(component.classroomUrlFragment).toBe('math');
  });

  it('should load topic summaries that belong to the offering only', async () => {
    await fixture.whenStable();

    expect(
      classroomBackendApiService.fetchClassroomDataAsync
    ).toHaveBeenCalledWith('math');
    expect(component.recommendedTopicSummaries.length).toBe(1);
    expect(component.recommendedTopicSummaries[0].getId()).toBe(
      'topic_place_values'
    );
  });

  it('should stop loading topics after the classroom data is fetched', async () => {
    expect(component.isLoadingTopics).toBe(true);

    await fixture.whenStable();

    expect(component.isLoadingTopics).toBe(false);
  });

  it('should keep the topics empty and stop loading when the classroom API request fails', async () => {
    const certificateOffering = component.certificateOffering;
    (
      classroomBackendApiService.getClassroomDataAsync as jasmine.Spy
    ).and.returnValue(Promise.reject(new Error('Request failed')));
    fixture = TestBed.createComponent(AssessmentIntroductionCardComponent);
    component = fixture.componentInstance;
    component.certificateOffering = certificateOffering;

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.recommendedTopicSummaries).toEqual([]);
    expect(component.isLoadingTopics).toBeFalse();
  });

  it('should expose the correct i18n key for the demonstrates heading', () => {
    expect(component.demonstratesHeadingI18nKey).toBe(
      'I18N_CERTIFICATE_ASSESSMENT_DEMONSTRATES_HEADING'
    );
  });

  it('should expose the correct i18n key for the topics heading', () => {
    expect(component.topicsHeadingI18nKey).toBe(
      'I18N_CERTIFICATE_ASSESSMENT_TOPICS_HEADING'
    );
  });

  it('should expose the correct i18n key for the topics subtext', () => {
    expect(component.topicsSubtextI18nKey).toBe(
      'I18N_CERTIFICATE_ASSESSMENT_TOPICS_SUBTEXT'
    );
  });

  it('should expose the correct i18n key for the continue button', () => {
    expect(component.continueButtonI18nKey).toBe(
      'I18N_CERTIFICATE_ASSESSMENT_CONTINUE_BUTTON'
    );
  });

  it('should expose the correct i18n key for the lessons count', () => {
    expect(component.lessonsCountI18nKey).toBe('I18N_COUNT_OF_LESSONS');
  });

  it('should build the topic thumbnail url from the topic summary', () => {
    const topicSummary = createTopicSummary(
      'topic_place_values',
      'Place Values'
    );

    expect(component.getTopicThumbnailUrl(topicSummary)).toBe(
      'thumb://topic_place_values/thumbnail.png'
    );
    expect(
      assetsBackendApiService.getThumbnailUrlForPreview
    ).toHaveBeenCalledWith('topic', 'topic_place_values', 'thumbnail.png');
  });

  it('should return the published lesson count for a topic summary', () => {
    const topicSummary = createTopicSummary(
      'topic_place_values',
      'Place Values'
    );

    expect(topicSummary.getTotalPublishedNodeCount()).toBe(5);
  });

  it('should emit the continue event when onContinue is called', () => {
    spyOn(component.continue, 'emit');

    component.onContinue();

    expect(component.continue.emit).toHaveBeenCalled();
  });

  it('should emit the continue event exactly once per call', () => {
    spyOn(component.continue, 'emit');

    component.onContinue();

    expect(component.continue.emit).toHaveBeenCalledTimes(1);
  });
});
