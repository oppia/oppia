# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Validators for activity models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from constants import constants
from core.domain import activity_domain
from core.domain import base_model_validators
from core.platform import models
import feconf

(collection_models, exp_models,) = models.Registry.import_models([
    models.NAMES.collection, models.NAMES.exploration])


class ActivityReferencesModelValidator(
        base_model_validators.BaseModelValidator):
    """Class for validating ActivityReferencesModels."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        # Valid id: featured.
        regex_string = '^(%s)$' % '|'.join(
            feconf.ALL_ACTIVITY_REFERENCE_LIST_TYPES)
        return regex_string

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        activity_references_list = []

        try:
            for reference in item.activity_references:
                activity_references_list.append(
                    activity_domain.ActivityReference(
                        reference['type'], reference['id']))
        except Exception as e:
            cls._add_error(
                base_model_validators.ERROR_CATEGORY_PROPERTY_FETCH_CHECK,
                'Entity id %s: Entity properties cannot be fetched completely '
                'with the error %s' % (item.id, e))
            return None

        return activity_domain.ActivityReferences(activity_references_list)

    @classmethod
    def _get_external_id_relationships(cls, item):
        exploration_ids = []
        collection_ids = []

        try:
            for reference in item.activity_references:
                if reference['type'] == constants.ACTIVITY_TYPE_EXPLORATION:
                    exploration_ids.append(reference['id'])
                elif reference['type'] == constants.ACTIVITY_TYPE_COLLECTION:
                    collection_ids.append(reference['id'])
        except Exception as e:
            cls._add_error(
                base_model_validators.ERROR_CATEGORY_PROPERTY_FETCH_CHECK,
                'Entity id %s: Entity properties cannot be fetched completely '
                'with the error %s' % (item.id, e))
            return []

        return [
            base_model_validators.ExternalModelFetcherDetails(
                'exploration_ids', exp_models.ExplorationModel,
                exploration_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'collection_ids', collection_models.CollectionModel,
                collection_ids)
        ]
