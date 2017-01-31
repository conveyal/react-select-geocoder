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
      this.cacheOptions(options)
      return {options}
    })
  }

  _onChange = (value) => {
    this.setState({value})
    this.props.onChange && this.props.onChange(value && this.options[value.value])
  }

  _saveRef = (select) => {
    this.select = select
  }

  render () {
    return (
      <Select.Async
        autoload={false}
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
