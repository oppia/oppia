# coding=utf-8
"""
The E-commerce Store Carts endpoint API endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/ecommerce/stores/carts/
Schema: https://api.mailchimp.com/schema/3.0/Ecommerce/Stores/Carts/Instance.json
"""
from __future__ import unicode_literals

import re

from mailchimp3.baseapi import BaseApi
from mailchimp3.entities.storecartlines import StoreCartLines


class StoreCarts(BaseApi):
    """
    Use Carts to represent unfinished e-commerce transactions. This can be
    used to create an Abandoned Cart workflow, or to save a consumer’s
    shopping cart pending a successful Order.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(StoreCarts, self).__init__(*args, **kwargs)
        self.endpoint = 'ecommerce/stores'
        self.store_id = None
        self.cart_id = None
        self.lines = StoreCartLines(self)


    def create(self, store_id, data):
        """
        Add a new cart to a store.

        :param store_id: The store id.
        :type store_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "id": string*,
            "customer": object*
            {
                "id": string*
            },
            "currency_code": string*,
            "order_total": number*,
            "lines": array*
            [
                {
                    "id": string*,
                    "product_id": string*,
                    "product_variant_id": string*,
                    "quantity": integer*,
                    "price": number*
                }
            ]
        }
        """
        self.store_id = store_id
        if 'id' not in data:
            raise KeyError('The cart must have an id')
        if 'customer' not in data:
            raise KeyError('The cart must have a customer')
        if 'id' not in data['customer']:
            raise KeyError('The cart customer must have an id')
        if 'currency_code' not in data:
            raise KeyError('The cart must have a currency_code')
        if not re.match(r"^[A-Z]{3}$", data['currency_code']):
            raise ValueError('The currency_code must be a valid 3-letter ISO 4217 currency code')
        if 'order_total' not in data:
            raise KeyError('The cart must have an order_total')
        if 'lines' not in data:
            raise KeyError('The cart must have at least one cart line')
        for line in data['lines']:
            if 'id' not in line:
                raise KeyError('Each cart line must have an id')
            if 'product_id' not in line:
                raise KeyError('Each cart line must have a product_id')
            if 'product_variant_id' not in line:
                raise KeyError('Each cart line must have a product_variant_id')
            if 'quantity' not in line:
                raise KeyError('Each cart line must have a quantity')
            if 'price' not in line:
                raise KeyError('Each cart line must have a price')
        response = self._mc_client._post(url=self._build_path(store_id, 'carts'), data=data)
        if response is not None:
            self.cart_id = response['id']
        else:
            self.cart_id = None
        return response


    def all(self, store_id, get_all=False, **queryparams):
        """
        Get information about a store’s carts.

        :param store_id: The store id.
        :type store_id: :py:class:`str`
        :param get_all: Should the query get all results
        :type get_all: :py:class:`bool`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        queryparams['count'] = integer
        queryparams['offset'] = integer
        """
        self.store_id = store_id
        self.cart_id = None
        if get_all:
            return self._iterate(url=self._build_path(store_id, 'carts'), **queryparams)
        else:
            return self._mc_client._get(url=self._build_path(store_id, 'carts'), **queryparams)


    def get(self, store_id, cart_id, **queryparams):
        """
        Get information about a specific cart.

        :param store_id: The store id.
        :type store_id: :py:class:`str`
        :param cart_id: The id for the cart.
        :type cart_id: :py:class:`str`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        self.store_id = store_id
        self.cart_id = cart_id
        return self._mc_client._get(url=self._build_path(store_id, 'carts', cart_id), **queryparams)


    def update(self, store_id, cart_id, data):
        """
        Update a specific cart.

        :param store_id: The store id.
        :type store_id: :py:class:`str`
        :param cart_id: The id for the cart.
        :type cart_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        """
        self.store_id = store_id
        self.cart_id = cart_id
        return self._mc_client._patch(url=self._build_path(store_id, 'carts', cart_id), data=data)


    def delete(self, store_id, cart_id):
        """
        Delete a cart.

        :param store_id: The store id.
        :type store_id: :py:class:`str`
        :param cart_id: The id for the cart.
        :type cart_id: :py:class:`str`
        """
        self.store_id = store_id
        self.cart_id = cart_id
        return self._mc_client._delete(url=self._build_path(store_id, 'carts', cart_id))
