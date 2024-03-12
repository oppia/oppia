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
 * @fileoverview Unit tests for SkillEditorRoutingService.
 */

import {fakeAsync, TestBed, tick} from '@angular/core/testing';
import {SkillEditorRoutingService} from 'pages/skill-editor-page/services/skill-editor-routing.service';

describe('Skill Editor Routing Service', () => {
  let sers: SkillEditorRoutingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SkillEditorRoutingService],
    });

    sers = TestBed.inject(SkillEditorRoutingService);
    sers.navigateToMainTab();
  });

  it('should handler calls with unexpect paths', fakeAsync(() => {
    expect(sers.getActiveTabName()).toBe('main');
    expect(sers.getTabStatuses()).toBe('main');

    sers._changeTab('');
    tick();

    expect(sers.getActiveTabName()).toBe('main');
    expect(sers.getTabStatuses()).toBe('main');

    sers._changeTab('');
    tick();

    expect(sers.getActiveTabName()).toBe('main');
    expect(sers.getTabStatuses()).toBe('main');
  }));

  it('should toggle between main tab, questions and preview tab', fakeAsync(() => {
    sers.navigateToQuestionsTab();
    tick();

    expect(sers.getActiveTabName()).toBe('questions');
    expect(sers.getTabStatuses()).toBe('questions');

    sers.navigateToPreviewTab();
    tick();

    expect(sers.getActiveTabName()).toBe('preview');
    expect(sers.getTabStatuses()).toBe('preview');

    sers.navigateToMainTab();
    tick();

    expect(sers.getActiveTabName()).toBe('main');
    expect(sers.getTabStatuses()).toBe('main');
  }));

  it('should open the question-editor directly', fakeAsync(() => {
    sers.creatingNewQuestion(true);
    tick();
    expect(sers.navigateToQuestionEditor()).toBe(true);

    sers.creatingNewQuestion(false);
    tick();
    expect(sers.navigateToQuestionEditor()).toBe(false);
  }));
});
