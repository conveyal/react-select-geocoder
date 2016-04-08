import {search} from 'isomorphic-mapzen-search'
import React, {PropTypes} from 'react'
import {PureComponent, shallowEqual} from 'react-pure-render'
import Select from 'react-select'
import throttle from 'throttleit'

class Geocoder extends PureComponent {
  static propTypes = {
    apiKey: PropTypes.string.isRequired,
    boundary: PropTypes.object,
    featureToLabel: PropTypes.func,
    featureToValue: PropTypes.func,
    focusLatlng: PropTypes.any,
    onChange: PropTypes.func,
    rateLimit: PropTypes.number,
    value: PropTypes.object
  }

  static defaultProps = {
    featureToLabel: (feature) => feature.properties.label,
    featureToValue: (feature) => `${feature.properties.label}-${feature.geometry.coordinates.join(',')}`
  }

  options = {}

  state = {
    value: this.props.value || null
  }

  cacheOptions (options) {
    options.forEach((o) => {
      this.options[o.value] = o.feature
    })
  }

  componentWillReceiveProps (nextProps) {
    if (!shallowEqual(nextProps.value, this.props.value)) {
      this.setState({value: nextProps.value})
    }
  }

  onChange (value) {
    this.setState({value})
    this.props.onChange && this.props.onChange(value && this.options[value.value])
  }

  render () {
    const {apiKey, boundary, featureToLabel, featureToValue, focusLatlng, rateLimit} = this.props
    const featureToOption = (feature) => {
      return {
        feature,
        label: featureToLabel(feature),
        value: featureToValue(feature)
      }
    }
    const loadOptions = throttle((input) => {
      return search(apiKey, input, {
        boundary,
        focusLatlng
      }).then((geojson) => {
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
        onChange={(value) => this.onChange(value)}
        value={this.state.value}
        />
    )
  }
}

module.exports = Geocoder
