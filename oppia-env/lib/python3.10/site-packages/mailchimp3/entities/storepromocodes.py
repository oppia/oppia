# coding=utf-8
"""
The E-commerce Stores Promo CodesAPI endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/ecommerce/stores/promo-rules
"""
from __future__ import unicode_literals
from mailchimp3.baseapi import BaseApi

class StorePromoCodes(BaseApi):
    """
        Promo Promo codes can be created for a given promo rule. All the promo codes under a promo rule share the
        generic information defined for that rule like the amount, type, expiration date etc.
        """
    def __init__(self, *args, **kwargs):
        """
        Initialize the Endpoint
        :param args:
        :param kwargs:
        """
        super(StorePromoCodes, self).__init__(*args, **kwargs)
        self.endpoint = 'ecommerce/stores'
        self.store_id = None

    def create(self, store_id, promo_rule_id, data):
        """
        Add a new promo code to a store.

        :param store_id: The store id
        :type store_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict'
        data = {
            "id": string*,
            "code": string*,
            "redemption_url": string*,
            "usage_count": string,
            "enabled": boolean,
            "created_at_foreign": string,
            "updated_at_foreign": string,
        }
        """
        self.store_id = store_id
        if 'id' not in data:
            raise KeyError('The promo code must have an id')
        if 'code' not in data:
            raise KeyError('This promo code must have a code')
        if 'redemption_url' not in data:
            raise KeyError('This promo code must have a redemption url')
        response = self._mc_client._post(url=self._build_path(store_id, 'promo-rules', promo_rule_id, 'promo-codes'), data=data)

        if response is not None:
            return response

    def all(self, store_id, promo_rule_id, get_all=False, **queryparams):
        """
        Get information about a store’s promo codes.

        :param store_id: The store's id
        :type store_id: `str`
        :param promo_rule_id: The store promo rule id
        :type store_id: `str`
        :param get_all:
        :type get_all: :py:class:`bool`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        queryparams['count'] = integer
        queryparams['offset'] = integer
        """
        self.store_id=store_id
        self.promo_rule_id=promo_rule_id
        if get_all:
            return self._iterate(url=self._build_path(store_id, 'promo-rules', promo_rule_id, 'promo-codes'), **queryparams)
        else:
            return self._mc_client._get(url=self._build_path(store_id, 'promo-rule', promo_rule_id), **queryparams)

    def get(self, store_id, promo_rule_id, promo_code_id, **queryparams):
        """
                Get information about a specific promo code.

                :param store_id: The store's id
                :type store_id: `string`
                :param queryparams: The query string parameters
                queryparams['fields'] = []
                queryparams['exclude_fields'] = []
                queryparams['count'] = integer
                queryparams['offset'] = integer
                """
        self.store_id = store_id
        self.promo_rule_id = promo_rule_id
        self.promo_code_id = promo_code_id
        return self._mc_client._get(url=self._build_path(store_id, 'promo-rules', promo_rule_id, 'promo-codes', promo_code_id), **queryparams)


    def update(self, store_id, promo_rule_id, promo_code_id, data):
        """
        Update a promo code

        :param store_id: The store id
        :type :py:class:`str`
        :param promo_rule_id: The id for the promo rule of a store.
        :type :py:class:`str`
        :param promo_code_id: The id for the promo code of a store.
        :type :py:class:`str`
        :param data:
        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "id": string,
            "title": string,
            "description": string,
            "starts_at": string,
            "ends_at": string,
            "amount": number,
            "type": string,
            "target": string,
            "enabled": boolean,
            "created_at_foreign": string,
            "updated_at_foreign": string,
        }
        """
        self.store_id = store_id
        self.promo_rule_id = promo_rule_id
        self.promo_code_id = promo_code_id
        return self._mc_client._patch(url=self._build_path(store_id, 'promo-rules', promo_rule_id, 'promo-codes', promo_code_id), data=data)

    def delete(self, store_id, promo_rule_id, promo_code_id):
        """
        Delete a promo code
        :param store_id: The store id
        :type :py:class:`str`
        :param promo_rule_id: The id for the promo rule of a store.
        :type :py:class:`str`
        :param promo_code_id: The id for the promo code of a store.
        :type :py:class:`str`
        """
        self.store_id=store_id
        self.promo_rule_id=promo_rule_id
        return self._mc_client._delete(url=self._build_path(store_id, 'promo-rules', promo_rule_id, 'promo-codes', promo_code_id))