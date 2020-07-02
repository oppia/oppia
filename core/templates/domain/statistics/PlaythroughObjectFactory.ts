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
  IEarlyQuitCustomizationArgs,
  ICyclicStateTransitionsCustomizationArgs,
  IMultipleIncorrectSubmissionsCustomizationArgs
} from 'domain/statistics/PlaythroughIssueObjectFactory';
import {
  ILearnerActionBackendDict,
  LearnerAction,
  LearnerActionObjectFactory
} from 'domain/statistics/LearnerActionObjectFactory';

export interface IPlaythroughBackendDict {
  'exp_id': string;
  'exp_version': number;
  'issue_type': string;
  'issue_customization_args': (
    IEarlyQuitCustomizationArgs |
    ICyclicStateTransitionsCustomizationArgs |
    IMultipleIncorrectSubmissionsCustomizationArgs);
  'actions': ILearnerActionBackendDict[];
}

type IssueCustomizationArgs = (
  IEarlyQuitCustomizationArgs |
  ICyclicStateTransitionsCustomizationArgs |
  IMultipleIncorrectSubmissionsCustomizationArgs);

export class Playthrough {
  constructor(
      public expId: string,
      public expVersion: number,
      public issueType: string,
      public issueCustomizationArgs: IssueCustomizationArgs,
      public actions: LearnerAction[]) {}

  toBackendDict(): IPlaythroughBackendDict {
    return {
      exp_id: this.expId,
      exp_version: this.expVersion,
      issue_type: this.issueType,
      issue_customization_args: this.issueCustomizationArgs,
      actions: this.actions.map(a => a.toBackendDict()),
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class PlaythroughObjectFactory {
  constructor(private learnerActionObjectFactory: LearnerActionObjectFactory) {}

  createNew(
      expId: string, expVersion: number,
      issueType: string, issueCustomizationArgs: IssueCustomizationArgs,
      learnerActions: LearnerAction[]): Playthrough {
    return new Playthrough(
      expId, expVersion, issueType, issueCustomizationArgs, learnerActions);
  }

  /**
   * @typedef
   * @param {PlaythroughBackendDict} playthroughBackendDict
   * @returns {Playthrough}
   */
  createFromBackendDict(backendDict: IPlaythroughBackendDict): Playthrough {
    const learnerActions = backendDict.actions.map(
      this.learnerActionObjectFactory.createFromBackendDict);
    return new Playthrough(
      backendDict.exp_id, backendDict.exp_version, backendDict.issue_type,
      backendDict.issue_customization_args, learnerActions);
  }
}

angular.module('oppia').factory(
  'PlaythroughObjectFactory', downgradeInjectable(PlaythroughObjectFactory));
