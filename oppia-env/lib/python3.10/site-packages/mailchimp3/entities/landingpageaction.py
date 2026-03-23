# coding=utf-8
"""
The Landinge Page actions API endpoint

Documentation: https://mailchimp.com/developer/reference/landing-pages/
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi


class LandingPageAction(BaseApi):
    """
    Manage your Landing Pages, including publishing and unpublishing.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(LandingPageAction, self).__init__(*args, **kwargs)
        self.endpoint = 'landing-pages'
        self.page_id = None


    def publish(self, page_id):
        """
        Publish a landing page that is in draft, unpublished, or has been
        previously published and edited.

        :param page_id: The unique id for the page.
        :type page_id: :py:class:`str`
        """
        self.page_id = page_id
        return self._mc_client._post(url=self._build_path(page_id, 'actions/publish'))


    def unpublish(self, page_id):
        """
        Unpublish a landing page that is in draft or has been published.

        :param page_id: The unique id for the page.
        :type page_id: :py:class:`str`
        """
        self.page_id = page_id
        return self._mc_client._post(url=self._build_path(page_id, 'actions/unpublish'))
