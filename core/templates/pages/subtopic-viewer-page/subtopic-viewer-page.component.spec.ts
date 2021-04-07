// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for subtopic viewer page component.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// App.ts is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.
import { TestBed } from '@angular/core/testing';

import { OppiaAngularRootComponent } from
  'components/oppia-angular-root.component';
import { PageTitleService } from 'services/page-title.service';
import { ReadOnlySubtopicPageData } from 'domain/subtopic_viewer/read-only-subtopic-page-data.model';

require('pages/subtopic-viewer-page/subtopic-viewer-page.component.ts');

describe('Subtopic viewer page', function() {
  var ctrl = null;
  var $q = null;
  var $scope = null;
  var AlertsService = null;
  var SubtopicViewerBackendApiService = null;
  var UrlService = null;
  var WindowDimensionsService = null;
  var ContextService = null;

  var topicName = 'Topic Name';
  var abbreviatedTopicName = 'abbrev';
  var topicId = '1';
  var subtopicTitle = 'Subtopic Title';
  var subtopicUrlFragment = 'subtopic-title';

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(() => {
    OppiaAngularRootComponent.pageTitleService = (
      TestBed.get(PageTitleService)
    );
  });

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $q = $injector.get('$q');
    var $rootScope = $injector.get('$rootScope');
    AlertsService = $injector.get('AlertsService');
    ContextService = $injector.get('ContextService');
    SubtopicViewerBackendApiService = $injector.get(
      'SubtopicViewerBackendApiService');
    UrlService = $injector.get('UrlService');
    WindowDimensionsService = $injector.get('WindowDimensionsService');

    $scope = $rootScope.$new();
    ctrl = $componentController('subtopicViewerPage', {
      $scope: $scope
    });
  }));

  it('should succesfully get subtopic data and set context', function() {
    spyOn(UrlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
      abbreviatedTopicName);
    spyOn(UrlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
      'math');
    spyOn(UrlService, 'getSubtopicUrlFragmentFromLearnerUrl').and.returnValue(
      subtopicUrlFragment);
    var subtopicDataObject = (
      ReadOnlySubtopicPageData.createFromBackendDict({
        topic_id: topicId,
        topic_name: topicName,
        subtopic_title: subtopicTitle,
        page_contents: {
          subtitled_html: {
            content_id: '',
            html: 'This is a html'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {}
          }
        },
        next_subtopic_dict: {
          id: 1,
          title: '',
          skill_ids: [],
          thumbnail_filename: '',
          thumbnail_bg_color: '',
          url_fragment: subtopicUrlFragment
        }
      }));
    spyOn(SubtopicViewerBackendApiService, 'fetchSubtopicDataAsync').and
      .returnValue(
        $q.resolve(subtopicDataObject));
    spyOn(
      OppiaAngularRootComponent.pageTitleService,
      'setPageTitle').and.callThrough();
    spyOn(
      OppiaAngularRootComponent.pageTitleService,
      'updateMetaTag').and.callThrough();
    spyOn(ContextService, 'setCustomEntityContext').and.callThrough();
    spyOn(ContextService, 'removeCustomEntityContext').and.callThrough();

    expect(ctrl.nextSubtopicSummaryIsShown).toBe(false);

    ctrl.$onInit();
    $scope.$apply();

    expect(ctrl.pageContents.getHtml()).toBe('This is a html');
    expect(ctrl.subtopicTitle).toBe(subtopicTitle);
    expect(
      OppiaAngularRootComponent.pageTitleService.setPageTitle
    ).toHaveBeenCalledWith(`Review ${subtopicTitle} | Oppia`);
    expect(
      OppiaAngularRootComponent.pageTitleService.updateMetaTag
    ).toHaveBeenCalledWith(
      `Review the skill of ${subtopicTitle.toLowerCase()}.`);
    expect(ContextService.setCustomEntityContext).toHaveBeenCalledWith(
      'topic', topicId);

    expect(ctrl.parentTopicId).toBe(topicId);
    expect(ctrl.nextSubtopic).toEqual(subtopicDataObject.getNextSubtopic());
    expect(ctrl.nextSubtopicSummaryIsShown).toBe(true);

    ctrl.$onDestroy();
    expect(ContextService.removeCustomEntityContext).toHaveBeenCalled();
  });

  it('should use reject handler when fetching subtopic data fails',
    function() {
      spyOn(UrlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
        abbreviatedTopicName);
      spyOn(
        UrlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
        'math');
      spyOn(UrlService, 'getSubtopicUrlFragmentFromLearnerUrl').and.returnValue(
        subtopicUrlFragment);
      spyOn(SubtopicViewerBackendApiService, 'fetchSubtopicDataAsync').and
        .returnValue(
          $q.reject({
            status: 404
          }));
      spyOn(AlertsService, 'addWarning').and.callThrough();

      expect(ctrl.nextSubtopicSummaryIsShown).toBe(false);

      ctrl.$onInit();
      $scope.$apply();

      expect(AlertsService.addWarning).toHaveBeenCalledWith(
        'Failed to get subtopic data');
      expect(ctrl.nextSubtopicSummaryIsShown).toBe(false);
    });

  it('should check if the view is mobile or not', function() {
    var widthSpy = spyOn(WindowDimensionsService, 'getWidth');
    widthSpy.and.returnValue(400);
    expect(ctrl.checkMobileView()).toBe(true);

    widthSpy.and.returnValue(700);
    expect(ctrl.checkMobileView()).toBe(false);
  });
});
