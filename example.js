import React from 'react'
import {render} from 'react-dom'

import Geocoder from './index'

const div = document.createElement('div')
document.body.appendChild(div)

render(
  <Geocoder
    apiKey={process.env.MAPZEN_KEY}
    featureToLabel={({properties}) => {
      let {label, localadmin, locality} = properties
      if (localadmin && locality) {
        if (locality === 'Indianapolis city (balance)') {
          locality = 'Indianapolis'
        }
        return label.replace(localadmin, locality)
      }
      return label
    }}
    onChange={(value) => console.log(value)}
    />,
  div
)
