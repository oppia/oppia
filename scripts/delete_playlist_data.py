# Copyright 2024 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Script to delete all LearnerPlaylistModel entities from the datastore.

Run this against your production or staging datastore BEFORE deploying
the code changes that remove the LearnerPlaylistModel class.

Usage:
    python scripts/delete_playlist_data.py --project <your-gcp-project-id>

Requires the google-cloud-datastore library and appropriate GCP credentials.
"""

from __future__ import annotations

import argparse

from google.cloud import datastore


KIND_NAME = 'LearnerPlaylistModel'


def delete_all_learner_playlist_models(project_id: str) -> None:
    """Deletes all LearnerPlaylistModel entities from the given project."""
    client = datastore.Client(project=project_id)

    query = client.query(kind=KIND_NAME)
    query.keys_only()
    entities = list(query.fetch())
    count = len(entities)

    if count == 0:
        print('No LearnerPlaylistModel entities found to delete.')
        return

    batch_size = 500
    for i in range(0, count, batch_size):
        batch = entities[i : i + batch_size]
        keys = [e.key for e in batch]
        client.delete_multi(keys)
        print(
            'Deleted %d-%d of %d LearnerPlaylistModel entities.'
            % (i + 1, min(i + batch_size, count), count)
        )

    print('Successfully deleted all %d LearnerPlaylistModel entities.' % count)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Delete all LearnerPlaylistModel entities from the datastore.'
    )
    parser.add_argument(
        '--project',
        required=True,
        help='Your GCP project ID (e.g. oppia-production)',
    )
    args = parser.parse_args()
    delete_all_learner_playlist_models(args.project)
