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

import { Component, Input, EventEmitter, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { EditableTopicBackendApiService } from 'domain/topic/editable-topic-backend-api.service';
import { CreatorTopicSummary } from 'domain/topic/creator-topic-summary.model';
import { TopicsAndSkillsDashboardBackendApiService } from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { Subscription } from 'rxjs';
import { AlertsService } from 'services/alerts.service';
import { DeleteTopicModalComponent } from '../modals/delete-topic-modal.component';

@Component({
  selector: 'oppia-topics-list',
  templateUrl: './topics-list.component.html'
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
  @Output() selectedTopicIdsChange: EventEmitter<string> = (
    new EventEmitter());

  directiveSubscriptions: Subscription = new Subscription();
  // Selected topic index is set to null when the delete topic modal is closed.
  // This is to ensure that the edit options are not shown for the topic that
  // is being deleted.
  selectedIndex: string | null = null;
  TOPIC_HEADINGS: string[] = [
    'index', 'name', 'canonical_story_count', 'subtopic_count',
    'skill_count', 'topic_status'
  ];

  constructor(
    private ngbModal: NgbModal,
    private alertsService: AlertsService,
    private editableTopicBackendApiService: EditableTopicBackendApiService,
    private topicsAndSkillsDashboardBackendApiService:
    TopicsAndSkillsDashboardBackendApiService,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  /**
   * @param {String} topicId - ID of the topic.
   * @returns {String} Url of the topic editor with the
   * topic ID provided in the args.
   */
  getTopicEditorUrl(topicId: string): string {
    const TOPIC_EDITOR_URL_TEMPLATE = '/topic_editor/<topic_id>#/';
    return this.urlInterpolationService.interpolateUrl(
      TOPIC_EDITOR_URL_TEMPLATE, {
        topic_id: topicId
      });
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
    let topicSerialNumber: number = (
      topicIndex + (this.pageNumber * this.itemsPerPage));
    return (topicSerialNumber + 1);
  }

  /**
   * @param {String} topicId - ID of the topic.
   * @param {String} topicName - Name of the topic.
   */
  deleteTopic(topicId: string, topicName: string): void {
    this.selectedIndex = null;
    let modalRef: NgbModalRef = this.ngbModal.open(DeleteTopicModalComponent, {
      backdrop: true,
      windowClass: 'delete-topic-modal'
    });
    modalRef.componentInstance.topicName = topicName;
    modalRef.result.then(() => {
      this.editableTopicBackendApiService.deleteTopicAsync(topicId).then(
        (status: number) => {
          this.topicsAndSkillsDashboardBackendApiService.
            onTopicsAndSkillsDashboardReinitialized.emit();
        },
        (error: string) => {
          this.alertsService.addWarning(
            error || 'There was an error when deleting the topic.');
        }
      );
    }, () => {});
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive('oppiaTopicsList',
  downgradeComponent({ component: TopicsListComponent }));
