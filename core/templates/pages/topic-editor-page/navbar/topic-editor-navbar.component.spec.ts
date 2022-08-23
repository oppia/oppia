// Copyright 2021 The Oppia Authors. All Rights Reserved.
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

import { EventEmitter } from '@angular/core';
import { fakeAsync, tick } from '@angular/core/testing';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ShortSkillSummary } from 'domain/skill/short-skill-summary.model';
import { Subtopic } from 'domain/topic/subtopic.model';
import { TopicRights } from 'domain/topic/topic-rights.model';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

describe('topicEditorNavbar', () => {
  let ctrl = null;
  let $scope = null;
  let $rootScope = null;
  let $window = null;
  let $uibModal = null;
  let TopicEditorStateService = null;
  let TopicObjectFactory = null;
  let UrlService = null;
  let topic = null;
  let UndoRedoService = null;
  let AlertsService = null;
  let ngbModal: NgbModal = null;
  let TopicEditorRoutingService = null;
  let TopicRightsBackendApiService = null;
  let topicInitializedEventEmitter = new EventEmitter();
  let topicReinitializedEventEmitter = new EventEmitter();
  let undoRedoChangeAppliedEventEmitter = new EventEmitter();

  importAllAngularServices();
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('NgbModal', {
      open: () => {
        return {
          result: Promise.resolve()
        };
      }
    });
  }));

  beforeEach(angular.mock.module('oppia', function($provide) {
    let mockWindow = {
      location: '',
      open: () => {}
    };
    $provide.value('$window', mockWindow);
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    TopicEditorStateService = $injector.get('TopicEditorStateService');
    ngbModal = $injector.get('NgbModal');
    TopicEditorRoutingService = $injector.get('TopicEditorRoutingService');
    TopicObjectFactory = $injector.get('TopicObjectFactory');
    UrlService = $injector.get('UrlService');
    UndoRedoService = $injector.get('UndoRedoService');
    $window = $injector.get('$window');
    AlertsService = $injector.get('AlertsService');
    TopicRightsBackendApiService =
      $injector.get('TopicRightsBackendApiService');
    $uibModal = $injector.get('$uibModal');
    ngbModal = $injector.get('NgbModal');

    var subtopic = Subtopic.createFromTitle(1, 'subtopic1');
    subtopic._skillIds = ['skill_1'];
    subtopic.setUrlFragment('dummy-url');
    let skillSummary = ShortSkillSummary.create(
      'skill_1', 'Description 1');
    topic = TopicObjectFactory.createInterstitialTopic();
    topic._uncategorizedSkillSummaries = [skillSummary];
    topic._subtopics = [subtopic];

    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    ctrl = $componentController('topicEditorNavbar', {
      $scope: $scope
    });
  }));

  afterEach(() => {
    ctrl.$onDestroy();
  });

  it('should initialise when user open the topic editor', () => {
    spyOn(UrlService, 'getTopicIdFromUrl').and.returnValue('topic_1');
    spyOn(TopicEditorStateService, 'getTopic').and.returnValue(topic);

    ctrl.$onInit();

    expect($scope.topicId).toBe('topic_1');
    expect($scope.navigationChoices).toEqual(['Topic', 'Questions', 'Preview']);
    expect($scope.activeTab).toEqual('Editor');
    expect($scope.showNavigationOptions).toBeFalse();
    expect($scope.warningsAreShown).toBeFalse();
    expect($scope.showTopicEditOptions).toBeFalse();
    expect($scope.topic).toEqual(topic);
    expect($scope.topicSkillIds).toEqual(['skill_1']);
    expect($scope.discardChangesButtonIsShown).toBeFalse();
    expect($scope.validationIssues).toEqual([]);
    expect($scope.topicRights).toEqual(
      TopicRights.createInterstitialRights()
    );
  });

  it('should validate topic when topic is initialised', () => {
    spyOn(UrlService, 'getTopicIdFromUrl').and.returnValue('topic_1');
    spyOn(TopicEditorStateService, 'getTopic').and.returnValue(topic);
    spyOnProperty(TopicEditorStateService, 'onTopicInitialized').and
      .returnValue(topicInitializedEventEmitter);
    spyOn(TopicEditorStateService, 'getTopicWithNameExists').and.returnValue(
      false);
    spyOn(TopicEditorStateService, 'getTopicWithUrlFragmentExists').and
      .returnValue(false);
    ctrl.$onInit();

    expect($scope.validationIssues).toEqual([]);
    expect($scope.prepublishValidationIssues).toEqual([]);

    topicInitializedEventEmitter.emit();

    expect($scope.validationIssues).toEqual([
      'Topic url fragment is not valid.'
    ]);
    expect($scope.prepublishValidationIssues).toEqual([
      'Topic should have a thumbnail.',
      'Subtopic with title subtopic1 does not have any skill IDs linked.',
      'Topic should have page title fragment.',
      'Topic should have meta tag content.',
      'Subtopic subtopic1 should have a thumbnail.'
    ]);
  });

  it('should validate topic when topic is reinitialised', () => {
    spyOn(UrlService, 'getTopicIdFromUrl').and.returnValue('topic_1');
    spyOn(TopicEditorStateService, 'getTopic').and.returnValue(topic);
    spyOnProperty(TopicEditorStateService, 'onTopicReinitialized').and
      .returnValue(topicReinitializedEventEmitter);
    spyOn(TopicEditorStateService, 'getTopicWithNameExists').and.returnValue(
      true);
    spyOn(TopicEditorStateService, 'getTopicWithUrlFragmentExists').and
      .returnValue(true);
    ctrl.$onInit();

    expect($scope.validationIssues).toEqual([]);
    expect($scope.prepublishValidationIssues).toEqual([]);

    topicReinitializedEventEmitter.emit();

    expect($scope.validationIssues).toEqual([
      'Topic url fragment is not valid.',
      'A topic with this name already exists.',
      'Topic URL fragment already exists.'
    ]);
    expect($scope.prepublishValidationIssues).toEqual([
      'Topic should have a thumbnail.',
      'Subtopic with title subtopic1 does not have any skill IDs linked.',
      'Topic should have page title fragment.',
      'Topic should have meta tag content.',
      'Subtopic subtopic1 should have a thumbnail.'
    ]);
  });

  it('should validate topic when user undo or redo changes', () => {
    spyOn(UrlService, 'getTopicIdFromUrl').and.returnValue('topic_1');
    spyOn(TopicEditorStateService, 'getTopic').and.returnValue(topic);
    spyOn(UndoRedoService, 'getUndoRedoChangeEventEmitter').and
      .returnValue(undoRedoChangeAppliedEventEmitter);
    spyOn(TopicEditorStateService, 'getTopicWithNameExists').and.returnValue(
      false);
    spyOn(TopicEditorStateService, 'getTopicWithUrlFragmentExists').and
      .returnValue(false);
    ctrl.$onInit();

    expect($scope.validationIssues).toEqual([]);
    expect($scope.prepublishValidationIssues).toEqual([]);

    undoRedoChangeAppliedEventEmitter.emit();

    expect($scope.validationIssues).toEqual([
      'Topic url fragment is not valid.'
    ]);
    expect($scope.prepublishValidationIssues).toEqual([
      'Topic should have a thumbnail.',
      'Subtopic with title subtopic1 does not have any skill IDs linked.',
      'Topic should have page title fragment.',
      'Topic should have meta tag content.',
      'Subtopic subtopic1 should have a thumbnail.'
    ]);
  });

  it('should return true when topic saving is in progress', () => {
    spyOn(TopicEditorStateService, 'isSavingTopic').and.returnValue(true);

    expect($scope.isSaveInProgress()).toBeTrue();
  });

  it('should return false when topic saving is not in progress', () => {
    spyOn(TopicEditorStateService, 'isSavingTopic').and.returnValue(false);

    expect($scope.isSaveInProgress()).toBeFalse();
  });

  it('should return active tab name when called', () => {
    spyOn(TopicEditorRoutingService, 'getActiveTabName').and
      .returnValue('topic_editor');

    expect($scope.getActiveTabName()).toBe('topic_editor');
  });

  it('should navigate to main tab when user clicks the \'Editor\' ' +
  'option', () => {
    spyOn(TopicEditorRoutingService, 'navigateToMainTab');
    $scope.activeTab = 'Question';
    $scope.showNavigationOptions = true;

    $scope.selectMainTab();

    expect($scope.activeTab).toBe('Editor');
    expect($scope.showNavigationOptions).toBe(false);
    expect(TopicEditorRoutingService.navigateToMainTab).toHaveBeenCalled();
  });

  it('should navigate to main tab when user clicks the \'Questions\' ' +
  'option', () => {
    spyOn(TopicEditorRoutingService, 'navigateToQuestionsTab');
    $scope.activeTab = 'Editor';
    $scope.showNavigationOptions = true;

    $scope.selectQuestionsTab();

    expect($scope.activeTab).toBe('Question');
    expect($scope.showNavigationOptions).toBe(false);
    expect(TopicEditorRoutingService.navigateToQuestionsTab).toHaveBeenCalled();
  });

  it('should open topic viewer when user clicks the \'preview\' button', () => {
    spyOn(UndoRedoService, 'getChangeCount').and.returnValue(0);
    spyOn(TopicEditorRoutingService, 'getActiveTabName').and
      .returnValue('topic_editor');
    spyOn(TopicEditorStateService, 'getClassroomUrlFragment').and
      .returnValue('classroom_url');
    spyOn($window, 'open');
    $scope.topic = topic;

    $scope.openTopicViewer();

    expect($window.open).toHaveBeenCalledWith(
      '/learn/classroom_url/Url%20Fragment%20loading', 'blank');
  });

  it('should alert user to save changes when user clicks the ' +
  '\'preview\' button with unsaved changes', () => {
    spyOn(UndoRedoService, 'getChangeCount').and.returnValue(1);
    spyOn(TopicEditorRoutingService, 'getActiveTabName').and
      .returnValue('topic_editor');
    spyOn(AlertsService, 'addInfoMessage');
    $scope.topic = topic;

    $scope.openTopicViewer();

    expect(AlertsService.addInfoMessage).toHaveBeenCalledWith(
      'Please save all pending changes to preview the topic ' +
      'with the changes', 2000);
  });

  it('should open subtopic preview when user clicks the \'preview\' ' +
  'button in the subtopic editor page', () => {
    spyOn(TopicEditorRoutingService, 'getActiveTabName').and
      .returnValue('subtopic_editor');
    spyOn(TopicEditorRoutingService, 'getSubtopicIdFromUrl').and
      .returnValue('subtopicId');
    spyOn(TopicEditorRoutingService, 'navigateToSubtopicPreviewTab');
    $scope.topic = topic;

    $scope.openTopicViewer();

    expect($scope.activeTab).toBe('Preview');
    expect(TopicEditorRoutingService.navigateToSubtopicPreviewTab)
      .toHaveBeenCalledWith('subtopicId');
  });

  it('should publish topic when user clicks the \'publish\' button',
    fakeAsync(() => {
      spyOn(TopicRightsBackendApiService, 'publishTopicAsync').and.returnValue(
        Promise.resolve());
      spyOn(AlertsService, 'addSuccessMessage');
      $scope.topicRights = TopicRights.createFromBackendDict({
        published: false,
        can_publish_topic: true,
        can_edit_topic: true
      });

      $scope.publishTopic();
      tick();

      expect(AlertsService.addSuccessMessage)
        .toHaveBeenCalledWith('Topic published.', 1000);
      expect($scope.topicRights.isPublished()).toBeTrue();
      expect($window.location).toBe('/topics-and-skills-dashboard');
    }));

  it('should send email when user who doesn\'t have publishing rights' +
  ' clicks the \'publish\' button', fakeAsync(() => {
    spyOn(TopicRightsBackendApiService, 'sendMailAsync').and.returnValue(
      Promise.resolve());
    spyOn($uibModal, 'open').and.returnValue({
      result: Promise.resolve()
    });
    spyOn(AlertsService, 'addSuccessMessage');
    $scope.topicRights = TopicRights.createFromBackendDict({
      published: false,
      can_publish_topic: false,
      can_edit_topic: true
    });

    $scope.publishTopic();
    tick();

    expect(AlertsService.addSuccessMessage)
      .toHaveBeenCalledWith('Mail Sent.', 1000);
  }));

  it('should not send email when user who doesn\'t have publishing rights' +
  ' clicks the \'publish\' button and then cancels', fakeAsync(() => {
    spyOn(TopicRightsBackendApiService, 'sendMailAsync').and.returnValue(
      Promise.resolve());
    spyOn(ngbModal, 'open').and.returnValue(
      {
        result: Promise.reject()
      } as NgbModalRef
    );
    spyOn(AlertsService, 'addSuccessMessage');
    $scope.topicRights = TopicRights.createFromBackendDict({
      published: false,
      can_publish_topic: false,
      can_edit_topic: true
    });

    $scope.publishTopic();
    tick();

    expect(AlertsService.addSuccessMessage).not.toHaveBeenCalled();
  }));

  it('should discard changes when user clicks \'Discard Changes\'' +
  ' button', () => {
    spyOn(TopicEditorStateService, 'loadTopic');
    spyOn(UndoRedoService, 'clearChanges');
    $scope.discardChangesButtonIsShown = true;
    $scope.topicId = 'topicId';

    $scope.discardChanges();

    expect(UndoRedoService.clearChanges).toHaveBeenCalled();
    expect($scope.discardChangesButtonIsShown).toBe(false);
    expect(TopicEditorStateService.loadTopic).toHaveBeenCalledWith('topicId');
  });

  it('should return the number of changes when called', () => {
    spyOn(UndoRedoService, 'getChangeCount').and.returnValue(1);

    expect($scope.getChangeListLength()).toBe(1);
  });

  it('should return true when user can save topic', () => {
    spyOn(UndoRedoService, 'getChangeCount').and.returnValue(1);
    $scope.topicRights = TopicRights.createFromBackendDict({
      published: false,
      can_publish_topic: true,
      can_edit_topic: true
    });
    $scope.validationIssues = [];
    $scope.prepublishValidationIssues = [];

    expect($scope.isTopicSaveable()).toBeTrue();
  });

  it('should return false when there are no changes', () => {
    spyOn(UndoRedoService, 'getChangeCount').and.returnValue(0);
    $scope.topicRights = TopicRights.createFromBackendDict({
      published: false,
      can_publish_topic: true,
      can_edit_topic: true
    });
    $scope.validationIssues = [];
    $scope.prepublishValidationIssues = [];

    expect($scope.isTopicSaveable()).toBeFalse();
  });

  it('should return false when topic has wranings', () => {
    spyOn(UndoRedoService, 'getChangeCount').and.returnValue(1);
    $scope.topicRights = TopicRights.createFromBackendDict({
      published: true,
      can_publish_topic: true,
      can_edit_topic: true
    });
    $scope.validationIssues = ['warn1'];
    $scope.prepublishValidationIssues = [];

    expect($scope.isTopicSaveable()).toBeFalse();
  });

  it('should return false when topic has pre publish validation issues', () => {
    spyOn(UndoRedoService, 'getChangeCount').and.returnValue(1);
    $scope.topicRights = TopicRights.createFromBackendDict({
      published: true,
      can_publish_topic: true,
      can_edit_topic: true
    });
    $scope.validationIssues = [];
    $scope.prepublishValidationIssues = ['warn1'];

    expect($scope.isTopicSaveable()).toBeFalse();
  });

  it('should show discard button when changes are present', () => {
    $scope.showTopicEditOptions = true;
    $scope.discardChangesButtonIsShown = false;

    $scope.toggleDiscardChangeButton();

    expect($scope.showTopicEditOptions).toBeFalse();
    expect($scope.discardChangesButtonIsShown).toBeTrue();
  });

  it('should disable discard button when changes are present', () => {
    $scope.showTopicEditOptions = true;
    $scope.discardChangesButtonIsShown = true;

    $scope.toggleDiscardChangeButton();

    expect($scope.showTopicEditOptions).toBeFalse();
    expect($scope.discardChangesButtonIsShown).toBeFalse();
  });

  it('should save topic when user saves topic changes', fakeAsync(() => {
    const modalspy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return ({
        componentInstance: NgbModalRef,
        result: Promise.resolve('commitMessage')
      } as NgbModalRef);
    });
    TopicEditorStateService.setTopic(topic);
    $scope.topicRights = TopicRights.createFromBackendDict({
      published: true,
      can_publish_topic: true,
      can_edit_topic: true
    });
    spyOn(AlertsService, 'addSuccessMessage');
    spyOn(TopicEditorStateService, 'saveTopic').and.callFake(
      (msg, callback) => {
        callback();
        expect(msg).toBe('commitMessage');
      });
    $scope.saveChanges();
    tick();

    expect(modalspy).toHaveBeenCalled();
    expect(AlertsService.addSuccessMessage)
      .toHaveBeenCalledWith('Changes Saved.');
  }));

  it('should close save topic modal when user clicks cancel', fakeAsync(() => {
    const modalspy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return ({
        componentInstance: NgbModalRef,
        result: Promise.reject()
      } as NgbModalRef);
    });
    TopicEditorStateService.setTopic(topic);
    $scope.topicRights = TopicRights.createFromBackendDict({
      published: true,
      can_publish_topic: true,
      can_edit_topic: true
    });
    spyOn(AlertsService, 'addSuccessMessage');
    $scope.saveChanges();
    tick();

    expect(modalspy).toHaveBeenCalled();
    expect(AlertsService.addSuccessMessage).not.toHaveBeenCalled();
  }));

  it('should toggle navigation option when user clicks the drop down' +
  ' button next to navigation options in mobile', () => {
    $scope.showNavigationOptions = true;

    $scope.toggleNavigationOptions();

    expect($scope.showNavigationOptions).toBeFalse();

    $scope.toggleNavigationOptions();

    expect($scope.showNavigationOptions).toBeTrue();
  });

  it('should toggle topic edit option when user clicks the drop down' +
  ' button next to topic edit options in mobile', () => {
    $scope.showTopicEditOptions = true;

    $scope.toggleTopicEditOptions();

    expect($scope.showTopicEditOptions).toBeFalse();

    $scope.toggleTopicEditOptions();

    expect($scope.showTopicEditOptions).toBeTrue();
  });

  it('should toggle warnings when user clicks the warning symbol in' +
  ' mobile', () => {
    $scope.warningsAreShown = true;

    $scope.toggleWarningText();

    expect($scope.warningsAreShown).toBeFalse();

    $scope.toggleWarningText();

    expect($scope.warningsAreShown).toBeTrue();
  });

  it('should validate topic when called', () => {
    $scope.topic = topic;

    $scope._validateTopic();

    expect($scope.validationIssues).toEqual([
      'Topic url fragment is not valid.'
    ]);
    expect($scope.prepublishValidationIssues).toEqual([
      'Topic should have a thumbnail.',
      'Subtopic with title subtopic1 does not have any skill IDs linked.',
      'Topic should have page title fragment.',
      'Topic should have meta tag content.',
      'Subtopic subtopic1 should have a thumbnail.'
    ]);
  });

  it('should return the total number of warnings when called', () => {
    $scope.topic = topic;
    $scope._validateTopic();
    expect($scope.validationIssues).toEqual([
      'Topic url fragment is not valid.'
    ]);
    expect($scope.prepublishValidationIssues).toEqual([
      'Topic should have a thumbnail.',
      'Subtopic with title subtopic1 does not have any skill IDs linked.',
      'Topic should have page title fragment.',
      'Topic should have meta tag content.',
      'Subtopic subtopic1 should have a thumbnail.'
    ]);

    expect($scope.getTotalWarningsCount()).toBe(6);
  });

  it('should unpublish topic when user clicks the \'Unpublish\' button',
    fakeAsync(() => {
      $scope.topicRights = TopicRights.createFromBackendDict({
        published: true,
        can_publish_topic: true,
        can_edit_topic: true
      });
      $scope.showTopicEditOptions = true;
      spyOn(TopicRightsBackendApiService, 'unpublishTopicAsync').and
        .returnValue(Promise.resolve());
      spyOn(TopicEditorStateService, 'setTopicRights');

      $scope.unpublishTopic();
      tick();

      expect($scope.showTopicEditOptions).toBeFalse();
      expect($scope.topicRights.isPublished()).toBe(false);
      expect(TopicEditorStateService.setTopicRights).toHaveBeenCalledWith(
        TopicRights.createFromBackendDict({
          published: false,
          can_publish_topic: true,
          can_edit_topic: true
        })
      );
    }));

  it('should not unpublish topic if topic has not been published',
    fakeAsync(() => {
      $scope.topicRights = TopicRights.createFromBackendDict({
        published: false,
        can_publish_topic: false,
        can_edit_topic: true
      });
      spyOn(TopicRightsBackendApiService, 'unpublishTopicAsync').and
        .returnValue(Promise.resolve());

      $scope.unpublishTopic();
      tick();

      expect($scope.topicRights.isPublished()).toBe(false);
    }));
});
