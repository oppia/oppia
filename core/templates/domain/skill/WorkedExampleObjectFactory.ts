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
 * @fileoverview Object factory for creating frontend instances of
 * worked examples.
 */

export interface IWorkedExampleBackendDict {
  question: SubtitledHtmlBackendDict,
  explanation: SubtitledHtmlBackendDict
}

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';
import {
  SubtitledHtml, SubtitledHtmlObjectFactory, SubtitledHtmlBackendDict
} from 'domain/exploration/SubtitledHtmlObjectFactory';

export class WorkedExample {
  _question: SubtitledHtml;
  _explanation: SubtitledHtml;

  constructor(question: SubtitledHtml, explanation: SubtitledHtml) {
    this._question = question;
    this._explanation = explanation;
  }

  toBackendDict(): IWorkedExampleBackendDict {
    return {
      question: this._question.toBackendDict(),
      explanation: this._explanation.toBackendDict()
    };
  }

  getQuestion(): SubtitledHtml {
    return this._question;
  }

  getExplanation(): SubtitledHtml {
    return this._explanation;
  }
}

@Injectable({
  providedIn: 'root'
})
export class WorkedExampleObjectFactory {
  constructor(
      private subtitledHtmlObjectFactory: SubtitledHtmlObjectFactory) {}

  createFromBackendDict(
      workedExampleDict: IWorkedExampleBackendDict): WorkedExample {
    return new WorkedExample(
      this.subtitledHtmlObjectFactory.createFromBackendDict(
        workedExampleDict.question),
      this.subtitledHtmlObjectFactory.createFromBackendDict(
        workedExampleDict.explanation)
    );
  }

  create(question: SubtitledHtml, explanation: SubtitledHtml) {
    return new WorkedExample(question, explanation);
  }
}

angular.module('oppia').factory(
  'WorkedExampleObjectFactory',
  downgradeInjectable(WorkedExampleObjectFactory));
