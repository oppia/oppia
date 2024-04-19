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
 * @fileoverview Service for the exploration states version history.
 */

import {TestBed} from '@angular/core/testing';
import {ExplorationMetadata} from 'domain/exploration/ExplorationMetadataObjectFactory';
import {ParamSpecObjectFactory} from 'domain/exploration/ParamSpecObjectFactory';
import {ParamSpecs} from 'domain/exploration/ParamSpecsObjectFactory';
import {StateObjectFactory} from 'domain/state/StateObjectFactory';
import {VersionHistoryService} from './version-history.service';

describe('Version history service', () => {
  let versionHistoryService: VersionHistoryService;
  let paramSpecObjectFactory: ParamSpecObjectFactory;
  let stateObjectFactory: StateObjectFactory;

  beforeEach(() => {
    versionHistoryService = TestBed.inject(VersionHistoryService);
    stateObjectFactory = TestBed.inject(StateObjectFactory);

    versionHistoryService.init(4);
  });

  it('should insert metadata version history', () => {
    expect(versionHistoryService.fetchedMetadata.length).toEqual(0);

    const explorationMetadata = new ExplorationMetadata(
      'title',
      'category',
      'objective',
      'en',
      [],
      '',
      '',
      55,
      'Introduction',
      new ParamSpecs({}, paramSpecObjectFactory),
      [],
      false,
      true
    );
    versionHistoryService.insertMetadataVersionHistoryData(
      3,
      explorationMetadata,
      ''
    );

    expect(versionHistoryService.fetchedMetadata.length).toEqual(1);

    versionHistoryService.insertMetadataVersionHistoryData(
      3,
      explorationMetadata,
      ''
    );
    expect(versionHistoryService.fetchedMetadata.length).toEqual(1);
  });

  it('should reset metadata version history', () => {
    const explorationMetadata = new ExplorationMetadata(
      'title',
      'category',
      'objective',
      'en',
      [],
      '',
      '',
      55,
      'Introduction',
      new ParamSpecs({}, paramSpecObjectFactory),
      [],
      false,
      true
    );
    versionHistoryService.insertMetadataVersionHistoryData(
      3,
      explorationMetadata,
      ''
    );

    expect(versionHistoryService.fetchedMetadata.length).toEqual(1);

    versionHistoryService.resetMetadataVersionHistory();

    expect(versionHistoryService.fetchedMetadata.length).toEqual(0);
  });

  it('should insert state version history', () => {
    expect(versionHistoryService.fetchedStateData.length).toEqual(0);

    const stateObject = {
      classifier_model_id: null,
      content: {
        content_id: 'content',
        html: '',
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
          default_outcome: {},
        },
      },
      interaction: {
        answer_groups: [],
        confirmed_unclassified_answers: [],
        customization_args: {
          rows: {
            value: 1,
          },
          placeholder: {
            value: {
              unicode_str: 'Type your answer here.',
              content_id: '',
            },
          },
        },
        default_outcome: {
          dest: '(untitled state)',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'default_outcome',
            html: '',
          },
          param_changes: [],
          labelled_as_correct: false,
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null,
        },
        hints: [],
        solution: null,
        id: 'TextInput',
      },
      linked_skill_id: null,
      next_content_id_index: 0,
      param_changes: [],
      solicit_answer_details: false,
      card_is_checkpoint: false,
      written_translations: {
        translations_mapping: {
          content: {},
          default_outcome: {},
          hint_1: {},
          rule_input_2: {},
        },
      },
    };
    const stateData = stateObjectFactory.createFromBackendDict(
      'State',
      stateObject
    );
    versionHistoryService.insertStateVersionHistoryData(3, stateData, '');

    expect(versionHistoryService.fetchedStateData.length).toEqual(1);

    versionHistoryService.insertStateVersionHistoryData(3, stateData, '');

    expect(versionHistoryService.fetchedStateData.length).toEqual(1);
  });

  it('should reset state version history', () => {
    const stateObject = {
      classifier_model_id: null,
      content: {
        content_id: 'content',
        html: '',
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
          default_outcome: {},
        },
      },
      interaction: {
        answer_groups: [],
        confirmed_unclassified_answers: [],
        customization_args: {
          rows: {
            value: 1,
          },
          placeholder: {
            value: {
              unicode_str: 'Type your answer here.',
              content_id: '',
            },
          },
        },
        default_outcome: {
          dest: '(untitled state)',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'default_outcome',
            html: '',
          },
          param_changes: [],
          labelled_as_correct: false,
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null,
        },
        hints: [],
        solution: null,
        id: 'TextInput',
      },
      linked_skill_id: null,
      next_content_id_index: 0,
      param_changes: [],
      solicit_answer_details: false,
      card_is_checkpoint: false,
      written_translations: {
        translations_mapping: {
          content: {},
          default_outcome: {},
          hint_1: {},
          rule_input_2: {},
        },
      },
    };
    const stateData = stateObjectFactory.createFromBackendDict(
      'State',
      stateObject
    );
    versionHistoryService.insertStateVersionHistoryData(3, stateData, '');

    expect(versionHistoryService.fetchedStateData.length).toEqual(1);

    versionHistoryService.resetStateVersionHistory();

    expect(versionHistoryService.fetchedStateData.length).toEqual(0);
  });

  it('should find whether new metadata version history data should be fetched', () => {
    const explorationMetadata = new ExplorationMetadata(
      'title',
      'category',
      'objective',
      'en',
      [],
      '',
      '',
      55,
      'Introduction',
      new ParamSpecs({}, paramSpecObjectFactory),
      [],
      false,
      true
    );
    versionHistoryService.insertMetadataVersionHistoryData(
      3,
      explorationMetadata,
      ''
    );

    expect(
      versionHistoryService.shouldFetchNewMetadataVersionHistory()
    ).toBeTrue();

    versionHistoryService.insertMetadataVersionHistoryData(
      4,
      explorationMetadata,
      ''
    );
    versionHistoryService.insertMetadataVersionHistoryData(
      5,
      explorationMetadata,
      ''
    );

    expect(
      versionHistoryService.shouldFetchNewMetadataVersionHistory()
    ).toBeFalse();
  });

  it('should find whether new state version history data should be fetched', () => {
    const stateObject = {
      classifier_model_id: null,
      content: {
        content_id: 'content',
        html: '',
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
          default_outcome: {},
        },
      },
      interaction: {
        answer_groups: [],
        confirmed_unclassified_answers: [],
        customization_args: {
          rows: {
            value: 1,
          },
          placeholder: {
            value: {
              unicode_str: 'Type your answer here.',
              content_id: '',
            },
          },
        },
        default_outcome: {
          dest: '(untitled state)',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'default_outcome',
            html: '',
          },
          param_changes: [],
          labelled_as_correct: false,
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null,
        },
        hints: [],
        solution: null,
        id: 'TextInput',
      },
      linked_skill_id: null,
      next_content_id_index: 0,
      param_changes: [],
      solicit_answer_details: false,
      card_is_checkpoint: false,
      written_translations: {
        translations_mapping: {
          content: {},
          default_outcome: {},
          hint_1: {},
          rule_input_2: {},
        },
      },
    };
    const stateData = stateObjectFactory.createFromBackendDict(
      'State',
      stateObject
    );
    versionHistoryService.insertStateVersionHistoryData(3, stateData, '');

    expect(
      versionHistoryService.shouldFetchNewStateVersionHistory()
    ).toBeTrue();

    versionHistoryService.insertStateVersionHistoryData(4, stateData, '');
    versionHistoryService.insertStateVersionHistoryData(5, stateData, '');

    expect(
      versionHistoryService.shouldFetchNewStateVersionHistory()
    ).toBeFalse();
  });

  it('should get whether we should show backward state diff data', () => {
    expect(versionHistoryService.canShowBackwardStateDiffData()).toBeFalse();

    const stateObject = {
      classifier_model_id: null,
      content: {
        content_id: 'content',
        html: '',
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
          default_outcome: {},
        },
      },
      interaction: {
        answer_groups: [],
        confirmed_unclassified_answers: [],
        customization_args: {
          rows: {
            value: 1,
          },
          placeholder: {
            value: {
              unicode_str: 'Type your answer here.',
              content_id: '',
            },
          },
        },
        default_outcome: {
          dest: '(untitled state)',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'default_outcome',
            html: '',
          },
          param_changes: [],
          labelled_as_correct: false,
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null,
        },
        hints: [],
        solution: null,
        id: 'TextInput',
      },
      linked_skill_id: null,
      next_content_id_index: 0,
      param_changes: [],
      solicit_answer_details: false,
      card_is_checkpoint: false,
      written_translations: {
        translations_mapping: {
          content: {},
          default_outcome: {},
          hint_1: {},
          rule_input_2: {},
        },
      },
    };
    const stateData = stateObjectFactory.createFromBackendDict(
      'State',
      stateObject
    );
    versionHistoryService.insertStateVersionHistoryData(3, stateData, '');
    versionHistoryService.insertStateVersionHistoryData(4, stateData, '');

    expect(versionHistoryService.canShowBackwardStateDiffData()).toBeTrue();
  });

  it('should get whether we should show backward metadata diff data', () => {
    expect(versionHistoryService.canShowBackwardMetadataDiffData()).toBeFalse();

    const explorationMetadata = new ExplorationMetadata(
      'title',
      'category',
      'objective',
      'en',
      [],
      '',
      '',
      55,
      'Introduction',
      new ParamSpecs({}, paramSpecObjectFactory),
      [],
      false,
      true
    );
    versionHistoryService.insertMetadataVersionHistoryData(
      3,
      explorationMetadata,
      ''
    );
    versionHistoryService.insertMetadataVersionHistoryData(
      4,
      explorationMetadata,
      ''
    );

    expect(versionHistoryService.canShowBackwardMetadataDiffData()).toBeTrue();
  });

  it('should get whether we should show foward state diff data', () => {
    expect(versionHistoryService.canShowForwardStateDiffData()).toBeFalse();

    const stateObject = {
      classifier_model_id: null,
      content: {
        content_id: 'content',
        html: '',
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
          default_outcome: {},
        },
      },
      interaction: {
        answer_groups: [],
        confirmed_unclassified_answers: [],
        customization_args: {
          rows: {
            value: 1,
          },
          placeholder: {
            value: {
              unicode_str: 'Type your answer here.',
              content_id: '',
            },
          },
        },
        default_outcome: {
          dest: '(untitled state)',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'default_outcome',
            html: '',
          },
          param_changes: [],
          labelled_as_correct: false,
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null,
        },
        hints: [],
        solution: null,
        id: 'TextInput',
      },
      linked_skill_id: null,
      next_content_id_index: 0,
      param_changes: [],
      solicit_answer_details: false,
      card_is_checkpoint: false,
      written_translations: {
        translations_mapping: {
          content: {},
          default_outcome: {},
          hint_1: {},
          rule_input_2: {},
        },
      },
    };
    const stateData = stateObjectFactory.createFromBackendDict(
      'State',
      stateObject
    );
    versionHistoryService.insertStateVersionHistoryData(3, stateData, '');
    versionHistoryService.insertStateVersionHistoryData(4, stateData, '');
    versionHistoryService.insertStateVersionHistoryData(5, stateData, '');
    versionHistoryService.incrementCurrentPositionInStateVersionHistoryList();
    versionHistoryService.incrementCurrentPositionInStateVersionHistoryList();

    expect(versionHistoryService.canShowForwardStateDiffData()).toBeTrue();
  });

  it('should get whether we should show foward metadata diff data', () => {
    expect(versionHistoryService.canShowForwardMetadataDiffData()).toBeFalse();

    const explorationMetadata = new ExplorationMetadata(
      'title',
      'category',
      'objective',
      'en',
      [],
      '',
      '',
      55,
      'Introduction',
      new ParamSpecs({}, paramSpecObjectFactory),
      [],
      false,
      true
    );
    versionHistoryService.insertMetadataVersionHistoryData(
      3,
      explorationMetadata,
      ''
    );
    versionHistoryService.insertMetadataVersionHistoryData(
      4,
      explorationMetadata,
      ''
    );
    versionHistoryService.insertMetadataVersionHistoryData(
      5,
      explorationMetadata,
      ''
    );
    versionHistoryService.incrementCurrentPositionInMetadataVersionHistoryList();
    versionHistoryService.incrementCurrentPositionInMetadataVersionHistoryList();

    expect(versionHistoryService.canShowForwardMetadataDiffData()).toBeTrue();
  });

  it('should get backward state diff data', () => {
    const stateObject = {
      classifier_model_id: null,
      content: {
        content_id: 'content',
        html: '',
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
          default_outcome: {},
        },
      },
      interaction: {
        answer_groups: [],
        confirmed_unclassified_answers: [],
        customization_args: {
          rows: {
            value: 1,
          },
          placeholder: {
            value: {
              unicode_str: 'Type your answer here.',
              content_id: '',
            },
          },
        },
        default_outcome: {
          dest: '(untitled state)',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'default_outcome',
            html: '',
          },
          param_changes: [],
          labelled_as_correct: false,
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null,
        },
        hints: [],
        solution: null,
        id: 'TextInput',
      },
      linked_skill_id: null,
      next_content_id_index: 0,
      param_changes: [],
      solicit_answer_details: false,
      card_is_checkpoint: false,
      written_translations: {
        translations_mapping: {
          content: {},
          default_outcome: {},
          hint_1: {},
          rule_input_2: {},
        },
      },
    };
    const stateData = stateObjectFactory.createFromBackendDict(
      'State',
      stateObject
    );
    versionHistoryService.insertStateVersionHistoryData(3, stateData, '');
    versionHistoryService.insertStateVersionHistoryData(2, stateData, '');
    const diffData = versionHistoryService.getBackwardStateDiffData();

    expect(diffData.oldVersionNumber).toEqual(2);
    expect(diffData.newVersionNumber).toEqual(3);
  });

  it('should get forward state diff data', () => {
    const stateObject = {
      classifier_model_id: null,
      content: {
        content_id: 'content',
        html: '',
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
          default_outcome: {},
        },
      },
      interaction: {
        answer_groups: [],
        confirmed_unclassified_answers: [],
        customization_args: {
          rows: {
            value: 1,
          },
          placeholder: {
            value: {
              unicode_str: 'Type your answer here.',
              content_id: '',
            },
          },
        },
        default_outcome: {
          dest: '(untitled state)',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'default_outcome',
            html: '',
          },
          param_changes: [],
          labelled_as_correct: false,
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null,
        },
        hints: [],
        solution: null,
        id: 'TextInput',
      },
      linked_skill_id: null,
      next_content_id_index: 0,
      param_changes: [],
      solicit_answer_details: false,
      card_is_checkpoint: false,
      written_translations: {
        translations_mapping: {
          content: {},
          default_outcome: {},
          hint_1: {},
          rule_input_2: {},
        },
      },
    };
    const stateData = stateObjectFactory.createFromBackendDict(
      'State',
      stateObject
    );
    versionHistoryService.insertStateVersionHistoryData(3, stateData, '');
    versionHistoryService.insertStateVersionHistoryData(2, stateData, '');
    versionHistoryService.insertStateVersionHistoryData(1, stateData, '');
    versionHistoryService.incrementCurrentPositionInStateVersionHistoryList();
    versionHistoryService.incrementCurrentPositionInStateVersionHistoryList();
    const diffData = versionHistoryService.getForwardStateDiffData();

    expect(diffData.oldVersionNumber).toEqual(2);
    expect(diffData.newVersionNumber).toEqual(3);
  });

  it('should get backward metadata diff data', () => {
    const explorationMetadata = new ExplorationMetadata(
      'title',
      'category',
      'objective',
      'en',
      [],
      '',
      '',
      55,
      'Introduction',
      new ParamSpecs({}, paramSpecObjectFactory),
      [],
      false,
      true
    );
    versionHistoryService.insertMetadataVersionHistoryData(
      3,
      explorationMetadata,
      ''
    );
    versionHistoryService.insertMetadataVersionHistoryData(
      2,
      explorationMetadata,
      ''
    );
    versionHistoryService.insertMetadataVersionHistoryData(
      1,
      explorationMetadata,
      ''
    );
    const diffData = versionHistoryService.getBackwardMetadataDiffData();

    expect(diffData.oldVersionNumber).toEqual(2);
    expect(diffData.newVersionNumber).toEqual(3);
  });

  it('should get forward metadata diff data', () => {
    const explorationMetadata = new ExplorationMetadata(
      'title',
      'category',
      'objective',
      'en',
      [],
      '',
      '',
      55,
      'Introduction',
      new ParamSpecs({}, paramSpecObjectFactory),
      [],
      false,
      true
    );
    versionHistoryService.insertMetadataVersionHistoryData(
      3,
      explorationMetadata,
      ''
    );
    versionHistoryService.insertMetadataVersionHistoryData(
      2,
      explorationMetadata,
      ''
    );
    versionHistoryService.insertMetadataVersionHistoryData(
      1,
      explorationMetadata,
      ''
    );
    versionHistoryService.incrementCurrentPositionInMetadataVersionHistoryList();
    versionHistoryService.incrementCurrentPositionInMetadataVersionHistoryList();
    const diffData = versionHistoryService.getForwardMetadataDiffData();

    expect(diffData.oldVersionNumber).toEqual(2);
    expect(diffData.newVersionNumber).toEqual(3);
  });

  it('should get and set the latest version of the exploration', () => {
    expect(versionHistoryService.getLatestVersionOfExploration()).toEqual(4);

    versionHistoryService.setLatestVersionOfExploration(5);

    expect(versionHistoryService.getLatestVersionOfExploration()).toEqual(5);
  });

  it('should get and set current position in state version history list', () => {
    expect(
      versionHistoryService.getCurrentPositionInStateVersionHistoryList()
    ).toEqual(0);

    versionHistoryService.setCurrentPositionInStateVersionHistoryList(2);

    expect(
      versionHistoryService.getCurrentPositionInStateVersionHistoryList()
    ).toEqual(2);
  });

  it('should get and set current position in metadata version history list', () => {
    expect(
      versionHistoryService.getCurrentPositionInMetadataVersionHistoryList()
    ).toEqual(0);

    versionHistoryService.setCurrentPositionInMetadataVersionHistoryList(2);

    expect(
      versionHistoryService.getCurrentPositionInMetadataVersionHistoryList()
    ).toEqual(2);
  });

  it('should decrement current position in state version history list', () => {
    versionHistoryService.setCurrentPositionInStateVersionHistoryList(2);

    expect(
      versionHistoryService.getCurrentPositionInStateVersionHistoryList()
    ).toEqual(2);

    versionHistoryService.decrementCurrentPositionInStateVersionHistoryList();

    expect(
      versionHistoryService.getCurrentPositionInStateVersionHistoryList()
    ).toEqual(1);
  });

  it('should decrement current position in metadata version history list', () => {
    versionHistoryService.setCurrentPositionInMetadataVersionHistoryList(2);

    expect(
      versionHistoryService.getCurrentPositionInMetadataVersionHistoryList()
    ).toEqual(2);

    versionHistoryService.decrementCurrentPositionInMetadataVersionHistoryList();

    expect(
      versionHistoryService.getCurrentPositionInMetadataVersionHistoryList()
    ).toEqual(1);
  });
});
