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

import {
  CertificateAssessmentOfferingData,
  CertificateAssessmentOfferingTopicData,
} from 'domain/certificate-assessment/certificate-assessment-offering.model';

import './certificate-offering-add-topic-items.component.css';
export interface TopicOption {
  id: string;
  title: string;
  classroomName: string;
  thumbnailBgColor?: string;
}

const STUB_TOPICS: TopicOption[] = [
  {
    id: 'topic_1',
    title: 'Place Values',
    classroomName: 'Grade 5 Math',
    thumbnailBgColor: '#fde68a',
  },
  {
    id: 'topic_2',
    title: 'Addition & Subtraction',
    classroomName: 'Grade 5 Math',
    thumbnailBgColor: '#bfdbfe',
  },
  {
    id: 'topic_3',
    title: 'Multiplication',
    classroomName: 'Grade 5 Math',
    thumbnailBgColor: '#d9f99d',
  },
  {
    id: 'topic_4',
    title: 'Fractions',
    classroomName: 'Grade 5 Math',
    thumbnailBgColor: '#fecdd3',
  },
  {
    id: 'topic_5',
    title: 'Geometry',
    classroomName: 'Grade 5 Math',
    thumbnailBgColor: '#ddd6fe',
  },
  {
    id: 'topic_6',
    title: 'Plant Cells',
    classroomName: 'Grade 6 Science',
    thumbnailBgColor: '#d9f99d',
  },
  {
    id: 'topic_7',
    title: 'Simple Machines',
    classroomName: 'Grade 6 Science',
    thumbnailBgColor: '#fde68a',
  },
];

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
  // TODO(#24717 - M1.11): Replace this display name input with classroomId once step 1
  // starts passing the actual classroom identifier to this component.
  @Input() classroomName: string = 'Math Grade 5';
  @Output() topicDataChange =
    new EventEmitter<CertificateAssessmentOfferingTopicData>();
  @Output() navigateToReviewAndAvailabilitySection = new EventEmitter<void>();
  @Output() navigateToDetailsSection = new EventEmitter<void>();

  searchQuery: string = '';
  selectedTopics: TopicOption[] = [];
  selectedTopicIds: Set<string> = new Set();

  // TODO(#24717 - M1.11): Replace this stub with the classroom-backed fetch once the flow
  // passes classroomId from the first step.
  availableTopics: TopicOption[] = STUB_TOPICS;

  ngOnInit(): void {
    this.syncSelectedFromOffering();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.certificateAssessmentOffering) {
      this.syncSelectedFromOffering();
    }
  }

  // TODO(#24717 - M1.11): When the real classroomId is available, fetch the classroom data
  // here and map classroomData.getTopicSummaries() into TopicOption values.
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
