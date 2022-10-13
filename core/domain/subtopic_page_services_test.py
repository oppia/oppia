# coding: utf-8
#
# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Tests for subtopic page domain objects."""

from __future__ import annotations

import re

from core import feconf
from core.constants import constants
from core.domain import skill_services
from core.domain import state_domain
from core.domain import subtopic_page_domain
from core.domain import subtopic_page_services
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.platform import models
from core.tests import test_utils

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import subtopic_models

(base_models, subtopic_models) = models.Registry.import_models([
    models.Names.BASE_MODEL, models.Names.SUBTOPIC])


class SubtopicPageServicesUnitTests(test_utils.GenericTestBase):
    """Tests for topic domain objects."""

    user_id = 'user_id'
    story_id_1 = 'story_1'
    story_id_2 = 'story_2'
    story_id_3 = 'story_3'
    subtopic_id = 1
    skill_id_1 = 'skill_1'
    skill_id_2 = 'skill_2'

    def setUp(self) -> None:
        super().setUp()
        self.signup(
            self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(
            self.CURRICULUM_ADMIN_EMAIL)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.TOPIC_ID = topic_fetchers.get_new_topic_id()

        self.subtopic_page = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                self.subtopic_id, self.TOPIC_ID))
        subtopic_page_services.save_subtopic_page(
            self.user_id, self.subtopic_page, 'Added subtopic',
            [topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'subtopic_id': 1,
                'title': 'Sample',
                'url_fragment': 'sample-fragment'
            })]
        )
        self.subtopic_page_id = (
            subtopic_page_domain.SubtopicPage.get_subtopic_page_id(
                self.TOPIC_ID, 1))

        self.TOPIC_ID_1 = topic_fetchers.get_new_topic_id()
        # Set up topic and subtopic.
        topic = topic_domain.Topic.create_default_topic(
            self.TOPIC_ID_1, 'Place Values', 'abbrev', 'description', 'fragm')
        topic.thumbnail_filename = 'thumbnail.svg'
        topic.thumbnail_bg_color = '#C6DCDA'
        topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Naming Numbers', ['skill_id_1'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-url'),
            topic_domain.Subtopic(
                2, 'Subtopic Name', ['skill_id_2'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'other-subtopic-url')]
        topic.next_subtopic_id = 3
        topic.skill_ids_for_diagnostic_test = ['skill_id_1']
        topic_services.save_new_topic(self.admin_id, topic)

        # Publish the topic and its stories.
        topic_services.publish_topic(self.TOPIC_ID_1, self.admin_id)

    def test_get_subtopic_page_from_model(self) -> None:
        subtopic_page_model = subtopic_models.SubtopicPageModel.get(
            self.subtopic_page_id)
        subtopic_page = subtopic_page_services.get_subtopic_page_from_model(
            subtopic_page_model)
        self.assertEqual(subtopic_page.to_dict(), self.subtopic_page.to_dict())

    def test_get_subtopic_page_by_id(self) -> None:
        subtopic_page_1 = subtopic_page_services.get_subtopic_page_by_id(
            self.TOPIC_ID, self.subtopic_id)
        self.assertEqual(
            subtopic_page_1.to_dict(), self.subtopic_page.to_dict())
        # When the subtopic page with the given subtopic id and topic id
        # doesn't exist.
        subtopic_page_2 = subtopic_page_services.get_subtopic_page_by_id(
            'topic_id', 1, strict=False)
        self.assertEqual(subtopic_page_2, None)

    def test_get_subtopic_pages_with_ids(self) -> None:
        subtopic_ids = [self.subtopic_id]
        subtopic_pages = subtopic_page_services.get_subtopic_pages_with_ids(
            self.TOPIC_ID, subtopic_ids)
        # Ruling out the possibility of None for mypy type checking.
        assert subtopic_pages[0] is not None
        self.assertEqual(
            subtopic_pages[0].to_dict(), self.subtopic_page.to_dict())
        subtopic_ids = [2]
        subtopic_pages = subtopic_page_services.get_subtopic_pages_with_ids(
            self.TOPIC_ID, subtopic_ids)
        self.assertEqual(subtopic_pages, [None])
        subtopic_ids = [self.subtopic_id, 2]
        subtopic_pages = subtopic_page_services.get_subtopic_pages_with_ids(
            self.TOPIC_ID, subtopic_ids)
        expected_subtopic_pages = [self.subtopic_page.to_dict(), None]
        # Ruling out the possibility of None for mypy type checking.
        assert subtopic_pages[0] is not None
        self.assertEqual(
            [subtopic_pages[0].to_dict(), subtopic_pages[1]],
            expected_subtopic_pages)
        subtopic_ids = []
        subtopic_pages = subtopic_page_services.get_subtopic_pages_with_ids(
            self.TOPIC_ID, subtopic_ids)
        self.assertEqual(subtopic_pages, [])
        subtopic_ids = [2, 2]
        subtopic_pages = subtopic_page_services.get_subtopic_pages_with_ids(
            self.TOPIC_ID, subtopic_ids)
        self.assertEqual(subtopic_pages, [None, None])

    def test_get_subtopic_page_contents_by_id(self) -> None:
        self.subtopic_page = subtopic_page_services.get_subtopic_page_by_id(
            self.TOPIC_ID, 1)
        recorded_voiceovers: state_domain.RecordedVoiceoversDict = {
            'voiceovers_mapping': {
                'content': {
                    'en': {
                        'filename': 'test.mp3',
                        'file_size_bytes': 100,
                        'needs_update': False,
                        'duration_secs': 7.213
                    }
                }
            }
        }
        expected_page_contents_dict = {
            'subtitled_html': {
                'content_id': 'content', 'html': '<p>hello world</p>'
            },
            'recorded_voiceovers': recorded_voiceovers,
            'written_translations': {
                'translations_mapping': {
                    'content': {}
                }
            }
        }
        self.subtopic_page.update_page_contents_html(
            state_domain.SubtitledHtml.from_dict({
                'html': '<p>hello world</p>',
                'content_id': 'content'
            }))
        self.subtopic_page.update_page_contents_audio(
            state_domain.RecordedVoiceovers.from_dict(recorded_voiceovers))
        subtopic_page_services.save_subtopic_page(
            self.user_id, self.subtopic_page, 'Updated page contents',
            [subtopic_page_domain.SubtopicPageChange({
                'cmd': subtopic_page_domain.CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY,
                'subtopic_id': 1,
                'property_name': 'page_contents_html',
                'new_value': 'a',
                'old_value': 'b'
            })])
        subtopic_page_contents = (
            subtopic_page_services.get_subtopic_page_contents_by_id(
                self.TOPIC_ID, 1))
        self.assertEqual(
            subtopic_page_contents.to_dict(), expected_page_contents_dict)
        subtopic_page_content = (
            subtopic_page_services.get_subtopic_page_contents_by_id(
                self.TOPIC_ID, 2, strict=False))
        self.assertEqual(subtopic_page_content, None)

    def test_save_subtopic_page(self) -> None:
        subtopic_page_1 = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                1, 'topic_id_1'))
        subtopic_page_services.save_subtopic_page(
            self.user_id, subtopic_page_1, 'Added subtopic',
            [topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'subtopic_id': 1,
                'title': 'Sample',
                'url_fragment': 'sample-fragment-one'
            })])
        with self.assertRaisesRegex(
            Exception, 'Unexpected error: received an invalid change list *'):
            subtopic_page_services.save_subtopic_page(
                self.user_id, subtopic_page_1, 'Added subtopic', [])
        subtopic_page_id_1 = (
            subtopic_page_domain.SubtopicPage.get_subtopic_page_id(
                'topic_id_1', 1))
        subtopic_page_model_1 = subtopic_models.SubtopicPageModel.get(
            subtopic_page_id_1)
        subtopic_page_1.version = 2
        subtopic_page_model_1.version = 3
        with self.assertRaisesRegex(Exception, 'Trying to update version *'):
            subtopic_page_services.save_subtopic_page(
                self.user_id, subtopic_page_1, 'Added subtopic',
                [topic_domain.TopicChange({
                    'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                    'subtopic_id': 1,
                    'title': 'Sample',
                    'url_fragment': 'fragment'
                })])
        subtopic_page_1.version = 3
        subtopic_page_model_1.version = 2
        with self.assertRaisesRegex(
            Exception, 'Unexpected error: trying to update version *'):
            subtopic_page_services.save_subtopic_page(
                self.user_id, subtopic_page_1, 'Added subtopic',
                [topic_domain.TopicChange({
                    'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                    'subtopic_id': 1,
                    'title': 'Sample',
                    'url_fragment': 'sample-frag'
                })])

    def test_commit_log_entry(self) -> None:
        subtopic_page_commit_log_entry = (
            subtopic_models.SubtopicPageCommitLogEntryModel.get_commit(
                self.subtopic_page_id, 1)
        )
        # Ruling out the possibility of None for mypy type checking.
        assert subtopic_page_commit_log_entry is not None
        self.assertEqual(subtopic_page_commit_log_entry.commit_type, 'create')
        self.assertEqual(
            subtopic_page_commit_log_entry.subtopic_page_id,
            self.subtopic_page_id)
        self.assertEqual(subtopic_page_commit_log_entry.user_id, self.user_id)

    def test_delete_subtopic_page(self) -> None:
        subtopic_page_id = (
            subtopic_page_domain.SubtopicPage.get_subtopic_page_id(
                self.TOPIC_ID, 1))
        subtopic_page_services.delete_subtopic_page(
            self.user_id, self.TOPIC_ID, 1)
        with self.assertRaisesRegex(
            base_models.BaseModel.EntityNotFoundError,
            re.escape(
                'Entity for class SubtopicPageModel with id %s not found' % (
                    subtopic_page_id))):
            subtopic_models.SubtopicPageModel.get(subtopic_page_id)
        with self.assertRaisesRegex(
            base_models.BaseModel.EntityNotFoundError,
            re.escape(
                'Entity for class SubtopicPageModel with id %s not found' % (
                    subtopic_page_id))):
            subtopic_page_services.delete_subtopic_page(
                self.user_id, self.TOPIC_ID, 1)

    def test_migrate_page_contents_from_v1_to_v2_schema(self) -> None:
        current_schema_version_swap = self.swap(
            feconf, 'CURRENT_SUBTOPIC_PAGE_CONTENTS_SCHEMA_VERSION', 2)
        html_content = (
            '<p>Value</p><oppia-noninteractive-math raw_latex-with-value="&a'
            'mp;quot;+,-,-,+&amp;quot;" svg_filename-with-value="&a'
            'mp;quot;abc.svg&amp;quot;"></oppia-noninteractive-math>')
        expected_html_content = (
            '<p>Value</p><oppia-noninteractive-math math_content-with-value='
            '"{&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+&amp;quot;, &'
            'amp;quot;svg_filename&amp;quot;: &amp;quot;abc.svg&amp;quot;}">'
            '</oppia-noninteractive-math>')
        written_translations_dict = {
            'translations_mapping': {
                'content1': {
                    'en': {
                        'data_format': 'html',
                        'translation': html_content,
                        'needs_update': True
                    },
                    'hi': {
                        'data_format': 'html',
                        'translation': 'Hey!',
                        'needs_update': False
                    }
                },
                'feedback_1': {
                    'hi': {
                        'data_format': 'html',
                        'translation': 'Testing!',
                        'needs_update': False
                    },
                    'en': {
                        'data_format': 'html',
                        'translation': 'hello!',
                        'needs_update': False
                    }
                }
            }
        }
        written_translations_dict_math = {
            'translations_mapping': {
                'content1': {
                    'en': {
                        'data_format': 'html',
                        'translation': expected_html_content,
                        'needs_update': True
                    },
                    'hi': {
                        'data_format': 'html',
                        'translation': 'Hey!',
                        'needs_update': False
                    }
                },
                'feedback_1': {
                    'hi': {
                        'data_format': 'html',
                        'translation': 'Testing!',
                        'needs_update': False
                    },
                    'en': {
                        'data_format': 'html',
                        'translation': 'hello!',
                        'needs_update': False
                    }
                }
            }
        }
        recorded_voiceovers = {
            'voiceovers_mapping': {
                'content': {
                    'en': {
                        'filename': 'test.mp3',
                        'file_size_bytes': 100,
                        'needs_update': False,
                        'duration_secs': 7.213
                    }
                }
            }
        }
        page_contents_dict = {
            'subtitled_html': {
                'content_id': 'content', 'html': html_content
            },
            'recorded_voiceovers': recorded_voiceovers,
            'written_translations': written_translations_dict
        }
        expected_page_contents_dict = {
            'subtitled_html': {
                'content_id': 'content', 'html': expected_html_content
            },
            'recorded_voiceovers': recorded_voiceovers,
            'written_translations': written_translations_dict_math
        }

        subtopic_page_id = subtopic_models.SubtopicPageModel.get_new_id('')
        subtopic_page_model = subtopic_models.SubtopicPageModel(
            id=subtopic_page_id,
            topic_id=self.TOPIC_ID,
            page_contents=page_contents_dict,
            page_contents_schema_version=1,
            language_code='en'
        )
        self.assertEqual(subtopic_page_model.page_contents_schema_version, 1)

        with current_schema_version_swap:
            subtopic_page = subtopic_page_services.get_subtopic_page_from_model(
                subtopic_page_model)

        self.assertEqual(subtopic_page.page_contents_schema_version, 2)
        self.assertEqual(
            subtopic_page.page_contents.to_dict(), expected_page_contents_dict)

    def test_migrate_page_contents_from_v2_to_v3_schema(self) -> None:
        current_schema_version_swap = self.swap(
            feconf, 'CURRENT_SUBTOPIC_PAGE_CONTENTS_SCHEMA_VERSION', 3)
        html_content = (
            '<oppia-noninteractive-svgdiagram '
            'svg_filename-with-value="&quot;img1.svg&quot;"'
            ' alt-with-value="&quot;Image&quot;">'
            '</oppia-noninteractive-svgdiagram>'
        )
        expected_html_content = (
            '<oppia-noninteractive-image alt-with-value=\'\"Image\"\''
            ' caption-with-value="&amp;quot;&amp;quot;" '
            'filepath-with-value=\'\"img1.svg\"\'>'
            '</oppia-noninteractive-image>')
        written_translations_dict = {
            'translations_mapping': {
                'content1': {
                    'en': {
                        'data_format': 'html',
                        'translation': html_content,
                        'needs_update': True
                    },
                    'hi': {
                        'data_format': 'html',
                        'translation': 'Hey!',
                        'needs_update': False
                    }
                },
                'feedback_1': {
                    'hi': {
                        'data_format': 'html',
                        'translation': 'Testing!',
                        'needs_update': False
                    },
                    'en': {
                        'data_format': 'html',
                        'translation': 'hello!',
                        'needs_update': False
                    }
                }
            }
        }
        written_translations_dict_math = {
            'translations_mapping': {
                'content1': {
                    'en': {
                        'data_format': 'html',
                        'translation': expected_html_content,
                        'needs_update': True
                    },
                    'hi': {
                        'data_format': 'html',
                        'translation': 'Hey!',
                        'needs_update': False
                    }
                },
                'feedback_1': {
                    'hi': {
                        'data_format': 'html',
                        'translation': 'Testing!',
                        'needs_update': False
                    },
                    'en': {
                        'data_format': 'html',
                        'translation': 'hello!',
                        'needs_update': False
                    }
                }
            }
        }
        recorded_voiceovers = {
            'voiceovers_mapping': {
                'content': {
                    'en': {
                        'filename': 'test.mp3',
                        'file_size_bytes': 100,
                        'needs_update': False,
                        'duration_secs': 7.213
                    }
                }
            }
        }
        page_contents_dict = {
            'subtitled_html': {
                'content_id': 'content', 'html': html_content
            },
            'recorded_voiceovers': recorded_voiceovers,
            'written_translations': written_translations_dict
        }
        expected_page_contents_dict = {
            'subtitled_html': {
                'content_id': 'content', 'html': expected_html_content
            },
            'recorded_voiceovers': recorded_voiceovers,
            'written_translations': written_translations_dict_math
        }

        subtopic_page_id = subtopic_models.SubtopicPageModel.get_new_id('')
        subtopic_page_model = subtopic_models.SubtopicPageModel(
            id=subtopic_page_id,
            topic_id=self.TOPIC_ID,
            page_contents=page_contents_dict,
            page_contents_schema_version=2,
            language_code='en'
        )
        self.assertEqual(subtopic_page_model.page_contents_schema_version, 2)

        with current_schema_version_swap:
            subtopic_page = subtopic_page_services.get_subtopic_page_from_model(
                subtopic_page_model)

        self.assertEqual(subtopic_page.page_contents_schema_version, 3)
        self.assertEqual(
            subtopic_page.page_contents.to_dict(), expected_page_contents_dict)

    def test_migrate_page_contents_from_v3_to_v4_schema(self) -> None:
        current_schema_version_swap = self.swap(
            feconf, 'CURRENT_SUBTOPIC_PAGE_CONTENTS_SCHEMA_VERSION', 4)
        expected_html_content = (
            '<p>1 × 3 😕 😊</p>'
        )
        html_content = (
            '<p>1 Ã— 3 ðŸ˜• ðŸ˜Š</p>'
        )
        written_translations_dict = {
            'translations_mapping': {
                'content1': {
                    'en': {
                        'data_format': 'html',
                        'translation': html_content,
                        'needs_update': True
                    },
                    'hi': {
                        'data_format': 'html',
                        'translation': 'Hey!',
                        'needs_update': False
                    }
                },
                'feedback_1': {
                    'hi': {
                        'data_format': 'html',
                        'translation': 'Testing!',
                        'needs_update': False
                    },
                    'en': {
                        'data_format': 'html',
                        'translation': 'hello!',
                        'needs_update': False
                    }
                }
            }
        }
        written_translations_dict_math = {
            'translations_mapping': {
                'content1': {
                    'en': {
                        'data_format': 'html',
                        'translation': expected_html_content,
                        'needs_update': True
                    },
                    'hi': {
                        'data_format': 'html',
                        'translation': 'Hey!',
                        'needs_update': False
                    }
                },
                'feedback_1': {
                    'hi': {
                        'data_format': 'html',
                        'translation': 'Testing!',
                        'needs_update': False
                    },
                    'en': {
                        'data_format': 'html',
                        'translation': 'hello!',
                        'needs_update': False
                    }
                }
            }
        }
        recorded_voiceovers = {
            'voiceovers_mapping': {
                'content': {
                    'en': {
                        'filename': 'test.mp3',
                        'file_size_bytes': 100,
                        'needs_update': False,
                        'duration_secs': 7.213
                    }
                }
            }
        }
        page_contents_dict = {
            'subtitled_html': {
                'content_id': 'content', 'html': html_content
            },
            'recorded_voiceovers': recorded_voiceovers,
            'written_translations': written_translations_dict
        }
        expected_page_contents_dict = {
            'subtitled_html': {
                'content_id': 'content', 'html': expected_html_content
            },
            'recorded_voiceovers': recorded_voiceovers,
            'written_translations': written_translations_dict_math
        }

        subtopic_page_id = subtopic_models.SubtopicPageModel.get_new_id('')
        subtopic_page_model = subtopic_models.SubtopicPageModel(
            id=subtopic_page_id,
            topic_id=self.TOPIC_ID,
            page_contents=page_contents_dict,
            page_contents_schema_version=3,
            language_code='en'
        )
        self.assertEqual(subtopic_page_model.page_contents_schema_version, 3)

        with current_schema_version_swap:
            subtopic_page = subtopic_page_services.get_subtopic_page_from_model(
                subtopic_page_model)

        self.assertEqual(subtopic_page.page_contents_schema_version, 4)
        self.assertEqual(
            subtopic_page.page_contents.to_dict(), expected_page_contents_dict)

    def test_cannot_migrate_page_contents_to_latest_schema_with_invalid_version(
        self
    ) -> None:
        current_schema_version_swap = self.swap(
            feconf, 'CURRENT_SUBTOPIC_PAGE_CONTENTS_SCHEMA_VERSION', 2)
        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception,
            'Sorry, we can only process v1-v2 page schemas at present.')

        subtopic_page_model = subtopic_models.SubtopicPageModel.get(
            self.subtopic_page_id)
        subtopic_page_model.page_contents_schema_version = 0
        subtopic_page_model.commit(self.user_id, '', [])

        with current_schema_version_swap, (
            assert_raises_regexp_context_manager):
            subtopic_page_services.get_subtopic_page_from_model(
                subtopic_page_model)

    def test_get_topic_ids_from_subtopic_page_ids(self) -> None:
        topic_ids = (
            subtopic_page_services.get_topic_ids_from_subtopic_page_ids(
                ['topic1:subtopic1', 'topic2:subtopic2', 'topic1:subtopic3']
            )
        )

        self.assertEqual(topic_ids, ['topic1', 'topic2'])

    def test_get_multi_users_subtopic_pages_progress(self) -> None:
        degree_of_mastery = 0.5
        learner_id_1 = 'learner_1'
        learner_id_2 = 'learner_2'

        # Add some subtopic progress for the learner.
        skill_services.create_user_skill_mastery(
            learner_id_1, 'skill_id_1', degree_of_mastery
        )

        subtopic_page_id = '{}:{}'.format(self.TOPIC_ID_1, 1)
        progress = (
            subtopic_page_services.get_multi_users_subtopic_pages_progress(
                [learner_id_1, learner_id_2], [subtopic_page_id]
            )
        )

        learner_1_progress = progress[learner_id_1]
        learner_2_progress = progress[learner_id_2]

        self.assertEqual(len(learner_1_progress), 1)
        self.assertEqual(len(learner_2_progress), 1)
        self.assertEqual(learner_1_progress[0]['subtopic_id'], 1)
        self.assertEqual(
            learner_1_progress[0]['subtopic_title'], 'Naming Numbers'
        )
        self.assertEqual(
            learner_1_progress[0]['parent_topic_id'], self.TOPIC_ID_1
        )
        self.assertEqual(
            learner_1_progress[0]['parent_topic_name'], 'Place Values'
        )
        self.assertEqual(
            learner_1_progress[0]['subtopic_mastery'], degree_of_mastery
        )
        self.assertIsNone(learner_2_progress[0]['subtopic_mastery'])

    def test_get_learner_group_syllabus_subtopic_page_summaries(self) -> None:
        subtopic_page_id = '{}:{}'.format(self.TOPIC_ID_1, 1)
        expected_summaries = [{
            'subtopic_id': 1,
            'subtopic_title': 'Naming Numbers',
            'parent_topic_id': self.TOPIC_ID_1,
            'parent_topic_name': 'Place Values',
            'thumbnail_filename': 'image.svg',
            'thumbnail_bg_color':
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0],
            'subtopic_mastery': None
        }]
        summaries = (
            subtopic_page_services
                .get_learner_group_syllabus_subtopic_page_summaries(
                    [subtopic_page_id]))
        self.assertEqual(summaries, expected_summaries)
