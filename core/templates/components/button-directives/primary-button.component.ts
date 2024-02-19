// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for primary buttons displayed on static pages.
 */

import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import './primary-button.component.css';
import { WindowRef } from 'services/contextual/window-ref.service';


@Component({
  selector: 'oppia-primary-button',
  templateUrl: './primary-button.component.html',
  styleUrls: ['./primary-button.component.css']
})
export class PrimaryButtonComponent implements OnInit {
  /**
   * The main text to be displayed on the button.
   */
  @Input() buttonText: string = '';

  /**
   * An optional array of custom CSS classes to be applied to the component.
   */
  @Input() customClasses?: string[];

  /**
   * The URL the button should navigate to when clicked, optional.
   * If no buttonHref is provided then the component acts like an HTML button
   * element instead of an anchor link element.
   */
  @Input() buttonHref: string = '#';

  /**
   * A boolean value indicating whether the button should be disabled, optional.
   * Valid only when the component is an HTML button element and not an anchor.
   */
  @Input() disabled?: boolean = false;

  /**
   * The function to execute when the component is clicked, optional.
   * The return type of the function must be void.
   */
  @Output() onClickPrimaryButton: EventEmitter<void> = new EventEmitter<void>();

  componentIsButton: boolean = false;
  openInNewTab: boolean = false;

  constructor(
    private windowRef: WindowRef,
  ) {}

  ngOnInit(): void {
    this.componentIsButton = this.buttonHref === '#';
  }

  getButtonHref(): string {
    return this.buttonHref;
  }

  getTarget(): string {
    this.openInNewTab = this.isExternalLink(this.buttonHref);
    return this.openInNewTab ? '_blank' : '_self';
  }

  private isExternalLink(link: string): boolean {
    return link.startsWith('http://') || link.startsWith('https://');
  }

  handleButtonClick(event: MouseEvent): void {
    // Prevent the browser from loading the next page
    // and thus unloading the current page, before the functions
    // passed to component such as registering Google analytics
    // have finished executing. Reference -
    // https://developers.google.com/analytics/devguides/collection/gtagjs/sending-data#know_when_an_event_has_been_sent
    event.preventDefault();

    if (this.onClickPrimaryButton.observers.length > 0) {
      this.onClickPrimaryButton.emit();
    }

    if (!this.componentIsButton) {
      const target = event.target as HTMLAnchorElement;
      const link = target.href; // The actual link to redirect to.
      const linkTarget = target.target; // '_blank' or '_self'.

      if (linkTarget === '_blank') {
        this.openExternalLink(link);
      } else {
        this.windowRef.nativeWindow.location.href = link;
      }
    }
  }

  private openExternalLink(link: string): void {
    const newTab = window.open();
    if (newTab) {
      newTab.opener = null;
      newTab.location.href = link;
    }
  }
}

angular.module('oppia').directive('oppiaPrimaryButton',
  downgradeComponent({
    component: PrimaryButtonComponent
  }) as angular.IDirectiveFactory);
