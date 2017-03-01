/* globals describe, expect, it */

import {mount} from 'enzyme'
import {mountToJson} from 'enzyme-to-json'
import nock from 'nock'
import React from 'react'

import Geocoder from './index'
const mockAutocompleteResult = require('./mock-autocomplete-result.json')

// add a div to jsdom for enzyme to mount to
const div = document.createElement('div')
div.id = 'test'
document.body.appendChild(div)

function timeoutPromise (ms) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms)
  })
}

describe('Geocoder', () => {
  it('should render', () => {
    const tree = mount(
      <Geocoder
        apiKey='test'
        />
    , {
      attachTo: document.getElementById('test')
    })
    expect(mountToJson(tree)).toMatchSnapshot()
  })

  it('should process input change', async () => {
    nock('https://search.mapzen.com/')
      .get(/v1\/autocomplete/)
      .reply(200, mockAutocompleteResult)

    const tree = mount(
      <Geocoder
        apiKey='test'
        />
    , {
      attachTo: document.getElementById('test')
    })

    let calculatedOptions

    tree.find('Async').props().loadOptions('123 main', (error, result) => {
      expect(error).toBeFalsy()
      calculatedOptions = result
    })

    // wait for query to mapzen
    await timeoutPromise(1000)

    expect(calculatedOptions.options).toHaveLength(10)
  })
})
