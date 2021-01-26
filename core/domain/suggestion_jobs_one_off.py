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

"""One-off jobs for suggestions."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast

from constants import constants
from core import jobs
from core.domain import html_validation_service
from core.domain import suggestion_services
from core.platform import models
import feconf

(feedback_models, suggestion_models, user_models,) = (
    models.Registry.import_models(
        [models.NAMES.feedback, models.NAMES.suggestion, models.NAMES.user]))
transaction_services = models.Registry.import_transaction_services()


class QuestionSuggestionMigrationJobManager(jobs.BaseMapReduceOneOffJobManager):
    """A reusable one-time job that can be used to migrate state schema
    versions of question suggestions.

    This job will create domain objects out of the models. The object conversion
    process of a suggestion automatically performs schema updating. This
    job persists that conversion work, keeping question suggestions up-to-date
    and improving the load time of question suggestions.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [suggestion_models.GeneralSuggestionModel]

    @staticmethod
    def map(item):
        if item.deleted or item.suggestion_type != (
                feconf.SUGGESTION_TYPE_ADD_QUESTION):
            return

        try:
            # Suggestion class itself updates the question state dict of the
            # suggestion while initializing the object.
            suggestion = suggestion_services.get_suggestion_from_model(item)
        except Exception as e:
            yield ('MIGRATION_FAILURE', (item.id, e))
            return

        try:
            suggestion.validate()
        except Exception as e:
            yield ('POST_MIGRATION_VALIDATION_FALIURE', (item.id, e))
            return

        item.change_cmd = suggestion.change.to_dict()
        item.update_timestamps(update_last_updated_time=False)
        item.put()

        yield ('SUCCESS', item.id)

    @staticmethod
    def reduce(key, value):
        if key == 'SUCCESS':
            value = len(value)
        yield (key, value)


class PopulateContributionStatsOneOffJob(
        jobs.BaseMapReduceOneOffJobManager):
    """A reusable one-time job that may be used to initialize, or regenerate,
    the reviewer and suggestion counts in the CommunityContributionStatsModel.
    """

    _VALIDATION_ERROR_KEY = 'community_contribution_stats_validation_error'
    ITEM_TYPE_REVIEWER = 'reviewer'
    ITEM_TYPE_SUGGESTION = 'suggestion'
    ITEM_CATEGORY_QUESTION = 'question'
    ITEM_CATEGORY_TRANSLATION = 'translation'
    KEY_DELIMITER = '.'

    @classmethod
    def entity_classes_to_map_over(cls):
        return [
            suggestion_models.GeneralSuggestionModel,
            user_models.UserContributionRightsModel
        ]

    @staticmethod
    def map(item):
        if item.deleted:
            return

        if isinstance(item, suggestion_models.GeneralSuggestionModel):
            # Exit early if the suggestion type is not a part of the
            # Contributor Dashboard or if the suggestion is not currently in
            # review.
            if item.suggestion_type == (
                    feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT) or (
                        item.status != suggestion_models.STATUS_IN_REVIEW):
                return
            suggestion = suggestion_services.get_suggestion_from_model(item)
            yield ('%s%s%s%s%s' % (
                PopulateContributionStatsOneOffJob.ITEM_TYPE_SUGGESTION,
                PopulateContributionStatsOneOffJob.KEY_DELIMITER,
                suggestion.suggestion_type,
                PopulateContributionStatsOneOffJob.KEY_DELIMITER,
                suggestion.language_code), 1)

        else:
            if item.can_review_translation_for_language_codes:
                for language_code in (
                        item.can_review_translation_for_language_codes):
                    yield ('%s%s%s%s%s' % (
                        PopulateContributionStatsOneOffJob.ITEM_TYPE_REVIEWER,
                        PopulateContributionStatsOneOffJob.KEY_DELIMITER,
                        (
                            PopulateContributionStatsOneOffJob
                            .ITEM_CATEGORY_TRANSLATION
                        ),
                        PopulateContributionStatsOneOffJob.KEY_DELIMITER,
                        language_code), 1)
            if item.can_review_questions:
                yield ('%s%s%s%s%s' % (
                    PopulateContributionStatsOneOffJob.ITEM_TYPE_REVIEWER,
                    PopulateContributionStatsOneOffJob.KEY_DELIMITER,
                    PopulateContributionStatsOneOffJob.ITEM_CATEGORY_QUESTION,
                    PopulateContributionStatsOneOffJob.KEY_DELIMITER,
                    constants.DEFAULT_LANGUAGE_CODE), 1)

    @staticmethod
    def reduce(key, values):

        def _update_community_contribution_stats_transactional(
                key, count_value):
            """Updates the CommunityContributionStatsModel according to the
            given key and count. The key contains the information for which
            count to update with the given count value. The model GET and PUT
            must be done in a transaction to avoid loss of updates that come in
            rapid succession.

            Args:
                key: str. A key containing the information regarding which count
                    to update.
                count_value: int. The count value for the given key.

            Returns:
                tuple(str, str). A 2-tuple that consists of the key and
                count_value to yield outside of the transaction.
            """
            item_type, item_category, language_code = key.split(
                PopulateContributionStatsOneOffJob.KEY_DELIMITER)

            stats_model = (
                suggestion_models.CommunityContributionStatsModel.get())

            # Update the reviewer counts.
            if item_type == (
                    PopulateContributionStatsOneOffJob.ITEM_TYPE_REVIEWER):
                if item_category == (
                        PopulateContributionStatsOneOffJob
                        .ITEM_CATEGORY_QUESTION):
                    stats_model.question_reviewer_count = count_value
                elif item_category == (
                        PopulateContributionStatsOneOffJob
                        .ITEM_CATEGORY_TRANSLATION):
                    (
                        stats_model
                        .translation_reviewer_counts_by_lang_code[language_code]
                    ) = count_value
            # Update the suggestion counts.
            else:
                if item_category == (
                        feconf.SUGGESTION_TYPE_ADD_QUESTION):
                    stats_model.question_suggestion_count = count_value
                elif item_category == (
                        feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT):
                    (
                        stats_model
                        .translation_suggestion_counts_by_lang_code[
                            language_code]
                    ) = count_value

            stats_model.update_timestamps()
            stats_model.put()
            return key, count_value

        key_from_transaction, count_value_from_transaction = (
            transaction_services.run_in_transaction(
                _update_community_contribution_stats_transactional, key,
                len(values)))

        # Only yield the values from the transactions.
        yield (key_from_transaction, count_value_from_transaction)
