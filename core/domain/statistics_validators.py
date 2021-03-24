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

"""Validators for statistics models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from core.domain import base_model_validators
from core.domain import config_domain
from core.domain import stats_services
from core.platform import models
import feconf

(base_models, exp_models, stats_models,) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.exploration, models.NAMES.statistics])


class PlaythroughModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating PlaythroughModel."""

    # The playthrough design was finalized at the end of GSOC 2018: 2018-09-01.
    PLAYTHROUGH_INTRODUCTION_DATETIME = datetime.datetime(2018, 9, 1)

    @classmethod
    def _get_external_id_relationships(cls, item):
        exp_id = item.exp_id
        exp_version = item.exp_version
        exp_issues_id = (
            stats_models.ExplorationIssuesModel.get_entity_id(
                exp_id, exp_version)
        )

        return [
            base_model_validators.ExternalModelFetcherDetails(
                'exp_ids', exp_models.ExplorationModel, [item.exp_id]),
            base_model_validators.ExternalModelFetcherDetails(
                'exp_issues_ids', stats_models.ExplorationIssuesModel,
                [exp_issues_id])]

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return r'^[A-Za-z0-9-_]{1,%s}\.[A-Za-z0-9-_]{1,%s}$' % (
            base_models.ID_LENGTH, base_models.ID_LENGTH)

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return stats_services.get_playthrough_from_model(item)

    @classmethod
    def _validate_exploration_id_in_whitelist(cls, item):
        """Validate the exploration id in playthrough model is in
        the whitelist.

        Args:
            item: datastore_services.Model. PlaythroughModel to validate.
        """
        whitelisted_exp_ids_for_playthroughs = (
            config_domain.WHITELISTED_EXPLORATION_IDS_FOR_PLAYTHROUGHS.value)

        if item.exp_id not in whitelisted_exp_ids_for_playthroughs:
            cls._add_error(
                'exploration %s' % (
                    base_model_validators.ERROR_CATEGORY_ID_CHECK),
                'Entity id %s: recorded in exploration_id:%s which '
                'has not been curated for recording.' % (
                    item.id, item.exp_id)
            )

    @classmethod
    def _validate_reference(cls, item, field_name_to_external_model_references):
        """Validate the playthrough reference relations.

        Args:
            item: datastore_services.Model. PlaythroughModel to validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
                A dict keyed by field name. The field name represents
                a unique identifier provided by the storage
                model to which the external model is associated. Each value
                contains a list of ExternalModelReference objects corresponding
                to the field_name. For examples, all the external Exploration
                Models corresponding to a storage model can be associated
                with the field name 'exp_ids'. This dict is used for
                validation of External Model properties linked to the
                storage model.
        """
        exp_issues_model_references = (
            field_name_to_external_model_references['exp_issues_ids'])

        for exp_issues_model_reference in exp_issues_model_references:
            exp_issues_model = exp_issues_model_reference.model_instance

            if exp_issues_model is None or exp_issues_model.deleted:
                model_class = exp_issues_model_reference.model_class
                model_id = exp_issues_model_reference.model_id
                cls._add_error(
                    'exp_issues_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field exp_issues_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            exp_id = item.exp_id
            exp_version = item.exp_version

            issues = []
            for issue_index, issue in enumerate(
                    exp_issues_model.unresolved_issues):
                issue_type = issue['issue_type']
                if (
                        item.id in issue['playthrough_ids']
                        and issue_type == item.issue_type):
                    issue_customization_args = issue['issue_customization_args']
                    identifying_arg = (
                        feconf.CUSTOMIZATION_ARG_WHICH_IDENTIFIES_ISSUE[
                            issue_type])
                    if (
                            issue_customization_args[identifying_arg] ==
                            item.issue_customization_args[identifying_arg]):
                        issues.append((issue_index, issue))

            if len(issues) == 0:
                cls._add_error(
                    base_model_validators.ERROR_CATEGORY_REFERENCE_CHECK,
                    'Entity id %s: not referenced by any issue of the'
                    ' corresponding exploration (id=%s, version=%s).' % (
                        item.id, exp_id, exp_version)
                )
            elif len(issues) > 1:
                issue_indices = [index for index, _ in issues]
                cls._add_error(
                    base_model_validators.ERROR_CATEGORY_REFERENCE_CHECK,
                    'Entity id %s: referenced by more than one issues of the '
                    'corresponding exploration (id=%s, version=%s), '
                    'issue indices: %s.' % (
                        item.id, exp_id, exp_version, issue_indices)
                )
            else:
                issue_index, issue = issues[0]
                id_indices = []
                for id_index, playthrough_id in enumerate(
                        issue['playthrough_ids']):
                    if playthrough_id == item.id:
                        id_indices.append(id_index)
                if len(id_indices) > 1:
                    cls._add_error(
                        base_model_validators.ERROR_CATEGORY_REFERENCE_CHECK,
                        'Entity id %s: referenced multiple times in an '
                        'issue (index=%s) of the corresponding exploration '
                        '(id=%s, version=%s), duplicated id indices: %s.' % (
                            item.id, issue_index, exp_id, exp_version,
                            id_indices)
                    )

    @classmethod
    def _validate_created_datetime(cls, item):
        """Validate the playthrough is created after the GSoC 2018 submission
        deadline.

        Args:
            item: datastore_services.Model. PlaythroughModel to validate.
        """
        created_on_datetime = item.created_on
        if created_on_datetime < cls.PLAYTHROUGH_INTRODUCTION_DATETIME:
            cls._add_error(
                'create datetime check',
                'Entity id %s: released on %s, which is before the '
                'GSoC 2018 submission deadline (2018-09-01) and should '
                'therefore not exist.' % (
                    item.id, item.created_on.strftime('%Y-%m-%d'))
            )

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_exploration_id_in_whitelist,
            cls._validate_created_datetime,
        ]

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [cls._validate_reference]
