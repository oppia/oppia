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
 * @fileoverview Model class for creating new frontend instances of Exploration
 *     Issue domain objects.
 */
export enum PlaythroughIssueType {
  EarlyQuit = 'EarlyQuit',
  CyclicStateTransitions = 'CyclicStateTransitions',
  MultipleIncorrectSubmissions = 'MultipleIncorrectSubmissions',
}

export interface EarlyQuitCustomizationArgs {
  'state_name': { value: string };
  'time_spent_in_exp_in_msecs': { value: number };
}

export interface CyclicStateTransitionsCustomizationArgs {
  'state_names': { value: string[] };
}

export interface MultipleIncorrectSubmissionsCustomizationArgs {
  'state_name': { value: string };
  'num_times_answered_incorrectly': { value: number };
}
export type PlaythroughIssueCustomizationArgs =
  | EarlyQuitCustomizationArgs
  | CyclicStateTransitionsCustomizationArgs
  | MultipleIncorrectSubmissionsCustomizationArgs;

export interface PlaythroughIssueBackendDict {
  issue_type: PlaythroughIssueType;
  issue_customization_args: PlaythroughIssueCustomizationArgs;
  playthrough_ids: string[];
  schema_version: number;
  is_valid: boolean;
}

export class PlaythroughIssue {
  constructor(
    public readonly issueType: PlaythroughIssueType,
    public issueCustomizationArgs: PlaythroughIssueCustomizationArgs,
    public playthroughIds: string[],
    public schemaVersion: number,
    public isValid: boolean
  ) {}

  toBackendDict(): PlaythroughIssueBackendDict {
    return {
      issue_type: this.issueType,
      issue_customization_args: this.issueCustomizationArgs,
      playthrough_ids: this.playthroughIds,
      schema_version: this.schemaVersion,
      is_valid: this.isValid,
    };
  }

  getStateNameWithIssue(): string {
    switch (this.issueType) {
      case PlaythroughIssueType.EarlyQuit: {
        const args = this.issueCustomizationArgs as EarlyQuitCustomizationArgs;
        return args.state_name.value;
      }
      case PlaythroughIssueType.MultipleIncorrectSubmissions: {
        const args = this
          .issueCustomizationArgs as
            MultipleIncorrectSubmissionsCustomizationArgs;
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

  static createFromBackendDict(
      backendDict: PlaythroughIssueBackendDict
  ): PlaythroughIssue {
    switch (backendDict.issue_type) {
      case PlaythroughIssueType.EarlyQuit:
        return new PlaythroughIssue(
          backendDict.issue_type,
          backendDict.issue_customization_args as EarlyQuitCustomizationArgs,
          backendDict.playthrough_ids,
          backendDict.schema_version,
          backendDict.is_valid
        );
      case PlaythroughIssueType.CyclicStateTransitions:
        return new PlaythroughIssue(
          backendDict.issue_type,
          backendDict.issue_customization_args as
            CyclicStateTransitionsCustomizationArgs,
          backendDict.playthrough_ids,
          backendDict.schema_version,
          backendDict.is_valid
        );
      case PlaythroughIssueType.MultipleIncorrectSubmissions:
        return new PlaythroughIssue(
          backendDict.issue_type,
          backendDict.issue_customization_args as
            MultipleIncorrectSubmissionsCustomizationArgs,
          backendDict.playthrough_ids,
          backendDict.schema_version,
          backendDict.is_valid
        );
      default:
        throw new Error(
          'Backend dict does not match any known issue type: ' +
            angular.toJson(backendDict)
        );
    }
  }
}
