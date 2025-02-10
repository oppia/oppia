// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Model class for creating new frontend instances of Playthrough
 *     domain objects.
 */

import {
  LearnerAction,
  LearnerActionBackendDict,
} from 'domain/statistics/learner-action.model';
import {
  PlaythroughIssueType,
  EarlyQuitCustomizationArgs,
  CyclicStateTransitionsCustomizationArgs,
  MultipleIncorrectSubmissionsCustomizationArgs,
  PlaythroughIssueCustomizationArgs,
} from 'domain/statistics/playthrough-issue.model';

export interface PlaythroughBackendDict {
  issue_type: PlaythroughIssueType;
  issue_customization_args: PlaythroughIssueCustomizationArgs;
  exp_id: string;
  exp_version: number;
  actions: LearnerActionBackendDict[];
}

export class Playthrough {
  constructor(
    public readonly issueType: PlaythroughIssueType,
    public issueCustomizationArgs: PlaythroughIssueCustomizationArgs,
    public expId: string,
    public expVersion: number,
    public actions: LearnerAction[]
  ) {}

  getStateNameWithIssue(): string {
    switch (this.issueType) {
      case PlaythroughIssueType.EarlyQuit: {
        const args = this.issueCustomizationArgs as EarlyQuitCustomizationArgs;
        return args.state_name.value;
      }
      case PlaythroughIssueType.MultipleIncorrectSubmissions: {
        const args = this
          .issueCustomizationArgs as MultipleIncorrectSubmissionsCustomizationArgs;
        return args.state_name.value;
      }
      case PlaythroughIssueType.CyclicStateTransitions: {
        const args = this
          .issueCustomizationArgs as CyclicStateTransitionsCustomizationArgs;
        const stateNames = args.state_names.value;
        return stateNames[stateNames.length - 1];
      }
      // Instance cannot exist with wrong issueType
      // default: Never happens.
    }
  }

  toBackendDict(): PlaythroughBackendDict {
    return {
      exp_id: this.expId,
      exp_version: this.expVersion,
      issue_type: this.issueType,
      issue_customization_args: this.issueCustomizationArgs,
      actions: this.actions.map(a => a.toBackendDict()),
    };
  }

  static createNewEarlyQuitPlaythrough(
    expId: string,
    expVersion: number,
    issueCustomizationArgs: EarlyQuitCustomizationArgs,
    actions: LearnerAction[]
  ): Playthrough {
    return new Playthrough(
      PlaythroughIssueType.EarlyQuit,
      issueCustomizationArgs,
      expId,
      expVersion,
      actions
    );
  }

  static createNewMultipleIncorrectSubmissionsPlaythrough(
    expId: string,
    expVersion: number,
    issueCustomizationArgs: MultipleIncorrectSubmissionsCustomizationArgs,
    actions: LearnerAction[]
  ): Playthrough {
    return new Playthrough(
      PlaythroughIssueType.MultipleIncorrectSubmissions,
      issueCustomizationArgs,
      expId,
      expVersion,
      actions
    );
  }

  static createNewCyclicStateTransitionsPlaythrough(
    expId: string,
    expVersion: number,
    issueCustomizationArgs: CyclicStateTransitionsCustomizationArgs,
    actions: LearnerAction[]
  ): Playthrough {
    return new Playthrough(
      PlaythroughIssueType.CyclicStateTransitions,
      issueCustomizationArgs,
      expId,
      expVersion,
      actions
    );
  }

  static createFromBackendDict(
    playthroughBackendDict: PlaythroughBackendDict
  ): Playthrough {
    const actions = playthroughBackendDict.actions.map(
      LearnerAction.createFromBackendDict
    );

    switch (playthroughBackendDict.issue_type) {
      case PlaythroughIssueType.EarlyQuit:
        return new Playthrough(
          playthroughBackendDict.issue_type,
          playthroughBackendDict.issue_customization_args,
          playthroughBackendDict.exp_id,
          playthroughBackendDict.exp_version,
          actions
        );
      case PlaythroughIssueType.CyclicStateTransitions:
        return new Playthrough(
          playthroughBackendDict.issue_type,
          playthroughBackendDict.issue_customization_args,
          playthroughBackendDict.exp_id,
          playthroughBackendDict.exp_version,
          actions
        );
      case PlaythroughIssueType.MultipleIncorrectSubmissions:
        return new Playthrough(
          playthroughBackendDict.issue_type,
          playthroughBackendDict.issue_customization_args,
          playthroughBackendDict.exp_id,
          playthroughBackendDict.exp_version,
          actions
        );
      default:
        throw new Error(
          'Backend dict does not match any known issue type: ' +
            angular.toJson(playthroughBackendDict)
        );
    }
  }
}
