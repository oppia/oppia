# coding=utf-8
"""
The List Segments API endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/lists/segments/
Schema: https://api.mailchimp.com/schema/3.0/Lists/Segments/Instance.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi
from mailchimp3.entities.listsegmentmembers import ListSegmentMembers


class ListSegments(BaseApi):
    """
    Manage segments for a specific MailChimp list. A segment is a section of
    your list that includes only those subscribers who share specific common
    field information.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(ListSegments, self).__init__(*args, **kwargs)
        self.endpoint = 'lists'
        self.list_id = None
        self.segment_id = None
        self.members = ListSegmentMembers(self)


    def create(self, list_id, data):
        """
        Create a new segment in a specific list.

        :param list_id: The unique id for the list.
        :type list_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "name": string*
        }
        """
        self.list_id = list_id
        if 'name' not in data:
            raise KeyError('The list segment must have a name')
        response = self._mc_client._post(url=self._build_path(list_id, 'segments'), data=data)
        if response is not None:
            self.segment_id = response['id']
        else:
            self.segment_id = None
        return response


    def all(self, list_id, get_all=False, **queryparams):
        """
        Get information about all available segments for a specific list.

        :param list_id: The unique id for the list.
        :type list_id: :py:class:`str`
        :param get_all: Should the query get all results
        :type get_all: :py:class:`bool`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        queryparams['count'] = integer
        queryparams['offset'] = integer
        queryparams['type'] = string
        queryparams['before_created_at'] = string
        queryparams['since_created_at'] = string
        queryparams['before_updated_at'] = string
        queryparams['since_updated_at'] = string
        """
        self.list_id = list_id
        self.segment_id = None
        if get_all:
            return self._iterate(url=self._build_path(list_id, 'segments'), **queryparams)
        else:
            return self._mc_client._get(url=self._build_path(list_id, 'segments'), **queryparams)


    def get(self, list_id, segment_id, **queryparams):
        """
        Get information about a specific segment.

        :param list_id: The unique id for the list.
        :type list_id: :py:class:`str`
        :param segment_id: The unique id for the segment.
        :type segment_id: :py:class:`str`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        self.list_id = list_id
        self.segment_id = segment_id
        return self._mc_client._get(url=self._build_path(list_id, 'segments', segment_id), **queryparams)


    def update(self, list_id, segment_id, data):
        """
        Update a specific segment in a list.

        :param list_id: The unique id for the list.
        :type list_id: :py:class:`str`
        :param segment_id: The unique id for the segment.
        :type segment_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "name": string*
        }
        """
        self.list_id = list_id
        self.segment_id = segment_id
        if 'name' not in data:
            raise KeyError('The list segment must have a name')
        return self._mc_client._patch(url=self._build_path(list_id, 'segments', segment_id), data=data)


    def update_members(self, list_id, segment_id, data):
        """
        Batch add/remove list members to static segment.

        :param list_id: The unique id for the list.
        :type list_id: :py:class:`str`
        :param segment_id: The unique id for the segment.
        :type segment_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "members_to_add": array,
            "members_to_remove": array
        }
        """
        self.list_id = list_id
        self.segment_id = segment_id
        return self._mc_client._post(url=self._build_path(list_id, 'segments', segment_id), data=data)


    def delete(self, list_id, segment_id):
        """
        Delete a specific segment in a list.

        :param list_id: The unique id for the list.
        :type list_id: :py:class:`str`
        :param segment_id: The unique id for the segment.
        :type segment_id: :py:class:`str`
        """
        self.list_id = list_id
        self.segment_id = segment_id
        return self._mc_client._delete(url=self._build_path(list_id, 'segments', segment_id))
