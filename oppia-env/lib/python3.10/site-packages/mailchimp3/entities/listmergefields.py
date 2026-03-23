# coding=utf-8
"""
The List Merge Fields API endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/lists/merge-fields/
Schema: https://api.mailchimp.com/schema/3.0/Lists/MergeFields/Instance.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi


class ListMergeFields(BaseApi):
    """
    Manage merge fields (formerly merge vars) for a specific list.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(ListMergeFields, self).__init__(*args, **kwargs)
        self.endpoint = 'lists'
        self.list_id = None
        self.merge_id = None


    def create(self, list_id, data):
        """
        Add a new merge field for a specific list.

        :param list_id: The unique id for the list.
        :type list_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "name": string*,
            "type": string*
        }
        """
        self.list_id = list_id
        if 'name' not in data:
            raise KeyError('The list merge field must have a name')
        if 'type' not in data:
            raise KeyError('The list merge field must have a type')
        response = self._mc_client._post(url=self._build_path(list_id, 'merge-fields'), data=data)
        if response is not None:
            self.merge_id = response['merge_id']
        else:
            self.merge_id = None
        return response


    def all(self, list_id, get_all=False, **queryparams):
        """
        Get a list of all merge fields (formerly merge vars) for a list.

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
        queryparams['required'] = boolean
        """
        self.list_id = list_id
        self.merge_id = None
        if get_all:
            return self._iterate(url=self._build_path(list_id, 'merge-fields'), **queryparams)
        else:
            return self._mc_client._get(url=self._build_path(list_id, 'merge-fields'), **queryparams)


    def get(self, list_id, merge_id):
        """
        Get information about a specific merge field in a list.

        :param list_id: The unique id for the list.
        :type list_id: :py:class:`str`
        :param merge_id: The id for the merge field.
        :type merge_id: :py:class:`str`
        """
        self.list_id = list_id
        self.merge_id = merge_id
        return self._mc_client._get(url=self._build_path(list_id, 'merge-fields', merge_id))


    def update(self, list_id, merge_id, data):
        """
        Update a specific merge field in a list.

        :param list_id: The unique id for the list.
        :type list_id: :py:class:`str`
        :param merge_id: The id for the merge field.
        :type merge_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "name": string*
        }
        """
        self.list_id = list_id
        self.merge_id = merge_id
        if 'name' not in data:
            raise KeyError('The list merge field must have a name')
        return self._mc_client._patch(url=self._build_path(list_id, 'merge-fields', merge_id), data=data)


    def delete(self, list_id, merge_id):
        """
        Delete a specific merge field in a list.

        :param list_id: The unique id for the list.
        :type list_id: :py:class:`str`
        :param merge_id: The id for the merge field.
        :type merge_id: :py:class:`str`
        """
        self.list_id = list_id
        self.merge_id = merge_id
        return self._mc_client._delete(url=self._build_path(list_id, 'merge-fields', merge_id))
