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
from core.domain import blog_services
from core.platform import models

datastore_services = models.Registry.import_datastore_services()

(base_models, blog_models) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.blog])


class BlogPostModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating BlogPostModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return blog_services.get_blog_post_from_model(item)

    @classmethod
    def _get_domain_object_validation_type(cls, item):
        blog_post_rights = blog_services.get_blog_post_rights(
            item.id, strict=False)

        if blog_post_rights.blog_post_is_published:
            return base_model_validators.VALIDATION_MODE_STRICT

        return base_model_validators.VALIDATION_MODE_NON_STRICT

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
                'author_id', [item.author_id],
                may_contain_system_ids=True,
                may_contain_pseudonymous_ids=True
            )
        )
        return field_name_to_external_model_references

    @classmethod
    def _validate_title_is_unique(cls, item):
        """Validate that title of the model unique.

        Args:
            item: datastore_services.Model. BlogPostModel to validate.
        """
        if item.title != '':
            blog_post_models = blog_models.BlogPostModel.query().filter(
                blog_models.BlogPostModel.title == (
                    item.title)).filter(
                        blog_models.BlogPostModel.deleted == False).fetch() # pylint: disable=singleton-comparison
            blog_model_ids = [
                model.id for model in blog_post_models if model.id != item.id]
            if blog_model_ids:
                cls._add_error(
                    'unique title for blog post',
                    'Entity id %s: title %s matches with title '
                    'blog post models with ids %s' % (
                        item.id, item.title, blog_model_ids))

    @classmethod
    def _validate_url_fragment_is_unique(cls, item):
        """Validates that the url fragment of the model is unique.

        Args:
            item: datastore_services.Model. BlogPostModel to validate.
        """
        if item.url_fragment != '':
            blog_post_models = blog_models.BlogPostModel.query().filter(
                blog_models.BlogPostModel.url_fragment == (
                    item.url_fragment)).filter(
                        blog_models.BlogPostModel.deleted == False).fetch() # pylint: disable=singleton-comparison
            blog_model_ids = [
                model.id for model in blog_post_models if model.id != item.id]
            if blog_model_ids:
                cls._add_error(
                    'unique url fragment for blog post',
                    'Entity id %s: url fragment %s matches with url fragment '
                    'of blog post models with ids %s' % (
                        item.id, item.url_fragment, blog_model_ids))

    @classmethod
    def _validate_title_matches_summary_model_title(cls, item):
        """Validates that the title of blog post model matches corresponding
        summary model title.

        Args:
            item: datastore_services.Model. BlogPostModel to validate.
        """
        if item.title != '':
            blog_post_summary_title = (
                blog_models.BlogPostSummaryModel.get_by_id(item.id).title)
            if blog_post_summary_title != item.title:
                cls._add_error(
                    'Same Title for blog post and blog post summary',
                    'Title for blog post with Entity id'
                    ' %s does not match with title of corresponding'
                    ' blog post summary model' % (item.id))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_title_is_unique,
            cls._validate_url_fragment_is_unique,
            cls._validate_title_matches_summary_model_title
        ]


class BlogPostSummaryModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating BlogPostSummaryModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return blog_services.get_blog_post_summary_from_model(item)

    @classmethod
    def _get_domain_object_validation_type(cls, item):
        blog_post_rights = blog_services.get_blog_post_rights(
            item.id, strict=False)

        if blog_post_rights.blog_post_is_published:
            return base_model_validators.VALIDATION_MODE_STRICT

        return base_model_validators.VALIDATION_MODE_NON_STRICT

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        # Valid id: random_hash of constants.BASE_MODELS_ID_LENGTH chars.
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
                'author_id', [item.author_id],
                may_contain_system_ids=True,
                may_contain_pseudonymous_ids=True
            )
        )
        return field_name_to_external_model_references

    @classmethod
    def _validate_title_is_unique(cls, item):
        """Validate that title of the model unique.

        Args:
            item: datastore_services.Model. BlogPostSummaryModel to validate.
        """
        if item.title != '':
            blog_post_summary_models = (
                blog_models.BlogPostSummaryModel.query().filter(
                    blog_models.BlogPostSummaryModel.title == (item.title)
                    ).filter(
                        blog_models.BlogPostSummaryModel.deleted == False  # pylint: disable=singleton-comparison
                    ).fetch()
                )
            blog_model_ids = [
                model.id
                for model in blog_post_summary_models if model.id != item.id]
            if blog_model_ids:
                cls._add_error(
                    'unique title for blog post',
                    'Entity id %s: title %s matches with title '
                    'blog post summary models with ids %s' % (
                        item.id, item.title, blog_model_ids))

    @classmethod
    def _validate_url_fragment_is_unique(cls, item):
        """Validates that the url fragment of the model is unique.

        Args:
            item: datastore_services.Model. BlogPostModel to validate.
        """
        if item.url_fragment != '':
            summary_models = (
                blog_models.BlogPostSummaryModel.query().filter(
                    blog_models.BlogPostSummaryModel.url_fragment == (
                        item.url_fragment)).filter(
                            blog_models.BlogPostSummaryModel.deleted == False # pylint: disable=singleton-comparison
                            ).fetch())
            blog_model_ids = [
                model.id for model in summary_models if model.id != item.id]
            if blog_model_ids:
                cls._add_error(
                    'unique url fragment for blog post',
                    'Entity id %s: url fragment %s matches with url fragment '
                    'of blog post summary models with ids %s' % (
                        item.id, item.url_fragment, blog_model_ids))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_title_is_unique,
            cls._validate_url_fragment_is_unique,
        ]


class BlogPostRightsModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating BlogPostRightsModel."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        # Valid id: random_hash of constants.BASE_MODELS_ID_LENGTH chars.
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
        field_name_to_external_model_references.append(
            base_model_validators.UserSettingsModelFetcherDetails(
                'editor_ids', item.editor_ids,
                may_contain_system_ids=True,
                may_contain_pseudonymous_ids=False
            )
        )
        return field_name_to_external_model_references
