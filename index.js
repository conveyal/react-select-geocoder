import {search} from 'isomorphic-mapzen-search'
import React, {Component, PropTypes} from 'react'
import Select from 'react-select'
import throttle from 'throttleit'

class Geocoder extends Component {
  static propTypes = {
    apiKey: PropTypes.string.isRequired,
    boundary: PropTypes.shape({
      country: PropTypes.string,
      minLatlng: PropTypes.any,
      maxLatlng: PropTypes.any
    }),
    focusLatlng: PropTypes.any,
    onChange: PropTypes.func,
    rateLimit: PropTypes.number,
    value: PropTypes.string
  };

  options = {};

  state = {
    value: this.props.value || null
  };

  cacheOptions (options) {
    options.forEach(o => {
      this.options[o.value] = o.feature
    })
  }

  componentWillReceiveProps (nextProps) {
    if (!eqOpts(nextProps.value, this.props.value)) {
      this.setState({ value: nextProps.value })
    }
  }

  onChange (value) {
    this.setState({ value })
    this.props.onChange && this.props.onChange(value && this.options[value.value])
  }

  shouldComponentUpdate (nextProps, nextState) {
    return !eqOpts(nextState.value, this.state.value)
  }

  render () {
    const {apiKey, boundary, focusLatlng, rateLimit} = this.props
    const loadOptions = throttle(input => {
      return search(apiKey, input, {
        boundary,
        focusLatlng
      }).then(geojson => {
        const options = geojson && geojson.features
          ? geojson.features.map(featureToOption)
          : []
        this.cacheOptions(options)
        return {options}
      })
    }, rateLimit || 500)

    return (
      <Select.Async
        autoload={false}
        cacheAsyncResults={false}
        filterOptions={false}
        loadOptions={loadOptions}
        minimumInput={3}
        {...this.props}
        onChange={value => this.onChange(value)}
        value={this.state.value}
        />
    )
  }
}

function eqOpts (o1, o2) {
  return o1 === o2 || (o1 && o2 && o1.value === o2.value && o1.label === o2.label)
}

function featureToOption (feature) {
  return {
    feature,
    label: feature.properties.label,
    value: feature.geometry.coordinates.join(',')
  }
}

module.exports = Geocoder
