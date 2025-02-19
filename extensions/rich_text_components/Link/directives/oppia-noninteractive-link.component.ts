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
 * @fileoverview Directive for the Link rich-text component.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 *
 * All of the RTE components follow this pattern of updateView and ngOnChanges.
 * This is because these are also web-components (So basically, we can create
 * this component using document.createElement). CKEditor creates instances of
 * these on the fly and runs ngOnInit before we can set the @Input properties.
 * When the input properties are not set, we get errors in the console.
 * The `if` condition in update view prevents that from happening.
 * The `if` condition in the updateView and ngOnChanges might look like the
 * literal opposite but that's not the case. We know from the previous
 * statements above that the if condition in the updateView is for preventing
 * the code to run until all the values needed for successful execution are
 * present. The if condition in ngOnChanges is to optimize the re-runs of
 * updateView and only re-run when a property we care about has changed in
 * value.
 */

import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import {ContextService} from 'services/context.service';
import {HtmlEscaperService} from 'services/html-escaper.service';

@Component({
  selector: 'oppia-noninteractive-link',
  templateUrl: './link.component.html',
  styleUrls: [],
})
export class NoninteractiveLink implements OnInit, OnChanges {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() urlWithValue!: string;
  @Input() textWithValue!: string;
  url!: string;
  text: string = '';
  showUrlInTooltip: boolean = false;
  tabIndexVal: number = 0;
  constructor(
    private contextService: ContextService,
    private htmlEscaperService: HtmlEscaperService
  ) {}

  private _updateViewOnLinkChange(): void {
    if (!this.urlWithValue || !this.textWithValue) {
      return;
    }
    let untrustedUrl = encodeURI(
      this.htmlEscaperService.escapedJsonToObj(this.urlWithValue) as string
    );
    if (
      !untrustedUrl.startsWith('http://') &&
      !untrustedUrl.startsWith('https://')
    ) {
      untrustedUrl = 'https://' + untrustedUrl;
    }
    this.url = untrustedUrl;
    this.text = this.url;
    if (this.textWithValue) {
      // This is done for backward-compatibility; some old explorations
      // have content parts that don't include a 'text' attribute on
      // their links.
      this.text = this.htmlEscaperService.escapedJsonToObj(
        this.textWithValue
      ) as string;
      // Note that this second 'if' condition is needed because a link
      // may have an empty 'text' value.
      if (this.text) {
        this.showUrlInTooltip = true;
      } else {
        this.text = this.url;
      }
    }

    // This following check disables the link in Editor being caught
    // by tabbing while in Exploration Editor mode.
    if (this.contextService.isInExplorationEditorMode()) {
      this.tabIndexVal = -1;
    }
  }

  ngOnInit(): void {
    this._updateViewOnLinkChange();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.urlWithValue || changes.textWithValue) {
      this._updateViewOnLinkChange();
    }
  }
}
