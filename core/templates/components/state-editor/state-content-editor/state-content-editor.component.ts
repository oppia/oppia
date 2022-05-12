// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the state content editor.
 */

import { Component, OnInit, ChangeDetectorRef, Input, Output, EventEmitter } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { ContextService } from 'services/context.service';
import { EditabilityService } from 'services/editability.service';
import { EditorFirstTimeEventsService } from 'pages/exploration-editor-page/services/editor-first-time-events.service';
import { ExternalSaveService } from 'services/external-save.service';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { StateContentService } from 'components/state-editor/state-editor-properties-services/state-content.service';

import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { Subscription } from 'rxjs';

interface HTMLSchema {
  type: string;
  ui_config: {
    hide_complex_extensions: boolean;
  };
}

@Component({
  selector: 'oppia-state-content-editor',
  templateUrl: './state-content-editor.component.html',
})
export class StateContentEditorComponent implements OnInit {
  @Output() intialize: EventEmitter<void> = new EventEmitter();
  @Output() saveStateContent = new EventEmitter<SubtitledHtml>();
  @Output() showMarkAllAudioAsNeedingUpdateModalIfRequired =
    new EventEmitter<string[]>();

  @Input() stateContentPlaceholder: string;
  @Input() stateContentSaveButtonPlaceholder: string;
  cardHeightLimitWarningIsShown: boolean;
  contentId: string;
  contentEditorIsOpen: boolean;
  directiveSubscriptions = new Subscription();
  isEditable: boolean;
  HTML_SCHEMA: HTMLSchema;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private contextService: ContextService,
    private editorFirstTimeEventsService: EditorFirstTimeEventsService,
    private externalSaveService: ExternalSaveService,
    private htmlEscaperService: HtmlEscaperService,
    private stateContentService: StateContentService,
    private stateEditorService: StateEditorService,
    private editabilityService: EditabilityService
  ) {}

  ngOnInit(): void {
    this.HTML_SCHEMA = {
      type: 'html',
      ui_config: {
        hide_complex_extensions: (
          this.contextService.getEntityType() === 'question')
      }
    };
    this.contentId = null;
    if (this.stateContentService.displayed) {
      this.contentId = this.stateContentService.displayed.contentId;
    }

    this.contentEditorIsOpen = false;
    this.cardHeightLimitWarningIsShown = true;
    this.directiveSubscriptions.add(
      this.externalSaveService.onExternalSave.subscribe(
        () => {
          if (this.contentEditorIsOpen) {
            this.saveContent();
          }
        }
      )
    );
    this.stateEditorService.updateStateContentEditorInitialised();
  }

  isCardContentLengthLimitReached(): boolean {
    let content = this.stateContentService.displayed.html;
    return (content.length > 4500);
  }

  isCardHeightLimitReached(): boolean {
    let shadowPreviewCard = $(
      '.oppia-shadow-preview-card .oppia-learner-view-card-top-section'
    );
    let height = shadowPreviewCard.height();
    return (height > 630);
  }

  hideCardHeightLimitWarning(): void {
    this.cardHeightLimitWarningIsShown = false;
  }

  saveContent(): void {
    this.stateContentService.saveDisplayedValue();
    this.saveStateContent.emit(this.stateContentService.displayed);
    this.contentEditorIsOpen = false;
    this.intialize.emit();
  }

  openStateContentEditor(): void {
    this.editorFirstTimeEventsService.registerFirstOpenContentBoxEvent();
    this.contentEditorIsOpen = true;
  }

  onSaveContentButtonClicked(): void {
    this.editorFirstTimeEventsService.registerFirstSaveContentEvent();
    let savedContent = this.stateContentService.savedMemento;
    let contentHasChanged = (
      savedContent.html !==
      this.stateContentService.displayed.html);
    if (contentHasChanged) {
      let contentId = this.stateContentService.displayed.contentId;
      this.showMarkAllAudioAsNeedingUpdateModalIfRequired.emit([contentId]);
    }

    var parser = new DOMParser();
    var doc = parser.parseFromString(
      this.stateContentService.displayed.html, 'text/html');
    var imageFilenameList: string[] = [];
    var elements = doc.getElementsByTagName(
      'oppia-noninteractive-image');
    for (let i = 0; i < elements.length; i++) {
      imageFilenameList.push(
        String(this.htmlEscaperService.escapedStrToUnescapedStr(
          elements[i].getAttribute('filepath-with-value'))
        ).replace('"', ''));
    }
    this.stateContentService.displayed._imageFilenamesInHtml = (
      imageFilenameList);
    this.saveContent();
  }

  cancelEdit(): void {
    this.stateContentService.restoreFromMemento();
    this.contentEditorIsOpen = false;
  }

  getHtmlSchema(): HTMLSchema {
    return this.HTML_SCHEMA;
  }

  updateHtml($event: string): void {
    if ($event !== this.stateContentService.displayed._html) {
      this.stateContentService.displayed._html = $event;
      this.changeDetectorRef.detectChanges();
    }
  }

  isContentEditable(): boolean {
    return this.editabilityService.isEditable();
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive('oppiaStateContentEditor',
downgradeComponent({
  component: StateContentEditorComponent
}) as angular.IDirectiveFactory);
