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
 * @fileoverview Factory for creating new frontend instances of Playthrough
 *     domain objects.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import {
  LearnerActionBackendDict,
  LearnerAction,
  LearnerActionObjectFactory
} from 'domain/statistics/LearnerActionObjectFactory';
import {
  EarlyQuitCustomizationArgs,
  CyclicStateTransitionsCustomizationArgs,
  MultipleIncorrectSubmissionsCustomizationArgs
} from 'domain/statistics/PlaythroughIssueObjectFactory';

// NOTE TO DEVELOPERS: Treat this as an implementation detail; do not export it.
// This type takes one of the values of the customization args based
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
interface PlaythroughBackendDictBase<IssueType> {
  'issue_type': IssueType;
  'issue_customization_args': IssueCustomizationArgs<IssueType>;
  'exp_id': string;
  'exp_version': number;
  'actions': LearnerActionBackendDict[];
}

export type EarlyQuitPlaythroughBackendDict = (
  PlaythroughBackendDictBase<'EarlyQuit'>);

export type MultipleIncorrectSubmissionsPlaythroughBackendDict = (
  PlaythroughBackendDictBase<'MultipleIncorrectSubmissions'>);

export type CyclicStateTransitionsPlaythroughBackendDict = (
  PlaythroughBackendDictBase<'CyclicStateTransitions'>);

export type PlaythroughBackendDict = (
  EarlyQuitPlaythroughBackendDict |
  MultipleIncorrectSubmissionsPlaythroughBackendDict |
  CyclicStateTransitionsPlaythroughBackendDict);

// NOTE TO DEVELOPERS: Treat this as an implementation detail; do not export it.
// This class takes the type according to the IssueType parameter.
abstract class PlaythroughBase<IssueType> {
  constructor(
    public readonly issueType: IssueType,
    public issueCustomizationArgs: IssueCustomizationArgs<IssueType>,
    public expId: string,
    public expVersion: number,
    public actions: LearnerAction[]) { }

  abstract getStateNameWithIssue(): string;

  toBackendDict(): PlaythroughBackendDictBase<IssueType> {
    return {
      exp_id: this.expId,
      exp_version: this.expVersion,
      issue_type: this.issueType,
      issue_customization_args: this.issueCustomizationArgs,
      actions: this.actions.map(a => a.toBackendDict()),
    };
  }
}

export class EarlyQuitPlaythrough extends PlaythroughBase<
    'EarlyQuit'> {
  getStateNameWithIssue(): string {
    return this.issueCustomizationArgs.state_name.value;
  }
}

export class MultipleIncorrectSubmissionsPlaythrough extends PlaythroughBase<
    'MultipleIncorrectSubmissions'> {
  getStateNameWithIssue(): string {
    return this.issueCustomizationArgs.state_name.value;
  }
}

export class CyclicStateTransitionsPlaythrough extends PlaythroughBase<
    'CyclicStateTransitions'> {
  getStateNameWithIssue(): string {
    const stateNames = this.issueCustomizationArgs.state_names.value;
    return stateNames[stateNames.length - 1];
  }
}

export type Playthrough = (
  EarlyQuitPlaythrough |
  MultipleIncorrectSubmissionsPlaythrough |
  CyclicStateTransitionsPlaythrough);

@Injectable({
  providedIn: 'root'
})
export class PlaythroughObjectFactory {
  constructor(private learnerActionObjectFactory: LearnerActionObjectFactory) {}

  createNewEarlyQuitPlaythrough(
      expId: string, expVersion: number,
      issueCustomizationArgs: EarlyQuitCustomizationArgs,
      actions: LearnerAction[]): EarlyQuitPlaythrough {
    return new EarlyQuitPlaythrough(
      'EarlyQuit', issueCustomizationArgs, expId,
      expVersion, actions);
  }

  createNewMultipleIncorrectSubmissionsPlaythrough(
      expId: string, expVersion: number,
      issueCustomizationArgs: MultipleIncorrectSubmissionsCustomizationArgs,
      actions: LearnerAction[]): MultipleIncorrectSubmissionsPlaythrough {
    return new MultipleIncorrectSubmissionsPlaythrough(
      'MultipleIncorrectSubmissions', issueCustomizationArgs,
      expId, expVersion, actions);
  }

  createNewCyclicStateTransitionsPlaythrough(
      expId: string, expVersion: number,
      issueCustomizationArgs: CyclicStateTransitionsCustomizationArgs,
      actions: LearnerAction[]): CyclicStateTransitionsPlaythrough {
    return new CyclicStateTransitionsPlaythrough(
      'CyclicStateTransitions', issueCustomizationArgs,
      expId, expVersion, actions);
  }

  createFromBackendDict(
      playthroughBackendDict: PlaythroughBackendDict): Playthrough {
    var actions = playthroughBackendDict.actions.map(
      this.learnerActionObjectFactory.createFromBackendDict);

    switch (playthroughBackendDict.issue_type) {
      case 'EarlyQuit':
        return new EarlyQuitPlaythrough(
          playthroughBackendDict.issue_type,
          playthroughBackendDict.issue_customization_args,
          playthroughBackendDict.exp_id,
          playthroughBackendDict.exp_version, actions);
      case 'CyclicStateTransitions':
        return new CyclicStateTransitionsPlaythrough(
          playthroughBackendDict.issue_type,
          playthroughBackendDict.issue_customization_args,
          playthroughBackendDict.exp_id,
          playthroughBackendDict.exp_version, actions);
      case 'MultipleIncorrectSubmissions':
        return new MultipleIncorrectSubmissionsPlaythrough(
          playthroughBackendDict.issue_type,
          playthroughBackendDict.issue_customization_args,
          playthroughBackendDict.exp_id,
          playthroughBackendDict.exp_version, actions);
      default:
        break;
    }

    const invalidBackendDict: never = playthroughBackendDict;
    throw new Error(
      'Backend dict does not match any known issue type: ' +
      angular.toJson(invalidBackendDict));
  }
}

angular.module('oppia').factory(
  'PlaythroughObjectFactory', downgradeInjectable(PlaythroughObjectFactory));
