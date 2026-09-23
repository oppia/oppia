// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the new lesson player's main navbar breadcrumb
 **/

import {Component, OnInit} from '@angular/core';
import {ReadOnlyTopic} from 'domain/topic_viewer/read-only-topic.model';
import {TopicViewerBackendApiService} from 'domain/topic_viewer/topic-viewer-backend-api.service';
import {UrlService} from 'services/contextual/url.service';
import {CapitalizePipe} from 'filters/string-utility-filters/capitalize.pipe';
import {ClassroomBackendApiService} from 'domain/classroom/classroom-backend-api.service';

@Component({
  selector: 'oppia-lesson-player-navbar-breadcrumb',
  templateUrl: './lesson-player-navbar-breadcrumb.component.html',
  styleUrls: ['./lesson-player-navbar-breadcrumb.component.css'],
})
export class LessonPlayerNavbarBreadcrumbComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  topicName!: string;
  classroomName!: string;
  classroomUrlFragment!: string | null;
  topicUrlFragment!: string | null;
  isLinkedToTopic: boolean | null = null;

  constructor(
    private urlService: UrlService,
    private capitalizePipe: CapitalizePipe,
    private classroomBackendApiService: ClassroomBackendApiService,
    private topicViewerBackendApiService: TopicViewerBackendApiService
  ) {}

  ngOnInit(): void {
    this.topicName = '';
    this.classroomName = '';

    this.isLinkedToTopic = this.computeIsLinkedToTopic();

    if (!this.isLinkedToTopic) {
      return;
    }

    const topicUrlFragment = this.topicUrlFragment as string;
    const classroomUrlFragment = this.classroomUrlFragment as string;

    this.topicViewerBackendApiService
      .fetchTopicDataAsync(topicUrlFragment, classroomUrlFragment)
      .then((readOnlyTopic: ReadOnlyTopic) => {
        this.topicName = readOnlyTopic.getTopicName();
      });

    this.classroomBackendApiService
      .fetchClassroomDataAsync(classroomUrlFragment)
      .then(classroomData => {
        this.classroomName = this.capitalizePipe.transform(
          classroomData.getName()
        );
      });
  }

  // Returns whether the current learner URL has classroom, topic, and
  // story fragments, which together indicate the exploration is being
  // played as part of a curated topic (rather than e.g. standalone via
  // the community library).
  private computeIsLinkedToTopic(): boolean {
    try {
      this.topicUrlFragment =
        this.urlService.getTopicUrlFragmentFromLearnerUrl();
      this.classroomUrlFragment =
        this.urlService.getClassroomUrlFragmentFromLearnerUrl();
    } catch (e) {
      return false;
    }

    if (this.topicUrlFragment === null && this.classroomUrlFragment === null) {
      return false;
    }

    if (this.topicUrlFragment === null || this.classroomUrlFragment === null) {
      throw new Error('Classroom URL fragment is null');
    }

    return true;
  }

  // Returns true once both names have arrived, so the template can avoid
  // flashing "> > " (or stale "Loading..." text) while fetches are
  // in flight.
  shouldShowBreadcrumb(): boolean {
    return Boolean(
      this.isLinkedToTopic && this.classroomName && this.topicName
    );
  }

  getClassroomUrl(): string {
    return `/learn/${this.classroomUrlFragment}`;
  }

  getTopicUrl(): string {
    return `/learn/${this.classroomUrlFragment}/${this.topicUrlFragment}`;
  }
}
