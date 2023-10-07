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
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { RecordedVoiceovers } from 'domain/exploration/recorded-voiceovers.model';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { ConceptCard } from 'domain/skill/concept-card.model';
import { Skill } from 'domain/skill/SkillObjectFactory';
import { StoryUpdateService } from 'domain/story/story-update.service';
import { Story } from 'domain/story/story.model';
import { AlertsService } from 'services/alerts.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { StoryEditorStateService } from '../services/story-editor-state.service';
import { CuratedExplorationValidationService } from '../../../domain/exploration/curated-exploration-validation.service';
import { WindowDimensionsService } from '../../../services/contextual/window-dimensions.service';
import { StoryNodeEditorComponent } from './story-node-editor.component';
import { EditableStoryBackendApiService } from '../../../domain/story/editable-story-backend-api.service';
import { SkillBackendApiService } from '../../../domain/skill/skill-backend-api.service';
import { TopicsAndSkillsDashboardBackendApiService } from '../../../domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PlatformFeatureService } from '../../../services/platform-feature.service';

class MockNgbModalRef {
  componentInstance: {
    skillSummaries: null;
    skillsInSameTopicCount: null;
    categorizedSkills: null;
    allowSkillsFromOtherTopics: null;
    untriagedSkillSummaries: null;
  };
}

class MockTopicsAndSkillsDashboardBackendApiService {
  fetchDashboardDataAsync = () => {
    return Promise.resolve({
      categorizedSkillsDict: {
        addition: {}
      },
      untriagedSkillSummaries: {
        addition: {}
      }
    });
  };
}

class MockSkillBackendApiService {
  fetchMultiSkillsAsync = (skillIds) => {
    // The skillId ='2' case is used to test the case when the
    // SkillBackendApiService rejects the request.
    if (skillIds[0] === '2') {
      return Promise.reject();
    } else {
      return Promise.resolve([
        new Skill(
          '1', 'test', [], [],
          new ConceptCard(
            new SubtitledHtml(
              '', '1'), [], RecordedVoiceovers.createEmpty()),
          'en', 1, 1, '0', true, []),
        new Skill(
          '2', 'test2', [], [],
          new ConceptCard(
            new SubtitledHtml(
              '', '1'), [], RecordedVoiceovers.createEmpty()),
          'en', 1, 1, '0', true, []),
        new Skill(
          '3', 'test3', [], [],
          new ConceptCard(
            new SubtitledHtml(
              '', '1'), [], RecordedVoiceovers.createEmpty()),
          'en', 1, 1, '0', true, [])
      ]);
    }
  };
}

class MockPlatformFeatureService {
  status = {
    SerialChapterLaunchCurriculumAdminView: {
      isEnabled: false
    }
  };
}

describe('Story node editor component', () => {
  let fixture: ComponentFixture<StoryNodeEditorComponent>;
  let component: StoryNodeEditorComponent;
  let ngbModal: NgbModal;
  let story: Story;
  let windowDimensionsService: WindowDimensionsService;
  let storyUpdateService: StoryUpdateService;
  let curatedExplorationValidationService:
    CuratedExplorationValidationService;
  let alertsService: AlertsService;
  let storyEditorStateService: StoryEditorStateService;
  let focusManagerService: FocusManagerService;
  let mockPlatformFeatureService = new MockPlatformFeatureService();
  let mockEventEmitterLast = new EventEmitter();

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        StoryNodeEditorComponent
      ],
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
          useValue: mockPlatformFeatureService
        },
        {
          provide: SkillBackendApiService,
          useClass: MockSkillBackendApiService
        },
        {
          provide: TopicsAndSkillsDashboardBackendApiService,
          useClass: MockTopicsAndSkillsDashboardBackendApiService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StoryNodeEditorComponent);
    component = fixture.componentInstance;
    ngbModal = TestBed.inject(NgbModal);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    curatedExplorationValidationService = (
      TestBed.inject(CuratedExplorationValidationService));
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
      url_fragment: 'story_title',
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
            outline_is_finalized: false
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
            planned_publication_date_msecs: 168960000000
          }, {
            id: 'node_2',
            title: 'Title 2',
            description: 'Description 2',
            prerequisite_skill_ids: ['skill_3'],
            acquired_skill_ids: ['skill_4'],
            destination_node_ids: ['node_1'],
            outline: 'Outline 2',
            exploration_id: 'exp_1',
            outline_is_finalized: true
          }, {
            id: 'break',
            title: 'Title 2',
            description: 'Description 2',
            prerequisite_skill_ids: ['skill_3'],
            acquired_skill_ids: ['skill_4'],
            destination_node_ids: ['node_1'],
            outline: 'Outline 2',
            exploration_id: 'exp_1',
            outline_is_finalized: true
          }],
        next_node_id: 'node_3'
      },
      language_code: 'en'
    };
    story = Story.createFromBackendDict(sampleStoryBackendObject);

    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(true);
    spyOn(storyEditorStateService, 'getSkillSummaries').and.returnValue(
      [{ id: '1', description: 'Skill description' }]);
    spyOn(storyEditorStateService, 'getStory').and.returnValue(story);
    spyOn(storyEditorStateService, 'getClassroomUrlFragment').and.returnValue(
      'math');
    spyOn(storyEditorStateService, 'getTopicUrlFragment').and.returnValue(
      'fractions');
    spyOn(storyEditorStateService, 'getTopicName').and.returnValue('addition');
    spyOnProperty(storyEditorStateService, 'onRecalculateAvailableNodes')
      .and.returnValue(mockEventEmitterLast);

    component.nodeId = 'node1';
    component.storyNodeIds = ['node1', 'node_2', 'node_3', 'wroking'];
    component.destinationNodeIds = ['node_2'];
    component.ngOnInit();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should init the controller', () => {
    component.viewNodeEditor('node_1');

    expect(component.chapterPreviewCardIsShown).toEqual(false);
    expect(component.mainChapterCardIsShown).toEqual(true);
    expect(component.explorationInputButtonsAreShown).toEqual(false);
  });

  it('should get status of Serial Chapter Launch Feature flag', () => {
    expect(component.isSerialChapterFeatureFlagEnabled()).toEqual(false);

    mockPlatformFeatureService.
      status.SerialChapterLaunchCurriculumAdminView.isEnabled = true;
    expect(component.isSerialChapterFeatureFlagEnabled()).toEqual(true);
  });

  it('should return skill editor URL', () => {
    expect(component.getSkillEditorUrl('skill_1')).toEqual(
      '/skill_editor/skill_1');
  });

  it('should fetch the descriptions for prerequisite skills', fakeAsync(() => {
    component.prerequisiteSkillIds = ['1', '2', '3'];

    component.getPrerequisiteSkillsDescription();
    tick();

    expect(component.skillIdToSummaryMap).toEqual(
      { 1: 'test', 2: 'test2', 3: 'test3' }
    );
  }));

  it('should call Alerts Service if getting skill desc. fails', fakeAsync(
    () => {
      component.prerequisiteSkillIds = ['2'];
      let alertsSpy = spyOn(alertsService, 'addWarning').and.callThrough();

      component.getPrerequisiteSkillsDescription();
      tick();

      expect(alertsSpy).toHaveBeenCalled();
    }));

  it('should check if exploration can be saved', () => {
    component.checkCanSaveExpId();

    expect(component.expIdCanBeSaved).toEqual(true);
  });

  it('should call StoryUpdate service remove prerequisite skill id',
    () => {
      let skillSpy = spyOn(
        storyUpdateService, 'removePrerequisiteSkillIdFromNode');

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

    expect(component.chapterPreviewCardIsShown).toBeTrue();
  });

  it('should untoggle chapter preview card', () => {
    component.chapterPreviewCardIsShown = true;

    component.togglePreview();

    expect(component.chapterPreviewCardIsShown).toBeFalse();
  });

  it('should toggle prereq skill list', () => {
    component.prerequisiteSkillIsShown = true;

    component.togglePrerequisiteSkillsList();

    expect(component.prerequisiteSkillIsShown).toBeFalse();
  });

  it('should call StoryUpdate service to set story thumbnail filename',
    () => {
      let storySpy = spyOn(storyUpdateService, 'setStoryNodeThumbnailFilename');
      let currentNodeIsPublishableSpy = spyOn(
        component, 'updateCurrentNodeIsPublishable');

      component.updateThumbnailFilename('new_file.png');

      expect(storySpy).toHaveBeenCalled();
      expect(currentNodeIsPublishableSpy).toHaveBeenCalled();
    });

  it('should call StoryUpdate service to set story thumbnail filename',
    () => {
      let storySpy = spyOn(storyUpdateService, 'setStoryNodeThumbnailBgColor');
      let currentNodeIsPublishableSpy = spyOn(
        component, 'updateCurrentNodeIsPublishable');

      component.updateThumbnailBgColor('#333');

      expect(storySpy).toHaveBeenCalled();
      expect(currentNodeIsPublishableSpy).toHaveBeenCalled();
    });

  it('should call StoryUpdate service to finalize story node outline',
    () => {
      let storySpy = spyOn(storyUpdateService, 'unfinalizeStoryNodeOutline');
      let currentNodeIsPublishableSpy = spyOn(
        component, 'updateCurrentNodeIsPublishable');

      component.unfinalizeOutline();

      expect(storySpy).toHaveBeenCalled();
      expect(currentNodeIsPublishableSpy).toHaveBeenCalled();
    });

  it('should call StoryUpdate service to finalize story node outline',
    () => {
      let storySpy = spyOn(storyUpdateService, 'finalizeStoryNodeOutline');
      let currentNodeIsPublishableSpy = spyOn(
        component, 'updateCurrentNodeIsPublishable');

      component.finalizeOutline();

      expect(storySpy).toHaveBeenCalled();
      expect(currentNodeIsPublishableSpy).toHaveBeenCalled();
    });

  it('should call StoryUpdate service to update outline', () => {
    let storySpy = spyOn(storyUpdateService, 'setStoryNodeOutline');

    component.updateOutline('New outline');

    expect(storySpy).toHaveBeenCalled();
  });

  it('should call StoryUpdate service to update description', () => {
    let storySpy = spyOn(storyUpdateService, 'setStoryNodeDescription');
    let currentNodeIsPublishableSpy = spyOn(
      component, 'updateCurrentNodeIsPublishable');

    component.updateDescription('New description');

    expect(storySpy).toHaveBeenCalled();
    expect(currentNodeIsPublishableSpy).toHaveBeenCalled();
  });

  it('should call StoryUpdate service to update planned publication date',
    () => {
      let storySpy = spyOn(
        storyUpdateService, 'setStoryNodePlannedPublicationDateMsecs');
      let currentNodeIsPublishableSpy = spyOn(
        component, 'updateCurrentNodeIsPublishable');

      component.plannedPublicationDate = null;
      component.updatePlannedPublicationDate(null);
      expect(currentNodeIsPublishableSpy).toHaveBeenCalled();
      expect(storyUpdateService.setStoryNodePlannedPublicationDateMsecs).
        toHaveBeenCalledTimes(0);

      let oldDateString = '2000-09-09';
      component.updatePlannedPublicationDate(oldDateString);
      expect(currentNodeIsPublishableSpy).toHaveBeenCalled();
      expect(storyUpdateService.setStoryNodePlannedPublicationDateMsecs).
        toHaveBeenCalledTimes(0);
      expect(component.plannedPublicationDate).toBe(null);
      expect(component.plannedPublicationDateIsInPast).toBeTrue();

      let futureDateString = '2037-04-20';
      component.updatePlannedPublicationDate(futureDateString);
      let futureDate = new Date(futureDateString);
      expect(storySpy).toHaveBeenCalledWith(
        component.story, component.nodeId, futureDate.getTime());
      expect(currentNodeIsPublishableSpy).toHaveBeenCalled();
      expect(component.plannedPublicationDateIsInPast).toBeFalse();

      component.updatePlannedPublicationDate('');
      expect(storySpy).toHaveBeenCalled();
      expect(currentNodeIsPublishableSpy).toHaveBeenCalled();
      expect(component.plannedPublicationDate).toBe(null);
      expect(component.plannedPublicationDateIsInPast).toBeFalse();

      component.plannedPublicationDate = new Date();
      component.updatePlannedPublicationDate(oldDateString);
      expect(storySpy).toHaveBeenCalled();
    });

  it('should update check if current node can be changed to' +
  'Ready To Publish', () => {
    let currentNodeIsPublishableSpy = spyOn(
      storyEditorStateService, 'setCurrentNodeAsPublishable');
    component.updateCurrentNodeIsPublishable();

    expect(currentNodeIsPublishableSpy).toHaveBeenCalledWith(false);

    component.outlineIsFinalized = true;
    component.editableThumbnailBgColor = '#fff';
    component.explorationId = 'exp_1';
    component.currentTitle = 'title';
    component.currentDescription = 'desc';
    component.plannedPublicationDate = new Date();
    component.updateCurrentNodeIsPublishable();

    expect(currentNodeIsPublishableSpy).toHaveBeenCalledWith(true);
  });

  it('should open and close node title editor', () => {
    component.openNodeTitleEditor();

    expect(component.nodeTitleEditorIsShown).toEqual(true);

    component.closeNodeTitleEditor();

    expect(component.nodeTitleEditorIsShown).toEqual(false);
  });

  it('should open add skill modal for adding prerequisite skill', () => {
    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return (
        {
          componentInstance: MockNgbModalRef,
          result: Promise.resolve('success')
        }) as NgbModalRef;
    });

    component.addPrerequisiteSkillId();

    expect(modalSpy).toHaveBeenCalled();
  });

  it('should show alert message when we try to ' +
    'add a prerequisite skill id which already exists', fakeAsync(() => {
    spyOn(storyUpdateService, 'addPrerequisiteSkillIdToNode')
      .and.callFake(() => {
        throw new Error('Given skill is already a prerequisite skill');
      });
    let alertsSpy = spyOn(alertsService, 'addInfoMessage')
      .and.returnValue(null);
    spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return (
          {
            componentInstance: MockNgbModalRef,
            result: Promise.resolve({
              summary: {
                id: 'id',
                description: 'description'
              }
            })
          }
        ) as NgbModalRef;
    });

    component.addPrerequisiteSkillId();
    tick();

    expect(alertsSpy).toHaveBeenCalledWith(
      'Given skill is already a prerequisite skill', 5000);
  }));

  it('should open add skill modal for adding acquired skill', fakeAsync(
    () => {
      spyOn(storyUpdateService, 'addAcquiredSkillIdToNode').and.callFake(
        () => { });
      const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return (
          {
            componentInstance: MockNgbModalRef,
            result: Promise.resolve('success')
          }) as NgbModalRef;
      });

      component.addAcquiredSkillId();
      tick();

      expect(modalSpy).toHaveBeenCalled();
    }));

  it('should show alert message when we try to ' +
    'add a acquired skill id which already exists', fakeAsync(() => {
    spyOn(storyUpdateService, 'addAcquiredSkillIdToNode')
      .and.callFake(() => {
        throw new Error('skill id already exist.');
      });
    let alertsSpy = spyOn(alertsService, 'addInfoMessage')
      .and.returnValue(null);
    spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return (
          {
            componentInstance: MockNgbModalRef,
            result: Promise.resolve('success')
          }) as NgbModalRef;
    });

    component.addAcquiredSkillId();
    tick();

    expect(alertsSpy).toHaveBeenCalledWith(
      'Given skill is already an acquired skill', 5000);
  }));

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

  it('should toggle exploration input buttons', () => {
    component.explorationInputButtonsAreShown = false;

    component.toggleExplorationInputButtons();

    expect(component.explorationInputButtonsAreShown).toBe(true);
  });

  it('should untoggle exploration input buttons', () => {
    component.explorationInputButtonsAreShown = true;

    component.toggleExplorationInputButtons();

    expect(component.explorationInputButtonsAreShown).toBe(false);
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

  it('should call StoryUpdateService and curatedExplorationValidationService' +
    ' to set node exploration id if story is published',
  fakeAsync(() => {
    spyOn(storyEditorStateService, 'isStoryPublished').and.returnValue(true);
    let value = Promise.resolve(true);
    let expSpy = spyOn(
      curatedExplorationValidationService, 'isExpPublishedAsync'
    ).and.returnValue(value);
    let storyUpdateSpy = spyOn(storyUpdateService, 'setStoryNodeExplorationId');

    component.updateExplorationId('exp10');
    tick();

    expect(expSpy).toHaveBeenCalled();
    expect(storyUpdateSpy).toHaveBeenCalled();
  }));

  it('should call StoryUpdateService to set node exploration id and set ' +
    'invalid exp error if story is published and exp id is invalid',
  fakeAsync(() => {
    component.invalidExpErrorIsShown = false;
    spyOn(storyEditorStateService, 'isStoryPublished').and.returnValue(true);
    let value = Promise.resolve(false);
    let expSpy = spyOn(
      curatedExplorationValidationService, 'isExpPublishedAsync'
    ).and.returnValue(value);
    let storyUpdateSpy = spyOn(
      storyUpdateService, 'setStoryNodeExplorationId');

    component.updateExplorationId('exp10');
    tick();

    expect(expSpy).toHaveBeenCalled();
    expect(storyUpdateSpy).not.toHaveBeenCalled();
    expect(component.invalidExpErrorIsShown).toEqual(true);
  }));

  it('should show error if story is published and exp id is null', () => {
    spyOn(storyEditorStateService, 'isStoryPublished').and.returnValue(true);
    let alertsSpy = spyOn(alertsService, 'addInfoMessage');

    let storyUpdateSpy = spyOn(
      storyUpdateService, 'setStoryNodeExplorationId');

    component.updateExplorationId(null as unknown as string);
    expect(storyUpdateSpy).not.toHaveBeenCalled();
    expect(alertsSpy).toHaveBeenCalled();
  });

  it('should call StoryUpdateService to set node exploration id and set ' +
    'invalid exp error if story is published and exp id is invalid',
  () => {
    spyOn(storyEditorStateService, 'isStoryPublished').and.returnValue(false);
    Promise.resolve(false);

    let storyUpdateSpy = spyOn(
      storyUpdateService, 'setStoryNodeExplorationId');

    component.updateExplorationId(null as unknown as string);
    expect(storyUpdateSpy).toHaveBeenCalled();
  });

  it('should show alert message if we try to update ' +
    'exploration id with empty value', () => {
    spyOn(storyEditorStateService, 'isStoryPublished').and.returnValue(false);
    Promise.resolve(false);
    spyOn(storyUpdateService, 'setStoryNodeExplorationId');
    let alertsSpy = spyOn(alertsService, 'addInfoMessage')
      .and.returnValue(null);

    component.updateExplorationId('');
    expect(alertsSpy).toHaveBeenCalledWith(
      'Please click the delete icon to remove an exploration ' +
        'from the story.', 5000);
  });

  it('should call StoryUpdate service to set story node title', () => {
    let storyUpdateSpy = spyOn(
      storyUpdateService, 'setStoryNodeTitle');
    let currentNodeIsPublishableSpy = spyOn(
      component, 'updateCurrentNodeIsPublishable');
    component.updateTitle('Title 10');
    expect(storyUpdateSpy).toHaveBeenCalled();
    expect(currentNodeIsPublishableSpy).toHaveBeenCalled();
  });

  it('should not call StoryUpdate service to set story node title and ' +
    'call alertsService if the name is a duplicate', () => {
    let storyUpdateSpy = spyOn(
      storyUpdateService, 'setStoryNodeTitle');
    let alertsSpy = spyOn(alertsService, 'addInfoMessage');
    component.updateTitle('Title 2');
    expect(storyUpdateSpy).not.toHaveBeenCalled();
    expect(alertsSpy).toHaveBeenCalled();
  });

  it('should focus on story node when story is initialized', fakeAsync(() => {
    let mockEventEmitter = new EventEmitter();
    spyOnProperty(storyEditorStateService, 'onStoryInitialized')
      .and.returnValue(mockEventEmitter);
    let focusSpy = spyOn(focusManagerService, 'setFocusWithoutScroll')
      .and.returnValue(null);

    component.ngOnInit();
    flush();
    mockEventEmitter.emit();

    expect(focusSpy).toHaveBeenCalled();
  }));

  it('should focus on story node when story is reinitialized', fakeAsync(
    () => {
      let mockEventEmitter = new EventEmitter();
      spyOnProperty(storyEditorStateService, 'onStoryReinitialized')
        .and.returnValue(mockEventEmitter);
      let focusSpy = spyOn(focusManagerService, 'setFocusWithoutScroll')
        .and.returnValue(null);

      component.ngOnInit();
      flush();

      mockEventEmitter.emit();
      tick();

      expect(focusSpy).toHaveBeenCalled();
    }));

  it('should focus on story node after recalculation of available node',
    fakeAsync(() => {
      spyOn(component, '_recalculateAvailableNodes').and.callThrough();

      component.nodeId = 'node1';
      component.storyNodeIds = ['node1', 'node_2', 'working', 'duty'];
      component.destinationNodeIds = ['node_2'];
      component.story = {
        getStoryContents: () => {
          return {
            getLinearNodesList: () => {
              return [{
                getId: () => {
                  return 'NodeID_1';
                }
              },
              {
                getId: () => {
                  return 'NodeID_2';
                }
              }];
            }
          };
        }
      };

      mockEventEmitterLast.emit();
      tick();

      expect(component._recalculateAvailableNodes).toHaveBeenCalled();
    }));
});
