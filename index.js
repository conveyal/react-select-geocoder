import stableStringify from 'json-stable-stringify'
import {autocomplete as mapzenAutocomplete, reverse as reverseSearch} from 'isomorphic-mapzen-search'
import isEqual from 'lodash/isEqual'
import throttle from 'lodash/throttle'
import PropTypes from 'prop-types'
import React, {Component} from 'react'
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
    geolocate: PropTypes.bool,
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
    search: mapzenAutocomplete,
    useLocationText: 'Use Current Location'
  }

  autocompleteCache = {}

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
    if (!isEqual(nextProps.value, this.props.value)) {
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
      } else {
        callback(null);
      }
    } else {
      const autocompleteQuery = {
        apiKey,
        boundary,
        focusPoint,
        text: input
      }
      const autocompleteQueryKey = stableStringify(autocompleteQuery)

      // check if autocomplete query has been made before
      const cacheValue = this.autocompleteCache[autocompleteQueryKey]
      if (cacheValue) {
        return callback(null, cacheValue)
      }

      search(autocompleteQuery).then((geojson) => {
        const options = geojson && geojson.features
          ? geojson.features.map(this.featureToOption)
          : []
        this.cacheOptions(options)
        this.autocompleteCache[autocompleteQueryKey] = {options}
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
          console.error('Error during reverse lookup of', position)
          console.error(err)
          const value = this.featureToOption({
            type: 'Feature',
            properties: {
              label: `${position.longitude}, ${position.latitude}`
            },
            geometry: {
              type: 'Point',
              coordinates: [
                position.longitude,
                position.latitude
              ]
            }
          })
          this.setState({
            ...this.state,
            value
          })
          onChange && onChange(value)
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
        onBlurResetsInput={false}
        />
    )
  }
}

module.exports = Geocoder
