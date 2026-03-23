# coding=utf-8
"""
The Landing Pages API endpoint

Documentation: https://mailchimp.com/developer/reference/landing-pages/
Schema: https://api.mailchimp.com/schema/3.0/LandingPages/Instance.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi
from mailchimp3.entities.landingpageaction import LandingPageAction
from mailchimp3.entities.landingpagecontent import LandingPageContent


class LandingPages(BaseApi):
    """
    Manage your Landing Pages, including publishing and unpublishing.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(LandingPages, self).__init__(*args, **kwargs)
        self.endpoint = 'landing-pages'
        self.page_id = None
        self.content = LandingPageContent(self)
        self.actions = LandingPageAction(self)


    def create(self, data):
        """
        Create a new Landing Page.

        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "list_id": string*,
        }
        """
        if 'list_id' not in data:
            raise KeyError('The landing page must have a list_id')
        response = self._mc_client._post(url=self._build_path(), data=data)
        if response is not None:
            self.page_id = response['id']
        else:
            self.page_id = None
        return response


    def all(self, get_all=False, **queryparams):
        """
        Get all landinge pages.

        :param get_all: Should the query get all results
        :type get_all: :py:class:`bool`
        :param queryparams: The query string parameters
        queryparams['sort_field'] = string
        queryparams['sort_dir'] = string
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        queryparams['count'] = integer
        """
        self.page_id = None
        if get_all:
            return self._iterate(url=self._build_path(), **queryparams)
        else:
            return self._mc_client._get(url=self._build_path(), **queryparams)


    def get(self, page_id, **queryparams):
        """
        Get information about a specific page.

        :param page_id: The unique id for the page.
        :type page_id: :py:class:`str`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        self.page_id = page_id
        return self._mc_client._get(url=self._build_path(page_id), **queryparams)


    def update(self, page_id, data):
        """
        Update a landing page.

        :param page_id: The unique id for the landing page.
        :type page_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        """
        self.page_id = page_id
        return self._mc_client._patch(url=self._build_path(page_id), data=data)


    def delete(self, page_id):
        """
        Remove a landing page from your MailChimp account.

        :param page_id: The unique id for the landing page.
        :type page_id: :py:class:`str`
        """
        self.page_id = page_id
        return self._mc_client._delete(url=self._build_path(page_id))
