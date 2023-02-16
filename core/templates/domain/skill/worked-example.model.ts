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

import {
  SubtitledHtml, SubtitledHtmlBackendDict
} from 'domain/exploration/subtitled-html.model';

export interface WorkedExampleBackendDict {
  question: SubtitledHtmlBackendDict;
  explanation: SubtitledHtmlBackendDict;
}

export class WorkedExample {
  _question: SubtitledHtml;
  _explanation: SubtitledHtml;

  constructor(question: SubtitledHtml, explanation: SubtitledHtml) {
    this._question = question;
    this._explanation = explanation;
  }

  toBackendDict(): WorkedExampleBackendDict {
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

  static createFromBackendDict(
      workedExampleDict: WorkedExampleBackendDict): WorkedExample {
    return new WorkedExample(
      SubtitledHtml.createFromBackendDict(
        workedExampleDict.question),
      SubtitledHtml.createFromBackendDict(
        workedExampleDict.explanation)
    );
  }

  static create(
      question: SubtitledHtml, explanation: SubtitledHtml
  ): WorkedExample {
    return new WorkedExample(question, explanation);
  }
}
