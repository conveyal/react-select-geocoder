import React from 'react'
import {render} from 'react-dom'

import Geocoder from './index'

const div = document.createElement('div')
document.body.appendChild(div)

render(
  <Geocoder
    apiKey={process.env.MAPZEN_KEY}
    onChange={value => console.log(value)}
    />,
  div
)
