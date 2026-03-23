# coding=utf-8
"""
The File Manager Files API endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/file-manager/files/
Schema: https://api.mailchimp.com/schema/3.0/FileManager/Files/Instance.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi


class FileManagerFiles(BaseApi):
    """
    Manage specific files in the File Manager for your MailChimp account. The
    File Manager is a place to store images, documents, and other files you
    include or link to in your campaigns, templates, or signup forms.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(FileManagerFiles, self).__init__(*args, **kwargs)
        self.endpoint = 'file-manager/files'
        self.file_id = None


    def create(self, data):
        """
        Upload a new image or file to the File Manager.

        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "name": string*,
            "file_data": string*
        }
        """
        if 'name' not in data:
            raise KeyError('The file must have a name')
        if 'file_data' not in data:
            raise KeyError('The file must have file_data')
        response = self._mc_client._post(url=self._build_path(), data=data)
        if response is not None:
            self.file_id = response['id']
        else:
            self.file_id = None
        return response


    def all(self, get_all=False, **queryparams):
        """
        Get a list of available images and files stored in the File Manager for the account.

        :param get_all: Should the query get all results
        :type get_all: :py:class:`bool`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        queryparams['count'] = integer
        queryparams['offset'] = integer
        queryparams['type'] = string
        queryparams['created_by'] = string
        queryparams['before_created_at'] = string
        queryparams['since_created_at'] = string
        queryparams['sort_field'] = string
        queryparams['sort_dir'] = string
        """
        self.file_id = None
        if get_all:
            return self._iterate(url=self._build_path(), **queryparams)
        else:
            return self._mc_client._get(url=self._build_path(), **queryparams)


    def get(self, file_id, **queryparams):
        """
        Get information about a specific file in the File Manager.

        :param file_id: The unique id for the File Manager file.
        :type file_id: :py:class:`str`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        self.file_id = file_id
        return self._mc_client._get(url=self._build_path(file_id), **queryparams)


    def update(self, file_id, data):
        """
        Update a file in the File Manager.

        :param file_id: The unique id for the File Manager file.
        :type file_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "name": string*,
            "file_data": string*
        }
        """
        self.file_id = file_id
        if 'name' not in data:
            raise KeyError('The file must have a name')
        if 'file_data' not in data:
            raise KeyError('The file must have file_data')
        return self._mc_client._patch(url=self._build_path(file_id), data=data)


    def delete(self, file_id):
        """
        Remove a specific file from the File Manager.

        :param file_id: The unique id for the File Manager file.
        :type file_id: :py:class:`str`
        """
        self.file_id = file_id
        return self._mc_client._delete(url=self._build_path(file_id))
