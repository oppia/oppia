# coding=utf-8
"""
The Templates API endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/templates/
Schema: https://api.mailchimp.com/schema/3.0/Templates/Instance.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi
from mailchimp3.entities.templatedefaultcontent import TemplateDefaultContent


class Templates(BaseApi):
    """
    Manage your MailChimp templates. A template is an HTML file used to create
    the layout and basic design for a campaign.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(Templates, self).__init__(*args, **kwargs)
        self.endpoint = 'templates'
        self.template_id = None
        self.default_content = TemplateDefaultContent(self)


    def create(self, data):
        """
        Create a new template for the account. Only Classic templates are
        supported.

        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "name": string*,
            "html": string*
        }
        """
        if 'name' not in data:
            raise KeyError('The template must have a name')
        if 'html' not in data:
            raise KeyError('The template must have html')
        response = self._mc_client._post(url=self._build_path(), data=data)
        if response is not None:
            self.template_id = response['id']
        else:
            self.template_id = None
        return response


    def all(self, get_all=False, **queryparams):
        """
        Get a list of an account’s available templates.

        :param get_all: Should the query get all results
        :type get_all: :py:class:`bool`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        queryparams['count'] = integer
        queryparams['offset'] = integer
        queryparams['created_by'] = string
        queryparams['before_created_at'] = string
        queryparams['since_created_at'] = string
        queryparams['type'] = string
        queryparams['folder_id'] = string
        """
        self.template_id = None
        if get_all:
            return self._iterate(url=self._build_path(), **queryparams)
        else:
            return self._mc_client._get(url=self._build_path(), **queryparams)


    def get(self, template_id, **queryparams):
        """
        Get information about a specific template.

        :param template_id: The unique id for the template.
        :type template_id: :py:class:`str`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        self.template_id = template_id
        return self._mc_client._get(url=self._build_path(template_id), **queryparams)


    def update(self, template_id, data):
        """
        Update the name, HTML, or folder_id of an existing template.

        :param template_id: The unique id for the template.
        :type template_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "name": string*,
            "html": string*
        }
        """
        if 'name' not in data:
            raise KeyError('The template must have a name')
        if 'html' not in data:
            raise KeyError('The template must have html')
        self.template_id = template_id
        return self._mc_client._patch(url=self._build_path(template_id), data=data)


    def delete(self, template_id):
        """
        Delete a specific template.

        :param template_id: The unique id for the template.
        :type template_id: :py:class:`str`
        """
        self.template_id = template_id
        return self._mc_client._delete(url=self._build_path(template_id))
