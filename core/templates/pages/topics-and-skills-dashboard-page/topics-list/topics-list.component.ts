// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the topics list viewer.
 */

import {Component, Input, EventEmitter, Output} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {EditableTopicBackendApiService} from 'domain/topic/editable-topic-backend-api.service';
import {CreatorTopicSummary} from 'domain/topic/creator-topic-summary.model';
import {TopicsAndSkillsDashboardBackendApiService} from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {Subscription} from 'rxjs';
import {AlertsService} from 'services/alerts.service';
import {DeleteTopicModalComponent} from '../modals/delete-topic-modal.component';
import {PlatformFeatureService} from 'services/platform-feature.service';
import constants from 'assets/constants';

@Component({
  selector: 'oppia-topics-list',
  templateUrl: './topics-list.component.html',
})
export class TopicsListComponent {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() topicSummaries!: CreatorTopicSummary[];
  @Input() pageNumber!: number;
  @Input() itemsPerPage!: number;
  @Input() userCanDeleteTopic!: boolean;
  @Input() selectedTopicIds!: string;
  @Output() selectedTopicIdsChange: EventEmitter<string> = new EventEmitter();

  directiveSubscriptions: Subscription = new Subscription();
  // Selected topic index is set to null when the delete topic modal is closed.
  // This is to ensure that the edit options are not shown for the topic that
  // is being deleted.
  selectedIndex: string | null = null;
  partiallyPublishedStoriesCounts: number[] = [];
  fullyPublishedStoriesCounts: number[] = [];
  publishedChaptersInPartiallyPublishedStories: number[] = [];
  totalChaptersInPartiallyPublishedStories: number[] = [];
  TOPIC_HEADINGS: string[] = [
    'index',
    'name',
    'canonical_story_count',
    'subtopic_count',
    'skill_count',
    'topic_status',
  ];

  constructor(
    private ngbModal: NgbModal,
    private alertsService: AlertsService,
    private editableTopicBackendApiService: EditableTopicBackendApiService,
    private topicsAndSkillsDashboardBackendApiService: TopicsAndSkillsDashboardBackendApiService,
    private urlInterpolationService: UrlInterpolationService,
    private platformFeatureService: PlatformFeatureService
  ) {}

  /**
   * @param {String} topicId - ID of the topic.
   * @returns {String} Url of the topic editor with the
   * topic ID provided in the args.
   */
  getTopicEditorUrl(topicId: string): string {
    const TOPIC_EDITOR_URL_TEMPLATE = '/topic_editor/<topic_id>#/';
    return this.urlInterpolationService.interpolateUrl(
      TOPIC_EDITOR_URL_TEMPLATE,
      {
        topic_id: topicId,
      }
    );
  }

  /**
   * @param {String} topicId - ID of the topic.
   * @returns {Boolean} Returns true for the topic whose
   * edit options should be shown.
   */
  showEditOptions(topicId: string): boolean {
    return this.selectedIndex === topicId;
  }

  /**
   * @param {String} topicId - ID of the topic.
   */
  changeEditOptions(topicId: string): void {
    this.selectedIndex = this.selectedIndex ? null : topicId;
  }

  /**
   ** @param {Number} topicIndex - Index of the topic in
   * the topicSummaries.
   * @returns {Number} The calculated serial number
   * of the topic taking into consideration the current page
   * number and the items being displayed per page.
   */
  getSerialNumberForTopic(topicIndex: number): number {
    let topicSerialNumber: number =
      topicIndex + this.pageNumber * this.itemsPerPage;
    return topicSerialNumber + 1;
  }

  /**
   ** @param {Number} topicId - ID of the topic.
   * @returns {CreatorTopicSummary} The topic summary of the topic
   * of the topic with given topicId.
   */
  getTopicSummaryForTopicId(topicId: string): CreatorTopicSummary | undefined {
    const topicSummary = this.topicSummaries.find(
      (topicSummary: CreatorTopicSummary) => {
        return topicSummary.id === topicId;
      }
    );

    return topicSummary;
  }

  /**
   * @param {String} topicId - ID of the topic.
   * @param {String} topicName - Name of the topic.
   */
  deleteTopic(topicId: string, topicName: string): void {
    const topicSummary = this.getTopicSummaryForTopicId(topicId);

    if (topicSummary?.classroom) {
      const errorMessage =
        `The topic is assigned to the ${topicSummary.classroom} classroom.` +
        ' Contact the curriculum admins to remove it from the classroom first.';
      this.alertsService.addWarning(errorMessage);
      return;
    }

    this.selectedIndex = null;
    let modalRef: NgbModalRef = this.ngbModal.open(DeleteTopicModalComponent, {
      backdrop: true,
      windowClass: 'delete-topic-modal',
    });
    modalRef.componentInstance.topicName = topicName;
    modalRef.result.then(
      () => {
        this.editableTopicBackendApiService.deleteTopicAsync(topicId).then(
          (status: number) => {
            this.topicsAndSkillsDashboardBackendApiService.onTopicsAndSkillsDashboardReinitialized.emit();
          },
          (error: string) => {
            this.alertsService.addWarning(
              error || 'There was an error when deleting the topic.'
            );
          }
        );
      },
      () => {}
    );
  }

  /**
   * @returns {boolean} Checks whether the SerialChapterLaunch feature
   * flag is enabled.
   */
  isSerialChapterLaunchFeatureEnabled(): boolean {
    return this.platformFeatureService.status
      .SerialChapterLaunchCurriculumAdminView.isEnabled;
  }

  /**
   * @param {CreatorTopicSummary} topic - Topic object whose upcoming chapters
   * notifications text is needed.
   * @returns {String} The text for upcoming chapters notifications in the
   * HTML template.
   */
  getUpcomingChapterNotificationsText(topic: CreatorTopicSummary): string {
    let upcomingChapterNotificationsText =
      topic.getTotalUpcomingChaptersCount() + ' upcoming launch';
    if (topic.getTotalUpcomingChaptersCount() > 1) {
      upcomingChapterNotificationsText += 'es';
    }
    upcomingChapterNotificationsText +=
      ' in the next ' +
      constants.CHAPTER_PUBLICATION_NOTICE_PERIOD_IN_DAYS +
      ' days';
    return upcomingChapterNotificationsText;
  }

  /**
   * @param {CreatorTopicSummary} topic - Topic object whose overdue chapters
   * notifications text is needed.
   * @returns {String} The text for overdue chapters notifications in the
   * HTML template.
   */
  getOverdueChapterNotificationsText(topic: CreatorTopicSummary): string {
    let overdueChapterNotificationsText =
      topic.getTotalOverdueChaptersCount() + ' launch';
    if (topic.getTotalOverdueChaptersCount() > 1) {
      overdueChapterNotificationsText += 'es';
    }
    overdueChapterNotificationsText += ' behind schedule';
    return overdueChapterNotificationsText;
  }

  /**
   * @param {CreatorTopicSummary} topic - Topic object which is checked if all
   * of its chapters are published.
   * @param {Number} idx - The index of the topic in the topicSummaries.
   * @returns {boolean} Checks whether all the chapters in the topic are
   * published.
   */
  areTopicChaptersFullyPublished(
    topic: CreatorTopicSummary,
    idx: number
  ): boolean {
    if (
      topic.getTotalChaptersCounts().length &&
      topic.getTotalChaptersCounts().length ===
        this.fullyPublishedStoriesCounts[idx]
    ) {
      return true;
    } else {
      return false;
    }
  }

  ngOnInit(): void {
    if (this.isSerialChapterLaunchFeatureEnabled()) {
      this.TOPIC_HEADINGS = [
        'index',
        'name',
        'added_stories_count',
        'published_stories_count',
        'notifications',
        'subtopic_count',
        'skill_count',
        'topic_status',
      ];
    } else {
      this.TOPIC_HEADINGS = [
        'index',
        'name',
        'canonical_story_count',
        'subtopic_count',
        'skill_count',
        'topic_status',
      ];
    }
  }

  ngOnChanges(): void {
    this.fullyPublishedStoriesCounts = [];
    this.partiallyPublishedStoriesCounts = [];
    this.totalChaptersInPartiallyPublishedStories = [];
    this.publishedChaptersInPartiallyPublishedStories = [];

    for (let i = 0; i < this.topicSummaries.length; i++) {
      this.fullyPublishedStoriesCounts.push(0);
      this.partiallyPublishedStoriesCounts.push(0);
      this.totalChaptersInPartiallyPublishedStories.push(0);
      this.publishedChaptersInPartiallyPublishedStories.push(0);

      let totalStories = this.topicSummaries[i].getTotalChaptersCounts().length;

      for (let j = 0; this.topicSummaries[i] && j < totalStories; j++) {
        if (
          this.topicSummaries[i].getTotalChaptersCounts()[j] ===
          this.topicSummaries[i].getPublishedChaptersCounts()[j]
        ) {
          this.fullyPublishedStoriesCounts[i]++;
        } else {
          this.partiallyPublishedStoriesCounts[i]++;
          this.totalChaptersInPartiallyPublishedStories[i] +=
            this.topicSummaries[i].getTotalChaptersCounts()[j];
          this.publishedChaptersInPartiallyPublishedStories[i] +=
            this.topicSummaries[i].getPublishedChaptersCounts()[j];
        }
      }
    }
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
