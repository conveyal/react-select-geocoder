# react-select-geocoder
Geocoder that uses react-select

## Usage

```js
import Geocoder from 'react-select-geocoder'
render(
  <Geocoder
    apiKey={process.env.MAPZEN_KEY}
    onChange={value => console.log(value)}
    />
  , div
)
```
