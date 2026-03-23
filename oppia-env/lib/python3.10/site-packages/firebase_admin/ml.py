# Copyright 2019 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Firebase ML module.

This module contains functions for creating, updating, getting, listing,
deleting, publishing and unpublishing Firebase ML models.
"""


import datetime
import re
import time
import os
from urllib import parse
import warnings

import requests

import firebase_admin
from firebase_admin import _http_client
from firebase_admin import _utils
from firebase_admin import exceptions

# pylint: disable=import-error,no-name-in-module
try:
    from firebase_admin import storage
    _GCS_ENABLED = True
except ImportError:
    _GCS_ENABLED = False

# pylint: disable=import-error,no-name-in-module
try:
    import tensorflow as tf
    _TF_ENABLED = True
except ImportError:
    _TF_ENABLED = False

_ML_ATTRIBUTE = '_ml'
_MAX_PAGE_SIZE = 100
_MODEL_ID_PATTERN = re.compile(r'^[A-Za-z0-9_-]{1,60}$')
_DISPLAY_NAME_PATTERN = re.compile(r'^[A-Za-z0-9_-]{1,32}$')
_TAG_PATTERN = re.compile(r'^[A-Za-z0-9_-]{1,32}$')
_GCS_TFLITE_URI_PATTERN = re.compile(
    r'^gs://(?P<bucket_name>[a-z0-9_.-]{3,63})/(?P<blob_name>.+)$')
_AUTO_ML_MODEL_PATTERN = re.compile(
    r'^projects/(?P<project_id>[a-z0-9-]{6,30})/locations/(?P<location_id>[^/]+)/' +
    r'models/(?P<model_id>[A-Za-z0-9]+)$')
_RESOURCE_NAME_PATTERN = re.compile(
    r'^projects/(?P<project_id>[a-z0-9-]{6,30})/models/(?P<model_id>[A-Za-z0-9_-]{1,60})$')
_OPERATION_NAME_PATTERN = re.compile(
    r'^projects/(?P<project_id>[a-z0-9-]{6,30})/operations/[^/]+$')


def _get_ml_service(app):
    """ Returns an _MLService instance for an App.

    Args:
      app: A Firebase App instance (or None to use the default App).

    Returns:
      _MLService: An _MLService for the specified App instance.

    Raises:
      ValueError: If the app argument is invalid.
    """
    return _utils.get_app_service(app, _ML_ATTRIBUTE, _MLService)


def create_model(model, app=None):
    """Creates a model in the current Firebase project.

    Args:
        model: An ml.Model to create.
        app: A Firebase app instance (or None to use the default app).

    Returns:
        Model: The model that was created in Firebase ML.
    """
    ml_service = _get_ml_service(app)
    return Model.from_dict(ml_service.create_model(model), app=app)


def update_model(model, app=None):
    """Updates a model's metadata or model file.

    Args:
        model: The ml.Model to update.
        app: A Firebase app instance (or None to use the default app).

    Returns:
        Model: The updated model.
    """
    ml_service = _get_ml_service(app)
    return Model.from_dict(ml_service.update_model(model), app=app)


def publish_model(model_id, app=None):
    """Publishes a Firebase ML model.

    A published model can be downloaded to client apps.

    Args:
        model_id: The id of the model to publish.
        app: A Firebase app instance (or None to use the default app).

    Returns:
        Model: The published model.
    """
    ml_service = _get_ml_service(app)
    return Model.from_dict(ml_service.set_published(model_id, publish=True), app=app)


def unpublish_model(model_id, app=None):
    """Unpublishes a Firebase ML model.

    Args:
        model_id: The id of the model to unpublish.
        app: A Firebase app instance (or None to use the default app).

    Returns:
        Model: The unpublished model.
    """
    ml_service = _get_ml_service(app)
    return Model.from_dict(ml_service.set_published(model_id, publish=False), app=app)


def get_model(model_id, app=None):
    """Gets the model specified by the given ID.

    Args:
        model_id: The id of the model to get.
        app: A Firebase app instance (or None to use the default app).

    Returns:
     Model: The requested model.
    """
    ml_service = _get_ml_service(app)
    return Model.from_dict(ml_service.get_model(model_id), app=app)


def list_models(list_filter=None, page_size=None, page_token=None, app=None):
    """Lists the current project's models.

    Args:
        list_filter: a list filter string such as ``tags:'tag_1'``. None will return all models.
        page_size: A number between 1 and 100 inclusive that specifies the maximum
            number of models to return per page. None for default.
        page_token: A next page token returned from a previous page of results. None
            for first page of results.
        app: A Firebase app instance (or None to use the default app).

    Returns:
        ListModelsPage: A (filtered) list of models.
    """
    ml_service = _get_ml_service(app)
    return ListModelsPage(
        ml_service.list_models, list_filter, page_size, page_token, app=app)


def delete_model(model_id, app=None):
    """Deletes a model from the current project.

    Args:
        model_id: The id of the model you wish to delete.
        app: A Firebase app instance (or None to use the default app).
    """
    ml_service = _get_ml_service(app)
    ml_service.delete_model(model_id)


class Model:
    """A Firebase ML Model object.

    Args:
        display_name: The display name of your model - used to identify your model in code.
        tags: Optional list of strings associated with your model. Can be used in list queries.
        model_format: A subclass of ModelFormat. (e.g. TFLiteFormat) Specifies the model details.
    """
    def __init__(self, display_name=None, tags=None, model_format=None):
        self._app = None  # Only needed for wait_for_unlo
        self._data = {}
        self._model_format = None

        if display_name is not None:
            self.display_name = display_name
        if tags is not None:
            self.tags = tags
        if model_format is not None:
            self.model_format = model_format

    @classmethod
    def from_dict(cls, data, app=None):
        """Create an instance of the object from a dict."""
        data_copy = dict(data)
        tflite_format = None
        tflite_format_data = data_copy.pop('tfliteModel', None)
        data_copy.pop('@type', None)  # Returned by Operations. (Not needed)
        if tflite_format_data:
            tflite_format = TFLiteFormat.from_dict(tflite_format_data)
        model = Model(model_format=tflite_format)
        model._data = data_copy  # pylint: disable=protected-access
        model._app = app # pylint: disable=protected-access
        return model

    def _update_from_dict(self, data):
        copy = Model.from_dict(data)
        self.model_format = copy.model_format
        self._data = copy._data # pylint: disable=protected-access

    def __eq__(self, other):
        if isinstance(other, self.__class__):
            # pylint: disable=protected-access
            return self._data == other._data and self._model_format == other._model_format
        return False

    def __ne__(self, other):
        return not self.__eq__(other)

    @property
    def model_id(self):
        """The model's ID, unique to the project."""
        if not self._data.get('name'):
            return None
        _, model_id = _validate_and_parse_name(self._data.get('name'))
        return model_id

    @property
    def display_name(self):
        """The model's display name, used to refer to the model in code and in
        the Firebase console."""
        return self._data.get('displayName')

    @display_name.setter
    def display_name(self, display_name):
        self._data['displayName'] = _validate_display_name(display_name)
        return self

    @staticmethod
    def _convert_to_millis(date_string):
        if not date_string:
            return None
        format_str = '%Y-%m-%dT%H:%M:%S.%fZ'
        epoch = datetime.datetime.utcfromtimestamp(0)
        datetime_object = datetime.datetime.strptime(date_string, format_str)
        millis = int((datetime_object - epoch).total_seconds() * 1000)
        return millis

    @property
    def create_time(self):
        """The time the model was created."""
        return Model._convert_to_millis(self._data.get('createTime', None))

    @property
    def update_time(self):
        """The time the model was last updated."""
        return Model._convert_to_millis(self._data.get('updateTime', None))

    @property
    def validation_error(self):
        """Validation error message."""
        return self._data.get('state', {}).get('validationError', {}).get('message')

    @property
    def published(self):
        """True if the model is published and available for clients to
        download."""
        return bool(self._data.get('state', {}).get('published'))

    @property
    def etag(self):
        """The entity tag (ETag) of the model resource."""
        return self._data.get('etag')

    @property
    def model_hash(self):
        """SHA256 hash of the model binary."""
        return self._data.get('modelHash')

    @property
    def tags(self):
        """Tag strings, used for filtering query results."""
        return self._data.get('tags')

    @tags.setter
    def tags(self, tags):
        self._data['tags'] = _validate_tags(tags)
        return self

    @property
    def locked(self):
        """True if the Model object is locked by an active operation."""
        return bool(self._data.get('activeOperations') and
                    len(self._data.get('activeOperations')) > 0)

    def wait_for_unlocked(self, max_time_seconds=None):
        """Waits for the model to be unlocked. (All active operations complete)

        Args:
            max_time_seconds: The maximum number of seconds to wait for the model to unlock.
                (None for no limit)

        Raises:
            exceptions.DeadlineExceeded: If max_time_seconds passed and the model is still locked.
        """
        if not self.locked:
            return
        ml_service = _get_ml_service(self._app)
        op_name = self._data.get('activeOperations')[0].get('name')
        model_dict = ml_service.handle_operation(
            ml_service.get_operation(op_name),
            wait_for_operation=True,
            max_time_seconds=max_time_seconds)
        self._update_from_dict(model_dict)

    @property
    def model_format(self):
        """The model's ``ModelFormat`` object, which represents the model's
        format and storage location."""
        return self._model_format

    @model_format.setter
    def model_format(self, model_format):
        if model_format is not None:
            _validate_model_format(model_format)
        self._model_format = model_format  #Can be None
        return self

    def as_dict(self, for_upload=False):
        """Returns a serializable representation of the object."""
        copy = dict(self._data)
        if self._model_format:
            copy.update(self._model_format.as_dict(for_upload=for_upload))
        return copy


class ModelFormat:
    """Abstract base class representing a Model Format such as TFLite."""
    def as_dict(self, for_upload=False):
        """Returns a serializable representation of the object."""
        raise NotImplementedError


class TFLiteFormat(ModelFormat):
    """Model format representing a TFLite model.

    Args:
        model_source: A TFLiteModelSource sub class. Specifies the details of the model source.
    """
    def __init__(self, model_source=None):
        self._data = {}
        self._model_source = None

        if model_source is not None:
            self.model_source = model_source

    @classmethod
    def from_dict(cls, data):
        """Create an instance of the object from a dict."""
        data_copy = dict(data)
        tflite_format = TFLiteFormat(model_source=cls._init_model_source(data_copy))
        tflite_format._data = data_copy # pylint: disable=protected-access
        return tflite_format

    def __eq__(self, other):
        if isinstance(other, self.__class__):
            # pylint: disable=protected-access
            return self._data == other._data and self._model_source == other._model_source
        return False

    def __ne__(self, other):
        return not self.__eq__(other)

    @staticmethod
    def _init_model_source(data):
        """Initialize the ML model source."""
        gcs_tflite_uri = data.pop('gcsTfliteUri', None)
        if gcs_tflite_uri:
            return TFLiteGCSModelSource(gcs_tflite_uri=gcs_tflite_uri)
        auto_ml_model = data.pop('automlModel', None)
        if auto_ml_model:
            warnings.warn('AutoML model support is deprecated and will be removed in the next '
                          'major version.', DeprecationWarning)
            return TFLiteAutoMlSource(auto_ml_model=auto_ml_model)
        return None

    @property
    def model_source(self):
        """The TF Lite model's location."""
        return self._model_source

    @model_source.setter
    def model_source(self, model_source):
        if model_source is not None:
            if not isinstance(model_source, TFLiteModelSource):
                raise TypeError('Model source must be a TFLiteModelSource object.')
        self._model_source = model_source # Can be None

    @property
    def size_bytes(self):
        """The size in bytes of the TF Lite model."""
        return self._data.get('sizeBytes')

    def as_dict(self, for_upload=False):
        """Returns a serializable representation of the object."""
        copy = dict(self._data)
        if self._model_source:
            copy.update(self._model_source.as_dict(for_upload=for_upload))
        return {'tfliteModel': copy}


class TFLiteModelSource:
    """Abstract base class representing a model source for TFLite format models."""
    def as_dict(self, for_upload=False):
        """Returns a serializable representation of the object."""
        raise NotImplementedError


class _CloudStorageClient:
    """Cloud Storage helper class"""

    GCS_URI = 'gs://{0}/{1}'
    BLOB_NAME = 'Firebase/ML/Models/{0}'

    @staticmethod
    def _assert_gcs_enabled():
        if not _GCS_ENABLED:
            raise ImportError('Failed to import the Cloud Storage library for Python. Make sure '
                              'to install the "google-cloud-storage" module.')

    @staticmethod
    def _parse_gcs_tflite_uri(uri):
        # GCS Bucket naming rules are complex. The regex is not comprehensive.
        # See https://cloud.google.com/storage/docs/naming for full details.
        matcher = _GCS_TFLITE_URI_PATTERN.match(uri)
        if not matcher:
            raise ValueError('GCS TFLite URI format is invalid.')
        return matcher.group('bucket_name'), matcher.group('blob_name')

    @staticmethod
    def upload(bucket_name, model_file_name, app):
        """Upload a model file to the specified Storage bucket."""
        _CloudStorageClient._assert_gcs_enabled()

        file_name = os.path.basename(model_file_name)
        bucket = storage.bucket(bucket_name, app=app)
        blob_name = _CloudStorageClient.BLOB_NAME.format(file_name)
        blob = bucket.blob(blob_name)
        blob.upload_from_filename(model_file_name)
        return _CloudStorageClient.GCS_URI.format(bucket.name, blob_name)

    @staticmethod
    def sign_uri(gcs_tflite_uri, app):
        """Makes the gcs_tflite_uri readable for GET for 10 minutes via signed_uri."""
        _CloudStorageClient._assert_gcs_enabled()
        bucket_name, blob_name = _CloudStorageClient._parse_gcs_tflite_uri(gcs_tflite_uri)
        bucket = storage.bucket(bucket_name, app=app)
        blob = bucket.blob(blob_name)
        return blob.generate_signed_url(
            version='v4',
            expiration=datetime.timedelta(minutes=10),
            method='GET'
        )


class TFLiteGCSModelSource(TFLiteModelSource):
    """TFLite model source representing a tflite model file stored in GCS."""

    _STORAGE_CLIENT = _CloudStorageClient()

    def __init__(self, gcs_tflite_uri, app=None):
        self._app = app
        self._gcs_tflite_uri = _validate_gcs_tflite_uri(gcs_tflite_uri)

    def __eq__(self, other):
        if isinstance(other, self.__class__):
            return self._gcs_tflite_uri == other._gcs_tflite_uri # pylint: disable=protected-access
        return False

    def __ne__(self, other):
        return not self.__eq__(other)

    @classmethod
    def from_tflite_model_file(cls, model_file_name, bucket_name=None, app=None):
        """Uploads the model file to an existing Google Cloud Storage bucket.

        Args:
            model_file_name: The name of the model file.
            bucket_name: The name of an existing bucket. None to use the default bucket configured
                in the app.
            app: A Firebase app instance (or None to use the default app).

        Returns:
            TFLiteGCSModelSource: The source created from the model_file

        Raises:
            ImportError: If the Cloud Storage Library has not been installed.
        """
        gcs_uri = TFLiteGCSModelSource._STORAGE_CLIENT.upload(bucket_name, model_file_name, app)
        return TFLiteGCSModelSource(gcs_tflite_uri=gcs_uri, app=app)

    @staticmethod
    def _assert_tf_enabled():
        if not _TF_ENABLED:
            raise ImportError('Failed to import the tensorflow library for Python. Make sure '
                              'to install the tensorflow module.')
        if not tf.version.VERSION.startswith('1.') and not tf.version.VERSION.startswith('2.'):
            raise ImportError('Expected tensorflow version 1.x or 2.x, but found {0}'
                              .format(tf.version.VERSION))

    @staticmethod
    def _tf_convert_from_saved_model(saved_model_dir):
        # Same for both v1.x and v2.x
        converter = tf.lite.TFLiteConverter.from_saved_model(saved_model_dir)
        return converter.convert()

    @staticmethod
    def _tf_convert_from_keras_model(keras_model):
        """Converts the given Keras model into a TF Lite model."""
        # Version 1.x conversion function takes a model file. Version 2.x takes the model itself.
        if tf.version.VERSION.startswith('1.'):
            keras_file = 'firebase_keras_model.h5'
            tf.keras.models.save_model(keras_model, keras_file)
            converter = tf.lite.TFLiteConverter.from_keras_model_file(keras_file)
        else:
            converter = tf.lite.TFLiteConverter.from_keras_model(keras_model)

        return converter.convert()

    @classmethod
    def from_saved_model(cls, saved_model_dir, model_file_name='firebase_ml_model.tflite',
                         bucket_name=None, app=None):
        """Creates a Tensor Flow Lite model from the saved model, and uploads the model to GCS.

        Args:
            saved_model_dir: The saved model directory.
            model_file_name: The name that the tflite model will be saved as in Cloud Storage.
            bucket_name: The name of an existing bucket. None to use the default bucket configured
                in the app.
            app: Optional. A Firebase app instance (or None to use the default app)

        Returns:
            TFLiteGCSModelSource: The source created from the saved_model_dir

        Raises:
            ImportError: If the Tensor Flow or Cloud Storage Libraries have not been installed.
        """
        TFLiteGCSModelSource._assert_tf_enabled()
        tflite_model = TFLiteGCSModelSource._tf_convert_from_saved_model(saved_model_dir)
        with open(model_file_name, 'wb') as model_file:
            model_file.write(tflite_model)
        return TFLiteGCSModelSource.from_tflite_model_file(model_file_name, bucket_name, app)

    @classmethod
    def from_keras_model(cls, keras_model, model_file_name='firebase_ml_model.tflite',
                         bucket_name=None, app=None):
        """Creates a Tensor Flow Lite model from the keras model, and uploads the model to GCS.

        Args:
            keras_model: A tf.keras model.
            model_file_name: The name that the tflite model will be saved as in Cloud Storage.
            bucket_name: The name of an existing bucket. None to use the default bucket configured
                in the app.
            app: Optional. A Firebase app instance (or None to use the default app)

        Returns:
            TFLiteGCSModelSource: The source created from the keras_model

        Raises:
            ImportError: If the Tensor Flow or Cloud Storage Libraries have not been installed.
        """
        TFLiteGCSModelSource._assert_tf_enabled()
        tflite_model = TFLiteGCSModelSource._tf_convert_from_keras_model(keras_model)
        with open(model_file_name, 'wb') as model_file:
            model_file.write(tflite_model)
        return TFLiteGCSModelSource.from_tflite_model_file(model_file_name, bucket_name, app)

    @property
    def gcs_tflite_uri(self):
        """URI of the model file in Cloud Storage."""
        return self._gcs_tflite_uri

    @gcs_tflite_uri.setter
    def gcs_tflite_uri(self, gcs_tflite_uri):
        self._gcs_tflite_uri = _validate_gcs_tflite_uri(gcs_tflite_uri)

    def _get_signed_gcs_tflite_uri(self):
        """Signs the GCS uri, so the model file can be uploaded to Firebase ML and verified."""
        return TFLiteGCSModelSource._STORAGE_CLIENT.sign_uri(self._gcs_tflite_uri, self._app)

    def as_dict(self, for_upload=False):
        """Returns a serializable representation of the object."""
        if for_upload:
            return {'gcsTfliteUri': self._get_signed_gcs_tflite_uri()}

        return {'gcsTfliteUri': self._gcs_tflite_uri}


class TFLiteAutoMlSource(TFLiteModelSource):
    """TFLite model source representing a tflite model created with AutoML.

    AutoML model support is deprecated and will be removed in the next major version.
    """

    def __init__(self, auto_ml_model, app=None):
        warnings.warn('AutoML model support is deprecated and will be removed in the next '
                      'major version.', DeprecationWarning)
        self._app = app
        self.auto_ml_model = auto_ml_model

    def __eq__(self, other):
        if isinstance(other, self.__class__):
            return self.auto_ml_model == other.auto_ml_model
        return False

    def __ne__(self, other):
        return not self.__eq__(other)

    @property
    def auto_ml_model(self):
        """Resource name of the model, created by the AutoML API or Cloud console."""
        return self._auto_ml_model

    @auto_ml_model.setter
    def auto_ml_model(self, auto_ml_model):
        self._auto_ml_model = _validate_auto_ml_model(auto_ml_model)

    def as_dict(self, for_upload=False):
        """Returns a serializable representation of the object."""
        # Upload is irrelevant for auto_ml models
        return {'automlModel': self._auto_ml_model}


class ListModelsPage:
    """Represents a page of models in a Firebase project.

    Provides methods for traversing the models included in this page, as well as
    retrieving subsequent pages of models. The iterator returned by
    ``iterate_all()`` can be used to iterate through all the models in the
    Firebase project starting from this page.
    """
    def __init__(self, list_models_func, list_filter, page_size, page_token, app):
        self._list_models_func = list_models_func
        self._list_filter = list_filter
        self._page_size = page_size
        self._page_token = page_token
        self._app = app
        self._list_response = list_models_func(list_filter, page_size, page_token)

    @property
    def models(self):
        """A list of Models from this page."""
        return [
            Model.from_dict(model, app=self._app) for model in self._list_response.get('models', [])
        ]

    @property
    def list_filter(self):
        """The filter string used to filter the models."""
        return self._list_filter

    @property
    def next_page_token(self):
        """Token identifying the next page of results."""
        return self._list_response.get('nextPageToken', '')

    @property
    def has_next_page(self):
        """True if more pages are available."""
        return bool(self.next_page_token)

    def get_next_page(self):
        """Retrieves the next page of models if available.

        Returns:
            ListModelsPage: Next page of models, or None if this is the last page.
        """
        if self.has_next_page:
            return ListModelsPage(
                self._list_models_func,
                self._list_filter,
                self._page_size,
                self.next_page_token,
                self._app)
        return None

    def iterate_all(self):
        """Retrieves an iterator for Models.

        Returned iterator will iterate through all the models in the Firebase
        project starting from this page. The iterator will never buffer more than
        one page of models in memory at a time.

        Returns:
            iterator: An iterator of Model instances.
        """
        return _ModelIterator(self)


class _ModelIterator:
    """An iterator that allows iterating over models, one at a time.

    This implementation loads a page of models into memory, and iterates on them.
    When the whole page has been traversed, it loads another page. This class
    never keeps more than one page of entries in memory.
    """
    def __init__(self, current_page):
        if not isinstance(current_page, ListModelsPage):
            raise TypeError('Current page must be a ListModelsPage')
        self._current_page = current_page
        self._index = 0

    def next(self):
        if self._index == len(self._current_page.models):
            if self._current_page.has_next_page:
                self._current_page = self._current_page.get_next_page()
                self._index = 0
        if self._index < len(self._current_page.models):
            result = self._current_page.models[self._index]
            self._index += 1
            return result
        raise StopIteration

    def __next__(self):
        return self.next()

    def __iter__(self):
        return self


def _validate_and_parse_name(name):
    # The resource name is added automatically from API call responses.
    # The only way it could be invalid is if someone tries to
    # create a model from a dictionary manually and does it incorrectly.
    matcher = _RESOURCE_NAME_PATTERN.match(name)
    if not matcher:
        raise ValueError('Model resource name format is invalid.')
    return matcher.group('project_id'), matcher.group('model_id')


def _validate_model(model, update_mask=None):
    if not isinstance(model, Model):
        raise TypeError('Model must be an ml.Model.')
    if update_mask is None and not model.display_name:
        raise ValueError('Model must have a display name.')


def _validate_model_id(model_id):
    if not _MODEL_ID_PATTERN.match(model_id):
        raise ValueError('Model ID format is invalid.')


def _validate_operation_name(op_name):
    if not _OPERATION_NAME_PATTERN.match(op_name):
        raise ValueError('Operation name format is invalid.')
    return op_name


def _validate_display_name(display_name):
    if not _DISPLAY_NAME_PATTERN.match(display_name):
        raise ValueError('Display name format is invalid.')
    return display_name


def _validate_tags(tags):
    if not isinstance(tags, list) or not \
        all(isinstance(tag, str) for tag in tags):
        raise TypeError('Tags must be a list of strings.')
    if not all(_TAG_PATTERN.match(tag) for tag in tags):
        raise ValueError('Tag format is invalid.')
    return tags


def _validate_gcs_tflite_uri(uri):
    # GCS Bucket naming rules are complex. The regex is not comprehensive.
    # See https://cloud.google.com/storage/docs/naming for full details.
    if not _GCS_TFLITE_URI_PATTERN.match(uri):
        raise ValueError('GCS TFLite URI format is invalid.')
    return uri

def _validate_auto_ml_model(model):
    if not _AUTO_ML_MODEL_PATTERN.match(model):
        raise ValueError('Model resource name format is invalid.')
    return model


def _validate_model_format(model_format):
    if not isinstance(model_format, ModelFormat):
        raise TypeError('Model format must be a ModelFormat object.')
    return model_format


def _validate_list_filter(list_filter):
    if list_filter is not None:
        if not isinstance(list_filter, str):
            raise TypeError('List filter must be a string or None.')


def _validate_page_size(page_size):
    if page_size is not None:
        if type(page_size) is not int: # pylint: disable=unidiomatic-typecheck
            # Specifically type() to disallow boolean which is a subtype of int
            raise TypeError('Page size must be a number or None.')
        if page_size < 1 or page_size > _MAX_PAGE_SIZE:
            raise ValueError('Page size must be a positive integer between '
                             '1 and {0}'.format(_MAX_PAGE_SIZE))


def _validate_page_token(page_token):
    if page_token is not None:
        if not isinstance(page_token, str):
            raise TypeError('Page token must be a string or None.')


class _MLService:
    """Firebase ML service."""

    PROJECT_URL = 'https://firebaseml.googleapis.com/v1beta2/projects/{0}/'
    OPERATION_URL = 'https://firebaseml.googleapis.com/v1beta2/'
    POLL_EXPONENTIAL_BACKOFF_FACTOR = 1.5
    POLL_BASE_WAIT_TIME_SECONDS = 3

    def __init__(self, app):
        self._project_id = app.project_id
        if not self._project_id:
            raise ValueError(
                'Project ID is required to access ML service. Either set the '
                'projectId option, or use service account credentials.')
        self._project_url = _MLService.PROJECT_URL.format(self._project_id)
        ml_headers = {
            'X-FIREBASE-CLIENT': 'fire-admin-python/{0}'.format(firebase_admin.__version__),
        }
        self._client = _http_client.JsonHttpClient(
            credential=app.credential.get_credential(),
            headers=ml_headers,
            base_url=self._project_url)
        self._operation_client = _http_client.JsonHttpClient(
            credential=app.credential.get_credential(),
            headers=ml_headers,
            base_url=_MLService.OPERATION_URL)

    def get_operation(self, op_name):
        _validate_operation_name(op_name)
        try:
            return self._operation_client.body('get', url=op_name)
        except requests.exceptions.RequestException as error:
            raise _utils.handle_platform_error_from_requests(error)

    def _exponential_backoff(self, current_attempt, stop_time):
        """Sleeps for the appropriate amount of time. Or throws deadline exceeded."""
        delay_factor = pow(_MLService.POLL_EXPONENTIAL_BACKOFF_FACTOR, current_attempt)
        wait_time_seconds = delay_factor * _MLService.POLL_BASE_WAIT_TIME_SECONDS

        if stop_time is not None:
            max_seconds_left = (stop_time - datetime.datetime.now()).total_seconds()
            if max_seconds_left < 1: # allow a bit of time for rpc
                raise exceptions.DeadlineExceededError('Polling max time exceeded.')
            wait_time_seconds = min(wait_time_seconds, max_seconds_left - 1)
        time.sleep(wait_time_seconds)

    def handle_operation(self, operation, wait_for_operation=False, max_time_seconds=None):
        """Handles long running operations.

        Args:
            operation: The operation to handle.
            wait_for_operation: Should we allow polling for the operation to complete.
                If no polling is requested, a locked model will be returned instead.
            max_time_seconds: The maximum seconds to try polling for operation complete.
                (None for no limit)

        Returns:
            dict: A dictionary of the returned model properties.

        Raises:
            TypeError: if the operation is not a dictionary.
            ValueError: If the operation is malformed.
            UnknownError: If the server responds with an unexpected response.
            err: If the operation exceeds polling attempts or stop_time
        """
        if not isinstance(operation, dict):
            raise TypeError('Operation must be a dictionary.')

        if operation.get('done'):
            # Operations which are immediately done don't have an operation name
            if operation.get('response'):
                return operation.get('response')
            if operation.get('error'):
                raise _utils.handle_operation_error(operation.get('error'))
            raise exceptions.UnknownError(message='Internal Error: Malformed Operation.')

        op_name = _validate_operation_name(operation.get('name'))
        metadata = operation.get('metadata', {})
        metadata_type = metadata.get('@type', '')
        if not metadata_type.endswith('ModelOperationMetadata'):
            raise TypeError('Unknown type of operation metadata.')
        _, model_id = _validate_and_parse_name(metadata.get('name'))
        current_attempt = 0
        start_time = datetime.datetime.now()
        stop_time = (None if max_time_seconds is None else
                     start_time + datetime.timedelta(seconds=max_time_seconds))
        while wait_for_operation and not operation.get('done'):
            # We just got this operation. Wait before getting another
            # so we don't exceed the GetOperation maximum request rate.
            self._exponential_backoff(current_attempt, stop_time)
            operation = self.get_operation(op_name)
            current_attempt += 1

        if operation.get('done'):
            if operation.get('response'):
                return operation.get('response')
            if operation.get('error'):
                raise _utils.handle_operation_error(operation.get('error'))

        # If the operation is not complete or timed out, return a (locked) model instead
        return get_model(model_id).as_dict()


    def create_model(self, model):
        _validate_model(model)
        try:
            return self.handle_operation(
                self._client.body('post', url='models', json=model.as_dict(for_upload=True)))
        except requests.exceptions.RequestException as error:
            raise _utils.handle_platform_error_from_requests(error)

    def update_model(self, model, update_mask=None):
        _validate_model(model, update_mask)
        path = 'models/{0}'.format(model.model_id)
        if update_mask is not None:
            path = path + '?updateMask={0}'.format(update_mask)
        try:
            return self.handle_operation(
                self._client.body('patch', url=path, json=model.as_dict(for_upload=True)))
        except requests.exceptions.RequestException as error:
            raise _utils.handle_platform_error_from_requests(error)

    def set_published(self, model_id, publish):
        _validate_model_id(model_id)
        model_name = 'projects/{0}/models/{1}'.format(self._project_id, model_id)
        model = Model.from_dict({
            'name': model_name,
            'state': {
                'published': publish
            }
        })
        return self.update_model(model, update_mask='state.published')

    def get_model(self, model_id):
        _validate_model_id(model_id)
        try:
            return self._client.body('get', url='models/{0}'.format(model_id))
        except requests.exceptions.RequestException as error:
            raise _utils.handle_platform_error_from_requests(error)

    def list_models(self, list_filter, page_size, page_token):
        """ lists Firebase ML models."""
        _validate_list_filter(list_filter)
        _validate_page_size(page_size)
        _validate_page_token(page_token)
        params = {}
        if list_filter:
            params['filter'] = list_filter
        if page_size:
            params['page_size'] = page_size
        if page_token:
            params['page_token'] = page_token
        path = 'models'
        if params:
            param_str = parse.urlencode(sorted(params.items()), True)
            path = path + '?' + param_str
        try:
            return self._client.body('get', url=path)
        except requests.exceptions.RequestException as error:
            raise _utils.handle_platform_error_from_requests(error)

    def delete_model(self, model_id):
        _validate_model_id(model_id)
        try:
            self._client.body('delete', url='models/{0}'.format(model_id))
        except requests.exceptions.RequestException as error:
            raise _utils.handle_platform_error_from_requests(error)
