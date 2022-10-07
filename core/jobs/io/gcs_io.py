import re
import threading

import httplib2
import apache_beam as beam

from apache_beam.internal.gcp import auth
from apache_beam.io.gcp.internal.clients import storage

# This is the number of seconds the library will wait for GCS operations to
# complete.
DEFAULT_HTTP_TIMEOUT_SECONDS = 60

def parse_gcs_path(gcs_path):
  """Return the bucket and object names of the given gs:// path."""
  match = re.match('^gs://([^/]+)/(.+)$', gcs_path)
  if match is None:
    raise ValueError('GCS path must be in the form gs://<bucket>/<object>.')
  return match.group(1), match.group(2)

@classmethod
def _get_storage_client(cls):
    local_state = threading.local()
    if getattr(local_state, 'gcsio_instance', None) is None:
        credentials = auth.get_service_credentials()
        storage_client = storage.StorageV1(
            credentials=credentials,
            http=httplib2.Http(timeout=DEFAULT_HTTP_TIMEOUT_SECONDS))
        local_state.gcsio_instance = (
            super(GcsIO, cls).__new__(cls, storage_client))
        local_state.gcsio_instance.client = storage_client
    return local_state.gcsio_instance

class GcsIoRead(beam.PTransform):
    """
    """
    def __new__(cls, storage_client=None):
        if storage_client:
            return super(GcsIO, cls).__new__(cls)
        else:
            return _get_storage_client(cls)

    def __init__(
        self, client, path, mode='r', buffer_size=DEFAULT_READ_BUFFER_SIZE,
        segment_timeout=DEFAULT_READ_SEGMENT_TIMEOUT_SECONDS
    ):
        if client is not None:
            self.client = client
        self.client = client
        self.path = path
        self.bucket, self.name = parse_gcs_path(path)
        self.mode = mode
        self.buffer_size = buffer_size
        self.segment_timeout = segment_timeout

        # Get object state.
        self.get_request = (storage.StorageObjectsGetRequest(
            bucket=self.bucket, object=self.name))
        try:
            metadata = self._get_object_metadata(self.get_request)
        except HttpError as http_error:
            if http_error.status_code == 404:
                raise IOError(errno.ENOENT, 'Not found: %s' % self.path)
            else:
                logging.error('HTTP error while requesting file %s: %s', self.path,
                            http_error)
                raise
        self.size = metadata.size

        # Ensure read is from file of the correct generation.
        self.get_request.generation = metadata.generation

        # Initialize read buffer state.
        self.download_stream = cStringIO.StringIO()
        self.downloader = transfer.Download(
            self.download_stream, auto_transfer=False, chunksize=self.buffer_size)
        self.client.objects.Get(self.get_request, download=self.downloader)
        self.position = 0
        self.buffer = ''
        self.buffer_start_position = 0
        self.closed = False

    def expand(
        self, pbegin: pvalue.PBegin
    ) -> beam.PCollection[datastore_services.Model]:
        """
        """
        # return (
        #     pbegin.pipeline
        #     | 'Read the file %s' % self.path >> beam.Map(
        #         self.open_file()
        #     )
        # )

    def open_file(self):
        """Logic to open the file"""

class GcsIOWrite(beam.PTransform):
    """
    """

class GcsIODelete(beam.PTransform):
    """
    """

class GcsIOModifyMetadata(beam.PTransform):
    """
    """

class GcsIOGetFilesInsideFolder(beam.PTransform):
    """
    """

class UploadFile(beam.PTransform):
    """
    """
    def _upload(
        self, bucket_name, destination_blob_name,
        contents
    ):
        """
        """
        # The ID of your GCS bucket
        # bucket_name = "your-bucket-name"

        # The contents to upload to the file
        # contents = "these are my contents"

        # The ID of your GCS object
        # destination_blob_name = "storage-object-name"

        storage_client = storage.Client()
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(destination_blob_name)

        blob.upload_from_string(contents)

    def expand(
        self, entities: beam.PCollection[datastore_services.Model]
    ) -> pvalue.PDone:
        """
        """
        return (
            entities
            | 'Upload file to GCS' >> beam.Map(self._upload)
        )
        
