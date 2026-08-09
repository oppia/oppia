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
 * @fileoverview Topic selection step for certificate offering flows.
 */

import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';

import {AppConstants} from 'app.constants';
import {ClassroomBackendApiService} from 'domain/classroom/classroom-backend-api.service';
import {
  CertificateAssessmentOfferingData,
  CertificateAssessmentOfferingTopicData,
} from 'domain/certificate-assessment/certificate-assessment.model';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';

import './certificate-offering-add-topic-items.component.css';
export interface TopicOption {
  id: string;
  title: string;
  classroomName: string;
  thumbnailUrl: string;
}

@Component({
  selector: 'oppia-certificate-offering-add-topic-items',
  templateUrl: './certificate-offering-add-topic-items.component.html',
  styleUrls: ['./certificate-offering-add-topic-items.component.css'],
})
export class CertificateOfferingAddTopicItemsComponent
  implements OnInit, OnChanges
{
  @Input() certificateAssessmentOffering: CertificateAssessmentOfferingData =
    CertificateAssessmentOfferingData.createEmpty();
  @Input() classroomId: string = '';
  @Output() topicDataChange =
    new EventEmitter<CertificateAssessmentOfferingTopicData>();
  @Output() navigateToReviewAndAvailabilitySection = new EventEmitter<void>();
  @Output() navigateToDetailsSection = new EventEmitter<void>();

  searchQuery: string = '';
  selectedTopics: TopicOption[] = [];
  selectedTopicIds: Set<string> = new Set();
  availableTopics: TopicOption[] = [];
  classroomName: string = '';
  classroomLoadErrorMessage: string = '';
  isLoadingTopics: boolean = false;

  constructor(
    private classroomBackendApiService: ClassroomBackendApiService,
    private assetsBackendApiService: AssetsBackendApiService
  ) {}

  ngOnInit(): void {
    this.loadTopicsForClassroom();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.classroomId && !changes.classroomId.firstChange) {
      this.loadTopicsForClassroom();
    }
    if (changes.certificateAssessmentOffering) {
      this.syncSelectedFromOffering();
    }
  }

  private async loadTopicsForClassroom(): Promise<void> {
    this.isLoadingTopics = true;
    if (!this.classroomId) {
      this.availableTopics = [];
      this.classroomName = '';
      this.classroomLoadErrorMessage = '';
      this.syncSelectedFromOffering();
      this.isLoadingTopics = false;
      return;
    }

    try {
      const classroomSummaries =
        await this.classroomBackendApiService.getAllClassroomsSummaryAsync();
      const selectedClassroom = classroomSummaries.find(
        classroom => classroom.classroom_id === this.classroomId
      );

      if (!selectedClassroom) {
        throw new Error('Selected classroom not found.');
      }

      const classroomData =
        await this.classroomBackendApiService.fetchClassroomDataAsync(
          selectedClassroom.url_fragment
        );
      this.classroomName = classroomData.getName();
      this.availableTopics = classroomData.getTopicSummaries().map(topic => {
        return {
          id: topic.getId(),
          title: topic.getName(),
          classroomName: classroomData.getName(),
          thumbnailUrl: this.assetsBackendApiService.getThumbnailUrlForPreview(
            AppConstants.ENTITY_TYPE.TOPIC,
            topic.getId(),
            topic.getThumbnailFilename()
          ),
        };
      });
      this.classroomLoadErrorMessage = '';
    } catch (error: unknown) {
      console.error('Failed to load classroom topics.', error);
      this.availableTopics = [];
      this.classroomName = '';
      this.classroomLoadErrorMessage =
        'Unable to load topics for this classroom.';
    } finally {
      this.isLoadingTopics = false;
    }

    this.syncSelectedFromOffering();
  }

  private syncSelectedFromOffering(): void {
    const topicData = this.certificateAssessmentOffering.topicData ?? {};
    const selectedIds = Object.entries(topicData)
      .sort((left, right) => left[1] - right[1])
      .map(([topicId]) => topicId);

    this.selectedTopicIds = new Set(selectedIds);
    this.selectedTopics = selectedIds
      .map(topicId => this.availableTopics.find(topic => topic.id === topicId))
      .filter((topic): topic is TopicOption => topic !== undefined);
  }

  get filteredTopics(): TopicOption[] {
    const query = this.searchQuery.trim().toLowerCase();
    return this.availableTopics.filter(topic => {
      const queryMatches =
        !query ||
        topic.title.toLowerCase().includes(query) ||
        topic.classroomName.toLowerCase().includes(query);
      return queryMatches;
    });
  }

  isAdded(topicId: string): boolean {
    return this.selectedTopicIds.has(topicId);
  }

  toggleTopic(topic: TopicOption): void {
    if (this.isAdded(topic.id)) {
      this.selectedTopics = this.selectedTopics.filter(
        selected => selected.id !== topic.id
      );
      this.selectedTopicIds.delete(topic.id);
    } else {
      this.selectedTopics = [...this.selectedTopics, topic];
      this.selectedTopicIds.add(topic.id);
    }
    this.syncTopicData();
  }

  removeSelectedTopic(topicId: string): void {
    this.selectedTopics = this.selectedTopics.filter(
      topic => topic.id !== topicId
    );
    this.selectedTopicIds.delete(topicId);
    this.syncTopicData();
  }

  private syncTopicData(): void {
    const topicData: CertificateAssessmentOfferingTopicData = {};
    this.selectedTopics.forEach((topic, index) => {
      topicData[topic.id] = index + 1;
    });
    this.certificateAssessmentOffering.topicData = topicData;
  }

  onNextClicked(): void {
    const topicData = this.certificateAssessmentOffering.topicData;
    if (!topicData || Object.keys(topicData).length === 0) {
      return;
    }
    this.topicDataChange.emit(topicData);
    this.navigateToReviewAndAvailabilitySection.emit();
  }

  onBackClicked(): void {
    this.topicDataChange.emit(this.certificateAssessmentOffering.topicData);
    this.navigateToDetailsSection.emit();
  }
}
