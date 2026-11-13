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
 * @fileoverview Unit tests for the story node editor directive.
 */
// @ts-nocheck

import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {RecordedVoiceovers} from 'domain/exploration/recorded-voiceovers.model';
import {SubtitledHtml} from 'domain/exploration/subtitled-html.model';
import {ConceptCard} from 'domain/skill/concept-card.model';
import {Skill} from 'domain/skill/skill.model';
import {StoryUpdateService} from 'domain/story/story-update.service';
import {Story} from 'domain/story/story.model';
import {AlertsService} from 'services/alerts.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {StoryEditorStateService} from '../services/story-editor-state.service';
import {CuratedExplorationValidationService} from '../../../domain/exploration/curated-exploration-validation.service';
import {WindowDimensionsService} from '../../../services/contextual/window-dimensions.service';
import {StoryNodeEditorComponent} from './story-node-editor.component';
import {EditableStoryBackendApiService} from '../../../domain/story/editable-story-backend-api.service';
import {SkillBackendApiService} from '../../../domain/skill/skill-backend-api.service';
import {TopicsAndSkillsDashboardBackendApiService} from '../../../domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {PlatformFeatureService} from '../../../services/platform-feature.service';

class MockTopicsAndSkillsDashboardBackendApiService {
  fetchDashboardDataAsync = () => {
    return Promise.resolve({
      categorizedSkillsDict: {
        addition: {},
      },
      untriagedSkillSummaries: {
        addition: {},
      },
    });
  };
}

class MockSkillBackendApiService {
  fetchMultiSkillsAsync = (skillIds: string[]) => {
    // The skillId ='2' case is used to test the case when the
    // SkillBackendApiService rejects the request.
    if (skillIds[0] === '2') {
      return Promise.reject();
    } else {
      return Promise.resolve([
        new Skill(
          '1',
          'test',
          [],
          [],
          new ConceptCard(
            new SubtitledHtml('', '1'),
            RecordedVoiceovers.createEmpty()
          ),
          'en',
          1,
          1,
          '0',
          true,
          []
        ),
        new Skill(
          '2',
          'test2',
          [],
          [],
          new ConceptCard(
            new SubtitledHtml('', '1'),
            RecordedVoiceovers.createEmpty()
          ),
          'en',
          1,
          1,
          '0',
          true,
          []
        ),
        new Skill(
          '3',
          'test3',
          [],
          [],
          new ConceptCard(
            new SubtitledHtml('', '1'),
            RecordedVoiceovers.createEmpty()
          ),
          'en',
          1,
          1,
          '0',
          true,
          []
        ),
      ]);
    }
  };
}

class MockPlatformFeatureService {
  status = {
    SerialChapterLaunchCurriculumAdminView: {
      isEnabled: false,
    },
  };
}

describe('Story node editor component', () => {
  let fixture: ComponentFixture<StoryNodeEditorComponent>;
  let component: StoryNodeEditorComponent;
  let ngbModal: NgbModal;
  let story: Story;
  let windowDimensionsService: WindowDimensionsService;
  let storyUpdateService: StoryUpdateService;
  let curatedExplorationValidationService: CuratedExplorationValidationService;
  let alertsService: AlertsService;
  let storyEditorStateService: StoryEditorStateService;
  let focusManagerService: FocusManagerService;
  let modalRef: {
    componentInstance: Record<string, string>;
    result: Promise<string | object | void>;
  };
  let mockPlatformFeatureService = new MockPlatformFeatureService();
  let mockEventEmitterLast = new EventEmitter();

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      // FormsModule is needed so that submitting the exploration ID form
      // emits ngSubmit.
      imports: [HttpClientTestingModule, FormsModule],
      declarations: [StoryNodeEditorComponent],
      providers: [
        WindowDimensionsService,
        StoryUpdateService,
        AlertsService,
        CuratedExplorationValidationService,
        StoryEditorStateService,
        FocusManagerService,
        EditableStoryBackendApiService,
        {
          provide: PlatformFeatureService,
          useValue: mockPlatformFeatureService,
        },
        {
          provide: SkillBackendApiService,
          useClass: MockSkillBackendApiService,
        },
        {
          provide: TopicsAndSkillsDashboardBackendApiService,
          useClass: MockTopicsAndSkillsDashboardBackendApiService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StoryNodeEditorComponent);
    component = fixture.componentInstance;
    ngbModal = TestBed.inject(NgbModal);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    curatedExplorationValidationService = TestBed.inject(
      CuratedExplorationValidationService
    );
    alertsService = TestBed.inject(AlertsService);
    storyUpdateService = TestBed.inject(StoryUpdateService);
    storyEditorStateService = TestBed.inject(StoryEditorStateService);
    focusManagerService = TestBed.inject(FocusManagerService);

    let sampleStoryBackendObject = {
      id: 'sample_story_id',
      title: 'Story title',
      description: 'Story description',
      notes: 'Story notes',
      version: 1,
      corresponding_topic_id: 'topic_id',
      thumbnail_filename: 'fileName',
      thumbnail_bg_color: 'blue',
      url_fragment: 'story_title',
      meta_tag_content: 'meta',
      story_contents: {
        initial_node_id: 'node_2',
        nodes: [
          {
            id: 'simple',
            title: 'Title 1',
            description: 'Description 1',
            prerequisite_skill_ids: ['skill_1'],
            acquired_skill_ids: ['skill_2'],
            destination_node_ids: [],
            outline: 'Outline',
            exploration_id: null,
            outline_is_finalized: false,
            thumbnail_filename: null,
            thumbnail_bg_color: null,
            status: 'Draft',
            planned_publication_date_msecs: null,
            last_modified_msecs: null,
            first_publication_date_msecs: null,
            unpublishing_reason: null,
          },
          {
            id: 'node_1',
            title: 'Title 1',
            description: 'Description 1',
            prerequisite_skill_ids: ['skill_1'],
            acquired_skill_ids: ['skill_2'],
            destination_node_ids: [],
            outline: 'Outline',
            exploration_id: null,
            outline_is_finalized: false,
            thumbnail_filename: null,
            thumbnail_bg_color: null,
            status: 'Draft',
            planned_publication_date_msecs: 168960000000,
            last_modified_msecs: null,
            first_publication_date_msecs: null,
            unpublishing_reason: null,
          },
          {
            id: 'node_2',
            title: 'Title 2',
            description: 'Description 2',
            prerequisite_skill_ids: ['skill_3'],
            acquired_skill_ids: ['skill_4'],
            destination_node_ids: ['node_1'],
            outline: 'Outline 2',
            exploration_id: 'exp_1',
            outline_is_finalized: true,
            thumbnail_filename: null,
            thumbnail_bg_color: null,
            status: 'Draft',
            planned_publication_date_msecs: null,
            last_modified_msecs: null,
            first_publication_date_msecs: null,
            unpublishing_reason: null,
          },
          {
            id: 'break',
            title: 'Title 2',
            description: 'Description 2',
            prerequisite_skill_ids: ['skill_3'],
            acquired_skill_ids: ['skill_4'],
            destination_node_ids: ['node_1'],
            outline: 'Outline 2',
            exploration_id: 'exp_1',
            outline_is_finalized: true,
            thumbnail_filename: null,
            thumbnail_bg_color: null,
            status: 'Draft',
            planned_publication_date_msecs: null,
            last_modified_msecs: null,
            first_publication_date_msecs: null,
            unpublishing_reason: null,
          },
        ],
        next_node_id: 'node_3',
      },
      language_code: 'en',
    };
    story = Story.createFromBackendDict(sampleStoryBackendObject);

    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(true);
    spyOn(storyEditorStateService, 'getSkillSummaries').and.returnValue([
      {id: '1', description: 'Skill description'},
    ]);
    spyOn(storyEditorStateService, 'getStory').and.returnValue(story);
    spyOn(storyEditorStateService, 'getClassroomUrlFragment').and.returnValue(
      'math'
    );
    spyOn(storyEditorStateService, 'getTopicUrlFragment').and.returnValue(
      'fractions'
    );
    spyOn(storyEditorStateService, 'getTopicName').and.returnValue('addition');
    spyOnProperty(
      storyEditorStateService,
      'onRecalculateAvailableNodes'
    ).and.returnValue(mockEventEmitterLast);

    component.nodeId = 'node1';
    component.storyNodeIds = ['node1', 'node_2', 'node_3', 'wroking'];
    component.destinationNodeIds = ['node_2'];
    component.ngOnInit();

    modalRef = {
      componentInstance: {},
      result: Promise.resolve('success'),
    };
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should init the controller', () => {
    component.viewNodeEditor('node_1');

    expect(component.chapterPreviewCardIsShown).toEqual(false);
    expect(component.mainChapterCardIsShown).toEqual(true);
    // No exploration is linked to the chapter, so the input field is shown.
    expect(component.explorationIdEditorIsShown).toEqual(true);
  });

  it('should get status of Serial Chapter Launch Feature flag', () => {
    expect(component.isSerialChapterFeatureFlagEnabled()).toEqual(false);

    mockPlatformFeatureService.status.SerialChapterLaunchCurriculumAdminView.isEnabled =
      true;
    expect(component.isSerialChapterFeatureFlagEnabled()).toEqual(true);
  });

  it('should return skill editor URL', () => {
    expect(component.getSkillEditorUrl('skill_1')).toEqual(
      '/skill_editor/skill_1'
    );
  });

  it('should return the exploration editor URL', () => {
    expect(component.getExplorationEditorUrl('exp_1')).toEqual('/create/exp_1');
  });

  describe('exploration ID field', () => {
    const query = (selector: string): HTMLElement | null =>
      fixture.nativeElement.querySelector(selector);

    // The first change detection run calls ngOnInit, which copies the
    // explorationId input into currentExplorationId.
    const renderChapterWithExploration = (explorationId: string | null) => {
      component.explorationId = explorationId;
      component.mainChapterCardIsShown = true;
      fixture.detectChanges();
    };

    it('should show the linked exploration as a view-only link', () => {
      renderChapterWithExploration('exp_1');

      const link = query('.e2e-test-exploration-id-link');
      expect(link?.getAttribute('href')).toEqual('/create/exp_1');
      expect(link?.getAttribute('target')).toEqual('_blank');
      expect(link?.getAttribute('rel')).toEqual('noopener');
      expect(link?.textContent?.trim()).toEqual('exp_1');
      expect(link?.getAttribute('aria-label')).toEqual(
        'exp_1 (opens the exploration editor in a new tab)'
      );
      expect(query('.e2e-test-edit-exploration-id-button')).not.toBeNull();
      expect(query('.e2e-test-exploration-id-input')).toBeNull();
    });

    it('should label the view-only link and edit button group in view mode', () => {
      renderChapterWithExploration('exp_1');

      // There is no input field to point to, so the label names the group.
      expect(query('.e2e-test-exploration-id-label')?.hasAttribute('for')).toBe(
        false
      );
      const group = query('.e2e-test-exploration-id-display');
      expect(group?.getAttribute('role')).toEqual('group');
      expect(group?.getAttribute('aria-labelledby')).toEqual(
        'storyNodeExplorationIdLabel'
      );
    });

    it('should point the label to the input field while editing', () => {
      renderChapterWithExploration('exp_1');

      component.openExplorationIdEditor();
      fixture.detectChanges();

      expect(
        query('.e2e-test-exploration-id-label')?.getAttribute('for')
      ).toEqual('storyNodeExplorationId');
      expect(query('#storyNodeExplorationId')).not.toBeNull();
    });

    it('should show the input field when no exploration is linked', () => {
      renderChapterWithExploration(null);

      expect(query('.e2e-test-exploration-id-input')).not.toBeNull();
      expect(query('.e2e-test-exploration-id-save-button')).not.toBeNull();
      // There is no saved exploration to go back to, so there is no Cancel
      // button, and no link.
      expect(query('.e2e-test-cancel-exploration-id-edit-button')).toBeNull();
      expect(query('.e2e-test-exploration-id-link')).toBeNull();
    });

    it('should switch to the input field when the edit button is clicked', fakeAsync(() => {
      renderChapterWithExploration('exp_1');
      const setFocusSpy = spyOn(focusManagerService, 'setFocus');

      query('.e2e-test-edit-exploration-id-button')?.click();
      fixture.detectChanges();

      expect(component.explorationIdEditorIsShown).toBe(true);
      expect(setFocusSpy).toHaveBeenCalledWith('storyNodeExplorationId');
      expect(query('.e2e-test-exploration-id-input')).not.toBeNull();
      expect(
        query('.e2e-test-cancel-exploration-id-edit-button')?.classList
      ).toContain('btn-sm');
      expect(
        query('.e2e-test-exploration-id-save-button')?.classList
      ).toContain('btn-sm');
      expect(query('.e2e-test-exploration-id-link')).toBeNull();
      flush();
    }));

    it('should restore the linked exploration when the edit is cancelled', () => {
      renderChapterWithExploration('exp_1');
      component.openExplorationIdEditor();
      component.explorationId = 'invalid id';
      component.expIdCanBeSaved = false;
      component.invalidExpErrorIsShown = true;

      component.cancelExplorationIdEdit();
      fixture.detectChanges();

      expect(component.explorationId).toEqual('exp_1');
      expect(component.expIdCanBeSaved).toBe(true);
      expect(component.invalidExpErrorIsShown).toBe(false);
      expect(component.explorationIdEditorIsShown).toBe(false);
      expect(query('.e2e-test-exploration-id-link')).not.toBeNull();
    });

    it('should save the exploration ID when the form is submitted', () => {
      renderChapterWithExploration('exp_1');
      component.openExplorationIdEditor();
      fixture.detectChanges();
      const updateExplorationIdSpy = spyOn(component, 'updateExplorationId');
      component.explorationId = 'exp_2';

      // Clicking Save (or pressing Enter in the input field) submits the form.
      query('.story-node-exploration form')?.dispatchEvent(new Event('submit'));

      expect(updateExplorationIdSpy).toHaveBeenCalledWith('exp_2');
    });

    it('should save an emptied exploration ID on submit, so that the existing message is shown', () => {
      renderChapterWithExploration('exp_1');
      const updateExplorationIdSpy = spyOn(component, 'updateExplorationId');
      component.explorationId = '';

      component.submitExplorationId();

      expect(updateExplorationIdSpy).toHaveBeenCalledWith('');
    });

    it('should not save an invalid exploration ID on submit', () => {
      renderChapterWithExploration('exp_1');
      const updateExplorationIdSpy = spyOn(component, 'updateExplorationId');
      // The (change) event, which updates expIdCanBeSaved, has not run yet.
      component.expIdCanBeSaved = true;
      component.explorationId = 'invalid id!';

      component.submitExplorationId();

      expect(updateExplorationIdSpy).not.toHaveBeenCalled();
      expect(component.expIdCanBeSaved).toBe(false);
      expect(component.invalidExpErrorIsShown).toBe(true);
    });

    it('should not save an unchanged exploration ID on submit', () => {
      renderChapterWithExploration('exp_1');
      const updateExplorationIdSpy = spyOn(component, 'updateExplorationId');

      component.submitExplorationId();

      expect(updateExplorationIdSpy).not.toHaveBeenCalled();
      expect(component.invalidExpErrorIsShown).toBe(false);
    });

    it('should not save a null exploration ID on submit', () => {
      // An exploration is only removed with the delete button, since the
      // input field gives an empty string when it is cleared.
      renderChapterWithExploration('exp_1');
      const updateExplorationIdSpy = spyOn(component, 'updateExplorationId');
      component.explorationId = null;

      component.submitExplorationId();

      expect(updateExplorationIdSpy).not.toHaveBeenCalled();
    });

    it('should not save a cleared input field on submit when no exploration is linked', () => {
      renderChapterWithExploration(null);
      const updateExplorationIdSpy = spyOn(component, 'updateExplorationId');
      // Something was typed and then erased.
      component.explorationId = '';

      component.submitExplorationId();

      expect(updateExplorationIdSpy).not.toHaveBeenCalled();
      expect(component.invalidExpErrorIsShown).toBe(false);
    });

    it('should treat an empty input field as no exploration when checking for changes', () => {
      renderChapterWithExploration(null);
      component.explorationId = '';
      expect(component.isExplorationIdChanged()).toBe(false);

      component.explorationId = 'exp_2';
      expect(component.isExplorationIdChanged()).toBe(true);

      component.currentExplorationId = 'exp_1';
      component.explorationId = 'exp_1';
      expect(component.isExplorationIdChanged()).toBe(false);

      // Clearing the field of a linked exploration is a change, so that the
      // existing message about the delete button is shown.
      component.explorationId = '';
      expect(component.isExplorationIdChanged()).toBe(true);
    });

    it('should show the delete button while editing if the story is not published', () => {
      spyOn(storyEditorStateService, 'isStoryPublished').and.returnValue(false);
      renderChapterWithExploration('exp_1');

      component.openExplorationIdEditor();
      fixture.detectChanges();

      expect(component.isStoryPublished()).toBe(false);
      const deleteButton = query('.e2e-test-delete-exploration-id-button');
      // A real button, so that it is reachable with the keyboard and has an
      // accessible name.
      expect(deleteButton?.tagName).toEqual('BUTTON');
      expect(deleteButton?.getAttribute('type')).toEqual('button');
      expect(deleteButton?.classList).toContain('btn-sm');
      expect(deleteButton?.getAttribute('aria-label')).toEqual(
        'Remove the exploration from this chapter'
      );
    });

    it('should remove the exploration when the delete button is clicked', () => {
      spyOn(storyEditorStateService, 'isStoryPublished').and.returnValue(false);
      renderChapterWithExploration('exp_1');
      component.openExplorationIdEditor();
      fixture.detectChanges();
      const updateExplorationIdSpy = spyOn(component, 'updateExplorationId');

      query('.e2e-test-delete-exploration-id-button')?.click();

      expect(updateExplorationIdSpy).toHaveBeenCalledWith(null);
    });

    it('should not show the delete button while editing if the story is published', () => {
      spyOn(storyEditorStateService, 'isStoryPublished').and.returnValue(true);
      renderChapterWithExploration('exp_1');

      component.openExplorationIdEditor();
      fixture.detectChanges();

      expect(component.isStoryPublished()).toBe(true);
      expect(query('.e2e-test-delete-exploration-id-button')).toBeNull();
    });

    it('should keep the input field when the edit is cancelled and no exploration is linked', () => {
      renderChapterWithExploration(null);
      component.explorationId = 'exp_2';

      component.cancelExplorationIdEdit();

      expect(component.explorationId).toBeNull();
      expect(component.explorationIdEditorIsShown).toBe(true);
    });
  });

  it('should fetch the descriptions for prerequisite skills', fakeAsync(() => {
    component.prerequisiteSkillIds = ['1', '2', '3'];

    component.getSkillsDescription(
      component.prerequisiteSkillIds,
      component.prerequisiteSkillIdToSummaryMap
    );
    tick();

    expect(component.prerequisiteSkillIdToSummaryMap).toEqual({
      1: 'test',
      2: 'test2',
      3: 'test3',
    });
  }));

  it('should fetch the descriptions for acquired skills', fakeAsync(() => {
    component.acquiredSkillIds = ['1', '2', '3'];

    component.getSkillsDescription(
      component.acquiredSkillIds,
      component.acquiredSkillIdToSummaryMap
    );
    tick();

    expect(component.acquiredSkillIdToSummaryMap).toEqual({
      1: 'test',
      2: 'test2',
      3: 'test3',
    });
  }));

  it('should call Alerts Service if getting acquired skill description fails', fakeAsync(() => {
    component.acquiredSkillIds = ['2'];
    let alertsSpy = spyOn(alertsService, 'addWarning').and.callThrough();

    component.getSkillsDescription(
      component.acquiredSkillIds,
      component.acquiredSkillIdToSummaryMap
    );
    tick();

    expect(alertsSpy).toHaveBeenCalled();
  }));

  it('should call Alerts Service if getting prerequisite skill description fails', fakeAsync(() => {
    component.prerequisiteSkillIds = ['2'];
    let alertsSpy = spyOn(alertsService, 'addWarning').and.callThrough();

    component.getSkillsDescription(
      component.prerequisiteSkillIds,
      component.prerequisiteSkillIdToSummaryMap
    );
    tick();

    expect(alertsSpy).toHaveBeenCalled();
  }));

  it('should check if exploration can be saved', () => {
    component.checkCanSaveExpId();

    expect(component.expIdCanBeSaved).toEqual(true);
  });

  it('should call StoryUpdate service remove prerequisite skill id', () => {
    let skillSpy = spyOn(
      storyUpdateService,
      'removePrerequisiteSkillIdFromNode'
    );

    component.removePrerequisiteSkillId('skill_3');

    expect(skillSpy).toHaveBeenCalled();
  });

  it('should call StoryUpdate service remove acquired skill id', () => {
    let skillSpy = spyOn(storyUpdateService, 'removeAcquiredSkillIdFromNode');

    component.removeAcquiredSkillId('node_1');

    expect(skillSpy).toHaveBeenCalled();
  });

  it('should toggle chapter preview card', () => {
    component.chapterPreviewCardIsShown = false;

    component.togglePreview();

    expect(component.chapterPreviewCardIsShown).toBe(true);
  });

  it('should untoggle chapter preview card', () => {
    component.chapterPreviewCardIsShown = true;

    component.togglePreview();

    expect(component.chapterPreviewCardIsShown).toBe(false);
  });

  it('should toggle prereq skill list', () => {
    component.prerequisiteSkillIsShown = true;

    component.togglePrerequisiteSkillsList();

    expect(component.prerequisiteSkillIsShown).toBe(false);
  });

  it('should toggle acquired skill list', () => {
    component.acquiredSkillIsShown = true;

    component.toggleAcquiredSkillsList();

    expect(component.acquiredSkillIsShown).toBe(false);
  });

  it('should call StoryUpdate service to set story thumbnail filename', () => {
    let storySpy = spyOn(storyUpdateService, 'setStoryNodeThumbnailFilename');
    let currentNodeIsPublishableSpy = spyOn(
      component,
      'updateCurrentNodeIsPublishable'
    );

    component.updateThumbnailFilename('new_file.png');

    expect(storySpy).toHaveBeenCalled();
    expect(currentNodeIsPublishableSpy).toHaveBeenCalled();
  });

  it('should call StoryUpdate service to set story thumbnail filename', () => {
    let storySpy = spyOn(storyUpdateService, 'setStoryNodeThumbnailBgColor');
    let currentNodeIsPublishableSpy = spyOn(
      component,
      'updateCurrentNodeIsPublishable'
    );

    component.updateThumbnailBgColor('#333');

    expect(storySpy).toHaveBeenCalled();
    expect(currentNodeIsPublishableSpy).toHaveBeenCalled();
  });

  it('should call StoryUpdate service to unfinalize story node outline', () => {
    let storySpy = spyOn(storyUpdateService, 'unfinalizeStoryNodeOutline');
    let currentNodeIsPublishableSpy = spyOn(
      component,
      'updateCurrentNodeIsPublishable'
    );

    component.unfinalizeOutline();

    expect(storySpy).toHaveBeenCalled();
    expect(currentNodeIsPublishableSpy).toHaveBeenCalled();
  });

  it('should call StoryUpdate service to finalize story node outline when editableOutline has some content', () => {
    let storySpy = spyOn(storyUpdateService, 'finalizeStoryNodeOutline');
    let currentNodeIsPublishableSpy = spyOn(
      component,
      'updateCurrentNodeIsPublishable'
    );
    component.editableOutline = 'Some outline text';
    component.finalizeOutline();

    expect(storySpy).toHaveBeenCalled();
    expect(currentNodeIsPublishableSpy).toHaveBeenCalled();
  });

  it('should call StoryUpdate service to unfinalize story node outline when editableOutline has no content', () => {
    let unfinalizeSpy = spyOn(storyUpdateService, 'unfinalizeStoryNodeOutline');
    let finalizeSpy = spyOn(storyUpdateService, 'finalizeStoryNodeOutline');
    let currentNodeIsPublishableSpy = spyOn(
      component,
      'updateCurrentNodeIsPublishable'
    );

    component.editableOutline = '';
    component.finalizeOutline();

    expect(unfinalizeSpy).toHaveBeenCalled();
    expect(finalizeSpy).not.toHaveBeenCalled();
    expect(component.outlineIsFinalized).toBe(false);
    expect(currentNodeIsPublishableSpy).toHaveBeenCalled();
  });

  it('should return true from canFinalize if editableOutline has content', () => {
    component.editableOutline = 'Some outline text';

    expect(component.canFinalize()).toBe(true);
  });

  it('should return false from canFinalize if editableOutline has no content', () => {
    component.editableOutline = '';

    expect(component.canFinalize()).toBe(false);
  });

  it('should call StoryUpdate service to update outline', () => {
    let storySpy = spyOn(storyUpdateService, 'setStoryNodeOutline');

    component.updateOutline('New outline');

    expect(storySpy).toHaveBeenCalled();
  });

  it('should call StoryUpdate service to update description', () => {
    let storySpy = spyOn(storyUpdateService, 'setStoryNodeDescription');
    let currentNodeIsPublishableSpy = spyOn(
      component,
      'updateCurrentNodeIsPublishable'
    );

    component.updateDescription('New description');

    expect(storySpy).toHaveBeenCalled();
    expect(currentNodeIsPublishableSpy).toHaveBeenCalled();
  });

  it('should call StoryUpdate service to update planned publication date', () => {
    let storySpy = spyOn(
      storyUpdateService,
      'setStoryNodePlannedPublicationDateMsecs'
    );
    let currentNodeIsPublishableSpy = spyOn(
      component,
      'updateCurrentNodeIsPublishable'
    );

    component.plannedPublicationDate = null;
    component.updatePlannedPublicationDate(null);
    expect(currentNodeIsPublishableSpy).toHaveBeenCalled();
    expect(
      storyUpdateService.setStoryNodePlannedPublicationDateMsecs
    ).toHaveBeenCalledTimes(0);

    let pastDate = new Date('2000-09-09');
    component.updatePlannedPublicationDate(pastDate);
    expect(currentNodeIsPublishableSpy).toHaveBeenCalled();
    expect(
      storyUpdateService.setStoryNodePlannedPublicationDateMsecs
    ).toHaveBeenCalledTimes(0);
    expect(component.plannedPublicationDate).toBe(null);
    expect(component.plannedPublicationDateIsInPast).toBe(true);

    let futureDate = new Date('2037-04-20');
    component.updatePlannedPublicationDate(futureDate);
    expect(storySpy).toHaveBeenCalledWith(
      component.story,
      component.nodeId,
      futureDate.getTime()
    );
    expect(currentNodeIsPublishableSpy).toHaveBeenCalled();
    expect(component.plannedPublicationDateIsInPast).toBe(false);

    component.updatePlannedPublicationDate(null);
    expect(storySpy).toHaveBeenCalled();
    expect(currentNodeIsPublishableSpy).toHaveBeenCalled();
    expect(component.plannedPublicationDate).toBe(null);
    expect(component.plannedPublicationDateIsInPast).toBe(false);

    component.plannedPublicationDate = new Date();
    component.updatePlannedPublicationDate(pastDate);
    expect(storySpy).toHaveBeenCalled();
  });

  it('should convert the date input value into a Date', () => {
    component.setEditablePlannedPublicationDate('2037-04-20');
    expect(component.editablePlannedPublicationDate).toEqual(
      new Date('2037-04-20')
    );

    component.setEditablePlannedPublicationDate('');
    expect(component.editablePlannedPublicationDate).toBeNull();
  });

  it('should update planned publication date when passed a Date', () => {
    let storySpy = spyOn(
      storyUpdateService,
      'setStoryNodePlannedPublicationDateMsecs'
    );
    component.plannedPublicationDate = null;
    let futureDate = new Date('2037-04-20');

    component.updatePlannedPublicationDate(futureDate);

    expect(storySpy).toHaveBeenCalledWith(
      component.story,
      component.nodeId,
      futureDate.getTime()
    );
    expect(component.plannedPublicationDateIsInPast).toBe(false);
  });

  it(
    'should update check if current node can be changed to' +
      'Ready To Publish',
    () => {
      let currentNodeIsPublishableSpy = spyOn(
        storyEditorStateService,
        'setCurrentNodeAsPublishable'
      );
      component.updateCurrentNodeIsPublishable();

      expect(currentNodeIsPublishableSpy).toHaveBeenCalledWith(false);

      component.outlineIsFinalized = true;
      component.editableThumbnailBgColor = '#fff';
      component.explorationId = 'exp_1';
      component.currentTitle = 'title';
      component.currentDescription = 'desc';
      component.plannedPublicationDate = new Date();
      component.acquiredSkillIds = ['skill_1'];
      component.updateCurrentNodeIsPublishable();

      expect(currentNodeIsPublishableSpy).toHaveBeenCalledWith(true);
    }
  );

  it('should open and close node title editor', () => {
    component.openNodeTitleEditor();

    expect(component.nodeTitleEditorIsShown).toEqual(true);

    component.closeNodeTitleEditor();

    expect(component.nodeTitleEditorIsShown).toEqual(false);
  });

  it('should open add skill modal for adding prerequisite skill', () => {
    const modalSpy = spyOn(ngbModal, 'open').and.callFake(() => modalRef);

    component.addPrerequisiteSkillId();

    expect(modalSpy).toHaveBeenCalled();
  });

  it(
    'should show alert message when we try to ' +
      'add a prerequisite skill id which already exists',
    fakeAsync(() => {
      spyOn(storyUpdateService, 'addPrerequisiteSkillIdToNode').and.callFake(
        () => {
          throw new Error('Given skill is already a prerequisite skill');
        }
      );
      let alertsSpy = spyOn(alertsService, 'addInfoMessage').and.returnValue(
        null
      );
      modalRef.result = Promise.resolve({
        summary: {
          id: 'id',
          description: 'description',
        },
      });
      spyOn(ngbModal, 'open').and.callFake(() => modalRef);

      component.addPrerequisiteSkillId();
      tick();

      expect(alertsSpy).toHaveBeenCalledWith(
        'Given skill is already a prerequisite skill',
        5000
      );
    })
  );

  it('should open add skill modal for adding acquired skill', fakeAsync(() => {
    spyOn(storyUpdateService, 'addAcquiredSkillIdToNode').and.callFake(
      () => {}
    );
    const modalSpy = spyOn(ngbModal, 'open').and.callFake(() => modalRef);

    component.addAcquiredSkillId();
    tick();

    expect(modalSpy).toHaveBeenCalled();
  }));

  it(
    'should show alert message when we try to ' +
      'add a acquired skill id which already exists',
    fakeAsync(() => {
      spyOn(storyUpdateService, 'addAcquiredSkillIdToNode').and.callFake(() => {
        throw new Error('skill id already exist.');
      });
      let alertsSpy = spyOn(alertsService, 'addInfoMessage').and.returnValue(
        null
      );
      spyOn(ngbModal, 'open').and.callFake(() => modalRef);

      component.addAcquiredSkillId();
      tick();

      expect(alertsSpy).toHaveBeenCalledWith(
        'Given skill is already an acquired skill',
        5000
      );
    })
  );

  it('should toggle chapter outline', fakeAsync(() => {
    component.chapterOutlineIsShown = false;

    component.toggleChapterOutline();

    expect(component.chapterOutlineIsShown).toBe(true);
  }));

  it('should toggle acquired skills list', () => {
    component.acquiredSkillIsShown = false;

    component.toggleAcquiredSkillsList();

    expect(component.acquiredSkillIsShown).toBe(true);
  });

  it('should untoggle acquired skills list', () => {
    component.acquiredSkillIsShown = true;

    component.toggleAcquiredSkillsList();

    expect(component.acquiredSkillIsShown).toBe(false);
  });

  it('should toggle chapter card', () => {
    component.mainChapterCardIsShown = false;

    component.toggleChapterCard();

    expect(component.mainChapterCardIsShown).toBe(true);
  });

  it('should untoggle chapter card', () => {
    component.mainChapterCardIsShown = true;

    component.toggleChapterCard();

    expect(component.mainChapterCardIsShown).toBe(false);
  });

  it('should toggle chapter todo card', () => {
    component.chapterTodoCardIsShown = false;

    component.toggleChapterTodoCard();

    expect(component.chapterTodoCardIsShown).toBe(true);
  });

  it('should untoggle chapter todo card', () => {
    component.chapterTodoCardIsShown = true;

    component.toggleChapterTodoCard();

    expect(component.chapterTodoCardIsShown).toBe(false);
  });

  it('should toggle chapter outline buttons', () => {
    component.chapterOutlineButtonsAreShown = false;
    component.toggleChapterOutlineButtons();

    expect(component.chapterOutlineButtonsAreShown).toBe(true);

    component.toggleChapterOutlineButtons();

    expect(component.chapterOutlineButtonsAreShown).toBe(false);

    component.chapterOutlineButtonsAreShown = false;
    component.editableOutline = '';
    component.updateLocalEditableOutline('value');

    expect(component.editableOutline).toBe('value');
  });

  it('should not update chapter outline for a non-string value', () => {
    component.editableOutline = 'outline';

    component.updateLocalEditableOutline(['non-string value']);

    expect(component.editableOutline).toBe('outline');
  });

  it('should not update chapter outline when the value is unchanged', () => {
    component.editableOutline = 'outline';

    component.updateLocalEditableOutline('outline');

    expect(component.editableOutline).toBe('outline');
  });

  it(
    'should call StoryUpdateService and curatedExplorationValidationService' +
      ' to set node exploration id if story is published',
    fakeAsync(() => {
      spyOn(storyEditorStateService, 'isStoryPublished').and.returnValue(true);
      let value = Promise.resolve(true);
      let expSpy = spyOn(
        curatedExplorationValidationService,
        'isExpPublishedAsync'
      ).and.returnValue(value);
      let storyUpdateSpy = spyOn(
        storyUpdateService,
        'setStoryNodeExplorationId'
      );
      component.explorationIdEditorIsShown = true;

      component.updateExplorationId('exp10');
      tick();

      expect(expSpy).toHaveBeenCalled();
      expect(storyUpdateSpy).toHaveBeenCalled();
      expect(component.currentExplorationId).toEqual('exp10');
      expect(component.explorationIdEditorIsShown).toBe(false);
    })
  );

  it(
    'should call StoryUpdateService to set node exploration id and set ' +
      'invalid exp error if story is published and exp id is invalid',
    fakeAsync(() => {
      component.invalidExpErrorIsShown = false;
      spyOn(storyEditorStateService, 'isStoryPublished').and.returnValue(true);
      let value = Promise.resolve(false);
      let expSpy = spyOn(
        curatedExplorationValidationService,
        'isExpPublishedAsync'
      ).and.returnValue(value);
      let storyUpdateSpy = spyOn(
        storyUpdateService,
        'setStoryNodeExplorationId'
      );

      component.explorationIdEditorIsShown = true;

      component.updateExplorationId('exp10');
      tick();

      expect(expSpy).toHaveBeenCalled();
      expect(storyUpdateSpy).not.toHaveBeenCalled();
      expect(component.invalidExpErrorIsShown).toEqual(true);
      // The input field stays open so that the ID can be fixed.
      expect(component.explorationIdEditorIsShown).toBe(true);
    })
  );

  it('should show error if story is published and exp id is null', () => {
    spyOn(storyEditorStateService, 'isStoryPublished').and.returnValue(true);
    let alertsSpy = spyOn(alertsService, 'addInfoMessage');

    let storyUpdateSpy = spyOn(storyUpdateService, 'setStoryNodeExplorationId');
    component.explorationIdEditorIsShown = true;

    component.updateExplorationId(null as unknown as string);
    expect(storyUpdateSpy).not.toHaveBeenCalled();
    expect(alertsSpy).toHaveBeenCalled();
    expect(component.explorationIdEditorIsShown).toBe(true);
  });

  it('should set node exploration id and show it as a link if story is not published', () => {
    spyOn(storyEditorStateService, 'isStoryPublished').and.returnValue(false);
    let storyUpdateSpy = spyOn(storyUpdateService, 'setStoryNodeExplorationId');
    component.explorationIdEditorIsShown = true;

    component.updateExplorationId('exp10');

    expect(storyUpdateSpy).toHaveBeenCalledWith(story, 'node1', 'exp10');
    expect(component.currentExplorationId).toEqual('exp10');
    expect(component.explorationIdEditorIsShown).toBe(false);
  });

  it(
    'should call StoryUpdateService to set node exploration id and set ' +
      'invalid exp error if story is published and exp id is invalid',
    () => {
      spyOn(storyEditorStateService, 'isStoryPublished').and.returnValue(false);
      Promise.resolve(false);

      let storyUpdateSpy = spyOn(
        storyUpdateService,
        'setStoryNodeExplorationId'
      );
      component.explorationId = 'exp10';
      component.explorationIdEditorIsShown = false;

      component.updateExplorationId(null as unknown as string);
      expect(storyUpdateSpy).toHaveBeenCalled();
      // The exploration was removed, so the empty input field is shown.
      expect(component.explorationId).toBeNull();
      expect(component.explorationIdEditorIsShown).toBe(true);
    }
  );

  it(
    'should show alert message if we try to update ' +
      'exploration id with empty value',
    () => {
      spyOn(storyEditorStateService, 'isStoryPublished').and.returnValue(false);
      Promise.resolve(false);
      spyOn(storyUpdateService, 'setStoryNodeExplorationId');
      let alertsSpy = spyOn(alertsService, 'addInfoMessage').and.returnValue(
        null
      );

      component.explorationIdEditorIsShown = true;

      component.updateExplorationId('');
      expect(alertsSpy).toHaveBeenCalledWith(
        'Please click the delete icon to remove an exploration ' +
          'from the story.',
        5000
      );
      expect(component.explorationIdEditorIsShown).toBe(true);
    }
  );

  it('should call StoryUpdate service to set story node title', () => {
    let storyUpdateSpy = spyOn(storyUpdateService, 'setStoryNodeTitle');
    let currentNodeIsPublishableSpy = spyOn(
      component,
      'updateCurrentNodeIsPublishable'
    );
    component.updateTitle('Title 10');
    expect(storyUpdateSpy).toHaveBeenCalled();
    expect(currentNodeIsPublishableSpy).toHaveBeenCalled();
  });

  it(
    'should not call StoryUpdate service to set story node title and ' +
      'call alertsService if the name is a duplicate',
    () => {
      let storyUpdateSpy = spyOn(storyUpdateService, 'setStoryNodeTitle');
      let alertsSpy = spyOn(alertsService, 'addInfoMessage');
      component.updateTitle('Title 2');
      expect(storyUpdateSpy).not.toHaveBeenCalled();
      expect(alertsSpy).toHaveBeenCalled();
    }
  );

  it('should focus on story node when story is initialized', fakeAsync(() => {
    let mockEventEmitter = new EventEmitter();
    spyOnProperty(
      storyEditorStateService,
      'onStoryInitialized'
    ).and.returnValue(mockEventEmitter);
    let focusSpy = spyOn(
      focusManagerService,
      'setFocusWithoutScroll'
    ).and.returnValue(null);

    component.ngOnInit();
    flush();
    mockEventEmitter.emit();

    expect(focusSpy).toHaveBeenCalled();
  }));

  it('should focus on story node when story is reinitialized', fakeAsync(() => {
    let mockEventEmitter = new EventEmitter();
    spyOnProperty(
      storyEditorStateService,
      'onStoryReinitialized'
    ).and.returnValue(mockEventEmitter);
    let focusSpy = spyOn(
      focusManagerService,
      'setFocusWithoutScroll'
    ).and.returnValue(null);

    component.ngOnInit();
    flush();

    mockEventEmitter.emit();
    tick();

    expect(focusSpy).toHaveBeenCalled();
  }));

  it('should focus on story node after recalculation of available node', fakeAsync(() => {
    spyOn(component, '_recalculateAvailableNodes').and.callThrough();

    component.nodeId = 'node1';
    component.storyNodeIds = ['node1', 'node_2', 'working', 'duty'];
    component.destinationNodeIds = ['node_2'];
    component.story = Story.createFromBackendDict({
      id: 'story_id',
      title: '',
      description: '',
      notes: '',
      version: 1,
      corresponding_topic_id: 'topic_id',
      thumbnail_filename: '',
      thumbnail_bg_color: '',
      url_fragment: 'url',
      meta_tag_content: 'meta',
      story_contents: {
        initial_node_id: '',
        next_node_id: '',
        nodes: [
          {
            id: 'NodeID_1',
            title: '',
            description: '',
            prerequisite_skill_ids: [],
            acquired_skill_ids: [],
            destination_node_ids: [],
            outline: '',
            outline_is_finalized: false,
            exploration_id: null,
            thumbnail_bg_color: null,
            thumbnail_filename: null,
            status: 'Draft',
            planned_publication_date_msecs: null,
            last_modified_msecs: null,
            first_publication_date_msecs: null,
            unpublishing_reason: null,
          },
          {
            id: 'NodeID_2',
            title: '',
            description: '',
            prerequisite_skill_ids: [],
            acquired_skill_ids: [],
            destination_node_ids: [],
            outline: '',
            outline_is_finalized: false,
            exploration_id: null,
            thumbnail_bg_color: null,
            thumbnail_filename: null,
            status: 'Draft',
            planned_publication_date_msecs: null,
            last_modified_msecs: null,
            first_publication_date_msecs: null,
            unpublishing_reason: null,
          },
        ],
      },
      language_code: 'en',
    });

    mockEventEmitterLast.emit();
    tick();

    expect(component._recalculateAvailableNodes).toHaveBeenCalled();
  }));
});
