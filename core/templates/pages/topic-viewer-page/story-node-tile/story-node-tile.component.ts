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
 * @fileoverview Component for a story node tile.
 */

import {Component, OnInit, Input} from '@angular/core';
import {downgradeComponent} from '@angular/upgrade/static';
import {StoryNode} from 'domain/story/story-node.model';
import {ExplorationEngineService} from 'pages/exploration-player-page/services/exploration-engine.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {AppConstants} from 'app.constants';
import {UrlService} from 'services/contextual/url.service';
import {EditableExplorationBackendApiService} from 'domain/exploration/editable-exploration-backend-api.service';
import {
  FetchExplorationBackendResponse,
  ReadOnlyExplorationBackendApiService,
} from 'domain/exploration/read-only-exploration-backend-api.service';
import {StateObjectsBackendDict} from 'domain/exploration/StatesObjectFactory';
import {ExplorationObjectFactory} from 'domain/exploration/ExplorationObjectFactory';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';

const CHECKPOINT_STATUS_INCOMPLETE = 'incomplete';
const CHECKPOINT_STATUS_COMPLETED = 'completed';
const CHECKPOINT_STATUS_IN_PROGRESS = 'in-progress';

interface IconParametersArray {
  thumbnailIconUrl: string;
  left: string;
  top: string;
  thumbnailBgColor: string;
}
@Component({
  selector: 'oppia-story-node-tile',
  templateUrl: './story-node-tile.component.html',
})
export class StoryNodeTileComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() topicId!: string;
  @Input() node!: StoryNode;
  @Input() storyId!: string;
  @Input() topicUrlFragment!: string;
  @Input() classroomUrlFragment!: string;
  @Input() storyUrlFragment!: string;
  thumbnailFilename: string;
  thumbnailBgColor: string;
  thumbnailUrl: string;
  nodeId: string;
  pathIconParameters: IconParametersArray[] = [];
  EXPLORE_PAGE_PREFIX = '/explore/';
  explorationId: string;
  expStates: StateObjectsBackendDict;
  checkpointCount: number;
  mostRecentlyReachedCheckpoint: string;
  prevSessionStatesProgress: string[] = [];
  pinIdUrl: string;
  completedcheckpoints: number = 0;
  nodeDataLoaded = false;
  totalCheckpointLoaded = false;
  checkpointStatusArray: string[];
  resumeButtonActivate = false;
  constructor(
    private explorationEngineService: ExplorationEngineService,
    private assetsBackendApiService: AssetsBackendApiService,
    private urlService: UrlService,
    private editableExplorationBackendApiService: EditableExplorationBackendApiService,
    private readOnlyExplorationBackendApiService: ReadOnlyExplorationBackendApiService,
    private explorationObjectFactory: ExplorationObjectFactory,
    private windowDimensionsService: WindowDimensionsService
  ) {}

  ngOnInit(): void {
    this.thumbnailFilename = this.node.getThumbnailFilename();
    this.thumbnailBgColor = this.node.getThumbnailBgColor();
    this.nodeId = this.node.getId();
    this.pathIconParameters = this.generatePathIconParameters();
    this.explorationId = this.node.getExplorationId();
    let states: StateObjectsBackendDict;
    this.readOnlyExplorationBackendApiService
      .loadLatestExplorationAsync(
        this.explorationId,
        this.urlService.getPidFromUrl()
      )
      .then(response => {
        states = response.exploration.states;

        this.mostRecentlyReachedCheckpoint =
          response.most_recently_reached_checkpoint_state_name;

        let exploration = this.explorationObjectFactory.createFromBackendDict({
          auto_tts_enabled: response.auto_tts_enabled,
          draft_changes: [],
          is_version_of_draft_valid: true,
          init_state_name: response.exploration.init_state_name,
          param_changes: response.exploration.param_changes,
          param_specs: response.exploration.param_specs,
          states: response.exploration.states,
          title: response.exploration.title,
          draft_change_list_id: response.draft_change_list_id,
          language_code: response.exploration.language_code,
          version: response.version,
          next_content_id_index: response.exploration.next_content_id_index,
          exploration_metadata: response.exploration_metadata,
        });
        this.explorationEngineService.exploration = exploration;
        this.prevSessionStatesProgress =
          this.explorationEngineService.getShortestPathToState(
            states,
            this.mostRecentlyReachedCheckpoint
          );
        for (let i = 0; i < this.prevSessionStatesProgress.length; i++) {
          // Set state name of a previously completed state.
          let stateName = this.prevSessionStatesProgress[i];
          if (this.mostRecentlyReachedCheckpoint === stateName) {
            break;
          }
          this.completedcheckpoints += 1;
        }
        this.nodeDataLoaded = true;
        this.getCheckpointCount();
        this.getCompletedProgressStatus();
      });
  }

  async getCheckpointCount(): Promise<void> {
    return this.readOnlyExplorationBackendApiService
      .fetchExplorationAsync(this.explorationId, null)
      .then((response: FetchExplorationBackendResponse) => {
        this.expStates = response.exploration.states;
        let count = 0;
        for (let [, value] of Object.entries(this.expStates)) {
          if (value.card_is_checkpoint) {
            count++;
          }
        }
        this.checkpointCount = count;
        this.totalCheckpointLoaded = true;
        this.getCompletedProgressStatus();
      });
  }

  getCompletedProgressStatus(): void {
    if (this.nodeDataLoaded && this.totalCheckpointLoaded) {
      this.checkpointStatusArray = new Array(this.checkpointCount);
      for (let i = 0; i < this.completedcheckpoints; i++) {
        this.checkpointStatusArray[i] = CHECKPOINT_STATUS_COMPLETED;
        this.resumeButtonActivate = true;
      }
      // If not all checkpoints are completed, then the checkpoint immediately
      // following the last completed checkpoint is labeled 'in-progress'.
      if (this.checkpointCount > this.completedcheckpoints) {
        this.checkpointStatusArray[this.completedcheckpoints] =
          CHECKPOINT_STATUS_IN_PROGRESS;
      }
      for (
        let i = this.completedcheckpoints + 1;
        i < this.checkpointCount;
        i++
      ) {
        this.checkpointStatusArray[i] = CHECKPOINT_STATUS_INCOMPLETE;
      }
    }
  }

  getCompletedProgressBarWidth(): number {
    if (this.completedcheckpoints === 0) {
      return 0;
    }
    const spaceBetweenEachNode = 100 / (this.checkpointCount - 1);
    return (
      (this.completedcheckpoints - 1) * spaceBetweenEachNode +
      spaceBetweenEachNode / 2
    );
  }

  generatePathIconParameters(): IconParametersArray[] {
    let iconParametersArray: IconParametersArray[] = [];
    this.thumbnailUrl = this.assetsBackendApiService.getThumbnailUrlForPreview(
      AppConstants.ENTITY_TYPE.STORY,
      this.storyId,
      this.thumbnailFilename
    );
    iconParametersArray.push({
      thumbnailIconUrl: this.thumbnailUrl,
      left: '225px',
      top: '35px',
      thumbnailBgColor: this.thumbnailBgColor,
    });
    return iconParametersArray;
  }

  clickstart(): void {
    const startLink = this.getStartLink();
    window.open(startLink, '_blank');
  }

  getStartLink(): string {
    this.editableExplorationBackendApiService.resetExplorationProgressAsync(
      this.explorationId
    );
    let urlParams = this.urlService.addField(
      '',
      'story_url_fragment',
      this.storyUrlFragment
    );
    urlParams = this.urlService.addField(
      urlParams,
      'topic_url_fragment',
      this.topicUrlFragment
    );
    urlParams = this.urlService.addField(
      urlParams,
      'classroom_url_fragment',
      this.classroomUrlFragment
    );
    urlParams = this.urlService.addField(
      urlParams,
      'node_id',
      this.node.getId()
    );
    return `${this.EXPLORE_PAGE_PREFIX}${this.node.getExplorationId()}${urlParams}`;
  }
}

angular.module('oppia').directive(
  'oppiaStoryNodeTile',
  downgradeComponent({
    component: StoryNodeTileComponent,
  }) as angular.IDirectiveFactory
);
