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
import datetime

from core import jobs
from core.domain import html_cleaner
from core.domain import opportunity_services
from core.domain import suggestion_services
from core.platform import models
import feconf

(suggestion_models,) = models.Registry.import_models([models.NAMES.suggestion])


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


class PopulateTranslationContributionStatsOneOffJob(
        jobs.BaseMapReduceOneOffJobManager):
    """A reusable one-time job that may be used to populate translation
    suggestion related counts in the TranslationContributionStatsModel.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [suggestion_models.GeneralSuggestionModel]

    @staticmethod
    def map(item):
        """Implements the map function (generator). Computes word counts of
        translations suggestions and outputs suggestion metadata.

        Args:
            item: GeneralSuggestionModel. An instance of GeneralSuggestionModel.

        Yields:
            tuple(key, recent_activity_commits). Where:
                key: str. The entity ID of the corresponding
                    TranslationContributionStatsModel.
                dict. Has the keys:
                    suggestion_status: str. The translation suggestion status.
                    edited_by_reviewer: bool. Whether the translation suggestion
                        was edited by a reviewer.
                    content_word_count: int. The word count of the translation
                        suggestion content HTML.
                    last_updated_date: date. The last updated date of the
                        translation suggestion.
        """
        if item.suggestion_type != feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT:
            return

        suggestion = suggestion_services.get_suggestion_from_model(item)

        # Try to extract the topic ID from the corresponding exploration
        # opportunity.
        topic_id = ''
        exp_id = suggestion.target_id
        exp_opportunity_dict = (
            opportunity_services.get_exploration_opportunity_summaries_by_ids(
                [exp_id]))
        exp_opportunity = exp_opportunity_dict[exp_id]
        if exp_opportunity is not None:
            topic_id = exp_opportunity.topic_id

        # Count the number of words in the original content, ignoring any HTML
        # tags and attributes.
        content_plain_text = html_cleaner.strip_html_tags(
            suggestion.change.content_html)
        content_word_count = len(content_plain_text.split())

        key = suggestion_models.TranslationContributionStatsModel.generate_id(
            suggestion.language_code, suggestion.author_id, topic_id)
        translation_contribution_stats_dict = {
            'suggestion_status': suggestion.status,
            'edited_by_reviewer': suggestion.edited_by_reviewer,
            'content_word_count': content_word_count,
            'last_updated_date': suggestion.last_updated.date().isoformat()
        }
        yield (key, translation_contribution_stats_dict)

    @staticmethod
    def reduce(key, stringified_values):
        """Updates the TranslationContributionStatsModel for the given key
        and stringified_values.

        Args:
            key: str. Entity ID for a TranslationContributionStatsModel.
            stringified_values: list(dict(str, str)). A list of stringified
                dicts with the following keys:
                    suggestion_status: str. The translation suggestion status.
                    edited_by_reviewer: bool. Whether the translation suggestion
                        was edited by a reviewer.
                    content_word_count: int. The word count of the translation
                        suggestion content HTML.
                    last_updated_date: date. The last updated date of the
                        translation suggestion.

        Yields:
            tuple(key, count). Where:
                key: str. TranslationContributionStatsModel entity ID.
                count: int. Number of translation suggestions processed for
                    populating the TranslationContributionStatsModel with ID
                    key.
        """
        values = [ast.literal_eval(v) for v in stringified_values]
        submitted_translations_count = 0
        submitted_translation_word_count = 0
        accepted_translations_count = 0
        accepted_translations_without_reviewer_edits_count = 0
        accepted_translation_word_count = 0
        rejected_translations_count = 0
        rejected_translation_word_count = 0
        contribution_dates = []
        for value in values:
            word_count = value['content_word_count']
            submitted_translations_count += 1
            submitted_translation_word_count += word_count

            if value['suggestion_status'] == suggestion_models.STATUS_ACCEPTED:
                accepted_translations_count += 1
                accepted_translation_word_count += word_count

                if value['edited_by_reviewer'] is False:
                    accepted_translations_without_reviewer_edits_count += 1

            if value['suggestion_status'] == suggestion_models.STATUS_REJECTED:
                rejected_translations_count += 1
                rejected_translation_word_count += word_count

            contribution_date = datetime.datetime.strptime(
                value['last_updated_date'], '%Y-%m-%d').date()
            if contribution_date not in contribution_dates:
                contribution_dates.append(contribution_date)

        language_code, contributor_user_id, topic_id = key.split('.')
        suggestion_models.TranslationContributionStatsModel.create(
            language_code=language_code,
            contributor_user_id=contributor_user_id,
            topic_id=topic_id,
            submitted_translations_count=submitted_translations_count,
            submitted_translation_word_count=submitted_translation_word_count,
            accepted_translations_count=accepted_translations_count,
            accepted_translations_without_reviewer_edits_count=(
                accepted_translations_without_reviewer_edits_count),
            accepted_translation_word_count=accepted_translation_word_count,
            rejected_translations_count=rejected_translations_count,
            rejected_translation_word_count=rejected_translation_word_count,
            contribution_dates=contribution_dates
        )
        yield (key, len(values))
