jQuery(document).ready(function ($) {
  // state object
  var state = {
    location: '',
    longitude: '',
    latitude: '',
    latShort: '',
    lngShort: '',
    longitudeNum: 0,
    latitudeNum: 0,
    sunrise: '',
    sunset: '',
    twilightBegin: '',
    twilightEnd: '',
    adjustedSunrise: '',
    adjustedSunset: '',
    adjustedTwilightBegin: '',
    adjustedTwilightEnd: '',
    adjustedCurrentTime: '',
    adjustedCurrentTimeAmPm: '',
    solar_noon: '',
    day_length: '',
    formatted_address: '',
    latAndLng: '',
    timezone: '',
    dstOffset: 0,
    rawOffset: 0,
    totalOffset: 0,
    timeZoneId: '',
    timeZoneName: '',
    map: '',

    // colors for background gradient
    currentTopColor: '',
    currentBottomColor: '',
    top1: '',
    top2: '',
    bottom1: '',
    bottom2: '',

    venues: [],
    timeInSeconds: 0,

    // base URLs for API calls
    GOOGLE_GEOLOCATION_BASE_URL: 'https://maps.googleapis.com/maps/api/geocode/json',
    GOOGLE_TIMEZONE_URL: 'https://maps.googleapis.com/maps/api/timezone/json',
    GOOGLE_MAPS_URL: 'https://maps.googleapis.com/maps/api/js',
    SUNSET_SUNRISE_BASE_URL: 'https://api.sunrise-sunset.org/json',
    FOURSQUARE_BASE_URL: 'https://api.foursquare.com/v2/venues/explore',

    // API keys
    geoCodeApiKey: 'AIzaSyADtTrg7QCT61wFqPVZfbojoaLjrxS0SWg',
    timeZoneApiKey: 'AIzaSyCma0pv_5pfV9kY8l2eEEfM_w4ydOrNP9w',
    clientIdFoursquare: 'F0U2TBIRD2H3F5V4K34J3MBB0CJGZ1ZWAUOWIPAEK41SQ2C4',
    clientSecretFoursquare: '0RECP02DJS4CMO0I3EZQA2Y0XXPG4ZTSBEFZV2BP3REAVJE3'

  }

  // get the longitude and latitude data for the location the user entered
  // have to display a map when using google API
  function getDataFromGeocodeAPI (locationSearch, callback) {
    var locationQuery = {
      key: state.geoCodeApiKey,
      address: state.location
    }

    $.getJSON(state.GOOGLE_GEOLOCATION_BASE_URL, locationQuery, passGeoToState)
  };

  // get sunset and sunrise data for using the long&lat data that comes back from Google geocode API and use passGeoToState as callback function
  function getDataFromSunriseAPI (callback) {
    var sunQuery = {
      lat: state.latitude,
      lng: state.longitude
    }

    $.getJSON(state.SUNSET_SUNRISE_BASE_URL, sunQuery, callback)
  };

  // get data from foursqaure using the long&lat data that comes back from Google geocode API
  function getDataFromFoursquareAPI () {
    var venueQuery = {
      ll: state.latAndLng,
      limit: 9,
      venuePhotos: 1,
      categoryId: '4bf58dd8d48988d1e2941735,4bf58dd8d48988d1df941735,4bf58dd8d48988d1e0941735,4bf58dd8d48988d161941735,52e81612bcbc57f1066b7a21,4bf58dd8d48988d163941735,4bf58dd8d48988d165941735',
      client_id: state.clientIdFoursquare,
      client_secret: state.clientSecretFoursquare,
      v: 20170324,
      m: 'foursquare'
    }

    $.getJSON(state.FOURSQUARE_BASE_URL, venueQuery, displayFourResults)
  }

  // call this function in the getDataFromGeocodeAPI so that the data from the geocode API call is passed into this function
  // set the value for the state.latitude and state.longitude variables
  function passGeoToState (data) {
    state.latitude = data.results[0].geometry.location.lat
    state.longitude = data.results[0].geometry.location.lng
    state.formatted_address = data.results[0].formatted_address

    getDataFromSunriseAPI(addSunResults)
  }

  // add results from sunrise API to state
  function addSunResults (data) {
    state.sunrise = data.results.sunrise
    state.sunset = data.results.sunset
    state.solar_noon = data.results.solar_noon
    state.day_length = data.results.day_length
    state.twilightBegin = data.results.astronomical_twilight_begin
    state.twilightEnd = data.results.astronomical_twilight_end

    // call function to get timezone data
    getDataFromTimezoneAPI()
  }

  // times that comes back from sunrise API are in UTC and summer time adjustments are not included in the returned data
  // get the timezone of chosen location to apply the right timezone to sunrise and sunset times
  // timestamp parameter passed into API specifies the desired time as seconds since midnight, January 1, 1970 UTC
  // Used for daylight savings calculations

  function getDataFromTimezoneAPI (callback) {
    state.latShort = state.latitude.toFixed(2)
    state.lngShort = state.longitude.toFixed(2)
    state.latAndLng = state.latShort + ',' + state.lngShort

    state.timeInSeconds = moment().unix()

    var timezoneQuery = {
      key: state.timeZoneApiKey,
      location: state.latAndLng,
      timestamp: state.timeInSeconds
    }

    $.getJSON(state.GOOGLE_TIMEZONE_URL, timezoneQuery, passTimeZoneToState)
  }

  // calculate the local time using the UTC time that comes back from the sunrise/sunset API
  // combine with rawOffset (constant) and dstOffset (daylight savings time)

  function passTimeZoneToState (data) {
    state.dstOffset = data.dstOffset
    state.rawOffset = data.rawOffset
    state.timeZoneId = data.timeZoneId
    state.timeZoneName = data.timeZoneName
    state.totalOffset = (data.dstOffset + data.rawOffset) / 60
    state.adjustedSunrise = moment.utc(state.sunrise, ['h:mm:ss A']).utcOffset(state.totalOffset).format('h.mm A')
    state.adjustedSunset = moment.utc(state.sunset, ['h:mm:ss A']).utcOffset(state.totalOffset).format('h.mm A')
    state.adjustedTwilightBegin = moment.utc(state.twilightBegin, ['h:mm:ss A']).utcOffset(state.totalOffset).format('h.mm A')
    state.adjustedTwilightEnd = moment.utc(state.twilightEnd, ['h:mm:ss A']).utcOffset(state.totalOffset).format('h.mm A')
    state.adjustedCurrentTimeAmPm = moment.utc().utcOffset(state.totalOffset).format('h.mm A')
    state.adjustedCurrentTime = moment.utc().utcOffset(state.totalOffset).format('h:mm')

    var address = state.formatted_address

    if (state.formatted_address.length > 45) {
      address = state.formatted_address.slice(0, 45) + '...'
    }

    $('.js-suntimes-results').append("<div class='sun-times'><p class='sun-times'><b>" + address + '</b></br>Current: ' + state.adjustedCurrentTimeAmPm + '</br>Sunrise: ' + state.adjustedSunrise + '</br>Sunset: ' + state.adjustedSunset + '</p></div>')
    $('.addbutton').append('<p class="search-again">New search</p>')

    getDataFromFoursquareAPI() // call function so that the API call is made and results are displayed
  }

  // store data in state
  // display  a list of 9 venues with one picture each
  // TODO show 'no results' if there is nothing to display

  function displayFourResults (data) {
    console.log(data)
    if (data.response.groups && data.response.groups.length > 0 && data.response.groups[0].items && data.response.groups[0].items.length > 0) {
      for (var i = 0; i < data.response.groups[0].items.length; i++) {

        // if (data.response.groups[0].items[i].venue.photos.groups &&
        //   data.response.groups[0].items[i].venue.photos.groups.length > 0 &&
        //   data.response.groups[0].items[i].venue.photos.groups[0].items &&
        //   data.response.groups[0].items[i].venue.photos.groups[0].items.length > 0) {

          var startResults = data.response.groups[0].items[i].venue


          //stops here - foursqaure has restructured API and now need to make separate API calls using venue_id 
          var startImage = data.response.groups[0].items[i].venue.photos.groups[0].items[0]
          if (i < 9) {
            if (startResults.name.length < 30) {
              $('.row-1').append('<div class="col-4"><div class="venue-image"><a href=" http://foursquare.com/v/' + startResults.id + '?ref=' + state.client_id + '""><img src="' +
                startImage.prefix + '300x300' + startImage.suffix + '" alt="image of ' + startResults.name + ' class="desaturate">' +
                '<h4><span>' +
                startResults.name +
                '<span class="spacer"></span><br><span class="spacer"></span>' +
                startResults.categories[0].name +
                '<span></h4></a></div></div>')
            } else {
              var venueName = startResults.name.slice(0, 30) + '...'
              $('.row-1').append('<div class="col-4"><div class="venue-image"><a href=" http://foursquare.com/v/' + startResults.id + '?ref=' + state.client_id + '""><img src="' +
                startImage.prefix + '300x300' + startImage.suffix + '" alt="image of ' + startResults.name + ' class="desaturate">' +
                '<h4><span>' +
                venueName +
                '<span class="spacer"></span><br><span class="spacer"></span>' +
                startResults.categories[0].name +
                '<span></h4></a></div></div>')
            }
          }
        // }
      }
    }

    $('.js-hidden').removeClass('hidden')
    $('.js-add-map').html('<div id="map"></div>')
    getRatioAndColors()
    initMap()
  }

  // eventlistener for when user submits location
  // get value of search field and use this as the first parameter when calling getDataFromGeocodeAPI function
  // passGeoToState is the second parameter (callback function)

  function watchSubmit () {
    $('.js-search-form').submit(function (event) {
      event.preventDefault()
      var locationQuery = $('.js-query').val()
      state.location = locationQuery
      getDataFromGeocodeAPI(locationQuery, passGeoToState)
      $('.js-query').val('')
      $('.js-form').remove()
    })
  }

  $(function () {
    watchSubmit()
  })

  // format times to seconds to easier calculate which phase of the day the current time is in
  // to be used for calculating the dynamic background
  function timeInSeconds (time) {
    var S = time
    var times = S.split(':')
    var hours = times[0]
    var minutes = times[1]
    var seconds = (parseInt(minutes, 10) * 60) + (parseInt(hours, 10) * 60 * 60)

    return seconds
  }

  // set 8 different phases of day and use current time of day to calculate how far along into a phase the day is
  // use this to calculate the ratio between colors to be used for the linear-gradient in the background of the results page
  // for example if current time is 60% into phase 3, use 40% of phase 3 top and bottom color and mix with 60% of phase 4 top and bottom color

  function getRatioAndColors () {
    // format sunrise, sunset and current time to a form that can easily be used for transforming to calculations
    // use these variables to call the timeInSeconds function
    var sunrise = moment.utc(state.sunrise, ['h:mm:ss A']).utcOffset(state.totalOffset).format('H:mm')
    var sunset = moment.utc(state.sunset, ['h:mm:ss A']).utcOffset(state.totalOffset).format('H:mm')
    var twilightBegin = moment.utc(state.twilightBegin, ['h:mm:ss A']).utcOffset(state.totalOffset).format('H:mm')
    var twilightEnd = moment.utc(state.twilightEnd, ['h:mm:ss A']).utcOffset(state.totalOffset).format('H:mm')
    var current = moment.utc().utcOffset(state.totalOffset).format('H:mm')

    // phaseduration calculations
    var hourInSeconds = 60 * 60
    var sunriseInSeconds = timeInSeconds(sunrise)
    var sunsetInSeconds = timeInSeconds(sunset)
    var twilightBeginInSeconds = timeInSeconds(twilightBegin)
    var twilightEndInSeconds = timeInSeconds(twilightEnd)
    var currentInSeconds = timeInSeconds(current)

    var sunriseStart = sunriseInSeconds - hourInSeconds
    var sunriseEnd = sunriseInSeconds + hourInSeconds
    var sunsetStart = sunsetInSeconds - hourInSeconds
    var sunsetEnd = sunsetInSeconds + hourInSeconds
    var twilightMorningStart = twilightBeginInSeconds
    var twilightEveningEnd = twilightEndInSeconds
    var halfDay = (sunsetStart - sunriseEnd) / 2
    var dayTurn = sunriseEnd + halfDay
    var dayInSeconds = 24 * hourInSeconds

    // colors for the different phases
    var twilightMorningTop = 'A346C5'
    var twilightMorningBottom = 'F3902B'
    var sunriseTop = '85E6C4'
    var sunriseBottom = 'E1C139'
    var lateSunriseTop = '85E6A0'
    var lateSunriseBottom = 'CEC424'
    var dayTurnTop = '92DBD9'
    var dayTurnBottom = '4871C9'
    var earlySunsetTop = '82A5D7'
    var earlySunsetBottom = 'A88E49'
    var sunsetTop = 'E0C762'
    var sunsetBottom = 'E17539'
    var twilightEveningTop = 'AD3F7E'
    var twilightEveningBottom = 'D76041'
    var midnightTop = '5C82B2'
    var midnightBottom = '061931'

    var ratio1 = 0
    var ratio2 = 0

    // find which phase current time is in

    // phase 1
    if (currentInSeconds < twilightMorningStart && currentInSeconds >= 0) {
      ratio2 = currentInSeconds / twilightMorningStart // calculate how far into the phase the current time is --> use for calculating the ratio of the two top and two botton colors when they are mixed
      state.top1 = midnightTop
      state.bottom1 = midnightBottom
      state.top2 = twilightMorningTop
      state.bottom2 = twilightMorningBottom

      // phase 2
    } else if (currentInSeconds < sunriseStart && currentInSeconds >= twilightMorningStart) {
      ratio2 = (currentInSeconds - twilightMorningStart) / (sunriseStart - twilightMorningStart)
      state.top1 = twilightMorningTop
      state.bottom1 = twilightMorningBottom
      state.top2 = sunriseTop
      state.bottom2 = sunriseBottom

      // phase 3
    } else if (currentInSeconds >= sunriseStart && currentInSeconds <= sunriseEnd) {
      ratio2 = (currentInSeconds - sunriseStart) / (sunriseEnd - sunriseStart)
      state.top1 = sunriseTop
      state.bottom1 = sunriseBottom
      state.top2 = lateSunriseTop
      state.bottom2 = lateSunriseBottom

      // phase 4
    } else if (currentInSeconds > sunriseEnd && currentInSeconds < dayTurn) {
      ratio2 = (currentInSeconds - sunriseEnd) / (dayTurn - sunriseEnd)
      state.top1 = lateSunriseTop
      state.bottom1 = lateSunriseBottom
      state.top2 = dayTurnTop
      state.bottom2 = dayTurnBottom

      // phase 5
    } else if (currentInSeconds >= dayTurn && currentInSeconds <= sunsetStart) {
      ratio2 = (currentInSeconds - dayTurn) / (sunsetStart - dayTurn)
      state.top1 = dayTurnTop
      state.bottom1 = dayTurnBottom
      state.top2 = earlySunsetTop
      state.bottom2 = earlySunsetBottom

      // phase 6
    } else if (currentInSeconds > sunsetStart && currentInSeconds < sunsetEnd) {
      ratio2 = (currentInSeconds - sunsetStart) / (sunsetEnd - sunsetStart)
      state.top1 = earlySunsetTop
      state.bottom1 = earlySunsetBottom
      state.top2 = sunsetTop
      state.bottom2 = sunsetBottom

      // phase 7
    } else if (currentInSeconds > sunsetEnd && currentInSeconds <= twilightEveningEnd) {
      ratio2 = (currentInSeconds - sunsetEnd) / (twilightEveningEnd - sunsetEnd)
      state.top1 = sunsetTop
      state.bottom1 = sunsetBottom
      state.top2 = twilightEveningTop
      state.bottom2 = twilightEveningBottom

      // phase 8
    } else if (currentInSeconds > twilightEveningEnd && currentInSeconds <= dayInSeconds) {
      ratio2 = (currentInSeconds - twilightEveningEnd) / (dayInSeconds - twilightEveningEnd)
      state.top1 = twilightEveningTop
      state.bottom1 = twilightEveningBottom
      state.top2 = midnightTop
      state.bottom2 = midnightBottom
    }

    // set the colors to be used for background linear gradient
    state.currentTopColor = mixColors(state.top1, state.top2, ratio1, ratio2)
    state.currentBottomColor = mixColors(state.bottom1, state.bottom2, ratio1, ratio2)

    $('body').removeClass('gradient')
    $('body').css({
      background: 'linear-gradient(#' + state.currentTopColor + ', #' + state.currentBottomColor + ')'
    }).css({
      height: '100%'
    }).css({
      margin: '0'
    }).css({
      'background-repeat': 'no-repeat'
    }).css({
      'background-attachment': 'fixed'
    })
    $('span').css({
      color: '#fff'
    }).css({
      'letter-spacing': '0px'
    }).css({
      background: '#' + state.currentBottomColor
    }).css({
      padding: '5px'
    })
    $('.search-again').css({
      color: '#fff'
    })
  }

  // eventlistener for click on 'new search' text --> page refresh
  $('.addbutton').on('click', '.search-again', function () {
    location.reload(true)
  })

  // background of app changes dynamically according to what time of the day it is and how close that time is to midnight, sunset and sunrise
  // calculate the current color as a mix between to colors (for instance the mix between the colors for midnight and sunrise)
  // values are changed from hex to rgb and back to hex
  function mixColors (color1, color2, ratio1, ratio2) {
    ratio1 = 1 - ratio2

    function hex (x) {
      x = x.toString(16)
      return (x.length === 1) ? '0' + x : x
    };

    var r = Math.ceil(parseInt(color1.substring(0, 2), 16) * ratio1 + parseInt(color2.substring(0, 2), 16) * ratio2)
    var g = Math.ceil(parseInt(color1.substring(2, 4), 16) * ratio1 + parseInt(color2.substring(2, 4), 16) * ratio2)
    var b = Math.ceil(parseInt(color1.substring(4, 6), 16) * ratio1 + parseInt(color2.substring(4, 6), 16) * ratio2)

    var middle = hex(r) + hex(g) + hex(b)

    return middle
  }

  // get map from google maps API with custom styling
  function initMap () {
    var location = {
      lat: Number(state.latitude),
      lng: Number(state.longitude)
    }
    var map = new google.maps.Map(document.getElementById('map'), {
      zoom: 2,
      center: location,
      styles: [{
        'elementType': 'geometry',
        'stylers': [{
          'color': '#f5f5f5'
        }]
      },
      {
        'elementType': 'labels',
        'stylers': [{
          'visibility': 'off'
        }]
      },
      {
        'elementType': 'labels.icon',
        'stylers': [{
          'visibility': 'off'
        }]
      },
      {
        'elementType': 'labels.text.fill',
        'stylers': [{
          'color': '#616161'
        }]
      },
      {
        'elementType': 'labels.text.stroke',
        'stylers': [{
          'color': '#f5f5f5'
        }]
      },
      {
        'featureType': 'administrative.land_parcel',
        'stylers': [{
          'visibility': 'off'
        }]
      },
      {
        'featureType': 'administrative.land_parcel',
        'elementType': 'labels.text.fill',
        'stylers': [{
          'color': '#bdbdbd'
        }]
      },
      {
        'featureType': 'administrative.neighborhood',
        'stylers': [{
          'visibility': 'off'
        }]
      },
      {
        'featureType': 'landscape',
        'elementType': 'geometry',
        'stylers': [{
          'color': '#94c9a9'
        }]
      },
      {
        'featureType': 'poi',
        'elementType': 'geometry',
        'stylers': [{
          'color': '#eeeeee'
        }]
      },
      {
        'featureType': 'poi',
        'elementType': 'labels.text.fill',
        'stylers': [{
          'color': '#757575'
        }]
      },
      {
        'featureType': 'poi.business',
        'stylers': [{
          'visibility': 'off'
        }]
      },
      {
        'featureType': 'poi.park',
        'elementType': 'geometry',
        'stylers': [{
          'color': '#e5e5e5'
        }]
      },
      {
        'featureType': 'poi.park',
        'elementType': 'labels.text',
        'stylers': [{
          'visibility': 'off'
        }]
      },
      {
        'featureType': 'poi.park',
        'elementType': 'labels.text.fill',
        'stylers': [{
          'color': '#9e9e9e'
        }]
      },
      {
        'featureType': 'road',
        'elementType': 'geometry',
        'stylers': [{
          'color': '#5a7d7c'
        }]
      },
      {
        'featureType': 'road',
        'elementType': 'geometry.fill',
        'stylers': [{
          'color': '#5a7d7c'
        }]
      },
      {
        'featureType': 'road.arterial',
        'stylers': [{
          'color': '#5a7d7c'
        }]
      },
      {
        'featureType': 'road.arterial',
        'elementType': 'geometry.stroke',
        'stylers': [{
          'color': '#5a7d7c'
        }]
      },
      {
        'featureType': 'road.arterial',
        'elementType': 'labels',
        'stylers': [{
          'visibility': 'off'
        }]
      },
      {
        'featureType': 'road.arterial',
        'elementType': 'labels.text.fill',
        'stylers': [{
          'color': '#757575'
        }]
      },
      {
        'featureType': 'road.highway',
        'stylers': [{
          'color': '#5a7d7c'
        }]
      },
      {
        'featureType': 'road.highway',
        'elementType': 'geometry',
        'stylers': [{
          'color': '#dadada'
        }]
      },
      {
        'featureType': 'road.highway',
        'elementType': 'geometry.fill',
        'stylers': [{
          'color': '#5a7d7c'
        }]
      },
      {
        'featureType': 'road.highway',
        'elementType': 'geometry.stroke',
        'stylers': [{
          'color': '#5a7d7c'
        }]
      },
      {
        'featureType': 'road.highway',
        'elementType': 'labels',
        'stylers': [{
          'visibility': 'off'
        }]
      },
      {
        'featureType': 'road.highway',
        'elementType': 'labels.text.fill',
        'stylers': [{
          'color': '#616161'
        }]
      },
      {
        'featureType': 'road.local',
        'stylers': [{
          'color': '#5a7d7c'
        },
        {
          'visibility': 'off'
        }
        ]
      },
      {
        'featureType': 'road.local',
        'elementType': 'geometry.stroke',
        'stylers': [{
          'color': '#5a7d7c'
        }]
      },
      {
        'featureType': 'road.local',
        'elementType': 'labels.text.fill',
        'stylers': [{
          'color': '#9e9e9e'
        }]
      },
      {
        'featureType': 'transit.line',
        'elementType': 'geometry',
        'stylers': [{
          'color': '#e5e5e5'
        }]
      },
      {
        'featureType': 'transit.station',
        'elementType': 'geometry',
        'stylers': [{
          'color': '#eeeeee'
        }]
      },
      {
        'featureType': 'water',
        'elementType': 'geometry',
        'stylers': [{
          'color': '#c9c9c9'
        }]
      },
      {
        'featureType': 'water',
        'elementType': 'geometry.fill',
        'stylers': [{
          'color': '#aed9e0'
        }]
      },
      {
        'featureType': 'water',
        'elementType': 'labels.text.fill',
        'stylers': [{
          'color': '#9e9e9e'
        }]
      }
      ]
    })
    var marker = new google.maps.Marker({
      position: location,
      map: map,
      icon: 'https://maps.gstatic.com/mapfiles/ridefinder-images/mm_20_orange.png'
    })
  }
})
