# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Commands that can be used to operate on activity summaries."""

from core.domain import activity_services
from core.domain import collection_services
from core.domain import exp_services
from core.domain import rights_manager
from core.domain import user_services
import feconf

def get_human_readable_contributors_summary(contributors_summary):
    contributor_ids = contributors_summary.keys()
    contributor_usernames = user_services.get_human_readable_user_ids(
        contributor_ids)
    contributor_profile_pictures = (
        user_services.get_profile_pictures_by_user_ids(contributor_ids))
    return {
        contributor_usernames[ind]: {
            'num_commits': contributors_summary[contributor_ids[ind]],
            'profile_picture_data_url': contributor_profile_pictures[
                contributor_ids[ind]]
        }
        for ind in xrange(len(contributor_ids))
    }


def require_activities_to_be_public(activity_references):
    """Raises an exception if any activity reference in the list does not
    exist, or is not public.
    """
    exploration_ids, collection_ids = activity_services.split_by_type(
        activity_references)

    activity_summaries_by_type = [{
        'type': feconf.ACTIVITY_TYPE_EXPLORATION,
        'ids': exploration_ids,
        'summaries': exp_services.get_exploration_summaries_matching_ids(
            exploration_ids),
    }, {
        'type': feconf.ACTIVITY_TYPE_COLLECTION,
        'ids': collection_ids,
        'summaries': collection_services.get_collection_summaries_matching_ids(
            collection_ids),
    }]

    for activities_info in activity_summaries_by_type:
        for index, summary in enumerate(activities_info['summaries']):
            if summary is None:
                raise Exception(
                    'Cannot feature non-existent %s with id %s' %
                    (activities_info['type'], activities_info['ids'][index]))
            if summary.status == rights_manager.ACTIVITY_STATUS_PRIVATE:
                raise Exception(
                    'Cannot feature private %s with id %s' %
                    (activities_info['type'], activities_info['ids'][index]))
