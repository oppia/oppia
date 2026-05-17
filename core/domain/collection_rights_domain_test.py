# coding: utf-8

from __future__ import annotations

from core import utils
from core.domain import collection_rights_domain
from core.tests import test_utils


class CollectionRightsTests(test_utils.GenericTestBase):

    def test_validate_does_not_raise_error(self) -> None:
        rights = collection_rights_domain.CollectionRights(
            'collection_id',
            ['owner'],
            ['editor'],
            ['voice_artist'],
            ['viewer'],
            community_owned=False,
        )

        rights.validate()

    def test_validation_fails_with_invalid_status(self) -> None:
        rights = collection_rights_domain.CollectionRights(
            'collection_id',
            ['owner'],
            [],
            [],
            [],
            status='invalid'
        )

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected status to be either'
        ):
            rights.validate()