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
 * @fileoverview Utility File for detecting, filtering and reporting
 * certain console logs while running puppeteer tests.
 */

import {
  ConsoleMessage as PuppeteerConsoleMessage,
  Browser,
  Target,
  ConsoleMessageType,
  JSHandle,
} from 'puppeteer';

import escapeRegExp from 'lodash/escapeRegExp';

const HOST_URL = 'http://localhost:8181';

interface ConsoleMessage {
  type: ConsoleMessageType;
  text: string;
  url: string;
}

const CONSOLE_ERRORS_TO_IGNORE = [
  // These "localhost:9099" are errors related to communicating with the
  // Firebase emulator, which would never occur in production, so we just ignore
  // them.
  escapeRegExp(
    'http://localhost:9099/www.googleapis.com/identitytoolkit/v3/' +
      'relyingparty/getAccountInfo?key=fake-api-key'
  ),
  escapeRegExp(
    'http://localhost:9099/www.googleapis.com/identitytoolkit/v3/' +
      'relyingparty/verifyPassword?key=fake-api-key'
  ),
  // This error covers the case when the PencilCode site uses an
  // invalid SSL certificate (which can happen when it expires).
  // In such cases, we ignore the error since it is out of our control.
  escapeRegExp(
    'https://pencilcode.net/lib/pencilcodeembed.js - Failed to ' +
      'load resource: net::ERR_CERT_DATE_INVALID'
  ),
  // These errors are related to the gtag script that is used to track events.
  // They are of the form "Failed to load resource: the server responded
  // with a status of 405", this happens when the HTTP method used for a
  // network call is refused by the server. The network call is triggered
  // automatically by the gtag script, so we have no control over it. The 405
  // error was observed on other websites (e.g. https://edu.google.com/) that
  // use gtag and it does not affect the user experience in any way.
  // Considering these reasons, the error may be ignored.
  new RegExp(
    'https://www.googletagmanager.com/a.* Failed to load resource: ' +
      'the server responded with a status of 405 ()',
    'g'
  ),
  // Error occurs due to ExpressionChangedAfterItHasBeenCheckedError.
  // This can be removed after solving the issue #20189.
  new RegExp('ERROR CONTEXT JSHandle@object.*'),
  // Error related to Google Docs Viewer since it's from an external service
  // and cannot be controlled by us. (https://stackoverflow.com/q/50909239)
  new RegExp(
    /https:\/\/content\.googleapis\.com\/drive\/v2internal\/viewerimpressions\?key=[^&]+&alt=json/
  ),
  // Error related to Donorbox ReCaptcha not being iframe-able in
  // acceptance tests. This is outside our control because it is
  // controlled by Donorbox.
  escapeRegExp("[Report Only] Refused to frame 'https://www.recaptcha.net/'"),
];

const CONSOLE_ERRORS_TO_FIX = [
  // TODO(#19746): Development console error "Uncaught in Promise" on signup.
  new RegExp(
    'Uncaught \\(in promise\\).*learner_groups_feature_status_handler'
  ),
  // TODO(#20748): SyntaxError: Unexpected token < in JSON at position 0.
  new RegExp(
    'Uncaught \\(in promise\\): SyntaxError: Unexpected token < in JSON.*',
    'm'
  ),
  // TODO(#19733): 404 (Not Found) for resources used in midi-js.
  escapeRegExp(
    'http://localhost:8181/dist/oppia-angular/midi/examples/soundfont/acoustic' +
      '_grand_piano-ogg.js Failed to load resource: the server responded with a ' +
      'status of 404 (Not Found)'
  ),
  // TODO(#18372): KeyError: <state name> when the version history handler is hit.
  escapeRegExp(
    'Failed to load resource: the server responded with a status of 500'
  ),
  // TODO(#20189): ExpressionChangedAfterItHasBeenCheckedError console error In creator dashboard's Subscribers tab.
  new RegExp(
    'ExpressionChangedAfterItHasBeenCheckedError: Expression has changed after it was ' +
      "checked. Previous value: 'srcset: .*'\\. Current value: 'srcset: .*'\\."
  ),
  // TODO(#20829): Console error "Cannot read properties of undefined (reading 'getStory')" on navigation or reload in Story Editor.
  /Cannot read properties of undefined \(reading 'getStory'\)/,
  /Occurred at http:\/\/localhost:8181\/story_editor\/.*\/#\/chapter_editor\/node_1 webpack:\/\/\/\..* Cannot read properties of undefined \(reading 'getStory'\)/,
  // TODO(#20830): ExpressionChangedAfterItHasBeenCheckedError in Story Editor.
  /ExpressionChangedAfterItHasBeenCheckedError: Expression has changed after it was checked. Previous value: 'headerText: Story Editor'. Current value: 'headerText: Chapter Editor'./,
];

export class ConsoleReporter {
  private static consoleMessages: ConsoleMessage[] = [];
  private static consoleErrorsToIgnore: (RegExp | string)[] = [];

  /**
   * This function initializes tracking for the browser's console messages.
   */
  public static trackConsoleMessagesInBrowser(browser: Browser): void {
    browser.on('targetcreated', async (target: Target) => {
      if (target.type() !== 'page') {
        return;
      }
      const page = await target.page();
      if (!page) {
        return;
      }
      page.on('console', async (message: PuppeteerConsoleMessage) => {
        // Here we exclude urls that are opened that are not part of the
        // application.
        if (!page.url().includes(HOST_URL)) {
          return;
        }

        let messageText = message.text();
        // Sometimes puppeteer returns a JSHandle error so we have to parse
        // it to get the message in this case.
        if (messageText.includes('JSHandle@error')) {
          const messages = await Promise.all(
            message.args().map((arg: JSHandle) =>
              arg.executionContext().evaluate((arg: unknown) => {
                if (arg instanceof Error) {
                  return arg.message;
                }
                return null;
              }, arg)
            )
          );
          messageText = messages.join(' ');
        }

        // Here we concat the message text with the message's source if it is present.
        const messageSource = message.location().url;
        messageText = messageSource
          ? `${messageSource} ${messageText}`
          : messageText;

        ConsoleReporter.consoleMessages.push({
          type: message.type(),
          text: messageText,
          url: page.url(),
        });
      });
    });
  }

  /**
   * This function reports any console errors that were detected.
   */
  public static reportConsoleErrors(): void {
    const errors = ConsoleReporter.getConsoleErrors();
    if (errors.length > 0) {
      const errorMessages = errors
        .map(
          (error: ConsoleMessage, index: number) =>
            `${index + 1}. Occurred at ${error.url}\n${error.text}`
        )
        .join('\n');
      ConsoleReporter.consoleMessages = [];
      throw new Error(
        `The following errors were detected in the console:\n${errorMessages}`
      );
    }
  }

  /**
   * This function sets the console errors to ignore.
   */
  public static setConsoleErrorsToIgnore(
    errorsToIgnore: (RegExp | string)[]
  ): void {
    ConsoleReporter.consoleErrorsToIgnore = errorsToIgnore;
  }

  /**
   * This function gets the console messages that are considered errors.
   */
  private static getConsoleErrors(): ConsoleMessage[] {
    let errorsToIgnore = ConsoleReporter.consoleErrorsToIgnore.concat(
      CONSOLE_ERRORS_TO_IGNORE,
      CONSOLE_ERRORS_TO_FIX
    );

    return ConsoleReporter.consoleMessages.filter(
      (message, index, self) =>
        message.type === 'error' &&
        // Here we filter out duplicate messages by their text.
        self.findIndex(m => m.text === message.text) === index &&
        errorsToIgnore.every(
          (error: RegExp | string) => message.text.match(error) === null
        )
    );
  }
}
