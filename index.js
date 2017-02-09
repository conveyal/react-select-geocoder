// import Icon from '@conveyal/woonerf/components/icon'
import {search as mapzenSearch} from 'isomorphic-mapzen-search'
import throttle from 'lodash.throttle'
import React, {PropTypes} from 'react'
import {PureComponent, shallowEqual} from 'react-pure-render'
import Select from 'react-select'

class Geocoder extends PureComponent {
  static propTypes = {
    apiKey: PropTypes.string.isRequired,
    boundary: PropTypes.object,
    featureToLabel: PropTypes.func,
    featureToValue: PropTypes.func,
    focusPoint: PropTypes.any,
    onChange: PropTypes.func,
    rateLimit: PropTypes.number,
    search: PropTypes.func,
    value: PropTypes.object
  }

  static defaultProps = {
    featureToLabel: (feature) => feature.properties.label,
    featureToValue: (feature) => `${feature.properties.label}-${feature.geometry.coordinates.join(',')}`,
    search: mapzenSearch
  }

  options = {}

  state = {
    value: this.props.value || null,
    position: null
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
  renderGeolocateOption (option) {

  }
  loadOptions = (input) => {
    const {apiKey, boundary, focusPoint, search} = this.props
    return search({
      apiKey,
      boundary,
      focusPoint,
      text: input
    }).then((geojson) => {
      const options = geojson && geojson.features
        ? geojson.features.map(this.featureToOption)
        : []
      // insert geolocate option if geolocate is enabled
      if (this.props.geolocate && 'geolocation' in navigator && input === '') {
        // TODO: handle option rendering in renderGeolocateOption with <Icon type={option.icon} />
        options.push({
          icon: 'location-arrow',
          label: 'Use my location',
          value: 'TBD',
          geolocate: true,
          feature: {
            properties: {label: 'test'},
            geometry: {
              coordinates: [0, 0]
            }
          }
        })
      } else {
        /* geolocation IS NOT available, do nothing */
      }
      this.cacheOptions(options)
      return {options}
    })
  }

  _onChange = (value) => {
    if (value && value.geolocate) {
      value.label = 'Finding your location...'
      this.setState({value})
      navigator.geolocation.getCurrentPosition((position) => {
        const result = {
          icon: 'location-arrow',
          label: `My location (${position.coords.longitude.toFixed(5)}, ${position.coords.latitude.toFixed(5)})`,
          value: `${position.coords.longitude},${position.coords.latitude}`,
          geolocate: true
        }
        this.setState({value: result})
        this.props.onChange && this.props.onChange(value && this.options[value.value])
      })
    } else {
      this.setState({value})
      this.props.onChange && this.props.onChange(value && this.options[value.value])
    }
  }

  _saveRef = (select) => {
    this.select = select
  }

  render () {
    return (
      <Select.Async
        autoload
        cacheAsyncResults={false}
        filterOptions={false}
        loadOptions={this._throttledLoadOptions}
        minimumInput={3}
        {...this.props}
        onChange={this._onChange}
        ref={this._saveRef}
        value={this.state.value}
        />
    )
  }
}

module.exports = Geocoder
