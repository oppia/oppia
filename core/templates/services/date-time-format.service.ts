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
 * @fileoverview Service for converting dates in milliseconds
 * since the Epoch to human-readable dates.
 */

import {Injectable} from '@angular/core';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

@Injectable({
  providedIn: 'root',
})
export class DateTimeFormatService {
  /**
   * This function returns the time (using locale conventions) if the local
   * datetime representation has the same date as the current date. Else if the
   * local datetime representation has the same year as the current date, it
   * returns the date in the format 'MMM D'. Else, it returns the full date in
   * the format 'MM/DD/YY'.
   * @param {number} millisSinceEpoch - milliseconds since Epoch
   * @returns {string} - a date
   */
  getLocaleAbbreviatedDatetimeString(millisSinceEpoch: number): string {
    let date = new Date(millisSinceEpoch);
    if (date.toLocaleDateString() === new Date().toLocaleDateString()) {
      return date.toLocaleTimeString([], {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      });
    } else if (date.getFullYear() === new Date().getFullYear()) {
      // Moment will return Oct 10.
      return dayjs(date).format('MMM D');
    } else {
      // Moment will return 10/22/35(shortDate).
      return dayjs(date).format('MM/DD/YY');
    }
  }

  /**
   * This function converts a millisecond date to a date in the
   * format 'MMM D HH:mm A' along with time.
   * @param {number} millisSinceEpoch - The millisecond date to be converted
   * @returns {string} a date and time string
   */
  getLocaleDateTimeHourString(millisSinceEpoch: number): string {
    let date = new Date(millisSinceEpoch);
    if (date.getFullYear() === new Date().getFullYear()) {
      // Dayjs will return Oct 10 10:15 AM.
      return dayjs(date).format('MMM D, h:mm A');
    } else {
      // Dayjs will return Oct 10, 2020.
      return dayjs(date).format('MMM D, YYYY');
    }
  }

  /**
   * This function converts a millisecond date to date in words.
   * @param {number} millisSinceEpoch - The millisecond date to be converted
   * @returns {string} a date and time string
   */
  getDateTimeInWords(millisSinceEpoch: number): string {
    let date = new Date(millisSinceEpoch);
    // Dayjs will return Monday, January 18, 2021 at 12:30 PM.
    return dayjs(date).format('dddd, MMMM D, YYYY [at] h:mm A');
  }

  /**
   * This function converts a millisecond date to a date string, using locale
   * conventions.
   * @param {number} millisSinceEpoch - The millisecond date to be converted
   * @returns {string} a date string
   */
  getLocaleDateString(millisSinceEpoch: number): string {
    let date = new Date(millisSinceEpoch);
    return date.toLocaleDateString();
  }

  /**
   * This function returns whether the date is at most one week before the
   * current date.
   * @param {number} millisSinceEpoch - milliseconds since Epoch
   * @returns {boolean} Whether the date is at most one week before
   *                    the current date
   */
  isRecent(millisSinceEpoch: number): boolean {
    let ONE_WEEK_IN_MILLIS = 7 * 24 * 60 * 60 * 1000;
    return new Date().getTime() - millisSinceEpoch < ONE_WEEK_IN_MILLIS;
  }

  /**
   * This function returns the relative time from now.
   * @param {number} millisSinceEpoch - milliseconds since Epoch
   * @returns {string} string representing the relative time from now
   */
  getRelativeTimeFromNow(millisSinceEpoch: number): string {
    dayjs.extend(relativeTime);
    let date = new Date(millisSinceEpoch);
    return dayjs(date).fromNow();
  }
}
