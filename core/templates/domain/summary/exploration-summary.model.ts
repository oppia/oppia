// Copyright 2024 The Oppia Authors. All Rights Reserved.
// Licensed under the Apache License, Version 2.0 (the "License");
// You may not use this file except in compliance with the License.

export interface ExplorationSummaryBackendDict {
    id: string;
    title: string;
    category: string;
    objective: string;
    language_code: string;
    tags: string[];
    thumbnail_icon_url: string | null;
    thumbnail_bg_color: string | null;
    ratings: {
      [ratingValue: string]: number;
    };
    status: string;
    community_owned: boolean;
    last_updated_msec: number;
    created_on_msec: number;
    human_readable_contributors_summary: {
      [username: string]: {
        num_commits: number;
      };
    };
    thumbnail_filename: string | null;
  }
  
  export class ExplorationSummary {
    constructor(
      public id: string,
      public title: string,
      public category: string,
      public objective: string,
      public languageCode: string,
      public tags: string[],
      public thumbnailIconUrl: string | null,
      public thumbnailBgColor: string | null,
      public ratings: {
        [ratingValue: string]: number;
      },
      public status: string,
      public communityOwned: boolean,
      public lastUpdatedMsec: number,
      public createdOnMsec: number,
      public humanReadableContributorsSummary: {
        [username: string]: {
          num_commits: number;
        };
      },
      public thumbnailFilename: string | null
    ) {}
  
    static createFromBackendDict(
      backendDict: ExplorationSummaryBackendDict
    ): ExplorationSummary {
      return new ExplorationSummary(
        backendDict.id,
        backendDict.title,
        backendDict.category,
        backendDict.objective,
        backendDict.language_code,
        backendDict.tags,
        backendDict.thumbnail_icon_url,
        backendDict.thumbnail_bg_color,
        backendDict.ratings,
        backendDict.status,
        backendDict.community_owned,
        backendDict.last_updated_msec,
        backendDict.created_on_msec,
        backendDict.human_readable_contributors_summary,
        backendDict.thumbnail_filename
      );
    }
  }
  