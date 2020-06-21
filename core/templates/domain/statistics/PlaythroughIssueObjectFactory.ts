// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for creating new frontend instances of Exploration
 *     Issue domain objects.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

export interface IEarlyQuitCustomizationArgs {
  'state_name': {value: string};
  'time_spent_in_exp_in_msecs': {value: number};
}

export interface ICyclicStateTransitionsCustomizationArgs {
  'state_names': {value: string[]};
}

export interface IMultipleIncorrectSubmissionsCustomizationArgs {
  'state_name': {value: string};
  'num_times_answered_incorrectly': {value: number};
}

// NOTE TO DEVELOPERS: Do not export this.
type IssueType<ICustomizationArgs> = (
  ICustomizationArgs extends IEarlyQuitCustomizationArgs ? 'EarlyQuit' :
  ICustomizationArgs extends ICyclicStateTransitionsCustomizationArgs ?
  'CyclicStateTransitions' :
  ICustomizationArgs extends IMultipleIncorrectSubmissionsCustomizationArgs ?
  'MultipleIncorrectSubmissions' : never);

// NOTE TO DEVELOPERS: Treat this as an implementation detail; do not export it.
interface IPlaythroughIssueBackendDictBase<ICustomizationArgs> {
  'issue_type': IssueType<ICustomizationArgs>;
  'issue_customization_args': ICustomizationArgs;
  'playthrough_ids': string[];
  'schema_version': number;
  'is_valid': boolean;
}

export class PlaythroughIssue<ICustomizationArgs> {
  constructor(
      public readonly issueType: IssueType<ICustomizationArgs>,
      public issueCustomizationArgs: ICustomizationArgs,
      public playthroughIds: string[],
      public schemaVersion: number,
      public isValid: boolean) {}

  toBackendDict(): IPlaythroughIssueBackendDictBase<ICustomizationArgs> {
    return {
      issue_type: this.issueType,
      issue_customization_args: this.issueCustomizationArgs,
      playthrough_ids: this.playthroughIds,
      schema_version: this.schemaVersion,
      is_valid: this.isValid,
    };
  }
}

export type IPlaythroughIssueBackendDict = (
  IPlaythroughIssueBackendDictBase<IEarlyQuitCustomizationArgs> |
  IPlaythroughIssueBackendDictBase<
  IMultipleIncorrectSubmissionsCustomizationArgs> |
  IPlaythroughIssueBackendDictBase<ICyclicStateTransitionsCustomizationArgs>);

export type GenericPlaythroughIssue = (
  PlaythroughIssue<IEarlyQuitCustomizationArgs> |
  PlaythroughIssue<IMultipleIncorrectSubmissionsCustomizationArgs> |
  PlaythroughIssue<ICyclicStateTransitionsCustomizationArgs>);

@Injectable({
  providedIn: 'root'
})
export class PlaythroughIssueObjectFactory {
  createFromBackendDict(
      backendDict: IPlaythroughIssueBackendDict): GenericPlaythroughIssue {
    switch (backendDict.issue_type) {
      case 'EarlyQuit':
        return new PlaythroughIssue<IEarlyQuitCustomizationArgs>(
          backendDict.issue_type, backendDict.issue_customization_args,
          backendDict.playthrough_ids, backendDict.schema_version,
          backendDict.is_valid);
      case 'CyclicStateTransitions':
        return new PlaythroughIssue<ICyclicStateTransitionsCustomizationArgs>(
          backendDict.issue_type, backendDict.issue_customization_args,
          backendDict.playthrough_ids, backendDict.schema_version,
          backendDict.is_valid);
      case 'MultipleIncorrectSubmissions':
        return new PlaythroughIssue<
        IMultipleIncorrectSubmissionsCustomizationArgs>(
          backendDict.issue_type, backendDict.issue_customization_args,
          backendDict.playthrough_ids, backendDict.schema_version,
          backendDict.is_valid);
      default:
        break;
    }
    const invalidBackendDict: never = backendDict;
    throw new Error(
      'Backend dict does not match any known issue type: ' +
      JSON.stringify(invalidBackendDict));
  }
}

angular.module('oppia').factory(
  'PlaythroughIssueObjectFactory',
  downgradeInjectable(PlaythroughIssueObjectFactory));
