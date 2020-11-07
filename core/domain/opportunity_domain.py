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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from constants import constants
import python_utils
import utils


class ExplorationOpportunitySummary(python_utils.OBJECT):
    """The domain object for the translation and voiceover opportunities summary
    available in an exploration.
    """

    def __init__(
            self, exp_id, topic_id, topic_name, story_id, story_title,
            chapter_title, content_count, incomplete_translation_language_codes,
            translation_counts, language_codes_needing_voice_artists,
            language_codes_with_assigned_voice_artists):
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
        self.validate()

    @classmethod
    def from_dict(cls, exploration_opportunity_summary_dict):
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
                'language_codes_with_assigned_voice_artists'])

    def to_dict(self):
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
            'translation_counts': self.translation_counts
        }

    def validate(self):
        """Validates various properties of the object.

        Raises:
            ValidationError. One or more attributes of the object are invalid.
        """
        if not isinstance(self.topic_id, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected topic_id to be a string, received %s' % self.topic_id)
        if not isinstance(self.topic_name, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected topic_name to be a string, received %s' %
                self.topic_name)
        if not isinstance(self.story_id, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected story_id to be a string, received %s' % self.story_id)
        if not isinstance(self.story_title, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected story_title to be a string, received %s' %
                self.story_title)
        if not isinstance(self.chapter_title, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected chapter_title to be a string, received %s' %
                self.chapter_title)
        if not isinstance(self.content_count, int):
            raise utils.ValidationError(
                'Expected content_count to be an integer, received %s' %
                self.content_count)

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
        for language_code, count in (
                self.translation_counts.items()):
            if not utils.is_supported_audio_language_code(language_code):
                raise utils.ValidationError(
                    'Invalid language_code: %s' % language_code)
            if not isinstance(count, int):
                raise utils.ValidationError(
                    'Expected count for language_code %s to be an integer, '
                    'received %s' % (language_code, count))
            if count < 0:
                raise utils.ValidationError(
                    'Expected count for language_code %s to be a non-negative '
                    'integer, received %s' % (language_code, count))

            if count > self.content_count:
                raise utils.ValidationError(
                    'Expected translation count for language_code %s to be '
                    'less than or equal to content_count(%s), received %s' % (
                        language_code, self.content_count, count))

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
                'received %s' % list(expected_set_of_all_languages))


class SkillOpportunity(python_utils.OBJECT):
    """The domain object for skill opportunities."""

    def __init__(
            self, skill_id, skill_description, question_count):
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

    def validate(self):
        """Validates various properties of the object.

        Raises:
            ValidationError. One or more attributes of the object are invalid.
        """
        if not isinstance(self.skill_description, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected skill_description to be a string, received %s' %
                self.skill_description)
        if not isinstance(self.question_count, int):
            raise utils.ValidationError(
                'Expected question_count to be an integer, received %s' %
                self.question_count)

        if self.question_count < 0:
            raise utils.ValidationError(
                'Expected question_count to be a non-negative integer, '
                'received %s' % self.question_count)

    @classmethod
    def from_dict(cls, skill_opportunity_dict):
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

    def to_dict(self):
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
