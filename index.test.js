/* globals describe, expect, it */

import {mount} from 'enzyme'
import {mountToJson} from 'enzyme-to-json'
import React from 'react'

import Geocoder from './index'

// add a div to jsdom for enzyme to mount to
const div = document.createElement('div')
div.id = 'test'
document.body.appendChild(div)

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
})
