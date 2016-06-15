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

"""Commands for operating on library models."""

import logging

from core.platform import models
import utils
(library_models,) = models.Registry.import_models([models.NAMES.library])


def get_featured_activity_ids():
    return library_models.ActivityListModel.get(
        library_models.ACTIVITY_LIST_FEATURED).activity_ids


def update_featured_activity_ids(featured_activity_ids):
    """Updates the current list of featured activity ids.

    This assumes that the input is a list of activity ids corresponding to
    publicly-viewable activities.
    """
    for activity_id in featured_activity_ids:
        utils.validate_activity_id(activity_id)

    if len(featured_activity_ids) != len(set(featured_activity_ids)):
        raise Exception('The activity list should not have duplicates.')

    featured_activity_list_model = library_models.ActivityListModel.get(
        library_models.ACTIVITY_LIST_FEATURED)
    featured_activity_list_model.activity_ids = featured_activity_ids
    featured_activity_list_model.put()


def remove_activity_from_featured_list(activity_type, item_id):
    activity_id = utils.get_activity_id(activity_type, item_id)

    featured_activity_list_model = library_models.ActivityListModel.get(
        library_models.ACTIVITY_LIST_FEATURED)
    if activity_id in featured_activity_list_model.activity_ids:
        while activity_id in featured_activity_list_model.activity_ids:
            featured_activity_list_model.activity_ids.remove(activity_id)
        featured_activity_list_model.put()

        # It is quite unusual for a featured activity to be unpublished or
        # deleted, so we log a message.
        logging.info(
            'Activity %s was removed from the featured list.' % activity_id)
