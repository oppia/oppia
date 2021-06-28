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

import { EventEmitter } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SkillDifficulty } from 'domain/skill/skill-difficulty.model';
import { SkillObjectFactory } from 'domain/skill/SkillObjectFactory';
import { importAllAngularServices } from 'tests/unit-test-utils';

/**
 * @fileoverview Unit test for Questions List Component.
 */

fdescribe('QuestionsListComponent', () => {
  let ctrl = null;
  let $rootScope = null;
  let $scope = null;
  let $q = null;

  let ngbModal: NgbModal;
  let WindowDimensionsService = null;
  let QuestionsListService = null;
  let SkillEditorRoutingService = null;
  let SkillBackendApiService = null;
  let skillObjectFactory: SkillObjectFactory;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(() => {
    ngbModal = TestBed.inject(NgbModal);
    skillObjectFactory = TestBed.inject(SkillObjectFactory);
  });

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $q = $injector.get('$q');

    WindowDimensionsService = $injector.get('WindowDimensionsService');
    QuestionsListService = $injector.get('QuestionsListService');
    SkillEditorRoutingService = $injector.get('SkillEditorRoutingService');
    SkillBackendApiService = $injector.get('SkillBackendApiService');

    ctrl = $componentController('questionsList', {
      $scope: $scope,
      NgbModal: ngbModal
    }, {
      getSelectedSkillId: () => {},
      getSkillIds: () => {},
      getSkillIdToRubricsObject: () => {},
      selectSkillModalIsShown: () => {},
    });

    spyOn(ctrl, 'getSelectedSkillId').and.returnValue('skillId1');
    spyOn(ctrl, 'getSkillIds').and.returnValue(['skillId1', 'skillId2']);
  }));

  it('should set component properties on initialization', () => {
    spyOn(WindowDimensionsService, 'isWindowNarrow').and.returnValue(true);

    expect(ctrl.showDifficultyChoices).toBe(undefined);
    expect(ctrl.difficultyCardIsShown).toBe(undefined);
    expect(ctrl.associatedSkillSummaries).toEqual(undefined);
    expect(ctrl.selectedSkillId).toBe(undefined);
    expect(ctrl.editorIsOpen).toBe(undefined);
    expect(ctrl.deletedQuestionIds).toEqual(undefined);
    expect(ctrl.questionEditorIsShown).toBe(undefined);
    expect(ctrl.questionIsBeingUpdated).toBe(undefined);

    ctrl.$onInit();

    expect(ctrl.showDifficultyChoices).toBe(false);
    expect(ctrl.difficultyCardIsShown).toBe(false);
    expect(ctrl.associatedSkillSummaries).toEqual([]);
    expect(ctrl.selectedSkillId).toBe('skillId1');
    expect(ctrl.editorIsOpen).toBe(false);
    expect(ctrl.deletedQuestionIds).toEqual([]);
    expect(ctrl.questionEditorIsShown).toBe(false);
    expect(ctrl.questionIsBeingUpdated).toBe(false);

    ctrl.$onDestroy();
  });

  it('should subscribe to question summaries init event on' +
    ' component initialization', () => {
    spyOn(QuestionsListService.onQuestionSummariesInitialized, 'subscribe');

    ctrl.$onInit();

    expect(QuestionsListService.onQuestionSummariesInitialized.subscribe)
      .toHaveBeenCalled();
  });

  it('should reset history and fetch question summaries on' +
    ' initialization', () => {
    let resetHistoryAndFetch = true;
    spyOn(QuestionsListService, 'getQuestionSummariesAsync');

    expect(ctrl.skillIds).toEqual(undefined);

    ctrl.$onInit();

    expect(ctrl.skillIds).toEqual(['skillId1', 'skillId2']);
    expect(QuestionsListService.getQuestionSummariesAsync).toHaveBeenCalledWith(
      'skillId1', resetHistoryAndFetch, resetHistoryAndFetch
    );
  });

  it('should not reset history and fetch question summaries when question' +
    ' summaries are initialized', () => {
    let resetHistoryAndFetch = false;
    let questionSummariesInitializedEmitter = new EventEmitter();
    spyOnProperty(QuestionsListService, 'onQuestionSummariesInitialized')
      .and.returnValue(questionSummariesInitializedEmitter);
    spyOn(QuestionsListService, 'getQuestionSummariesAsync');

    ctrl.$onInit();

    questionSummariesInitializedEmitter.emit();

    expect(QuestionsListService.getQuestionSummariesAsync).toHaveBeenCalledWith(
      'skillId1', resetHistoryAndFetch, resetHistoryAndFetch
    );
  });

  it('should fetch misconception ids for selected skill on initialization', () => {
    spyOn(SkillBackendApiService, 'fetchSkillAsync').and.returnValue($q.resolve(
      {
        skill: skillObjectFactory.createFromBackendDict({
          id: 'skillId1',
          description: 'test description 1',
          misconceptions: [{
            id: '2',
            name: 'test name',
            notes: 'test notes',
            feedback: 'test feedback',
            must_be_addressed: true
          }],
          rubrics: [],
          skill_contents: {
            explanation: {
              html: 'test explanation',
              content_id: 'explanation',
            },
            worked_examples: [],
            recorded_voiceovers: {
              voiceovers_mapping: {}
            }
          },
          language_code: 'en',
          version: 3,
          prerequisite_skill_ids: [],
          all_questions_merged: null,
          next_misconception_id: null,
          superseding_skill_id: null
        })
      }
    ));

    expect(ctrl.misconceptionIdsForSelectedSkill).toEqual(undefined);

    ctrl.$onInit();
    $scope.$apply();

    expect(ctrl.misconceptionIdsForSelectedSkill).toEqual(['2']);
  });

  it('should start creating question on navigating to question editor', () => {
    spyOn(SkillEditorRoutingService, 'navigateToQuestionEditor')
      .and.returnValue(true);
    spyOn(ctrl, 'createQuestion').and.stub();

    ctrl.$onInit();

    expect(ctrl.createQuestion).toHaveBeenCalled();
  });

  it('should get selected skill id when a question is created', () => {
    // When modal is not shown, then newQuestionSkillIds get the values of
    // skillIds.
    spyOn(ctrl, 'selectSkillModalIsShown').and.returnValues(true, false);
    ctrl.skillIds = ['skillId2'];
    expect(ctrl.newQuestionSkillIds).toEqual(undefined);

    ctrl.createQuestion();

    expect(ctrl.newQuestionSkillIds).toEqual(['skillId1']);

    ctrl.createQuestion();

    expect(ctrl.newQuestionSkillIds).toEqual(['skillId2']);
  });

  it('should populate misconceptions when a question is created', () => {
    spyOn(SkillBackendApiService, 'fetchMultiSkillsAsync').and.returnValue(
      $q.resolve([{
        skill: skillObjectFactory.createFromBackendDict({
          id: 'skillId1',
          description: 'test description 1',
          misconceptions: [{
            id: '2',
            name: 'test name',
            notes: 'test notes',
            feedback: 'test feedback',
            must_be_addressed: true
          }],
          rubrics: [],
          skill_contents: {
            explanation: {
              html: 'test explanation',
              content_id: 'explanation',
            },
            worked_examples: [],
            recorded_voiceovers: {
              voiceovers_mapping: {}
            }
          },
          language_code: 'en',
          version: 3,
          prerequisite_skill_ids: [],
          all_questions_merged: null,
          next_misconception_id: null,
          superseding_skill_id: null
        })
      }])
    );
    ctrl.linkedSkillsWithDifficulty = [
      SkillDifficulty.create('skillId1', '', 1)
    ];
    console.error(ctrl.misconceptionsBySkill);

    ctrl.initiateQuestionCreation();

    console.error(ctrl.misconceptionsBySkill);
  });
});
