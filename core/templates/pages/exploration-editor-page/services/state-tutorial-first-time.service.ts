// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for all tutorials to be run only for the first time.
 */

import {EventEmitter, Injectable} from '@angular/core';

import {EditorFirstTimeEventsService} from 'pages/exploration-editor-page/services/editor-first-time-events.service';
import {TutorialEventsBackendApiService} from 'pages/exploration-editor-page/services/tutorial-events-backend-api.service';

@Injectable({
  providedIn: 'root',
})
export class StateTutorialFirstTimeService {
  // Whether this is the first time the tutorial has been seen by this user.
  private _currentlyInEditorFirstVisit: boolean = true;
  private _currentlyInTranslationFirstVisit: boolean = true;
  private _translationTutorialNotSeenBefore: boolean = false;

  private enterEditorForTheFirstTimeEventEmitter = new EventEmitter();
  private enterTranslationForTheFirstTimeEventEmitter = new EventEmitter();

  private _openEditorTutorialEventEmitter = new EventEmitter();
  private _openPostTutorialHelpPopoverEventEmitter = new EventEmitter();
  private _openTranslationTutorialEventEmitter = new EventEmitter();

  constructor(
    private editorFirstTimeEventsService: EditorFirstTimeEventsService,
    private tutorialEventsBackendApiService: TutorialEventsBackendApiService
  ) {}

  initEditor(firstTime: boolean, expId: string): void {
    // After the first call to it in a client session, this does nothing.
    if (!firstTime || !this._currentlyInEditorFirstVisit) {
      this._currentlyInEditorFirstVisit = false;
    }

    if (this._currentlyInEditorFirstVisit) {
      this.enterEditorForTheFirstTimeEventEmitter.emit();
      this.editorFirstTimeEventsService.initRegisterEvents(expId);
      this.tutorialEventsBackendApiService
        .recordStartedEditorTutorialEventAsync(expId)
        .then(null, () => {
          console.error(
            'Warning: could not record editor tutorial start event.'
          );
        });
    }
  }

  markEditorTutorialFinished(): void {
    if (this._currentlyInEditorFirstVisit) {
      this._openPostTutorialHelpPopoverEventEmitter.emit();
      this.editorFirstTimeEventsService.registerEditorFirstEntryEvent();
    }

    this._currentlyInEditorFirstVisit = false;
  }

  markTranslationTutorialNotSeenBefore(): void {
    this._translationTutorialNotSeenBefore = true;
  }

  initTranslation(expId: string): void {
    // After the first call to it in a client session, this does nothing.
    if (
      !this._translationTutorialNotSeenBefore ||
      !this._currentlyInTranslationFirstVisit
    ) {
      this._currentlyInTranslationFirstVisit = false;
    }

    if (this._currentlyInTranslationFirstVisit) {
      this.enterTranslationForTheFirstTimeEventEmitter.emit();
      this._currentlyInTranslationFirstVisit = false;
      this.editorFirstTimeEventsService.initRegisterEvents(expId);
      this.tutorialEventsBackendApiService
        .recordStartedTranslationTutorialEventAsync(expId)
        .then(null, () => {
          console.error(
            'Warning: could not record translation tutorial start event.'
          );
        });
    }
  }

  markTranslationTutorialFinished(): void {
    if (this._currentlyInTranslationFirstVisit) {
      this._openPostTutorialHelpPopoverEventEmitter.emit();
      this.editorFirstTimeEventsService.registerEditorFirstEntryEvent();
    }

    this._currentlyInTranslationFirstVisit = false;
  }

  get onEnterEditorForTheFirstTime(): EventEmitter<string> {
    return this.enterEditorForTheFirstTimeEventEmitter;
  }

  get onEnterTranslationForTheFirstTime(): EventEmitter<string> {
    return this.enterTranslationForTheFirstTimeEventEmitter;
  }

  get onOpenEditorTutorial(): EventEmitter<string> {
    return this._openEditorTutorialEventEmitter;
  }

  get onOpenPostTutorialHelpPopover(): EventEmitter<string> {
    return this._openPostTutorialHelpPopoverEventEmitter;
  }

  get onOpenTranslationTutorial(): EventEmitter<string> {
    return this._openTranslationTutorialEventEmitter;
  }
}
