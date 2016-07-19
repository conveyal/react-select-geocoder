import {search as mapzenSearch} from 'isomorphic-mapzen-search'
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
    search: PropTypes.func,
    value: PropTypes.object
  };

  static defaultProps = {
    featureToLabel: (feature) => feature.properties.label,
    featureToValue: (feature) => `${feature.properties.label}-${feature.geometry.coordinates.join(',')}`,
    search: mapzenSearch
  };

  options = {};

  state = {
    value: this.props.value || null
  };

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

  featureToOption = (feature) => {
    const {featureToLabel, featureToValue} = this.props
    return {
      feature,
      label: featureToLabel(feature),
      value: featureToValue(feature)
    }
  };

  loadOptions = (input) => {
    const {apiKey, focusLatlng, boundary, search} = this.props
    return search(apiKey, input, {
      boundary,
      focusLatlng
    }).then((geojson) => {
      const options = geojson && geojson.features
        ? geojson.features.map(this.featureToOption)
        : []
      this.cacheOptions(options)
      return {options}
    })
  };

  throttleLoadOptions = (loadOptions) => {
    return throttle(loadOptions, this.props.rateLimit || 500)
  };

  onChange = (value) => {
    this.setState({value})
    this.props.onChange && this.props.onChange(value && this.options[value.value])
  };

  render () {
    return (
      <Select.Async
        autoload={false}
        cacheAsyncResults={false}
        filterOptions={false}
        loadOptions={this.throttleLoadOptions(this.loadOptions)}
        minimumInput={3}
        {...this.props}
        onChange={this.onChange}
        value={this.state.value}
        />
    )
  }
}

module.exports = Geocoder
