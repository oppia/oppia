// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Utility file for date-time parsing.
 */

export default function parseLocaleAbbreviatedDatetimeString(
  dateString: string
): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Check if it's a time string (today) - format: "2:30 PM".
  const timeRegex = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;
  const timeMatch = dateString.match(timeRegex);

  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const ampm = timeMatch[3].toUpperCase();

    if (ampm === 'PM' && hours !== 12) {
      hours += 12;
    }
    if (ampm === 'AM' && hours === 12) {
      hours = 0;
    }

    const date = new Date(today);
    date.setHours(hours, minutes, 0, 0);
    return date.getTime();
  }

  // Check if it's current year format - "MMM D" (e.g., "Oct 10").
  const currentYearRegex = /^([A-Za-z]{3})\s+(\d{1,2})$/;
  const currentYearMatch = dateString.match(currentYearRegex);

  if (currentYearMatch) {
    const monthStr = currentYearMatch[1];
    const day = parseInt(currentYearMatch[2]);

    // Parse month abbreviation.
    const monthMap: {[key: string]: number} = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };

    const month = monthMap[monthStr];
    if (month !== undefined) {
      const date = new Date(now.getFullYear(), month, day, 0, 0, 0, 0);
      return date.getTime();
    }
  }

  // Check if it's short date format - "MM/DD/YY" (e.g., "10/22/35").
  const shortDateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/;
  const shortDateMatch = dateString.match(shortDateRegex);

  if (shortDateMatch) {
    const month = parseInt(shortDateMatch[1]) - 1;
    const day = parseInt(shortDateMatch[2]);
    let year = parseInt(shortDateMatch[3]);

    // Convert 2-digit year to 4-digit year.
    year += 2000;

    const date = new Date(year, month, day, 0, 0, 0, 0);
    return date.getTime();
  }

  // If no pattern matches, throw an error.
  throw new Error(`Unable to parse date string: "${dateString}"`);
}
