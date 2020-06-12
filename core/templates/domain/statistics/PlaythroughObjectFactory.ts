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

import { LearnerAction, LearnerActionObjectFactory, ILearnerActionBackendDict }
  from 'domain/statistics/LearnerActionObjectFactory';

export interface IPlaythroughBackendDict {
  'playthrough_id'?: string;
  'id'?: string;
  'exp_id': string;
  'exp_version': number;
  'issue_type': string;
  'issue_customization_args': any;
  'actions': ILearnerActionBackendDict[];
}

export class Playthrough {
  constructor(
      public playthroughId: string,
      public expId: string,
      public expVersion: number,
      public issueType: string,
      public issueCustomizationArgs: any,
      public actions: LearnerAction[]) {}

  getLastAction(): LearnerAction {
    const actionsLength = this.actions.length;
    return actionsLength > 0 ? this.actions[actionsLength - 1] : null;
  }

  toBackendDict(): IPlaythroughBackendDict {
    return {
      id: this.playthroughId,
      exp_id: this.expId,
      exp_version: this.expVersion,
      issue_type: this.issueType,
      issue_customization_args: this.issueCustomizationArgs,
      actions: this.actions.map(a => a.toBackendDict())
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class PlaythroughObjectFactory {
  constructor(private learnerActionObjectFactory: LearnerActionObjectFactory) {}

  createNew(
      playthroughId: string, expId: string, expVersion: number,
      issueType: string, issueCustomizationArgs: any,
      actions: LearnerAction[]): Playthrough {
    return new Playthrough(
      playthroughId, expId, expVersion, issueType, issueCustomizationArgs,
      actions);
  }

  createFromBackendDict(
      playthroughBackendDict: IPlaythroughBackendDict): Playthrough {
    return new Playthrough(
      playthroughBackendDict.playthrough_id, playthroughBackendDict.exp_id,
      playthroughBackendDict.exp_version, playthroughBackendDict.issue_type,
      playthroughBackendDict.issue_customization_args,
      playthroughBackendDict.actions.map(
        d => this.learnerActionObjectFactory.createFromBackendDict(d)));
  }
}

angular.module('oppia').factory(
  'PlaythroughObjectFactory', downgradeInjectable(PlaythroughObjectFactory));
