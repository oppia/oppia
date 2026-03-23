from __future__ import unicode_literals
from ..baseapi import BaseApi


class Segments(BaseApi):

    def __init__(self, *args, **kwargs):
        super(Segments, self).__init__(*args, **kwargs)
        self.endpoint = 'lists'

    def all(self, list_id, **queryparams):
        """
        returns the first 10 segments for a specific list.
        """
        return self._mc_client._get(url=self._build_path(list_id, 'segments'), **queryparams)

    def get(self, list_id, segment_id):
        """
        returns the specified list segment.
        """
        return self._mc_client._get(url=self._build_path(list_id, 'segments', segment_id))

    def update(self, list_id, segment_id, data):
        """
        updates an existing list segment.
        """
        return self._mc_client._patch(url=self._build_path(list_id, 'segments', segment_id), data=data)

    def delete(self, list_id, segment_id):
        """
        removes an existing list segment from the list. This cannot be undone.
        """
        return self._mc_client._delete(url=self._build_path(list_id, 'segments', segment_id))

    def create(self, list_id, data):
        """
        adds a new segment to the list.
        """
        return self._mc_client._post(url=self._build_path(list_id, 'segments'), data=data)
