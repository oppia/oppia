# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

""" Validators for Blog models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import base_model_validators
from core.platform import models

datastore_services = models.Registry.import_datastore_services()

(base_models, blog_models) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.blog
    ])


class BlogPostModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating BlogPostModel."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        # Valid id: random_hash of base_models.ID_LENGTH chars.
        return '[A-Za-z0-9-_]{1,%s}$' % (base_models.ID_LENGTH)

    @classmethod
    def _get_external_id_relationships(cls, item):
        field_name_to_external_model_references = [
            base_model_validators.ExternalModelFetcherDetails(
                'blog_post_rights_model_ids',
                blog_models.BlogPostRightsModel,
                [item.id]
            ),
            base_model_validators.ExternalModelFetcherDetails(
                'blog_post_summary_model_ids',
                blog_models.BlogPostSummaryModel,
                [item.id]
            )
        ]
        field_name_to_external_model_references.append(
            base_model_validators.UserSettingsModelFetcherDetails(
                'author_ids', [item.author_id],
                may_contain_system_ids=True,
                may_contain_pseudonymous_ids=True
            )
        )
        return field_name_to_external_model_references


class BlogPostSummaryModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating BlogPostSummaryModel."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        # Valid id: random_hash of 12 chars.
        regex_string = '[A-Za-z0-9-_]{1,%s}$' % (base_models.ID_LENGTH)
        return regex_string

    @classmethod
    def _get_external_id_relationships(cls, item):
        field_name_to_external_model_references = [
            base_model_validators.ExternalModelFetcherDetails(
                'blog_post_rights_model_ids',
                blog_models.BlogPostRightsModel,
                [item.id]
            ),
            base_model_validators.ExternalModelFetcherDetails(
                'blog_post_model_ids',
                blog_models.BlogPostModel,
                [item.id]
            )
        ]
        field_name_to_external_model_references.append(
            base_model_validators.UserSettingsModelFetcherDetails(
                'author_ids', [item.author_id],
                may_contain_system_ids=True,
                may_contain_pseudonymous_ids=True
            )
        )
        return field_name_to_external_model_references


class BlogPostRightsModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating BlogPostRightsModel."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        # Valid id: random_hash of 12 chars.
        regex_string = '[A-Za-z0-9-_]{1,%s}$' % (base_models.ID_LENGTH)
        return regex_string

    @classmethod
    def _get_external_id_relationships(cls, item):
        field_name_to_external_model_references = [
            base_model_validators.ExternalModelFetcherDetails(
                'blog_post_summary_model_ids',
                blog_models.BlogPostSummaryModel,
                [item.id]
            ),
            base_model_validators.ExternalModelFetcherDetails(
                'blog_post_model_ids',
                blog_models.BlogPostModel,
                [item.id]
            )
        ]
        return field_name_to_external_model_references
