$(function () {

  var $elements = $('.temp,.wind,.weather-summary,.forecast').hide();

  var getLocation = function () {
    var deferred = jQuery.Deferred();

    navigator.geolocation.getCurrentPosition(
      deferred.resolve, deferred.reject, geoLocationOptions);

    var promise = deferred.promise();
    promise.fail(function (err) {
      console.log('getLocation fail', err);
    });

    return promise;
  };

  var roundVal = function (temp) {
    return Math.round(temp * 10) / 10;
  };

  var iconTable = {
    'clear-day':           'wi-day-sunny',
    'clear-night':         'wi-night-clear',
    'rain':                'wi-rain',
    'snow':                'wi-snow',
    'sleet':               'wi-rain-mix',
    'wind':                'wi-cloudy-gusts',
    'fog':                 'wi-fog',
    'cloudy':              'wi-cloudy',
    'partly-cloudy-day':   'wi-day-cloudy',
    'partly-cloudy-night': 'wi-night-cloudy',
    'hail':                'wi-hail',
    'thunderstorm':        'wi-thunderstorm',
    'tornado':             'wi-tornado'
  };

  var bearingIcons = [
    'wi-wind-north',
    'wi-wind-north-east',
    'wi-wind-east',
    'wi-wind-south-east',
    'wi-wind-south',
    'wi-wind-south-west',
    'wi-wind-west',
    'wi-wind-north-west'
  ];

  var renderWeather = function (currentWeather, minuteWeather) {
    var temp = Math.round(currentWeather.temperature);

    var wind = Math.round(currentWeather.windSpeed);

    var iconClass = iconTable[currentWeather.icon];
    var icon = $('<span/>').addClass('icon dimmed wi').addClass(iconClass);
    $('.temp').updateWithText(icon.outerHTML()+temp+'&deg;', 1000);

    if (wind > 0) {
      var bearingIcon = '';
      var bearing = currentWeather.windBearing;
      if (bearing !== undefined) {
        bearing = (bearing + 22.5) % 360;
        var bearingIndex = Math.floor(bearing / 45);
        bearingIcon = $('<span/>').addClass('xdimmed wi').addClass(bearingIcons[bearingIndex]);
      }

      var windString = '<span class="wi wi-strong-wind xdimmed"></span> ' + wind + ' ' + bearingIcon.outerHTML();
      $('.wind').updateWithText(windString, 1000);
    } else {
      $('.wind').updateWithText('', 1000);
    }

    // remove ending '.' for consistancy
    var summary = minuteWeather.summary.replace(/\.$/, '');
    $('.weather-summary').updateWithText(summary, 1000);
  };

  var renderForecast = function (forcast) {
    var forecastTable = $('<table />').addClass('forecast-table');
    var weekday = (new Date()).getDay();
    var days = forcast.data;
    var opacity = 1;
    for (var i = 0; i < days.length; i++) {
      var day = days[i];
      var row = $('<tr />').css('opacity', opacity);
      if (i === 0) {
        row.addClass('today');
      }

      row.append($('<td/>').addClass('day').html(moment.weekdaysShort(weekday)));
      row.append($('<td/>').addClass('temp-min').html(Math.round(day.temperatureMin)));
      row.append($('<td/>').addClass('temp-max').html(Math.round(day.temperatureMax)));
      forecastTable.append(row);
      weekday = (weekday + 1) % 7;
      opacity -= 0.1;
    }

    $('.forecast').updateWithText(forecastTable, 1000);
  };

  var getWeatherData = function(lat, long) {
    // use the cached copy if we have it
    if (localStorage.forecast) {
      var forecastTime = parseInt(localStorage.forecastTime, 10);
      if (forecastTime && isFresh(forecastTime)) {
        var data = JSON.parse(localStorage.forecast);
        var deferred = jQuery.Deferred();
        deferred.resolve(data);
        return deferred.promise();
      }
    }

    var url = 'https://api.forecast.io/forecast/'+APIKEY+'/'+lat+','+long+'?callback=?';
    var ajax = $.getJSON(url, weatherParams);
    ajax.done(function (weatherData) {
      // cache the response
      localStorage.forecast     = JSON.stringify(weatherData);
      localStorage.forecastTime = moment().unix();
    });
    return ajax;
  };

  var isFresh = function (time) {
    if (!time) {
      return false;
    }
    var ageInSeconds = moment().unix() - time;
    return ageInSeconds < 300; // 5 minutes
  };

  var updateWeather = function () {
    if (!visible) {
      return;
    }
    getLocation().then(function (location) {
      var coords = location.coords;
      return getWeatherData(coords.latitude, coords.longitude);
    }).done(function (weatherData) {
      renderWeather(weatherData.currently, weatherData.minutely);
      renderForecast(weatherData.daily);
    });

    setTimeout(updateWeather, 60 * 5 * 1000); // five minutes
  };

  var visible = false;

  Mirror.listen({
    show: function () {
      visible = true;
      updateWeather();
      $elements.fadeIn(1000);
    },
    hide: function () {
      visible = false;
      $elements.fadeOut(1000);
    }
  });

});
