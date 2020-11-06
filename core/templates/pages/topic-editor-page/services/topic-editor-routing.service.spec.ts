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
 * @fileoverview Unit tests for TopicEditorRoutingService.
 */
import { MockLocationStrategy } from '@angular/common/testing';
import { SpyLocation } from '@angular/common/testing';
import { Location } from '@angular/common';
import { TestBed } from '@angular/core/testing';
// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.

import { UpgradedServices } from 'services/UpgradedServices';

// ^^^ This block is to be removed.

import { TopicEditorRoutingService } from 'pages/topic-editor-page/services/topic-editor-routing.service';

fdescribe('Topic editor routing service', () => {
  beforeEach(angular.mock.module('oppia'));
  
  beforeEach(angular.mock.module('oppia', ($provide) => {
    let ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  // let $rootScope = null;
  // let $location = null;
  // let $window = null;
  let TERS: TopicEditorRoutingService;
  let locat: SpyLocation;
  

  // beforeEach(angular.mock.inject( ($injector) => {
  //   $rootScope = $injector.get('$rootScope');
  //   $location = $injector.get('$location');
  //   $window = $injector.get('$window');
  // }));

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TopicEditorRoutingService,
        {provide: Location, useClass: SpyLocation},
        // {provide: Location, useClass: MockLocationStrategy}
      ]
    });
    TERS = TestBed.get(TopicEditorRoutingService);
    locat =TestBed.get(Location);
  });

  it('should return the default active tab name', () => {
    expect(TERS.getActiveTabName()).toEqual('main');
  });

  it('should navigate to different tabs', () => {
    expect(TERS.getActiveTabName()).toEqual('main');
    
    TERS.navigateToSubtopicPreviewTab(1);
    locat.simulateHashChange('subtopic_preview');
    expect(
      TERS.getActiveTabName()).toEqual('subtopic_preview');

    TERS.navigateToSubtopicEditorWithId(1);
    
    expect(
      TERS.getActiveTabName()).toEqual('subtopic_editor');

    TERS.navigateToQuestionsTab();
    // $rootScope.$apply();
    expect(TERS.getActiveTabName()).toEqual('questions');

    TERS.navigateToMainTab();
    // $rootScope.$apply();
    expect(TERS.getActiveTabName()).toEqual('main');

    TERS.navigateToTopicPreviewTab();
    // $rootScope.$apply();
    expect(TERS.getActiveTabName()).toEqual(
      'topic_preview');
  });

  // it('should handle calls with unexpect paths', () => {
  //   expect(TERS.getActiveTabName()).toEqual('main');

  //   $location.path();
  //   $rootScope.$apply();
  //   expect(TERS.getActiveTabName()).toEqual('main');

  //   $location.path('');
  //   $rootScope.$apply();
  //   expect(TERS.getActiveTabName()).toEqual('main');
  // });

  // it('should navigate to skill editor', () => {
  //   spyOn($window, 'open').and.callFake(() => {
  //     return true;
  //   });
  //   TERS.navigateToSkillEditorWithId('10');
  //   expect($window.open).toHaveBeenCalled();
  //   expect($window.open).toHaveBeenCalledWith('/skill_editor/10');
  // });

  // it('should return last tab visited', () => {
  //   TERS.navigateToSubtopicEditorWithId(1);
  //   $rootScope.$apply();
  //   expect(TERS.getLastTabVisited()).toEqual('subtopic');
  //   TERS.navigateToMainTab();
  //   $rootScope.$apply();
  //   expect(TERS.getLastTabVisited()).toEqual('topic');
  // });

  // it('should return last visited subtopic id', () => {
  //   TERS.navigateToSubtopicPreviewTab(1);
  //   $rootScope.$apply();
  //   TERS.navigateToQuestionsTab();
  //   $rootScope.$apply();
  //   expect(TERS.getLastSubtopicIdVisited()).toEqual(1);

  //   TERS.navigateToSubtopicPreviewTab(5);
  //   $rootScope.$apply();
  //   TERS.navigateToQuestionsTab();
  //   $rootScope.$apply();
  //   expect(TERS.getLastSubtopicIdVisited()).toEqual(5);
  // });
});
