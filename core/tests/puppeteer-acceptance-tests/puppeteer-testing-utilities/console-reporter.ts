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
 * @fileoverview Utility File for detecting and filtering console logs
 * while running puppeteer acceptance tests.
 */

import {
  ConsoleMessage as PuppeteerConsoleMessage,
  Browser,
  Target,
  ConsoleMessageType,
  JSHandle,
} from 'puppeteer';

import escapeRegExp from 'lodash/escapeRegExp';

interface ConsoleMessage {
  type: ConsoleMessageType;
  text: string;
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
];

const CONSOLE_ERRORS_TO_FIX = [
  // TODO(#19746): Development console error "Uncaught in Promise" on signup.
  new RegExp(
    'Uncaught \\(in promise\\).*learner_groups_feature_status_handler'
  ),
];

export class ConsoleReporter {
  private static consoleMessages: ConsoleMessage[] = [];

  /**
   * This function starts to track a browser's console messages.
   */
  public static trackConsoleMessagesInBrowser(browser: Browser): void {
    browser.on('targetcreated', async (target: Target) => {
      if (target.type() === 'page') {
        const page = await target.page();
        if (!page) {
          return;
        }
        page.on('console', async (message: PuppeteerConsoleMessage) => {
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

          // Here we concat the page's url with the message's source if it is present.
          const url = message.location().url
            ? `${page.url()} ${message.location().url}`
            : page.url();

          ConsoleReporter.consoleMessages.push({
            type: message.type(),
            text: `${url} ${messageText}`,
          });
        });
      }
    });
  }

  /**
   * This function reports any console errors that were detected
   * while running the tests.
   */
  public static reportConsoleErrors(): void {
    const errors = ConsoleReporter.getConsoleErrors();
    if (errors.length > 0) {
      const errorMessages = errors
        .map(
          (error: ConsoleMessage, index: number) =>
            `${index + 1}. ${error.text}`
        )
        .join('\n');
      throw new Error(
        `The following errors were detected in the console:\n${errorMessages}`
      );
    }
  }

  /**
   * This function gets the console messages that are considered errors.
   */
  private static getConsoleErrors(): ConsoleMessage[] {
    return ConsoleReporter.consoleMessages
      .filter(
        (message, index, self) =>
          self.findIndex(m => m.text === message.text) === index &&
          CONSOLE_ERRORS_TO_IGNORE.every(e => message.text.match(e) === null) &&
          CONSOLE_ERRORS_TO_FIX.every(e => message.text.match(e) === null)
      )
      .filter(message => message.type === 'error');
  }
}
