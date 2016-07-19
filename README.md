# react-select-geocoder

[![NPM version][npm-image]][npm-url]
[![Build status][travis-image]][travis-url]

Geocoder that uses react-select

## Usage

Check the `propTypes` for the options.

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

[npm-image]: https://img.shields.io/npm/v/react-select-geocoder.svg?maxAge=2592000?style=flat-square
[npm-url]: https://www.npmjs.com/package/react-select-geocoder
[travis-image]: https://img.shields.io/travis/conveyal/react-select-geocoder.svg?style=flat-square
[travis-url]: https://travis-ci.org/conveyal/react-select-geocoder
