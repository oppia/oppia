// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the navbar of the topic editor.
 */

import {Subscription} from 'rxjs';
import {TopicEditorSendMailComponent} from '../modal-templates/topic-editor-send-mail-modal.component';
import {TopicEditorSaveModalComponent} from '../modal-templates/topic-editor-save-modal.component';
import {AfterContentChecked, Component, OnDestroy, OnInit} from '@angular/core';
import {TopicEditorStateService} from '../services/topic-editor-state.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {TopicRightsBackendApiService} from 'domain/topic/topic-rights-backend-api.service';
import {AlertsService} from 'services/alerts.service';
import {UndoRedoService} from 'domain/editor/undo_redo/undo-redo.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {UrlService} from 'services/contextual/url.service';
import {TopicEditorRoutingService} from '../services/topic-editor-routing.service';
import {ClassroomDomainConstants} from 'domain/classroom/classroom-domain.constants';
import {Topic} from 'domain/topic/topic-object.model';
import {TopicRights} from 'domain/topic/topic-rights.model';
import {WindowRef} from 'services/contextual/window-ref.service';

@Component({
  selector: 'oppia-topic-editor-navbar',
  templateUrl: './topic-editor-navbar.component.html',
})
export class TopicEditorNavbarComponent
  implements OnInit, OnDestroy, AfterContentChecked
{
  validationIssues: string[];
  topic: Topic;
  prepublishValidationIssues: string[];
  topicRights: TopicRights;
  topicId: string;
  topicName: string;
  discardChangesButtonIsShown: boolean;
  showTopicEditOptions: boolean;
  topicSkillIds: string[];
  showNavigationOptions: boolean;
  warningsAreShown: boolean;
  navigationChoices: string[];
  activeTab: string;
  changeListLength: number;
  topicIsSaveable: boolean;
  totalWarningsCount: number;

  constructor(
    private topicEditorStateService: TopicEditorStateService,
    private ngbModal: NgbModal,
    private topicRightsBackendApiService: TopicRightsBackendApiService,
    private alertsService: AlertsService,
    private undoRedoService: UndoRedoService,
    private urlInterpolationService: UrlInterpolationService,
    private urlService: UrlService,
    private topicEditorRoutingService: TopicEditorRoutingService,
    private windowRef: WindowRef
  ) {}

  directiveSubscriptions = new Subscription();

  isSaveInProgress(): boolean {
    return this.topicEditorStateService.isSavingTopic();
  }

  _validateTopic(): void {
    this.validationIssues = this.topic.validate();
    if (this.topicEditorStateService.getTopicWithNameExists()) {
      this.validationIssues.push('A topic with this name already exists.');
    }
    if (this.topicEditorStateService.getTopicWithUrlFragmentExists()) {
      this.validationIssues.push('Topic URL fragment already exists.');
    }
    let prepublishTopicValidationIssues = this.topic.prepublishValidate();
    let subtopicPrepublishValidationIssues = [].concat.apply(
      [],
      this.topic.getSubtopics().map(subtopic => subtopic.prepublishValidate())
    );
    this.prepublishValidationIssues = prepublishTopicValidationIssues.concat(
      subtopicPrepublishValidationIssues
    );
  }

  publishTopic(): void {
    if (!this.topicRights.canPublishTopic()) {
      this.ngbModal
        .open(TopicEditorSendMailComponent, {
          backdrop: true,
        })
        .result.then(
          () => {
            this.topicRightsBackendApiService
              .sendMailAsync(this.topicId, this.topicName)
              .then(() => {
                let successToast = 'Mail Sent.';
                this.alertsService.addSuccessMessage(successToast, 1000);
              });
          },
          () => {
            // Note to developers:
            // This callback is triggered when the Cancel button is clicked.
            // No further action is needed.
          }
        );
      return;
    }
    let redirectToDashboard = false;
    this.topicRightsBackendApiService
      .publishTopicAsync(this.topicId)
      .then(() => {
        if (!this.topicRights.isPublished()) {
          redirectToDashboard = true;
        }
        this.topicRights.markTopicAsPublished();
        this.topicEditorStateService.setTopicRights(this.topicRights);
      })
      .then(() => {
        let successToast = 'Topic published.';
        if (redirectToDashboard) {
          this.windowRef.nativeWindow.location.href =
            '/topics-and-skills-dashboard';
        }
        this.alertsService.addSuccessMessage(successToast, 1000);
      });
  }

  discardChanges(): void {
    this.undoRedoService.clearChanges();
    this.discardChangesButtonIsShown = false;
    this.topicEditorStateService.loadTopic(this.topicId);
  }

  getChangeListLength(): number {
    return this.undoRedoService.getChangeCount();
  }

  isTopicSaveable(): boolean {
    return (
      this.getChangeListLength() > 0 &&
      this.getWarningsCount() === 0 &&
      (!this.topicRights.isPublished() ||
        this.prepublishValidationIssues.length === 0)
    );
  }

  isWarningTooltipDisabled(): boolean {
    return this.isTopicSaveable() || this.getTotalWarningsCount() === 0;
  }

  getAllTopicWarnings(): string {
    return this.validationIssues
      .concat()
      .concat(this.prepublishValidationIssues)
      .join('\n');
  }

  toggleDiscardChangeButton(): void {
    this.showTopicEditOptions = false;
    this.discardChangesButtonIsShown = !this.discardChangesButtonIsShown;
  }

  saveChanges(): void {
    let isTopicPublished = this.topicRights.isPublished();
    const modelRef = this.ngbModal.open(TopicEditorSaveModalComponent, {
      backdrop: 'static',
    });
    modelRef.componentInstance.topicIsPublished = isTopicPublished;
    modelRef.result.then(
      (commitMessage: string) => {
        this.topicEditorStateService.saveTopic(commitMessage, () => {
          this.alertsService.addSuccessMessage('Changes Saved.');
        });
      },
      () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        // No further action is needed.
      }
    );
  }

  unpublishTopic(): boolean {
    const classroomName = this.topicEditorStateService.getClassroomName();
    if (classroomName) {
      const errorMessage =
        `The topic is assigned to the ${classroomName} ` +
        'classroom. Contact the curriculum admins to remove it from the classroom first.';
      this.alertsService.addWarning(errorMessage);
      return false;
    }
    this.showTopicEditOptions = false;
    if (!this.topicRights.canPublishTopic()) {
      return false;
    }
    this.topicRightsBackendApiService
      .unpublishTopicAsync(this.topicId)
      .then(() => {
        this.topicRights.markTopicAsUnpublished();
        this.topicEditorStateService.setTopicRights(this.topicRights);
      });
  }

  toggleNavigationOptions(): void {
    this.showNavigationOptions = !this.showNavigationOptions;
  }

  toggleTopicEditOptions(): void {
    this.showTopicEditOptions = !this.showTopicEditOptions;
  }

  toggleWarningText(): void {
    this.warningsAreShown = !this.warningsAreShown;
  }

  getWarningsCount(): number {
    return this.validationIssues.length;
  }

  getTotalWarningsCount(): number {
    let validationIssuesCount = this.validationIssues.length;
    let prepublishValidationIssuesCount =
      this.prepublishValidationIssues.length;
    return validationIssuesCount + prepublishValidationIssuesCount;
  }

  getMobileNavigatorText(): string {
    const activeTab = this.getActiveTabName();
    if (activeTab === 'main') {
      return 'Editor';
    } else if (activeTab === 'subtopic_editor') {
      return 'Editor';
    } else if (activeTab === 'subtopic_preview') {
      return 'Preview';
    } else if (activeTab === 'questions') {
      return 'Questions';
    } else if (activeTab === 'topic_preview') {
      return 'Preview';
    }
  }

  openTopicViewer(): void {
    this.showNavigationOptions = false;
    let activeTab = this.topicEditorRoutingService.getActiveTabName();
    if (activeTab !== 'subtopic_editor' && activeTab !== 'subtopic_preview') {
      if (this.getChangeListLength() > 0) {
        this.alertsService.addInfoMessage(
          'Please save all pending changes to preview the topic ' +
            'with the changes',
          2000
        );
        return;
      }
      let topicUrlFragment = this.topic.getUrlFragment();
      let classroomUrlFragment =
        this.topicEditorStateService.getClassroomUrlFragment();
      this.windowRef.nativeWindow.open(
        this.urlInterpolationService.interpolateUrl(
          ClassroomDomainConstants.TOPIC_VIEWER_URL_TEMPLATE,
          {
            topic_url_fragment: topicUrlFragment,
            classroom_url_fragment: classroomUrlFragment,
          }
        ),
        'blank'
      );
    } else {
      let subtopicId = this.topicEditorRoutingService.getSubtopicIdFromUrl();
      this.topicEditorRoutingService.navigateToSubtopicPreviewTab(subtopicId);
      this.activeTab = 'Preview';
    }
  }

  selectMainTab(): void {
    this.showNavigationOptions = false;
    let activeTab = this.topicEditorRoutingService.getActiveTabName();
    if (activeTab !== 'subtopic_editor' && activeTab !== 'subtopic_preview') {
      this.topicEditorRoutingService.navigateToMainTab();
      this.activeTab = 'Editor';
    } else {
      let subtopicId = this.topicEditorRoutingService.getSubtopicIdFromUrl();
      this.topicEditorRoutingService.navigateToSubtopicEditorWithId(subtopicId);
      this.activeTab = 'Editor';
    }
  }

  selectQuestionsTab(): void {
    this.showNavigationOptions = false;
    this.topicEditorRoutingService.navigateToQuestionsTab();
    this.activeTab = 'Questions';
  }

  getActiveTabName(): string {
    return this.topicEditorRoutingService.getActiveTabName();
  }

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.topicEditorStateService.onTopicInitialized.subscribe(() => {
        this.topic = this.topicEditorStateService.getTopic();
        this._validateTopic();
      })
    );
    this.directiveSubscriptions.add(
      this.topicEditorStateService.onTopicReinitialized.subscribe(() => {
        this.topic = this.topicEditorStateService.getTopic();
        this._validateTopic();
      })
    );
    this.topicId = this.urlService.getTopicIdFromUrl();
    this.navigationChoices = ['Topic', 'Questions', 'Preview'];
    this.activeTab = this.getMobileNavigatorText();
    this.showNavigationOptions = false;
    this.warningsAreShown = false;
    this.showTopicEditOptions = false;
    this.topic = this.topicEditorStateService.getTopic();
    this.discardChangesButtonIsShown = false;
    this.validationIssues = [];
    this.prepublishValidationIssues = [];
    this.topicRights = this.topicEditorStateService.getTopicRights();
    this.directiveSubscriptions.add(
      this.undoRedoService.getUndoRedoChangeEventEmitter().subscribe(() => {
        this.topic = this.topicEditorStateService.getTopic();
        this._validateTopic();
      })
    );
  }

  ngAfterContentChecked(): void {
    this.changeListLength = this.getChangeListLength();
    this.topicIsSaveable = this.isTopicSaveable();
    this.totalWarningsCount = this.getTotalWarningsCount();
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
