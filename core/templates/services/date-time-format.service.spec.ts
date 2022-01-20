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
 * @fileoverview Unit test for DateTimeFormatService.
 */

import { DateTimeFormatService } from 'services/date-time-format.service';
import dayjs from 'dayjs';

describe('datetimeformatter', () => {
  // This corresponds to Fri, 21 Nov 2014 09:45:00 GMT.
  let NOW_MILLIS = 1416563100000;
  let df: DateTimeFormatService;
  let OldDate = Date;

  beforeEach(() => {
    df = new DateTimeFormatService();

    let MockDateContructor = function(millisSinceEpoch = 0) {
      if (millisSinceEpoch === 0) {
        return new OldDate(NOW_MILLIS);
      } else {
        return new OldDate(millisSinceEpoch);
      }
    };

    // Mock Date() to give a time of NOW_MILLIS in GMT. (Unfortunately, there
    // doesn't seem to be a good way to set the timezone locale directly).

    // This throws "Argument of type '(millisSinceEpoch?: number) => Date' is
    // not assignable to parameter of type 'DateConstructor'.". We need to
    // suppress this error because the actual 'Date' has more properties than
    // 'MockDateContructor'. We have only defined the properties we need in
    // 'MockDateContructor'.
    // @ts-expect-error
    spyOn(window, 'Date').and.callFake(MockDateContructor);
  });

  it('should correctly indicate recency', () => {
    // 1 second ago is recent.
    expect(df.isRecent(NOW_MILLIS - 1)).toBe(true);
    // 72 hours ago is recent.
    expect(df.isRecent(NOW_MILLIS - 72 * 60 * 60 * 1000)).toBe(true);
    // 8 days ago is not recent.
    expect(df.isRecent(NOW_MILLIS - 8 * 24 * 60 * 60 * 1000)).toBe(false);
  });

  it('should provide correct locale abbreviated datetime string', () => {
    let expectedDatetime = new Date(NOW_MILLIS - 1).toLocaleTimeString([], {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
    expect(df.getLocaleAbbreviatedDatetimeString(NOW_MILLIS - 1)).toBe(
      expectedDatetime);
    expect(
      df.getLocaleAbbreviatedDatetimeString(
        NOW_MILLIS + 48 * 60 * 60 * 1000)).toBe('Nov 23');
    expect(
      df.getLocaleAbbreviatedDatetimeString(
        NOW_MILLIS - 365 * 24 * 60 * 60 * 1000)).toBe('11/21/13');
  });

  it('should provide date time hour in MMM D, h:mm A format', () => {
    expect(df.getLocaleDateTimeHourString(NOW_MILLIS)).toBe(
      dayjs(new Date(NOW_MILLIS)).format('MMM D, h:mm A')
    );
  });

  it('should provide date time hour in MMM D, YYYY format', () => {
    // This is a date that is 1 year before NOW_MILLIS.
    let dateFromPreviousYear = NOW_MILLIS - 365 * 24 * 60 * 60 * 1000;
    expect(df.getLocaleDateTimeHourString(dateFromPreviousYear)).toBe(
      dayjs(new Date(dateFromPreviousYear)).format('MMM D, YYYY')
    );
  });

  it('should provide correct date format MM/DD/YYY string', () => {
    // Note to developers: This test is not ideal, because it tests the
    // implementation rather than the interface. However, we have not found
    // a way to retrieve the browser current locale that is used on
    // Date methods. Since each user can have different date formats in
    // their browser, this makes it tricky to test the returned day,
    // month and year of df.getLocaleDateString, which is why
    // toLocaleDateString() needs to be computed in the expected
    // value of the test as well.
    expect((new Date(NOW_MILLIS)).toLocaleDateString()).toBe(
      df.getLocaleDateString(NOW_MILLIS));
    expect((new Date(NaN).toLocaleDateString())).toBe(
      df.getLocaleDateString(NaN));
  });

  it('should provide relative time from a given timestamp', () => {
    let timeAFewSecondsAgo = NOW_MILLIS - 5 * 1000;
    let timeAnHourAgo = NOW_MILLIS - 60 * 60 * 1000;
    let timeADayAgo = NOW_MILLIS - 24 * 60 * 60 * 1000;
    expect(df.getRelativeTimeFromNow(timeAFewSecondsAgo))
      .toBe('a few seconds ago');
    expect(df.getRelativeTimeFromNow(timeAnHourAgo))
      .toBe('an hour ago');
    expect(df.getRelativeTimeFromNow(timeADayAgo))
      .toBe('a day ago');
  });
});
