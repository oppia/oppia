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

"""Tests for the blog dashboard page."""

from __future__ import annotations

import os

from core import feconf
from core import utils
from core.constants import constants
from core.domain import blog_services
from core.platform import models
from core.tests import test_utils

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import user_models

(user_models,) = models.Registry.import_models([models.Names.USER])


class BlogDashboardDataHandlerTests(test_utils.GenericTestBase):

    username = 'user'
    user_email = 'user@example.com'

    def setUp(self) -> None:
        """Completes the sign-up process for the various users."""
        super().setUp()
        self.signup(
            self.BLOG_ADMIN_EMAIL, self.BLOG_ADMIN_USERNAME)
        self.signup(
            self.BLOG_EDITOR_EMAIL, self.BLOG_EDITOR_USERNAME)
        self.signup(self.user_email, self.username)
        self.add_user_role(
            self.BLOG_ADMIN_USERNAME, feconf.ROLE_ID_BLOG_ADMIN)
        self.add_user_role(
            self.BLOG_EDITOR_USERNAME,
            feconf.ROLE_ID_BLOG_POST_EDITOR)
        self.blog_admin_id = (
            self.get_user_id_from_email(self.BLOG_ADMIN_EMAIL))
        self.blog_editor_id = (
            self.get_user_id_from_email(self.BLOG_EDITOR_EMAIL))

    def test_get_dashboard_page_data(self) -> None:
        # Checks blog editor can access blog dashboard.
        self.login(self.BLOG_EDITOR_EMAIL)
        json_response = self.get_json(
            '%s' % (feconf.BLOG_DASHBOARD_DATA_URL),
            )
        self.assertEqual(
            self.BLOG_EDITOR_USERNAME,
            json_response['author_details']['displayed_author_name']
        )
        self.assertEqual(json_response['published_blog_post_summary_dicts'], [])
        self.assertEqual(json_response['draft_blog_post_summary_dicts'], [])
        self.logout()

        # Checks blog admin can access blog dashboard.
        self.login(self.BLOG_ADMIN_EMAIL)
        json_response = self.get_json(
            '%s' % (feconf.BLOG_DASHBOARD_DATA_URL),
            )
        self.assertEqual(self.BLOG_ADMIN_USERNAME, json_response['username'])
        self.assertEqual(json_response['published_blog_post_summary_dicts'], [])
        self.assertEqual(json_response['draft_blog_post_summary_dicts'], [])
        self.logout()

        # Checks non blog-admins and non-editors can not access blog dashboard.
        self.login(self.user_email)
        json_response = self.get_json(
            '%s' % (feconf.BLOG_DASHBOARD_DATA_URL), expected_status_int=401)
        self.logout()

        # Checks for correct published and draft blog post summary data.
        blog_post = blog_services.create_new_blog_post(self.blog_editor_id)
        change_dict: blog_services.BlogPostChangeDict = {
            'title': 'Sample Title',
            'thumbnail_filename': 'thumbnail.svg',
            'content': '<p>Hello Bloggers<p>',
            'tags': ['Newsletter', 'Learners']
        }
        self.login(self.BLOG_EDITOR_EMAIL)
        json_response = self.get_json(
            '%s' % (feconf.BLOG_DASHBOARD_DATA_URL))
        self.assertEqual(self.BLOG_EDITOR_USERNAME, json_response['username'])
        self.assertEqual(
            blog_post.id,
            json_response['draft_blog_post_summary_dicts'][0]['id'])

        blog_services.update_blog_post(blog_post.id, change_dict)
        blog_services.publish_blog_post(blog_post.id)
        json_response = self.get_json(
            '%s' % (feconf.BLOG_DASHBOARD_DATA_URL))
        self.assertEqual(self.BLOG_EDITOR_USERNAME, json_response['username'])
        self.assertEqual(
            blog_post.id,
            json_response['published_blog_post_summary_dicts'][0]['id'])
        self.assertEqual(
            change_dict['title'],
            json_response['published_blog_post_summary_dicts'][0]['title'])
        self.assertEqual(json_response['draft_blog_post_summary_dicts'], [])

    def test_create_new_blog_post(self) -> None:
        # Checks blog editor can create a new blog post.
        self.login(self.BLOG_EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()
        json_response = self.post_json(
            '%s' % (feconf.BLOG_DASHBOARD_DATA_URL), {}, csrf_token=csrf_token)
        blog_post_id = json_response['blog_post_id']
        blog_post_rights = blog_services.get_blog_post_rights(blog_post_id)
        self.assertEqual(blog_post_rights.editor_ids, [self.blog_editor_id])
        self.logout()

        # Checks non blog-admins and non editors cannot create a new blog post.
        self.login(self.user_email)
        json_response = self.post_json(
            '%s' % (feconf.BLOG_DASHBOARD_DATA_URL), {},
            csrf_token=csrf_token, expected_status_int=401)
        self.logout()

    def test_put_author_data(self) -> None:
        self.login(self.BLOG_EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()
        payload = {
            'displayed_author_name': 'new user name',
            'author_bio': 'general oppia user and blog post author'
        }

        pre_update_author_details = blog_services.get_blog_author_details(
            self.blog_editor_id).to_dict()
        self.assertEqual(
            pre_update_author_details['displayed_author_name'],
            self.BLOG_EDITOR_USERNAME
        )
        self.assertEqual(pre_update_author_details['author_bio'], '')

        json_response = self.put_json(
            '%s' % (feconf.BLOG_DASHBOARD_DATA_URL),
            payload, csrf_token=csrf_token)

        self.assertEqual(
            json_response['author_details']['displayed_author_name'],
            'new user name'
        )
        self.assertEqual(
            json_response['author_details']['author_bio'],
            'general oppia user and blog post author'
        )

        self.logout()

    def test_put_author_details_with_invalid_author_name(self) -> None:
        self.login(self.BLOG_EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()
        payload = {
            'displayed_author_name': 1234,
            'author_bio': 'general oppia user and blog post author'
        }
        pre_update_author_details = blog_services.get_blog_author_details(
            self.blog_editor_id).to_dict()
        self.assertEqual(
            pre_update_author_details['displayed_author_name'],
            self.BLOG_EDITOR_USERNAME
        )

        self.put_json(
            '%s' % (feconf.BLOG_DASHBOARD_DATA_URL),
            payload, csrf_token=csrf_token,
            expected_status_int=400)

    def test_put_author_details_with_invalid_author_bio(self) -> None:
        self.login(self.BLOG_EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()
        payload = {
            'displayed_author_name': 'new user',
            'author_bio': 1234
        }
        pre_update_author_details = blog_services.get_blog_author_details(
            self.blog_editor_id).to_dict()
        self.assertEqual(pre_update_author_details['author_bio'], '')

        self.put_json(
            '%s' % (feconf.BLOG_DASHBOARD_DATA_URL),
            payload, csrf_token=csrf_token,
            expected_status_int=400)


class BlogPostHandlerTests(test_utils.GenericTestBase):

    username = 'user'
    user_email = 'user@example.com'

    def setUp(self) -> None:
        """Completes the sign-up process for the various users."""
        super().setUp()
        self.signup(
            self.BLOG_ADMIN_EMAIL, self.BLOG_ADMIN_USERNAME)
        self.signup(
            self.BLOG_EDITOR_EMAIL, self.BLOG_EDITOR_USERNAME)
        self.signup(self.user_email, self.username)
        self.add_user_role(
            self.BLOG_ADMIN_USERNAME, feconf.ROLE_ID_BLOG_ADMIN)
        self.add_user_role(
            self.BLOG_EDITOR_USERNAME,
            feconf.ROLE_ID_BLOG_POST_EDITOR)
        self.blog_admin_id = (
            self.get_user_id_from_email(self.BLOG_ADMIN_EMAIL))
        self.blog_editor_id = (
            self.get_user_id_from_email(self.BLOG_EDITOR_EMAIL))
        self.blog_post = (
            blog_services.create_new_blog_post(self.blog_editor_id))

    def test_get_blog_post_editor_page_data(self) -> None:
        # Checks blog editor can access blog post editor.
        self.login(self.BLOG_EDITOR_EMAIL)
        json_response = self.get_json(
            '%s/%s' % (feconf.BLOG_EDITOR_DATA_URL_PREFIX, self.blog_post.id),
            )
        self.assertEqual(self.BLOG_EDITOR_USERNAME, json_response['username'])
        assert self.blog_post.last_updated is not None
        expected_blog_post_dict = {
            'id': u'%s' % self.blog_post.id,
            'displayed_author_name': self.BLOG_EDITOR_USERNAME,
            'title': '',
            'content': '',
            'tags': [],
            'thumbnail_filename': None,
            'url_fragment': '',
            'published_on': None,
            'last_updated': u'%s' % utils.convert_naive_datetime_to_string(
                self.blog_post.last_updated)
        }
        self.assertEqual(
            expected_blog_post_dict, json_response['blog_post_dict'])
        self.assertEqual(10, json_response['max_no_of_tags'])
        self.logout()

        # Checks blog admin can access blog post editor for a given blog post.
        self.login(self.BLOG_ADMIN_EMAIL)
        json_response = self.get_json(
            '%s/%s' % (feconf.BLOG_EDITOR_DATA_URL_PREFIX, self.blog_post.id),
            )
        self.assertEqual(
            self.BLOG_EDITOR_USERNAME, json_response['displayed_author_name'])
        expected_blog_post_dict = {
            'id': u'%s' % self.blog_post.id,
            'displayed_author_name': self.BLOG_EDITOR_USERNAME,
            'title': '',
            'content': '',
            'tags': [],
            'thumbnail_filename': None,
            'url_fragment': '',
            'published_on': None,
            'last_updated': u'%s' % utils.convert_naive_datetime_to_string(
                self.blog_post.last_updated)
        }
        self.assertEqual(
            expected_blog_post_dict, json_response['blog_post_dict'])
        self.assertEqual(10, json_response['max_no_of_tags'])
        self.logout()

        # Checks non blog-admins and non-editors can not access blog editor.
        self.login(self.user_email)
        json_response = self.get_json(
            '%s/%s' % (feconf.BLOG_EDITOR_DATA_URL_PREFIX, self.blog_post.id),
            expected_status_int=401)
        self.logout()

        self.set_curriculum_admins([self.username])
        self.login(self.user_email)
        json_response = self.get_json(
            '%s/%s' % (feconf.BLOG_EDITOR_DATA_URL_PREFIX, self.blog_post.id),
            expected_status_int=401)
        self.logout()

    def test_get_blog_post_data_by_invalid_blog_post_id(self) -> None:
        self.login(self.BLOG_EDITOR_EMAIL)
        # ID fails minimum length validation.
        self.get_json(
            '%s/%s' % (feconf.BLOG_EDITOR_DATA_URL_PREFIX, '123'),
            expected_status_int=400)

        # ID fails maximum length validation.
        self.get_json(
            '%s/%s' % (
                feconf.BLOG_EDITOR_DATA_URL_PREFIX,
                '123' * constants.BLOG_POST_ID_LENGTH
            ),
            expected_status_int=400)

        blog_services.delete_blog_post(self.blog_post.id)
        self.get_json(
            '%s/%s' % (feconf.BLOG_EDITOR_DATA_URL_PREFIX, self.blog_post.id),
            expected_status_int=404)

        self.logout()

    def test_get_blog_post_data_with_author_account_deleted_by_blog_admin(
        self
    ) -> None:
        blog_services.create_blog_author_details_model(self.blog_editor_id)
        blog_services.update_blog_author_details(
            self.blog_editor_id, 'new author name', 'general user bio')
        # Deleting user setting model.
        blog_editor_model = (
            user_models.UserSettingsModel.get_by_id(self.blog_editor_id))
        blog_editor_model.deleted = True
        blog_editor_model.update_timestamps()
        blog_editor_model.put()

        self.login(self.BLOG_ADMIN_EMAIL)
        json_response = self.get_json(
            '%s/%s' % (feconf.BLOG_EDITOR_DATA_URL_PREFIX, self.blog_post.id),
            )
        self.assertEqual(
            'new author name', json_response['displayed_author_name'])
        assert self.blog_post.last_updated is not None
        expected_blog_post_dict = {
            'id': u'%s' % self.blog_post.id,
            'displayed_author_name': 'new author name',
            'title': '',
            'content': '',
            'tags': [],
            'thumbnail_filename': None,
            'url_fragment': '',
            'published_on': None,
            'last_updated': u'%s' % utils.convert_naive_datetime_to_string(
                self.blog_post.last_updated)
        }
        self.assertEqual(
            expected_blog_post_dict, json_response['blog_post_dict']
        )
        self.assertEqual(10, json_response['max_no_of_tags'])
        self.logout()

    def test_put_blog_post_data(self) -> None:
        # Checks blog editor can edit owned blog post.
        self.login(self.BLOG_EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()
        payload = {
            'change_dict': {
                'title': 'Sample Title',
                'content': '<p>Hello<p>',
                'tags': ['New lessons', 'Learners'],
                'thumbnail_filename': 'file.svg'
            },
            'new_publish_status': False
        }

        json_response = self.put_json(
            '%s/%s' % (feconf.BLOG_EDITOR_DATA_URL_PREFIX, self.blog_post.id),
            payload, csrf_token=csrf_token)

        self.assertEqual(
            json_response['blog_post']['title'], 'Sample Title')
        blog_post = (
            blog_services.get_blog_post_by_id(self.blog_post.id))
        self.assertEqual(
            blog_post.thumbnail_filename, 'file.svg')

        self.logout()

    def test_put_blog_post_data_by_invalid_blog_post_id(self) -> None:
        self.login(self.BLOG_EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()
        payload = {
            'change_dict': {
                'title': 'Sample Title',
            },
            'new_publish_status': False
        }

        self.put_json(
            '%s/%s' % (feconf.BLOG_EDITOR_DATA_URL_PREFIX, 123),
            payload, csrf_token=csrf_token,
            expected_status_int=400
        )

        blog_services.delete_blog_post(self.blog_post.id)
        csrf_token = self.get_new_csrf_token()
        # This is raised by acl decorator.
        self.put_json(
            '%s/%s' % (feconf.BLOG_EDITOR_DATA_URL_PREFIX, self.blog_post.id),
            payload, csrf_token=csrf_token, expected_status_int=404
        )

    def test_update_blog_post_with_invalid_change_dict(self) -> None:
        self.login(self.BLOG_EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()
        payload = {
            'change_dict': {
                'title': 1234,
            },
            'new_publish_status': False
        }
        response = self.put_json(
            '%s/%s' % (feconf.BLOG_EDITOR_DATA_URL_PREFIX, self.blog_post.id),
            payload, csrf_token=csrf_token, expected_status_int=400)
        self.assertEqual(
            response['error'], 'Schema validation for \'change_dict\''
            ' failed: Title should be a string.')

    def test_publishing_unpublishing_blog_post(self) -> None:
        self.login(self.BLOG_EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()
        payload = {
            'change_dict': {
                'title': 'Sample Title',
                'content': '<p>Hello<p>',
                'tags': ['New lessons', 'Learners'],
                'thumbnail_filename': 'file.svg'
            },
            'new_publish_status': True
        }

        self.put_json(
            '%s/%s' % (feconf.BLOG_EDITOR_DATA_URL_PREFIX, self.blog_post.id),
            payload, csrf_token=csrf_token)
        blog_post_rights = blog_services.get_blog_post_rights(self.blog_post.id)
        self.assertTrue(blog_post_rights.blog_post_is_published)

        # Unpublishing blog post.
        csrf_token = self.get_new_csrf_token()
        payload = {
            'change_dict': {},
            'new_publish_status': False
        }
        self.put_json(
            '%s/%s' % (feconf.BLOG_EDITOR_DATA_URL_PREFIX, self.blog_post.id),
            payload, csrf_token=csrf_token)
        blog_post_rights = blog_services.get_blog_post_rights(self.blog_post.id)
        self.assertFalse(blog_post_rights.blog_post_is_published)

    def test_uploading_thumbnail_with_valid_image(self) -> None:
        self.login(self.BLOG_EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()
        payload = {
            'thumbnail_filename': 'test_svg.svg'
        }
        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'test_svg.svg'), 'rb',
            encoding=None
        ) as f:
            raw_image = f.read()
        self.post_json(
            '%s/%s' % (feconf.BLOG_EDITOR_DATA_URL_PREFIX, self.blog_post.id),
            payload,
            csrf_token=csrf_token,
            upload_files=[('image', 'unused_filename', raw_image)],
            expected_status_int=200)

        self.logout()

    def test_updating_blog_post_fails_with_invalid_image(self) -> None:
        self.login(self.BLOG_EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()
        payload = {
            'thumbnail_filename': 'cafe.flac'
        }

        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'dummy_large_image.jpg'), 'rb',
            encoding=None
        ) as f:
            raw_image = f.read()

        json_response = self.post_json(
            '%s/%s' % (feconf.BLOG_EDITOR_DATA_URL_PREFIX, self.blog_post.id),
            payload,
            csrf_token=csrf_token,
            upload_files=[('image', 'unused_filename', raw_image)],
            expected_status_int=400)

        self.assertEqual(
            json_response['error'], 'Image exceeds file size limit of 1024 KB.')

    def test_guest_can_not_delete_blog_post(self) -> None:
        response = self.delete_json(
            '%s/%s' % (feconf.BLOG_EDITOR_DATA_URL_PREFIX, self.blog_post.id),
            expected_status_int=401)
        self.assertEqual(
            response['error'],
            'You must be logged in to access this resource.')

    def test_cannot_delete_invalid_blog_post(self) -> None:
        # Check that an invalid blog post can not be deleted.
        # The error is raised as blog post id fails minimum character limit
        # validation check.
        self.login(self.BLOG_ADMIN_EMAIL)
        self.delete_json(
            '%s/%s' % (feconf.BLOG_EDITOR_DATA_URL_PREFIX, 123456),
            expected_status_int=400
        )
        self.logout()

        self.login(self.BLOG_ADMIN_EMAIL)
        # The error is raised by acl decorator as the blog post doesn't exist.
        self.delete_json(
            '%s/%s' % (feconf.BLOG_EDITOR_DATA_URL_PREFIX, 'abc123efgH34'),
            expected_status_int=404)
        self.logout()

    def test_blog_post_handler_delete_by_admin(self) -> None:
        # Check that blog admins can delete a blog post.
        self.login(self.BLOG_ADMIN_EMAIL)
        self.delete_json(
            '%s/%s' % (
                feconf.BLOG_EDITOR_DATA_URL_PREFIX, self.blog_post.id
            ),
            expected_status_int=200
        )
        self.logout()

    def test_blog_post_handler_delete_by_blog_editor(self) -> None:
        # Check that editor who owns the blog post can delete it.
        self.login(self.BLOG_EDITOR_EMAIL)
        self.delete_json(
            '%s/%s' % (
                feconf.BLOG_EDITOR_DATA_URL_PREFIX, self.blog_post.id),
            expected_status_int=200)
        self.logout()

    def test_cannot_delete_post_by_blog_editor(self) -> None:
        # Check that blog editor who does not own the blog post can not
        # delete it.
        self.add_user_role(
            self.username, feconf.ROLE_ID_BLOG_POST_EDITOR)
        self.login(self.user_email)

        self.delete_json(
            '%s/%s' % (
                feconf.BLOG_EDITOR_DATA_URL_PREFIX, self.blog_post.id
            ),
            expected_status_int=401
        )

        self.logout()


class BlogPostTitleHandlerTest(test_utils.GenericTestBase):
    """Tests for BlogPostTitleHandler."""

    def setUp(self) -> None:
        """Complete the setup process for testing."""
        super().setUp()
        self.signup(
            self.BLOG_ADMIN_EMAIL, self.BLOG_ADMIN_USERNAME
        )
        self.blog_admin_id = (
            self.get_user_id_from_email(self.BLOG_ADMIN_EMAIL)
        )
        self.add_user_role(
            self.BLOG_ADMIN_USERNAME,
            feconf.ROLE_ID_BLOG_ADMIN
        )
        blog_post = blog_services.create_new_blog_post(self.blog_admin_id)
        self.change_dict: blog_services.BlogPostChangeDict = {
            'title': 'Sample Title',
            'thumbnail_filename': 'thumbnail.svg',
            'content': '<p>Hello Bloggers<p>',
            'tags': ['Newsletter', 'Learners']
        }
        self.blog_post_id = blog_post.id
        blog_services.update_blog_post(blog_post.id, self.change_dict)
        blog_services.publish_blog_post(blog_post.id)

        # Creating another blog post.
        self.new_blog_post_id = (
            blog_services.create_new_blog_post(self.blog_admin_id).id
        )

    def test_blog_post_title_handler_when_unique(self) -> None:
        self.login(self.BLOG_ADMIN_EMAIL)

        params = {
            'title': 'Sample'
        }

        # Blog post with same title does not exist yet.
        json_response = self.get_json(
            '%s/%s' % (feconf.BLOG_TITLE_HANDLER, self.new_blog_post_id),
            params=params,
        )
        self.assertEqual(json_response['blog_post_exists'], False)

    def test_blog_post_title_handler_when_duplicate(self) -> None:
        self.login(self.BLOG_ADMIN_EMAIL)

        params = {
            'title': 'Sample Title'
        }

        # Blog post with same title already exist.
        json_response = self.get_json(
            '%s/%s' % (feconf.BLOG_TITLE_HANDLER, self.new_blog_post_id),
            params=params,
        )
        self.assertEqual(json_response['blog_post_exists'], True)
