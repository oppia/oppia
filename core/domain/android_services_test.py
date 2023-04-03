# coding: utf-8
#
# Copyright 2023 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for core.domain.android_services."""

from __future__ import annotations

import logging
import os

from core import feconf
from core.domain import android_services
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import skill_fetchers
from core.domain import story_fetchers
from core.domain import topic_fetchers
from core.domain import topic_services
from core.platform import models
from core.tests import test_utils

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import secrets_services
    from mypy_imports import translation_models

secrets_services = models.Registry.import_secrets_services()

(translation_models,) = models.Registry.import_models([
    models.Names.TRANSLATION])


class InitializeAndroidTestDataTests(test_utils.GenericTestBase):
    """Tests for the initialize_android_test_data."""

    def test_initialize_topic_is_published(self) -> None:
        android_services.initialize_android_test_data()
        self.assertTrue(
            topic_services.does_topic_with_name_exist('Android test'))
        topic = topic_fetchers.get_topic_by_name('Android test', strict=True)
        topic_rights = topic_fetchers.get_topic_rights(topic.id, strict=True)

        self.assertTrue(topic_rights.topic_is_published)

    def test_initialize_structures_are_valid(self) -> None:
        android_services.initialize_android_test_data()
        exp_id = '26'
        topic = topic_fetchers.get_topic_by_name('Android test', strict=True)
        exploration = exp_fetchers.get_exploration_by_id(exp_id)
        story = story_fetchers.get_story_by_url_fragment(
            'android-end-to-end-testing')
        assert story is not None
        skill = skill_fetchers.get_skill_by_description(
            'Dummy Skill for Android')
        assert skill is not None
        skill.validate()
        story.validate()
        topic.validate(strict=True)
        exploration.validate(strict=True)
        for node in story.story_contents.nodes:
            self.assertEqual(node.exploration_id, exp_id)

    def test_initialize_structure_thumbnails_exist(self) -> None:
        # To validate the thumbnails for topics ans stories can be fetched
        # using AssetsDevHandler.
        android_services.initialize_android_test_data()
        topic = topic_fetchers.get_topic_by_name('Android test', strict=True)
        story = story_fetchers.get_story_by_url_fragment(
            'android-end-to-end-testing')
        assert story is not None
        self.get_custom_response(
            '/assetsdevhandler/topic/%s/assets/thumbnail/test_svg.svg' %
            topic.id, 'image/svg+xml'
        )
        self.get_custom_response(
            '/assetsdevhandler/story/%s/assets/thumbnail/test_svg.svg' %
            story.id, 'image/svg+xml'
        )

    def test_exploration_assets_are_loaded(self) -> None:
        android_services.initialize_android_test_data()
        filelist = os.listdir(
            os.path.join(
                'data',
                'explorations',
                'android_interactions',
                'assets',
                'image'
            )
        )
        for filename in filelist:
            self.get_custom_response(
                '/assetsdevhandler/exploration/26/assets/image/%s' % filename,
                'image/png'
            )

    def test_reinitialize_topic_is_published(self) -> None:
        android_services.initialize_android_test_data()
        old_topic = topic_fetchers.get_topic_by_name(
            'Android test', strict=True)
        old_topic_last_updated = old_topic.last_updated

        android_services.initialize_android_test_data()
        self.assertTrue(
            topic_services.does_topic_with_name_exist('Android test'))
        new_topic = topic_fetchers.get_topic_by_name(
            'Android test', strict=True)
        new_topic_rights = topic_fetchers.get_topic_rights(
            new_topic.id, strict=True)
        self.assertTrue(new_topic_rights.topic_is_published)

        self.assertGreater(new_topic.last_updated, old_topic_last_updated)

    def test_reinitialize_topic_is_published_when_exploration_does_not_exist(
        self
    ) -> None:
        android_services.initialize_android_test_data()

        exp_services.delete_exploration('committer', '26')
        android_services.initialize_android_test_data()
        self.assertTrue(
            topic_services.does_topic_with_name_exist('Android test'))
        new_topic = topic_fetchers.get_topic_by_name(
            'Android test', strict=True)
        new_topic_rights = topic_fetchers.get_topic_rights(
            new_topic.id, strict=True)
        self.assertTrue(new_topic_rights.topic_is_published)

    def test_reinitialize_topic_is_published_when_translation_does_not_exist(
            self
    ) -> None:
        android_services.initialize_android_test_data()
        test_exploration = exp_fetchers.get_exploration_by_id('26', strict=True)
        entity_translation_model = (
            translation_models.EntityTranslationsModel.get_model(
                feconf.TranslatableEntityType(feconf.ENTITY_TYPE_EXPLORATION),
                '26',
                test_exploration.version,
                'pt'
            )
        )
        if entity_translation_model:
            entity_translation_model.delete()
        android_services.initialize_android_test_data()
        self.assertTrue(
            topic_services.does_topic_with_name_exist('Android test'))
        new_topic = topic_fetchers.get_topic_by_name(
            'Android test', strict=True)
        new_topic_rights = topic_fetchers.get_topic_rights(
            new_topic.id, strict=True)
        self.assertTrue(new_topic_rights.topic_is_published)


class AndroidBuildSecretTests(test_utils.GenericTestBase):
    """Tests for the verify_android_build_secret."""

    def setUp(self) -> None:
        super().setUp()
        self.swap_webhook_secrets_return_none = self.swap_to_always_return(
            secrets_services, 'get_secret', None)
        self.swap_webhook_secrets_return_secret = self.swap_with_checks(
            secrets_services,
            'get_secret',
            lambda _: 'secret',
            expected_args=[
                ('ANDROID_BUILD_SECRET',),
                ('ANDROID_BUILD_SECRET',),
            ]
        )

    def test_cloud_secrets_return_none_logs_exception(self) -> None:
        with self.swap_webhook_secrets_return_none:
            with self.capture_logging(min_level=logging.WARNING) as logs:
                self.assertFalse(
                    android_services.verify_android_build_secret('secret'))
                self.assertEqual(
                    ['Android build secret is not available.'], logs
                )

    def test_cloud_secrets_return_secret_passes(self) -> None:
        with self.swap_webhook_secrets_return_secret:
            self.assertTrue(
                android_services.verify_android_build_secret('secret'))
            self.assertFalse(
                android_services.verify_android_build_secret('not-secret'))
