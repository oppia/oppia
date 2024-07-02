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
 * @fileoverview Unit tests for story node tile component.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {StoryNodeTileComponent} from './story-node-tile.component';
import {ExplorationEngineService} from 'pages/exploration-player-page/services/exploration-engine.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {UrlService} from 'services/contextual/url.service';
import {EditableExplorationBackendApiService} from 'domain/exploration/editable-exploration-backend-api.service';
import {
  ReadOnlyExplorationBackendApiService,
  FetchExplorationBackendResponse,
} from 'domain/exploration/read-only-exploration-backend-api.service';
import {
  ExplorationObjectFactory,
  Exploration,
} from 'domain/exploration/ExplorationObjectFactory';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {StoryNode} from 'domain/story/story-node.model';
import {TranslateService} from '@ngx-translate/core';
import {MockTranslateService} from 'components/forms/schema-based-editors/integration-tests/schema-based-editors.integration.spec';
import {MockTranslatePipe} from 'tests/unit-test-utils';

class MockAssetsBackendApiService {
  getThumbnailUrlForPreview() {
    return 'thumbnail_url';
  }
}

describe('StoryNodeTileComponent', () => {
  let fixture: ComponentFixture<StoryNodeTileComponent>;
  let componentInstance: StoryNodeTileComponent;
  let explorationEngineService: ExplorationEngineService;
  let assetsBackendApiService: AssetsBackendApiService;
  let urlService: UrlService;
  let editableExplorationBackendApiService: EditableExplorationBackendApiService;
  let readOnlyExplorationBackendApiService: ReadOnlyExplorationBackendApiService;
  let explorationObjectFactory: ExplorationObjectFactory;

  let mockStoryNode: StoryNode;

  let explorationDict = {
    states: {
      Start: {
        classifier_model_id: null,
        recorded_voiceovers: {
          voiceovers_mapping: {
            ca_placeholder_0: {},
            feedback_1: {},
            rule_input_2: {},
            content: {},
            default_outcome: {},
          },
        },
        solicit_answer_details: false,
        interaction: {
          solution: null,
          confirmed_unclassified_answers: [],
          id: 'TextInput',
          hints: [],
          customization_args: {
            rows: {
              value: 1,
            },
            placeholder: {
              value: {
                unicode_str: '',
                content_id: 'ca_placeholder_0',
              },
            },
            catchMisspellings: {
              value: false,
            },
          },
          answer_groups: [
            {
              outcome: {
                missing_prerequisite_skill_id: null,
                refresher_exploration_id: null,
                labelled_as_correct: false,
                feedback: {
                  content_id: 'feedback_1',
                  html: '<p>Good Job</p>',
                },
                param_changes: [],
                dest_if_really_stuck: null,
                dest: 'Mid',
              },
              training_data: [],
              rule_specs: [
                {
                  inputs: {
                    x: {
                      normalizedStrSet: ['answer'],
                      contentId: 'rule_input_2',
                    },
                  },
                  rule_type: 'FuzzyEquals',
                },
              ],
              tagged_skill_misconception_id: null,
            },
          ],
          default_outcome: {
            missing_prerequisite_skill_id: null,
            refresher_exploration_id: null,
            labelled_as_correct: false,
            feedback: {
              content_id: 'default_outcome',
              html: '<p>Try again.</p>',
            },
            param_changes: [],
            dest_if_really_stuck: null,
            dest: 'Start',
          },
        },
        param_changes: [],
        card_is_checkpoint: true,
        linked_skill_id: null,
        content: {
          content_id: 'content',
          html: '<p>First Question</p>',
        },
      },
      End: {
        classifier_model_id: null,
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
          },
        },
        solicit_answer_details: false,
        interaction: {
          solution: null,
          confirmed_unclassified_answers: [],
          id: 'EndExploration',
          hints: [],
          customization_args: {
            recommendedExplorationIds: {
              value: ['recommnendedExplorationId'],
            },
          },
          answer_groups: [],
          default_outcome: null,
        },
        param_changes: [],
        card_is_checkpoint: false,
        linked_skill_id: null,
        content: {
          content_id: 'content',
          html: 'Congratulations, you have finished!',
        },
      },
      Mid: {
        classifier_model_id: null,
        recorded_voiceovers: {
          voiceovers_mapping: {
            ca_placeholder_0: {},
            feedback_1: {},
            rule_input_2: {},
            content: {},
            default_outcome: {},
          },
        },
        solicit_answer_details: false,
        interaction: {
          solution: null,
          confirmed_unclassified_answers: [],
          id: 'TextInput',
          hints: [],
          customization_args: {
            rows: {
              value: 1,
            },
            placeholder: {
              value: {
                unicode_str: '',
                content_id: 'ca_placeholder_0',
              },
            },
            catchMisspellings: {
              value: false,
            },
          },
          answer_groups: [
            {
              outcome: {
                missing_prerequisite_skill_id: null,
                refresher_exploration_id: null,
                labelled_as_correct: false,
                feedback: {
                  content_id: 'feedback_1',
                  html: ' <p>Good Job</p>',
                },
                param_changes: [],
                dest_if_really_stuck: null,
                dest: 'End',
              },
              training_data: [],
              rule_specs: [
                {
                  inputs: {
                    x: {
                      normalizedStrSet: ['answer'],
                      contentId: 'rule_input_2',
                    },
                  },
                  rule_type: 'FuzzyEquals',
                },
              ],
              tagged_skill_misconception_id: null,
            },
          ],
          default_outcome: {
            missing_prerequisite_skill_id: null,
            refresher_exploration_id: null,
            labelled_as_correct: false,
            feedback: {
              content_id: 'default_outcome',
              html: '<p>try again.</p>',
            },
            param_changes: [],
            dest_if_really_stuck: null,
            dest: 'Mid',
          },
        },
        param_changes: [],
        card_is_checkpoint: false,
        linked_skill_id: null,
        content: {
          content_id: 'content',
          html: '<p>Second Question</p>',
        },
      },
    },
    auto_tts_enabled: true,
    version: 2,
    draft_change_list_id: 9,
    is_version_of_draft_valid: null,
    title: 'Exploration',
    language_code: 'en',
    init_state_name: 'Start',
    param_changes: [],
    next_content_id_index: 4,
    param_specs: null,
    draft_changes: null,
  };

  let sampleExpResponse: FetchExplorationBackendResponse = {
    exploration: {
      init_state_name: 'Start',
      param_changes: [],
      param_specs: null,
      title: 'Exploration',
      language_code: 'en',
      objective: 'To learn',
      states: explorationDict.states,
      next_content_id_index: explorationDict.next_content_id_index,
    },
    exploration_metadata: {
      title: 'Exploration',
      category: 'Algebra',
      objective: 'To learn',
      language_code: 'en',
      tags: [],
      blurb: '',
      author_notes: '',
      states_schema_version: 50,
      init_state_name: 'Introduction',
      param_specs: {},
      param_changes: [],
      auto_tts_enabled: false,
      edits_allowed: true,
    },
    version: 2,
    preferred_language_codes: [],
    auto_tts_enabled: true,
    draft_change_list_id: 0,
    furthest_reached_checkpoint_state_name: 'End',
    most_recently_reached_checkpoint_state_name: 'Mid',
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [StoryNodeTileComponent, MockTranslatePipe],
      providers: [
        ExplorationEngineService,
        AssetsBackendApiService,
        UrlService,
        EditableExplorationBackendApiService,
        ReadOnlyExplorationBackendApiService,
        ExplorationObjectFactory,
        WindowDimensionsService,
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
        {
          provide: assetsBackendApiService,
          useClass: MockAssetsBackendApiService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(StoryNodeTileComponent);
    componentInstance = fixture.componentInstance;
    explorationEngineService = TestBed.inject(ExplorationEngineService);
    assetsBackendApiService = TestBed.inject(AssetsBackendApiService);
    urlService = TestBed.inject(UrlService);
    editableExplorationBackendApiService = TestBed.inject(
      EditableExplorationBackendApiService
    );
    readOnlyExplorationBackendApiService = TestBed.inject(
      ReadOnlyExplorationBackendApiService
    );
    explorationObjectFactory = TestBed.inject(ExplorationObjectFactory);

    var sampleStoryNodeBackendDict = {
      id: 'node_1',
      title: 'Sample Title',
      description: 'Sample Description',
      destination_node_ids: ['node_2'],
      prerequisite_skill_ids: ['skill_1'],
      acquired_skill_ids: ['skill_2'],
      outline: 'Sample Outline',
      outline_is_finalized: true,
      exploration_id: 'exp_1',
      thumbnail_bg_color: '#FFFFFF',
      thumbnail_filename: 'thumbnail.png',
      thumbnail_icon_url: 'thumbnail-url',
      status: 'in-progress',
      planned_publication_date_msecs: null,
      last_modified_msecs: 1622499200000,
      first_publication_date_msecs: 1622499200000,
      unpublishing_reason: null,
    };

    mockStoryNode = StoryNode.createFromBackendDict(sampleStoryNodeBackendDict);
    spyOn(assetsBackendApiService, 'getThumbnailUrlForPreview').and.returnValue(
      'thumbnail_url'
    );
    componentInstance.topicId = 'topic_1';
    componentInstance.nodeId = 'node_1';
    componentInstance.nodeDataLoaded = true;
    componentInstance.explorationId = 'exp_1';
    componentInstance.storyId = 'story_1';
    componentInstance.topicUrlFragment = 'topic-url';
    componentInstance.classroomUrlFragment = 'classroom-url';
    componentInstance.storyUrlFragment = 'story-url';
    componentInstance.checkpointCount = 3;
    componentInstance.totalCheckpointLoaded = true;
    componentInstance.mostRecentlyReachedCheckpoint = 'Mid';
  }));

  it('should initialize component properties correctly', fakeAsync(() => {
    expect(mockStoryNode.getThumbnailFilename()).toEqual('thumbnail.png');
    expect(mockStoryNode.getThumbnailBgColor()).toEqual('#FFFFFF');
    expect(componentInstance.nodeId).toEqual('node_1');
    expect(componentInstance.explorationId).toEqual('exp_1');
    let exploration: Exploration =
      explorationObjectFactory.createFromBackendDict({
        auto_tts_enabled: true,
        draft_changes: [],
        is_version_of_draft_valid: true,
        init_state_name: 'Start',
        param_changes: [],
        param_specs: {},
        states: {},
        title: 'Exploration',
        draft_change_list_id: 0,
        language_code: 'en',
        version: 2,
        next_content_id_index: 4,
      });
    spyOn(explorationEngineService, 'getShortestPathToState').and.returnValue([
      'Start',
      'Mid',
    ]);
    componentInstance.prevSessionStatesProgress = ['Start', 'Mid'];
    componentInstance.mostRecentlyReachedCheckpoint = 'Mid';
    spyOn(
      readOnlyExplorationBackendApiService,
      'loadLatestExplorationAsync'
    ).and.returnValue(Promise.resolve(sampleExpResponse));
    spyOn(explorationObjectFactory, 'createFromBackendDict').and.returnValue(
      exploration
    );
    explorationEngineService.exploration = exploration;
    componentInstance.prevSessionStatesProgress = ['Start', 'Mid'];
    componentInstance.prevSessionStatesProgress[0] = 'Start';
    componentInstance.prevSessionStatesProgress[1] = 'Mid';
    componentInstance.mostRecentlyReachedCheckpoint = 'Mid';
    componentInstance.node = mockStoryNode;
    componentInstance.ngOnInit();

    tick();

    expect(componentInstance.completedcheckpoints).toBe(1);
    expect(componentInstance.nodeDataLoaded).toEqual(true);
    spyOn(componentInstance, 'getCheckpointCount').and.callThrough();
    spyOn(componentInstance, 'getCompletedProgressStatus').and.callThrough();
  }));

  it('should generate the correct start link', () => {
    componentInstance.node = mockStoryNode;
    componentInstance.getStartLink();
    spyOn(
      editableExplorationBackendApiService,
      'resetExplorationProgressAsync'
    ).and.returnValue(Promise.resolve());
    spyOn(urlService, 'addField').and.callThrough();
    expect(componentInstance.getStartLink()).toEqual(
      '/explore/' +
        componentInstance.explorationId +
        '?story_url_fragment=' +
        componentInstance.storyUrlFragment +
        '&topic_url_fragment=' +
        componentInstance.topicUrlFragment +
        '&classroom_url_fragment=' +
        componentInstance.classroomUrlFragment +
        '&node_id=' +
        mockStoryNode.getId()
    );
  });

  it('should generate correct path icon parameters', () => {
    componentInstance.storyId = 'story_1';
    componentInstance.thumbnailFilename = 'thumbnail.png';
    componentInstance.thumbnailBgColor = '#FFFFFF';
    componentInstance.generatePathIconParameters();
    componentInstance.node = mockStoryNode;
    componentInstance.ngOnInit();
    expect(componentInstance.generatePathIconParameters()).toEqual([
      {
        thumbnailIconUrl: 'thumbnail_url',
        left: '225px',
        top: '35px',
        thumbnailBgColor: '#FFFFFF',
      },
    ]);
  });
  it('should call getCheckpointCount and getCompletedProgressStatus', waitForAsync(() => {
    spyOn(componentInstance, 'getCheckpointCount').and.callThrough();
    spyOn(
      readOnlyExplorationBackendApiService,
      'fetchExplorationAsync'
    ).and.returnValue(Promise.resolve(sampleExpResponse));
    componentInstance.getCheckpointCount();
    componentInstance.node = mockStoryNode;
    componentInstance.ngOnInit();
    expect(componentInstance.checkpointCount).toEqual(3);
    expect(componentInstance.totalCheckpointLoaded).toEqual(true);
    spyOn(componentInstance, 'getCompletedProgressStatus').and.callThrough();
  }));

  it(
    'should get status of checkpoints weather it is completed,in-progress,' +
      'and non-completed',
    () => {
      componentInstance.nodeDataLoaded = true;
      componentInstance.totalCheckpointLoaded = true;
      componentInstance.checkpointCount = 3;
      componentInstance.completedcheckpoints = 1;
      componentInstance.checkpointStatusArray = [
        'completed',
        'in-progress',
        'incomplete',
      ];
      componentInstance.getCompletedProgressStatus();
      componentInstance.node = mockStoryNode;
      componentInstance.ngOnInit();
      expect(componentInstance.checkpointStatusArray).toEqual([
        'completed',
        'in-progress',
        'incomplete',
      ]);
    }
  );

  it('should get the completed progress bar width', () => {
    componentInstance.checkpointCount = 3;
    componentInstance.completedcheckpoints = 0;
    expect(componentInstance.getCompletedProgressBarWidth()).toEqual(0);
    componentInstance.completedcheckpoints = 1;
    expect(componentInstance.getCompletedProgressBarWidth()).toEqual(25);
    componentInstance.completedcheckpoints = 2;
    expect(componentInstance.getCompletedProgressBarWidth()).toEqual(75);
  });

  it('should call clickstart()', () => {
    spyOn(window, 'open');
    componentInstance.node = mockStoryNode;
    componentInstance.clickstart();
    expect(window.open).toHaveBeenCalledWith(
      componentInstance.getStartLink(),
      '_blank'
    );
  });
});
