# coding: utf-8
#
# Copyright 2013 Google Inc. All Rights Reserved.
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

"""Models relating to files and their metadata."""

__author__ = 'Sean Lip'

import os

import core.storage.base_model.models as base_models

from django.db import models

QUERY_LIMIT = 1000


class FileMetadataModel(base_models.BaseModel):
    """File metadata model, keyed by exploration id and absolute file name.

    This stores the content of the latest, most up-to-date version of the file
    metadata.
    """
    # The size of the file.
    size = models.IntegerField()
    # The current version of the file.
    version = models.IntegerField()

    def get_new_id(cls, entity_name):
        raise NotImplementedError

    @classmethod
    def get_undeleted(cls):
    	# TODO(sunu0000): Impose a limit of QUERY_LIMIT on the number of
    	# results.
        return cls.get_all().filter(deleted=False)

    @classmethod
    def _construct_id(cls, exploration_id, filepath):
        return os.path.join('/', exploration_id, filepath)

    @classmethod
    def create(cls, exploration_id, filepath):
        model = cls.get(exploration_id, filepath)
        if model is not None:
            model.deleted = False
        else:
            model_id = cls._construct_id(exploration_id, filepath)
            model = cls(id=model_id, deleted=False)
        return model

    @classmethod
    def get(cls, exploration_id, filepath, strict=False):
        return super(FileMetadataModel, cls).get(
            cls._construct_id(exploration_id, filepath), strict=strict)


class FileMetadataHistoryModel(base_models.BaseModel):
    """Model for old versions of the file metadata.

    Instances of this class are keyed by exploration id, absolute file name and
    version number.
    """
    # The size of the file.
    size = models.IntegerField()

    def get_new_id(cls, entity_name):
        raise NotImplementedError

    @classmethod
    def _construct_id(cls, exploration_id, filepath, version):
        """The id is formatted as [EXP_ID]/[FILEPATH]#[VERSION]."""
        return '#'.join([
            os.path.join('/', exploration_id, filepath), str(version)])

    @classmethod
    def create(cls, exploration_id, filepath, version):
        model = cls.get(exploration_id, filepath, version)
        if model is not None:
            model.deleted = False
        else:
            model_id = cls._construct_id(exploration_id, filepath, version)
            model = cls(id=model_id, deleted=False)
        return model

    @classmethod
    def get(cls, exploration_id, filepath, version, strict=False):
        return super(FileMetadataHistoryModel, cls).get(
            cls._construct_id(exploration_id, filepath, version),
            strict=strict)


class FileDataModel(base_models.BaseModel):
    """File data model, keyed by absolute file name."""
    # The contents of the file.
    # TODO(sunu0000): This is probably too short. Can it be replaced with an
    # unbounded-length field? Do we need to use something like ContentFile?
    content = models.TextField(max_length=5000)
    # The current version of the file.
    version = models.IntegerField()

    def get_new_id(cls, entity_name):
        raise NotImplementedError

    @classmethod
    def _construct_id(cls, exploration_id, filepath):
        return os.path.join('/', exploration_id, filepath)

    @classmethod
    def create(cls, exploration_id, filepath):
        model = cls.get(exploration_id, filepath)
        if model is not None:
            model.deleted = False
        else:
            model_id = cls._construct_id(exploration_id, filepath)
            model = cls(id=model_id, deleted=False)
        return model

    @classmethod
    def get(cls, exploration_id, filepath, strict=False):
        return super(FileDataModel, cls).get(
            cls._construct_id(exploration_id, filepath), strict=strict)


class FileDataHistoryModel(base_models.BaseModel):
    """Model for old versions of the file data.

    Instances of this class are keyed by exploration id, absolute filename and
    version.
    """
    # The contents of the file.
    # TODO(sunu0000): This is probably too short. Can it be replaced with an
    # unbounded-length field? Do we need to use something like ContentFile?
    content = models.TextField(max_length=5000)

    def get_new_id(cls, entity_name):
        raise NotImplementedError

    @classmethod
    def _construct_id(cls, exploration_id, filepath, version):
        """The id is formatted as [EXP_ID]/[FILEPATH]#[VERSION]."""
        return '#'.join([
            os.path.join('/', exploration_id, filepath), str(version)])

    @classmethod
    def create(cls, exploration_id, filepath, version):
        model = cls.get(exploration_id, filepath, version)
        if model is not None:
            model.deleted = False
        else:
            model_id = cls._construct_id(exploration_id, filepath, version)
            model = cls(id=model_id, deleted=False)
        return model

    @classmethod
    def get(cls, exploration_id, filepath, version, strict=False):
        return super(FileDataHistoryModel, cls).get(
            cls._construct_id(exploration_id, filepath, version),
            strict=strict)
