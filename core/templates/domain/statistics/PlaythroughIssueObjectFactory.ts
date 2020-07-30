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

// NOTE TO DEVELOPERS: Treat this as an implementation detail; do not export it.
// This type takes one of the values of the above customization args based
// on the type of IssueType.
type IssueCustomizationArgs<IssueType> = (
  IssueType extends 'EarlyQuit' ? EarlyQuitCustomizationArgs :
  IssueType extends 'CyclicStateTransitions' ?
  CyclicStateTransitionsCustomizationArgs :
  IssueType extends 'MultipleIncorrectSubmissions' ?
  MultipleIncorrectSubmissionsCustomizationArgs : never);

// NOTE TO DEVELOPERS: Treat this as an implementation detail; do not export it.
// This interface takes the type of backend dict according to the IssueType
// parameter.
interface PlaythroughIssueBackendDictBase<IssueType> {
  'issue_type': IssueType;
  'issue_customization_args': IssueCustomizationArgs<IssueType>;
  'playthrough_ids': string[];
  'schema_version': number;
  'is_valid': boolean;
}

export type EarlyQuitPlaythroughIssueBackendDict = (
  PlaythroughIssueBackendDictBase<'EarlyQuit'>);

export type MultipleIncorrectSubmissionsPlaythroughIssueBackendDict = (
  PlaythroughIssueBackendDictBase<'MultipleIncorrectSubmissions'>);

export type CyclicStateTransitionsPlaythroughIssueBackendDict = (
  PlaythroughIssueBackendDictBase<'CyclicStateTransitions'>);

export type PlaythroughIssueBackendDict = (
  EarlyQuitPlaythroughIssueBackendDict |
  MultipleIncorrectSubmissionsPlaythroughIssueBackendDict |
  CyclicStateTransitionsPlaythroughIssueBackendDict);

// NOTE TO DEVELOPERS: Treat this as an implementation detail; do not export it.
// This class takes the type according to the IssueType parameter.
abstract class PlaythroughIssueBase<IssueType> {
  constructor(
    public readonly issueType: IssueType,
    public issueCustomizationArgs: IssueCustomizationArgs<IssueType>,
    public playthroughIds: string[],
    public schemaVersion: number,
    public isValid: boolean) { }

  abstract getStateNameWithIssue(): string;

  toBackendDict(): PlaythroughIssueBackendDictBase<IssueType> {
    return {
      issue_type: this.issueType,
      issue_customization_args: this.issueCustomizationArgs,
      playthrough_ids: this.playthroughIds,
      schema_version: this.schemaVersion,
      is_valid: this.isValid,
    };
  }
}

export class EarlyQuitPlaythroughIssue extends
  PlaythroughIssueBase<'EarlyQuit'> {
  getStateNameWithIssue(): string {
    return this.issueCustomizationArgs.state_name.value;
  }
}

export class MultipleIncorrectSubmissionsPlaythroughIssue extends
  PlaythroughIssueBase<'MultipleIncorrectSubmissions'> {
  getStateNameWithIssue(): string {
    return this.issueCustomizationArgs.state_name.value;
  }
}

export class CyclicStateTransitionsPlaythroughIssue extends
  PlaythroughIssueBase<'CyclicStateTransitions'> {
  getStateNameWithIssue(): string {
    const stateNames = this.issueCustomizationArgs.state_names.value;
    return stateNames[stateNames.length - 1];
  }
}

export type PlaythroughIssue = (
  EarlyQuitPlaythroughIssue |
  MultipleIncorrectSubmissionsPlaythroughIssue |
  CyclicStateTransitionsPlaythroughIssue);

@Injectable({
  providedIn: 'root'
})
export class PlaythroughIssueObjectFactory {
  createFromBackendDict(
      backendDict: PlaythroughIssueBackendDict): PlaythroughIssue {
    switch (backendDict.issue_type) {
      case 'EarlyQuit':
        return new EarlyQuitPlaythroughIssue(
          backendDict.issue_type, backendDict.issue_customization_args,
          backendDict.playthrough_ids, backendDict.schema_version,
          backendDict.is_valid);
      case 'CyclicStateTransitions':
        return new CyclicStateTransitionsPlaythroughIssue(
          backendDict.issue_type, backendDict.issue_customization_args,
          backendDict.playthrough_ids, backendDict.schema_version,
          backendDict.is_valid);
      case 'MultipleIncorrectSubmissions':
        return new MultipleIncorrectSubmissionsPlaythroughIssue(
          backendDict.issue_type, backendDict.issue_customization_args,
          backendDict.playthrough_ids, backendDict.schema_version,
          backendDict.is_valid);
      default:
        break;
    }
    const invalidBackendDict: never = backendDict;
    throw new Error(
      'Backend dict does not match any known issue type: ' +
      angular.toJson(invalidBackendDict));
  }
}

angular.module('oppia').factory(
  'PlaythroughIssueObjectFactory',
  downgradeInjectable(PlaythroughIssueObjectFactory));
