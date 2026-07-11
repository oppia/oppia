// coding: utf-8
//
// Copyright 2026 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Clean display of session diagnostics for platform
 * feedback. Shows environment summary + expandable log sections
 * instead of raw JSON dumps.
 */

import {Component, Input, ChangeDetectionStrategy} from '@angular/core';
import {FeedbackSessionInfo} from 'domain/feedback/feedback.model';

@Component({
  selector: 'oppia-feedback-detail-session-info',
  templateUrl: './feedback-detail-session-info.component.html',
  styleUrls: ['./feedback-detail-session-info.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedbackDetailSessionInfoComponent {
  @Input() sessionInfo!: FeedbackSessionInfo;

  showConsoleLogs: boolean = false;
  showFailedRequests: boolean = false;
  showNavigation: boolean = false;

  get consoleLogCount(): number {
    return this.sessionInfo.console_logs_json?.length ?? 0;
  }

  get failedRequestCount(): number {
    return this.sessionInfo.failed_requests_json?.length ?? 0;
  }

  get navigationEntryCount(): number {
    return this.sessionInfo.navigation_history_json?.length ?? 0;
  }

  get hasAnyLogs(): boolean {
    return (
      this.consoleLogCount > 0 ||
      this.failedRequestCount > 0 ||
      this.navigationEntryCount > 0
    );
  }

  get viewportLabel(): string {
    const vp = this.sessionInfo.environment_json?.viewport;
    if (!vp) {
      return 'Unknown';
    }
    return vp.width + ' x ' + vp.height;
  }

  get languageLabel(): string {
    const locale = this.sessionInfo.environment_json?.locale;
    if (!locale) {
      return 'Unknown';
    }
    return locale.language_code + ' / ' + locale.direction.toUpperCase();
  }

  get pageTitle(): string {
    return this.sessionInfo.environment_json?.page?.title ?? null;
  }

  get userAgent(): string {
    return this.sessionInfo.environment_json?.user_agent ?? 'Unknown';
  }

  get clientTime(): string {
    const msecs = this.sessionInfo.environment_json?.client_time_msecs;
    if (!msecs) {
      return 'Unknown';
    }
    return new Date(msecs).toLocaleString('en-US');
  }

  get consoleErrorCount(): number {
    if (!this.sessionInfo.console_logs_json) {
      return 0;
    }
    return this.sessionInfo.console_logs_json.filter(
      log => log.log_level === 'error'
    ).length;
  }

  formatLogTimestamp(msecs: number): string {
    return new Date(msecs).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  toggleConsoleLogs(): void {
    this.showConsoleLogs = !this.showConsoleLogs;
  }

  toggleFailedRequests(): void {
    this.showFailedRequests = !this.showFailedRequests;
  }

  toggleNavigation(): void {
    this.showNavigation = !this.showNavigation;
  }
}
