# coding: utf-8
#
# Copyright 2016 The Oppia Authors. All Rights Reserved.
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

"""Commands for operating on lists of activity references."""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import division  # pylint: disable=import-only-modules
from __future__ import print_function  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import logging
import os
import sys

from constants import constants
from core.domain import activity_domain
from core.platform import models
import feconf

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_FUTURE_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'future-0.17.1')

sys.path.insert(0, _FUTURE_PATH)

# pylint: disable=wrong-import-position
# pylint: disable=wrong-import-order
from future import standard_library  # isort:skip

standard_library.install_aliases()
# pylint: enable=wrong-import-order
# pylint: enable=wrong-import-position

(activity_models,) = models.Registry.import_models([models.NAMES.activity])


def get_featured_activity_references():
    """Gets a list of ActivityReference domain models.

    Returns:
        A list of all ActivityReference domain objects that are
        currently featured.
    """
    featured_model_instance = (
        activity_models.ActivityReferencesModel.get_or_create(
            feconf.ACTIVITY_REFERENCE_LIST_FEATURED))

    return [
        activity_domain.ActivityReference(reference['type'], reference['id'])
        for reference in featured_model_instance.activity_references]


def update_featured_activity_references(featured_activity_references):
    """Updates the current list of featured activity references.

    Args:
        featured_activity_references: A list of ActivityReference domain
            objects representing the full list of 'featured' activities.

    Raises:
         Exception: The input list of ActivityReference
            domain objects has duplicates.
    """
    for activity_reference in featured_activity_references:
        activity_reference.validate()

    activity_hashes = [
        reference.get_hash() for reference in featured_activity_references]
    if len(activity_hashes) != len(set(activity_hashes)):
        raise Exception(
            'The activity reference list should not have duplicates.')

    featured_model_instance = (
        activity_models.ActivityReferencesModel.get_or_create(
            feconf.ACTIVITY_REFERENCE_LIST_FEATURED))
    featured_model_instance.activity_references = [
        reference.to_dict() for reference in featured_activity_references]
    featured_model_instance.put()


def remove_featured_activity(activity_type, activity_id):
    """Removes the specified activity reference from the
        list of featured activity references.

    Args:
        activity_type: str. The type of the activity to remove.
        activity_id: str. The id of the activity to remove.
    """
    featured_references = get_featured_activity_references()

    activity_reference_found = False
    new_activity_references = []
    for reference in featured_references:
        if reference.type != activity_type or reference.id != activity_id:
            new_activity_references.append(reference)
        else:
            activity_reference_found = True

    if activity_reference_found:
        # It is quite unusual for a featured activity to be unpublished or
        # deleted, so we log a message.
        logging.info(
            'The %s with id %s was removed from the featured list.' % (
                activity_type, activity_id))
        update_featured_activity_references(new_activity_references)


def split_by_type(activity_references):
    """Given a list of activity references, returns two lists: the first list
    contains the exploration ids, and the second contains the collection ids.
    The elements in each of the returned lists are in the same order as those
    in the input list.

    Args:
        activity_references: A list of ActivityReference domain objects.

    Returns:
        A 2-tuple whose first element is a list of all exploration
        ids represented in the input list, and whose second element
        is a list of all collection ids represented in the input list.

    Raises:
        Exception: The activity reference type is invalid.
    """
    exploration_ids, collection_ids = [], []
    for activity_reference in activity_references:
        if activity_reference.type == constants.ACTIVITY_TYPE_EXPLORATION:
            exploration_ids.append(activity_reference.id)
        elif activity_reference.type == constants.ACTIVITY_TYPE_COLLECTION:
            collection_ids.append(activity_reference.id)
        else:
            raise Exception(
                'Invalid activity reference: (%s, %s)' %
                (activity_reference.type, activity_reference.id))

    return exploration_ids, collection_ids
