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
 * @fileoverview Unit tests for the navbar of the topic editor.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { UndoRedoService } from 'domain/editor/undo_redo/undo-redo.service';
import { ShortSkillSummary } from 'domain/skill/short-skill-summary.model';
import { Subtopic } from 'domain/topic/subtopic.model';
import { TopicRightsBackendApiService, TopicRightsBackendResponse } from 'domain/topic/topic-rights-backend-api.service';
import { TopicRights } from 'domain/topic/topic-rights.model';
import { Topic } from 'domain/topic/topic-object.model';
import { AlertsService } from 'services/alerts.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { TopicEditorSaveModalComponent } from '../modal-templates/topic-editor-save-modal.component';
import { TopicEditorSendMailComponent } from '../modal-templates/topic-editor-send-mail-modal.component';
import { TopicEditorRoutingService } from '../services/topic-editor-routing.service';
import { TopicEditorStateService } from '../services/topic-editor-state.service';
import { TopicEditorNavbarComponent } from './topic-editor-navbar.component';

class MockWindowRef {
  _window = {
    location: {
      hash: '123',
      href: '',
      replace: (val: string) => {}
    },
    open: (url: string) => {},
    gtag: () => {}
  };

  get nativeWindow() {
    return this._window;
  }
}

describe('Topic Editor Navbar', () => {
  let fixture: ComponentFixture<TopicEditorNavbarComponent>;
  let componentInstance: TopicEditorNavbarComponent;
  let topicEditorStateService: TopicEditorStateService;
  let urlService: UrlService;
  let topic: Topic;
  let undoRedoService: UndoRedoService;
  let alertsService: AlertsService;
  let ngbModal: NgbModal;
  let windowRef: MockWindowRef;
  let topicEditorRoutingService: TopicEditorRoutingService;
  let topicRightsBackendApiService: TopicRightsBackendApiService;
  let topicInitializedEventEmitter = new EventEmitter();
  let topicReinitializedEventEmitter = new EventEmitter();
  let undoRedoChangeAppliedEventEmitter = new EventEmitter();

  beforeEach(waitForAsync(() => {
    windowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        TopicEditorNavbarComponent,
        TopicEditorSaveModalComponent,
        TopicEditorSendMailComponent
      ],
      providers: [
        TopicEditorStateService,
        UrlService,
        UndoRedoService,
        TopicRightsBackendApiService,
        {
          provide: WindowRef,
          useValue: windowRef
        },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopicEditorNavbarComponent);
    componentInstance = fixture.componentInstance;
    topicEditorStateService = TestBed.inject(TopicEditorStateService);
    ngbModal = TestBed.inject(NgbModal);
    topicEditorRoutingService = TestBed.inject(TopicEditorRoutingService);
    urlService = TestBed.inject(UrlService);
    undoRedoService = TestBed.inject(UndoRedoService);
    alertsService = TestBed.inject(AlertsService);
    topicRightsBackendApiService =
      TestBed.inject(TopicRightsBackendApiService);

    let subtopic = Subtopic.createFromTitle(1, 'subtopic1');
    subtopic.setUrlFragment('dummy-url');
    let skillSummary = ShortSkillSummary.create(
      'skill_1', 'Description 1');
    topic = new Topic(
      '', 'Topic name loading', 'Abbrev. name loading',
      'Url Fragment loading', 'Topic description loading', 'en',
      [], [], [], 1, 1, [], '', '', {}, false, '', '', []
    );
    topic._uncategorizedSkillSummaries = [skillSummary];
    topic._subtopics = [subtopic];
    topic._skillSummariesForDiagnosticTest = [skillSummary];
  });

  afterEach(() => {
    componentInstance.ngOnDestroy();
    fixture.destroy();
  });

  it('should initialise when user open the topic editor', () => {
    spyOn(urlService, 'getTopicIdFromUrl').and.returnValue('topic_1');
    spyOn(topicEditorStateService, 'getTopic').and.returnValue(topic);

    componentInstance.ngOnInit();

    expect(componentInstance.topicId).toBe('topic_1');
    expect(componentInstance.navigationChoices).toEqual(
      ['Topic', 'Questions', 'Preview']);
    expect(componentInstance.activeTab).toEqual('Editor');
    expect(componentInstance.showNavigationOptions).toBeFalse();
    expect(componentInstance.warningsAreShown).toBeFalse();
    expect(componentInstance.showTopicEditOptions).toBeFalse();
    expect(componentInstance.topic).toEqual(topic);
    expect(componentInstance.discardChangesButtonIsShown).toBeFalse();
    expect(componentInstance.validationIssues).toEqual([]);
    expect(componentInstance.topicRights).toEqual(
      new TopicRights(false, false, false)
    );
  });

  it('should validate topic when topic is initialised', () => {
    spyOn(urlService, 'getTopicIdFromUrl').and.returnValue('topic_1');
    spyOn(topicEditorStateService, 'getTopic').and.returnValue(topic);
    spyOnProperty(topicEditorStateService, 'onTopicInitialized').and
      .returnValue(topicInitializedEventEmitter);
    spyOn(topicEditorStateService, 'getTopicWithNameExists').and.returnValue(
      false);
    spyOn(topicEditorStateService, 'getTopicWithUrlFragmentExists').and
      .returnValue(false);
    componentInstance.ngOnInit();

    expect(componentInstance.validationIssues).toEqual([]);
    expect(componentInstance.prepublishValidationIssues).toEqual([]);

    topicInitializedEventEmitter.emit();

    expect(componentInstance.validationIssues).toEqual([
      'Topic url fragment is not valid.'
    ]);
    expect(componentInstance.prepublishValidationIssues).toEqual([
      'Topic should have a thumbnail.',
      'Subtopic with title subtopic1 does not have any skill IDs linked.',
      'Topic should have page title fragment.',
      'Topic should have meta tag content.',
      'Subtopic subtopic1 should have a thumbnail.'
    ]);
  });

  it('should validate topic when topic is reinitialised', () => {
    spyOn(urlService, 'getTopicIdFromUrl').and.returnValue('topic_1');
    spyOn(topicEditorStateService, 'getTopic').and.returnValue(topic);
    spyOnProperty(topicEditorStateService, 'onTopicReinitialized').and
      .returnValue(topicReinitializedEventEmitter);
    spyOn(topicEditorStateService, 'getTopicWithNameExists').and.returnValue(
      true);
    spyOn(topicEditorStateService, 'getTopicWithUrlFragmentExists').and
      .returnValue(true);
    componentInstance.ngOnInit();

    expect(componentInstance.validationIssues).toEqual([]);
    expect(componentInstance.prepublishValidationIssues).toEqual([]);

    topicReinitializedEventEmitter.emit();

    expect(componentInstance.validationIssues).toEqual([
      'Topic url fragment is not valid.',
      'A topic with this name already exists.',
      'Topic URL fragment already exists.'
    ]);
    expect(componentInstance.prepublishValidationIssues).toEqual([
      'Topic should have a thumbnail.',
      'Subtopic with title subtopic1 does not have any skill IDs linked.',
      'Topic should have page title fragment.',
      'Topic should have meta tag content.',
      'Subtopic subtopic1 should have a thumbnail.'
    ]);
  });

  it('should load content properly', () => {
    spyOn(componentInstance, 'getChangeListLength').and.returnValue(1);
    spyOn(componentInstance, 'isTopicSaveable').and.returnValue(true);
    spyOn(componentInstance, 'getTotalWarningsCount').and.returnValue(1);

    componentInstance.ngAfterContentChecked();

    expect(componentInstance.changeListLength).toEqual(1);
    expect(componentInstance.totalWarningsCount).toEqual(1);
    expect(componentInstance.topicIsSaveable).toBe(true);
  });

  it('should validate topic when user undo or redo changes', () => {
    spyOn(urlService, 'getTopicIdFromUrl').and.returnValue('topic_1');
    spyOn(topicEditorStateService, 'getTopic').and.returnValue(topic);
    spyOn(undoRedoService, 'getUndoRedoChangeEventEmitter').and
      .returnValue(undoRedoChangeAppliedEventEmitter);
    spyOn(topicEditorStateService, 'getTopicWithNameExists').and.returnValue(
      false);
    spyOn(topicEditorStateService, 'getTopicWithUrlFragmentExists').and
      .returnValue(false);
    componentInstance.ngOnInit();

    expect(componentInstance.validationIssues).toEqual([]);
    expect(componentInstance.prepublishValidationIssues).toEqual([]);

    undoRedoChangeAppliedEventEmitter.emit();

    expect(componentInstance.validationIssues).toEqual([
      'Topic url fragment is not valid.'
    ]);
    expect(componentInstance.prepublishValidationIssues).toEqual([
      'Topic should have a thumbnail.',
      'Subtopic with title subtopic1 does not have any skill IDs linked.',
      'Topic should have page title fragment.',
      'Topic should have meta tag content.',
      'Subtopic subtopic1 should have a thumbnail.'
    ]);
  });

  it('should return true when topic saving is in progress', () => {
    spyOn(topicEditorStateService, 'isSavingTopic').and.returnValue(true);

    expect(componentInstance.isSaveInProgress()).toBeTrue();
  });

  it('should return false when topic saving is not in progress', () => {
    spyOn(topicEditorStateService, 'isSavingTopic').and.returnValue(false);

    expect(componentInstance.isSaveInProgress()).toBeFalse();
  });

  it('should return active tab name when called', () => {
    spyOn(topicEditorRoutingService, 'getActiveTabName').and
      .returnValue('topic_editor');

    expect(componentInstance.getActiveTabName()).toBe('topic_editor');
  });

  it('should return the navbar text on mobile', () => {
    componentInstance.selectQuestionsTab();
    let routingSpy = spyOn(
      topicEditorRoutingService, 'getActiveTabName');
    routingSpy.and.returnValue('questions');
    expect(componentInstance.getMobileNavigatorText()).toBe('Questions');
    routingSpy.and.returnValue('subtopic_editor');
    expect(componentInstance.getMobileNavigatorText()).toEqual('Editor');
    routingSpy.and.returnValue('subtopic_preview');
    expect(componentInstance.getMobileNavigatorText()).toEqual('Preview');
    routingSpy.and.returnValue('topic_preview');
    expect(componentInstance.getMobileNavigatorText()).toEqual('Preview');
    routingSpy.and.returnValue('main');
    expect(componentInstance.getMobileNavigatorText()).toEqual('Editor');
  });

  it('should navigate to main tab when user clicks the \'Editor\' ' +
  'option', () => {
    spyOn(topicEditorRoutingService, 'navigateToMainTab');
    componentInstance.activeTab = 'Question';
    componentInstance.showNavigationOptions = true;

    componentInstance.selectMainTab();

    expect(componentInstance.activeTab).toBe('Editor');
    expect(componentInstance.showNavigationOptions).toBe(false);
    expect(topicEditorRoutingService.navigateToMainTab).toHaveBeenCalled();
  });

  it('should navigate to Questions tab when user clicks the \'Questions\' ' +
  'option', () => {
    spyOn(topicEditorRoutingService, 'navigateToQuestionsTab');
    componentInstance.activeTab = 'Editor';
    componentInstance.showNavigationOptions = true;

    componentInstance.selectQuestionsTab();

    expect(componentInstance.activeTab).toBe('Questions');
    expect(componentInstance.showNavigationOptions).toBe(false);
    expect(topicEditorRoutingService.navigateToQuestionsTab).toHaveBeenCalled();
  });

  it('should open topic viewer when user clicks the \'preview\' button', () => {
    spyOn(undoRedoService, 'getChangeCount').and.returnValue(0);
    spyOn(topicEditorRoutingService, 'getActiveTabName').and
      .returnValue('topic_editor');
    spyOn(topicEditorStateService, 'getClassroomUrlFragment').and
      .returnValue('classroom_url');
    spyOn(windowRef.nativeWindow, 'open');
    componentInstance.topic = topic;

    componentInstance.openTopicViewer();

    expect(windowRef.nativeWindow.open).toHaveBeenCalledWith(
      '/learn/classroom_url/Url%20Fragment%20loading', 'blank');
  });

  it('should alert user to save changes when user clicks the ' +
  '\'preview\' button with unsaved changes', () => {
    spyOn(undoRedoService, 'getChangeCount').and.returnValue(1);
    spyOn(topicEditorRoutingService, 'getActiveTabName').and
      .returnValue('topic_editor');
    spyOn(alertsService, 'addInfoMessage');
    componentInstance.topic = topic;

    componentInstance.openTopicViewer();

    expect(alertsService.addInfoMessage).toHaveBeenCalledWith(
      'Please save all pending changes to preview the topic ' +
      'with the changes', 2000);
  });

  it('should open subtopic editor when user clicks the \'editor\' ' +
  'button in the subtopic preview page', () => {
    spyOn(topicEditorRoutingService, 'getActiveTabName').and
      .returnValue('subtopic_preview');
    spyOn(topicEditorRoutingService, 'getSubtopicIdFromUrl').and
      .returnValue(1);
    spyOn(topicEditorRoutingService, 'navigateToSubtopicEditorWithId');
    componentInstance.topic = topic;

    componentInstance.selectMainTab();

    expect(componentInstance.activeTab).toBe('Editor');
    expect(topicEditorRoutingService.navigateToSubtopicEditorWithId)
      .toHaveBeenCalledWith(1);
  });

  it('should open subtopic preview when user clicks the \'preview\' ' +
  'button in the subtopic editor page', () => {
    spyOn(topicEditorRoutingService, 'getActiveTabName').and
      .returnValue('subtopic_editor');
    spyOn(topicEditorRoutingService, 'getSubtopicIdFromUrl').and
      .returnValue(1);
    spyOn(topicEditorRoutingService, 'navigateToSubtopicPreviewTab');
    componentInstance.topic = topic;

    componentInstance.openTopicViewer();

    expect(componentInstance.activeTab).toBe('Preview');
    expect(topicEditorRoutingService.navigateToSubtopicPreviewTab)
      .toHaveBeenCalledWith(1);
  });

  it('should not send email when user who doesn\'t have publishing rights' +
  ' clicks the \'publish\' button and then cancels', fakeAsync(() => {
    spyOn(topicRightsBackendApiService, 'sendMailAsync').and.returnValue(
      Promise.resolve());
    spyOn(ngbModal, 'open').and.returnValue(
      {
        result: Promise.reject()
      } as NgbModalRef
    );
    spyOn(alertsService, 'addSuccessMessage');
    componentInstance.topicRights = TopicRights.createFromBackendDict({
      published: false,
      can_publish_topic: false,
      can_edit_topic: true
    });

    componentInstance.publishTopic();
    tick();

    expect(alertsService.addSuccessMessage).not.toHaveBeenCalled();
  }));

  it('should discard changes when user clicks \'Discard Changes\'' +
  ' button', () => {
    spyOn(topicEditorStateService, 'loadTopic');
    spyOn(undoRedoService, 'clearChanges');
    componentInstance.discardChangesButtonIsShown = true;
    componentInstance.topicId = 'topicId';

    componentInstance.discardChanges();

    expect(undoRedoService.clearChanges).toHaveBeenCalled();
    expect(componentInstance.discardChangesButtonIsShown).toBe(false);
    expect(topicEditorStateService.loadTopic).toHaveBeenCalledWith('topicId');
  });

  it('should return the number of changes when called', () => {
    spyOn(undoRedoService, 'getChangeCount').and.returnValue(1);

    expect(componentInstance.getChangeListLength()).toBe(1);
  });

  it('should return true when user can save topic', () => {
    spyOn(undoRedoService, 'getChangeCount').and.returnValue(1);
    componentInstance.topicRights = TopicRights.createFromBackendDict({
      published: false,
      can_publish_topic: true,
      can_edit_topic: true
    });
    componentInstance.validationIssues = [];
    componentInstance.prepublishValidationIssues = [];

    expect(componentInstance.isTopicSaveable()).toBeTrue();
  });

  it('should return false when there are no changes', () => {
    spyOn(undoRedoService, 'getChangeCount').and.returnValue(0);
    componentInstance.topicRights = TopicRights.createFromBackendDict({
      published: false,
      can_publish_topic: true,
      can_edit_topic: true
    });
    componentInstance.validationIssues = [];
    componentInstance.prepublishValidationIssues = [];

    expect(componentInstance.isTopicSaveable()).toBeFalse();
  });

  it('should return false when topic has wranings', () => {
    spyOn(undoRedoService, 'getChangeCount').and.returnValue(1);
    componentInstance.topicRights = TopicRights.createFromBackendDict({
      published: true,
      can_publish_topic: true,
      can_edit_topic: true
    });
    componentInstance.validationIssues = ['warn1'];
    componentInstance.prepublishValidationIssues = [];

    expect(componentInstance.isTopicSaveable()).toBeFalse();
  });

  it('should return false when topic has pre publish validation issues', () => {
    spyOn(undoRedoService, 'getChangeCount').and.returnValue(1);
    componentInstance.topicRights = TopicRights.createFromBackendDict({
      published: true,
      can_publish_topic: true,
      can_edit_topic: true
    });
    componentInstance.validationIssues = [];
    componentInstance.prepublishValidationIssues = ['warn1'];

    expect(componentInstance.isTopicSaveable()).toBeFalse();
  });

  it('should show discard button when changes are present', () => {
    componentInstance.showTopicEditOptions = true;
    componentInstance.discardChangesButtonIsShown = false;

    componentInstance.toggleDiscardChangeButton();

    expect(componentInstance.showTopicEditOptions).toBeFalse();
    expect(componentInstance.discardChangesButtonIsShown).toBeTrue();
  });

  it('should disable discard button when changes are present', () => {
    componentInstance.showTopicEditOptions = true;
    componentInstance.discardChangesButtonIsShown = true;

    componentInstance.toggleDiscardChangeButton();

    expect(componentInstance.showTopicEditOptions).toBeFalse();
    expect(componentInstance.discardChangesButtonIsShown).toBeFalse();
  });

  it('should save topic when user saves topic changes', fakeAsync(() => {
    const modalspy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return ({
        componentInstance: {
          topicIsPublished: true
        },
        result: Promise.resolve('commitMessage')
      } as NgbModalRef);
    });
    topicEditorStateService.setTopic(topic);
    componentInstance.topicRights = TopicRights.createFromBackendDict({
      published: true,
      can_publish_topic: true,
      can_edit_topic: true
    });
    spyOn(alertsService, 'addSuccessMessage');
    spyOn(topicEditorStateService, 'saveTopic').and.callFake(
      // This throws "Cannot set properties of undefined (setting
      // 'topicIsPublished')". We need to suppress this error because
      // we can't return a true value here for spyOn. We need to
      // return a promise here because the function is async.
      // @ts-ignore
      (commitMessage: string, successCallback: () => void) => {
        successCallback();
        expect(commitMessage).toBe('commitMessage');
      });
    componentInstance.saveChanges();
    tick();

    expect(modalspy).toHaveBeenCalled();
    expect(alertsService.addSuccessMessage)
      .toHaveBeenCalledWith('Changes Saved.');
  }));

  it('should close save topic modal when user clicks cancel', fakeAsync(() => {
    const modalspy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return ({
        componentInstance: {
          topicIsPublished: true
        },
        result: Promise.reject()
      } as NgbModalRef);
    });
    topicEditorStateService.setTopic(topic);
    componentInstance.topicRights = TopicRights.createFromBackendDict({
      published: true,
      can_publish_topic: true,
      can_edit_topic: true
    });
    spyOn(alertsService, 'addSuccessMessage');
    componentInstance.saveChanges();
    tick();

    expect(modalspy).toHaveBeenCalled();
    expect(alertsService.addSuccessMessage).not.toHaveBeenCalled();
  }));

  it('should toggle navigation option when user clicks the drop down' +
  ' button next to navigation options in mobile', () => {
    componentInstance.showNavigationOptions = true;

    componentInstance.toggleNavigationOptions();

    expect(componentInstance.showNavigationOptions).toBeFalse();

    componentInstance.toggleNavigationOptions();

    expect(componentInstance.showNavigationOptions).toBeTrue();
  });

  it('should toggle topic edit option when user clicks the drop down' +
  ' button next to topic edit options in mobile', () => {
    componentInstance.showTopicEditOptions = true;

    componentInstance.toggleTopicEditOptions();

    expect(componentInstance.showTopicEditOptions).toBeFalse();

    componentInstance.toggleTopicEditOptions();

    expect(componentInstance.showTopicEditOptions).toBeTrue();
  });

  it('should toggle warnings when user clicks the warning symbol in' +
  ' mobile', () => {
    componentInstance.warningsAreShown = true;

    componentInstance.toggleWarningText();

    expect(componentInstance.warningsAreShown).toBeFalse();

    componentInstance.toggleWarningText();

    expect(componentInstance.warningsAreShown).toBeTrue();
  });

  it('should validate topic when called', () => {
    componentInstance.topic = topic;

    componentInstance._validateTopic();

    expect(componentInstance.validationIssues).toEqual([
      'Topic url fragment is not valid.'
    ]);
    expect(componentInstance.prepublishValidationIssues).toEqual([
      'Topic should have a thumbnail.',
      'Subtopic with title subtopic1 does not have any skill IDs linked.',
      'Topic should have page title fragment.',
      'Topic should have meta tag content.',
      'Subtopic subtopic1 should have a thumbnail.'
    ]);
  });

  it('should return the total number of warnings when called', () => {
    componentInstance.topic = topic;
    componentInstance._validateTopic();
    expect(componentInstance.validationIssues).toEqual([
      'Topic url fragment is not valid.'
    ]);
    expect(componentInstance.prepublishValidationIssues).toEqual([
      'Topic should have a thumbnail.',
      'Subtopic with title subtopic1 does not have any skill IDs linked.',
      'Topic should have page title fragment.',
      'Topic should have meta tag content.',
      'Subtopic subtopic1 should have a thumbnail.'
    ]);

    expect(componentInstance.getTotalWarningsCount()).toBe(6);
  });

  it('should unpublish topic when user clicks the \'Unpublish\' button',
    fakeAsync(() => {
      componentInstance.topicRights = TopicRights.createFromBackendDict({
        published: true,
        can_publish_topic: true,
        can_edit_topic: true
      });
      componentInstance.showTopicEditOptions = true;
      spyOn(topicRightsBackendApiService, 'unpublishTopicAsync').and
        .returnValue(
          Promise.resolve() as unknown as Promise<TopicRightsBackendResponse>);
      spyOn(topicEditorStateService, 'setTopicRights');

      componentInstance.unpublishTopic();
      tick();

      expect(componentInstance.showTopicEditOptions).toBeFalse();
      expect(componentInstance.topicRights.isPublished()).toBe(false);
      expect(topicEditorStateService.setTopicRights).toHaveBeenCalledWith(
        TopicRights.createFromBackendDict({
          published: false,
          can_publish_topic: true,
          can_edit_topic: true
        })
      );
    }));

  it('should not unpublish topic if topic has not been published',
    fakeAsync(() => {
      componentInstance.topicRights = TopicRights.createFromBackendDict({
        published: false,
        can_publish_topic: false,
        can_edit_topic: true
      });
      spyOn(topicRightsBackendApiService, 'unpublishTopicAsync').and
        .returnValue(
          Promise.resolve() as unknown as Promise<TopicRightsBackendResponse>);

      componentInstance.unpublishTopic();
      tick();

      expect(componentInstance.topicRights.isPublished()).toBe(false);
    }));

  it('should publish topic when user clicks the \'publish\' button',
    fakeAsync(() => {
      spyOn(topicRightsBackendApiService, 'publishTopicAsync').and.returnValue(
        Promise.resolve() as unknown as Promise<TopicRightsBackendResponse>);
      spyOn(alertsService, 'addSuccessMessage');
      componentInstance.topicRights = TopicRights.createFromBackendDict({
        published: false,
        can_publish_topic: true,
        can_edit_topic: true
      });

      componentInstance.publishTopic();
      tick(100);

      expect(alertsService.addSuccessMessage)
        .toHaveBeenCalledWith('Topic published.', 1000);
      expect(componentInstance.topicRights.isPublished()).toBeTrue();
      expect(
        windowRef.nativeWindow.location.href).toBe(
        '/topics-and-skills-dashboard');
    }));

  it('should send email when user who doesn\'t have publishing rights' +
  ' clicks the \'publish\' button', fakeAsync(() => {
    spyOn(topicRightsBackendApiService, 'sendMailAsync').and.returnValue(
      Promise.resolve());
    spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return ({
        result: Promise.resolve('success')
      } as NgbModalRef);
    });
    spyOn(alertsService, 'addSuccessMessage');
    componentInstance.topicRights = TopicRights.createFromBackendDict({
      published: false,
      can_publish_topic: false,
      can_edit_topic: true
    });

    componentInstance.publishTopic();
    tick(100);

    expect(alertsService.addSuccessMessage)
      .toHaveBeenCalledWith('Mail Sent.', 1000);
  }));

  it('should return all the warnings when called', () => {
    componentInstance.topic = topic;
    componentInstance._validateTopic();
    expect(componentInstance.getAllTopicWarnings()).toEqual([
      'Topic url fragment is not valid.',
      'Topic should have a thumbnail.',
      'Subtopic with title subtopic1 does not have any skill IDs linked.',
      'Topic should have page title fragment.',
      'Topic should have meta tag content.',
      'Subtopic subtopic1 should have a thumbnail.'
    ].join('\n'));
  });

  it('should return true or false when called', () => {
    componentInstance.topic = topic;
    componentInstance._validateTopic();
    expect(componentInstance.isWarningTooltipDisabled()).toBeFalse();
  });
});
