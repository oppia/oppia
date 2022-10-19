# coding: utf-8
#
# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Domain object for contribution opportunities."""

from __future__ import annotations

from core import utils
from core.constants import constants

from typing import Dict, List, TypedDict


class PartialExplorationOpportunitySummaryDict(TypedDict):
    """A dictionary representing partial fields of
    ExplorationOpportunitySummary object.

    This dict has only required fields to represent
    an opportunity to a contributor.
    """

    id: str
    topic_name: str
    story_title: str
    chapter_title: str
    content_count: int
    translation_counts: Dict[str, int]
    translation_in_review_counts: Dict[str, int]


class ExplorationOpportunitySummaryDict(
    PartialExplorationOpportunitySummaryDict
):
    """A dictionary representing ExplorationOpportunitySummary object.

    Contains all fields of an ExplorationOpportunitySummary object.
    It gets the required fields from PartialExplorationOpportunitySummaryDict.
    """

    topic_id: str
    story_id: str
    incomplete_translation_language_codes: List[str]
    language_codes_needing_voice_artists: List[str]
    language_codes_with_assigned_voice_artists: List[str]


class SkillOpportunityDict(TypedDict):
    """A dictionary representing SkillOpportunity object."""

    id: str
    skill_description: str
    question_count: int


class ExplorationOpportunitySummary:
    """The domain object for the translation and voiceover opportunities summary
    available in an exploration.
    """

    def __init__(
        self,
        exp_id: str,
        topic_id: str,
        topic_name: str,
        story_id: str,
        story_title: str,
        chapter_title: str,
        content_count: int,
        incomplete_translation_language_codes: List[str],
        translation_counts: Dict[str, int],
        language_codes_needing_voice_artists: List[str],
        language_codes_with_assigned_voice_artists: List[str],
        translation_in_review_counts: Dict[str, int]
    ) -> None:
        """Constructs a ExplorationOpportunitySummary domain object.

        Args:
            exp_id: str. The unique id of the exploration.
            topic_id: str. The unique id of the topic.
            topic_name: str. The name of the topic.
            story_id: str. The uniques id of the story.
            story_title: str. The title of the story.
            chapter_title: str. The title of the story chapter.
            content_count: int. The total number of content available in the
                exploration.
            incomplete_translation_language_codes: list(str). A list of language
                code in which the exploration translation is incomplete.
            translation_counts: dict. A dict with language code as a key and
                number of translation available in that language as the value.
            language_codes_needing_voice_artists: list(str). A list of language
                code in which the exploration needs voice artist.
            language_codes_with_assigned_voice_artists: list(str). A list of
                language code for which a voice-artist is already assigned to
                the exploration.
            translation_in_review_counts: dict. A dict with language code as a
                key and number of translation in review in that language as the
                value.
        """
        self.id = exp_id
        self.topic_id = topic_id
        self.topic_name = topic_name
        self.story_id = story_id
        self.story_title = story_title
        self.chapter_title = chapter_title
        self.content_count = content_count
        self.incomplete_translation_language_codes = (
            incomplete_translation_language_codes)
        self.translation_counts = translation_counts
        self.language_codes_needing_voice_artists = (
            language_codes_needing_voice_artists)
        self.language_codes_with_assigned_voice_artists = (
            language_codes_with_assigned_voice_artists)
        self.translation_in_review_counts = translation_in_review_counts
        self.validate()

    @classmethod
    def from_dict(
        cls,
        exploration_opportunity_summary_dict: ExplorationOpportunitySummaryDict,
    ) -> 'ExplorationOpportunitySummary':
        """Return a ExplorationOpportunitySummary domain object from a dict.

        Args:
            exploration_opportunity_summary_dict: dict. The dict representation
                of ExplorationOpportunitySummary object.

        Returns:
            ExplorationOpportunitySummary. The corresponding
            ExplorationOpportunitySummary domain object.
        """
        return cls(
            exploration_opportunity_summary_dict['id'],
            exploration_opportunity_summary_dict['topic_id'],
            exploration_opportunity_summary_dict['topic_name'],
            exploration_opportunity_summary_dict['story_id'],
            exploration_opportunity_summary_dict['story_title'],
            exploration_opportunity_summary_dict['chapter_title'],
            exploration_opportunity_summary_dict['content_count'],
            exploration_opportunity_summary_dict[
                'incomplete_translation_language_codes'],
            exploration_opportunity_summary_dict['translation_counts'],
            exploration_opportunity_summary_dict[
                'language_codes_needing_voice_artists'],
            exploration_opportunity_summary_dict[
                'language_codes_with_assigned_voice_artists'],
            exploration_opportunity_summary_dict[
                'translation_in_review_counts'])

    def to_dict(self) -> PartialExplorationOpportunitySummaryDict:
        """Return a copy of the object as a dictionary. It includes all
        necessary information to represent an opportunity.

        NOTE: The returned dict has only those data which are required to
        represent the opportunity to a contributor.

        Returns:
            dict. A dict mapping the fields of ExplorationOpportunitySummary
            instance which are required to represent the opportunity to a
            contributor.
        """
        return {
            'id': self.id,
            'topic_name': self.topic_name,
            'story_title': self.story_title,
            'chapter_title': self.chapter_title,
            'content_count': self.content_count,
            'translation_counts': self.translation_counts,
            'translation_in_review_counts': self.translation_in_review_counts
        }

    def validate(self) -> None:
        """Validates various properties of the object.

        Raises:
            ValidationError. One or more attributes of the object are invalid.
        """

        if self.content_count < 0:
            raise utils.ValidationError(
                'Expected content_count to be a non-negative integer, '
                'received %s' % self.content_count)

        allowed_language_codes = [language['id'] for language in (
            constants.SUPPORTED_AUDIO_LANGUAGES)]

        if not set(self.language_codes_with_assigned_voice_artists).isdisjoint(
                self.language_codes_needing_voice_artists):
            raise utils.ValidationError(
                'Expected voice_artist "needed" and "assigned" list of '
                'languages to be disjoint, received: %s, %s' % (
                    self.language_codes_needing_voice_artists,
                    self.language_codes_with_assigned_voice_artists))

        self._validate_translation_counts(self.translation_counts)
        self._validate_translation_counts(self.translation_in_review_counts)

        expected_set_of_all_languages = set(
            self.incomplete_translation_language_codes +
            self.language_codes_needing_voice_artists +
            self.language_codes_with_assigned_voice_artists)

        for language_code in expected_set_of_all_languages:
            if language_code not in allowed_language_codes:
                raise utils.ValidationError(
                    'Invalid language_code: %s' % language_code)

        if expected_set_of_all_languages != set(allowed_language_codes):
            raise utils.ValidationError(
                'Expected set of all languages available in '
                'incomplete_translation, needs_voiceover and assigned_voiceover'
                ' to be the same as the supported audio languages, '
                'received %s' % list(sorted(expected_set_of_all_languages)))

    def _validate_translation_counts(
        self, translation_counts: Dict[str, int]
    ) -> None:
        """Validates per-language counts of translations.

        Args:
            translation_counts: dict. A dict with language code as a key and
                number of translations in that language as the value.

        Raises:
            ValidationError. One or more attributes of the object are invalid.
        """
        for language_code, count in (
                translation_counts.items()):
            if not utils.is_supported_audio_language_code(language_code):
                raise utils.ValidationError(
                    'Invalid language_code: %s' % language_code)

            if count < 0:
                raise utils.ValidationError(
                    'Expected count for language_code %s to be a non-negative '
                    'integer, received %s' % (language_code, count))

            if count > self.content_count:
                raise utils.ValidationError(
                    'Expected translation count for language_code %s to be '
                    'less than or equal to content_count(%s), received %s' % (
                        language_code, self.content_count, count))


class SkillOpportunity:
    """The domain object for skill opportunities."""

    def __init__(
        self,
        skill_id: str,
        skill_description: str,
        question_count: int
    ) -> None:
        """Constructs a SkillOpportunity domain object.

        Args:
            skill_id: str. The unique id of the skill.
            skill_description: str. The title of the skill.
            question_count: int. The total number of questions for the skill.
        """
        self.id = skill_id
        self.skill_description = skill_description
        self.question_count = question_count
        self.validate()

    def validate(self) -> None:
        """Validates various properties of the object.

        Raises:
            ValidationError. One or more attributes of the object are invalid.
        """

        if self.question_count < 0:
            raise utils.ValidationError(
                'Expected question_count to be a non-negative integer, '
                'received %s' % self.question_count)

    @classmethod
    def from_dict(
        cls, skill_opportunity_dict: SkillOpportunityDict
    ) -> 'SkillOpportunity':
        """Return a SkillOpportunity domain object from a dict.

        Args:
            skill_opportunity_dict: dict. The dict representation of a
                SkillOpportunity object.

        Returns:
            SkillOpportunity. The corresponding SkillOpportunity domain object.
        """
        return cls(
            skill_opportunity_dict['id'],
            skill_opportunity_dict['skill_description'],
            skill_opportunity_dict['question_count'])

    def to_dict(self) -> SkillOpportunityDict:
        """Returns a copy of the object as a dictionary. It includes all
        necessary information to represent an opportunity.

        Returns:
            dict. A dict mapping the fields of SkillOpportunity instance which
            are required to represent the opportunity to a contributor.
        """
        return {
            'id': self.id,
            'skill_description': self.skill_description,
            'question_count': self.question_count
        }
