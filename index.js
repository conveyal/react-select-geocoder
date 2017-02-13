import {search as mapzenSearch, reverse as reverseSearch} from 'isomorphic-mapzen-search'
import throttle from 'lodash.throttle'
import React, {Component, PropTypes} from 'react'
import {shallowEqual} from 'react-pure-render'
import Select from 'react-select'

const GEOLOCATE_VALUE = 'geolocate'

class Geocoder extends Component {
  static propTypes = {
    apiKey: PropTypes.string.isRequired,
    boundary: PropTypes.object,
    featureToLabel: PropTypes.func,
    featureToValue: PropTypes.func,
    findingLocationText: PropTypes.string,
    focusPoint: PropTypes.any,
    geocode: PropTypes.bool,
    onChange: PropTypes.func,
    placeholder: PropTypes.string,
    rateLimit: PropTypes.number,
    reverseSearch: PropTypes.func,
    search: PropTypes.func,
    useLocationText: PropTypes.string,
    value: PropTypes.object
  }

  static defaultProps = {
    featureToLabel: (feature) => feature.properties.label,
    featureToValue: (feature) => `${feature.properties.label}-${feature.geometry.coordinates.join(',')}`,
    findingLocationText: 'Locating you...',
    reverseSearch,
    search: mapzenSearch,
    useLocationText: 'Use Current Location'
  }

  options = {}

  state = {
    options: this.defaultOptions(),
    value: this.props.value || null
  }

  cacheOptions (options) {
    options.forEach((o) => {
      this.options[o.value] = o.feature
    })
  }

  componentWillMount () {
    this._throttledLoadOptions = throttle(this.loadOptions, this.props.rateLimit || 500)
  }

  componentWillReceiveProps (nextProps) {
    if (!shallowEqual(nextProps.value, this.props.value)) {
      this.setState({value: nextProps.value})
    }

    if (this.props.rateLimit !== nextProps.rateLimit) {
      this._throttledLoadOptions = throttle(this.loadOptions, this.props.rateLimit || 500)
    }
  }

  defaultOptions () {
    return this.props.geolocate && 'geolocation' in navigator
      ? [{label: this.props.useLocationText, value: GEOLOCATE_VALUE}]
      : []
  }

  featureToOption = (feature) => {
    const {featureToLabel, featureToValue} = this.props
    return {
      feature,
      label: featureToLabel(feature),
      value: featureToValue(feature)
    }
  }

  focus () {
    this.select.focus()
  }

  loadOptions = (input, callback) => {
    const {apiKey, boundary, focusPoint, geolocate, search} = this.props
    if (!input) {
      if (geolocate && 'geolocation' in navigator) {
        callback(null, {
          options: this.defaultOptions()
        })
      }
    } else {
      search({
        apiKey,
        boundary,
        focusPoint,
        text: input
      }).then((geojson) => {
        const options = geojson && geojson.features
          ? geojson.features.map(this.featureToOption)
          : []
        this.cacheOptions(options)
        callback(null, {options})
      }).catch((error) => {
        callback(error)
      })
    }
  }

  _onChange = (value) => {
    const {apiKey, findingLocationText, onChange, reverseSearch} = this.props
    if (value && value.value === GEOLOCATE_VALUE) {
      this.setState({
        ...this.state,
        value: {
          label: findingLocationText
        }
      })
      window.navigator.geolocation.getCurrentPosition((position) => {
        reverseSearch({
          apiKey,
          point: position.coords
        }).then((geojson) => {
          const value = this.featureToOption(geojson.features[0])
          this.setState({
            ...this.state,
            value
          })
          onChange && onChange(value)
        }).catch((err) => {
          console.log('Error during reverse lookup of ', position)
          console.error(err)
        })
      })
    } else {
      if (!value) {
        this.setState({
          options: this.defaultOptions(),
          value
        })
      } else {
        this.setState({value})
      }
      this.props.onChange && this.props.onChange(value && this.options[value.value])
    }
  }

  _saveRef = (select) => {
    this.select = select
  }

  renderCount = 0
  render () {
    return (
      <Select.Async
        autoBlur
        autoload={false}
        cache={false}
        filterOptions={false}
        ignoreAccents={false}
        ignoreCase={false}
        loadOptions={this._throttledLoadOptions}
        minimumInput={3}
        options={this.state.options}
        {...this.props}
        onChange={this._onChange}
        ref={this._saveRef}
        value={this.state.value}
        />
    )
  }
}

module.exports = Geocoder
