$(document).ready(function () {
    function keywordFromWeatherCode(code) {
        if (code === 0) return "sunlight";
        if (code === 1 || code === 2) return "Clear";
        if (code === 3) return "cloud";
        if (code === 45 || code === 48) return "fog";
        if (code >= 51 && code <= 57) return "rain";
        if (code >= 61 && code <= 67) return "rain";
        if (code >= 71 && code <= 77) return "snow";
        if (code >= 80 && code <= 82) return "storm";
        if (code === 85 || code === 86) return "snow";
        if (code >= 95 && code <= 99) return "lightning";
        return "landscape";
    }

    function fetchMetArt(keyword) {
        $("#artResult").html("<p class='mb-0'>Searching the Met for: <strong>" + keyword + "</strong>…</p>");

        const searchUrl =
            "https://collectionapi.metmuseum.org/public/collection/v1/search" +
            "?hasImages=true&q=" + encodeURIComponent(keyword);

        $.getJSON(searchUrl, function (s) {
            if (!s.objectIDs || s.objectIDs.length === 0) {
                $("#artResult").html("<p class='text-danger mb-0'>No artworks found for that keyword.</p>");
                return;
            }

            const idx = Math.floor(Math.random() * Math.min(40, s.objectIDs.length));
            const objectId = s.objectIDs[idx];

            const objectUrl =
                "https://collectionapi.metmuseum.org/public/collection/v1/objects/" + objectId;

            $.getJSON(objectUrl, function (obj) {
                if (!obj.primaryImageSmall) {
                    $("#artResult").html("<p class='text-danger mb-0'>Artwork had no usable image.</p>");
                    return;
                }

                const title = obj.title || "Untitled";
                const artist = obj.artistDisplayName || "Unknown artist";
                const date = obj.objectDate || "Unknown date";
                const credit = obj.creditLine || "The Metropolitan Museum of Art";

                $("#artResult").html(
                    "<div class='mb-2'><strong>" + title + "</strong></div>" +
                    "<div class='text-muted mb-2'>" + artist + " • " + date + "</div>" +
                    "<img src='" + obj.primaryImageSmall + "' alt='Artwork image' style='max-width:100%; border-radius:12px;'>" +
                    "<div class='text-muted small mt-2'>" + credit + "</div>"
                );
            }).fail(function () {
                $("#artResult").html("<p class='text-danger mb-0'>Error loading artwork details.</p>");
            });

        }).fail(function () {
            $("#artResult").html("<p class='text-danger mb-0'>Error searching the Met API.</p>");
        });
    }



    $("#btnGo").on("click", function () {
        const city = $("#cityInput").val().trim();

        if (city === "") {
            $("#weatherResult").html("<p class='text-danger mb-0'>Please enter a city.</p>");
            return;
        }

        $("#weatherResult").html("<p class='mb-0'>Looking up city coordinates…</p>");
        $("#artResult").html("<p class='text-muted mb-0'>No artwork loaded yet</p>");
        $("#keywordResult").text("None yet");

        const geoUrl =
            "https://geocoding-api.open-meteo.com/v1/search?name=" +
            encodeURIComponent(city) +
            "&count=1&language=en&format=json";

        $.getJSON(geoUrl, function (data) {
            if (!data.results || data.results.length === 0) {
                $("#weatherResult").html("<p class='text-danger mb-0'>City not found.</p>");
                return;
            }

            const place = data.results[0];
            const lat = place.latitude;
            const lon = place.longitude;

            $("#weatherResult").html(
                "<p class='mb-1'><strong>City:</strong> " + place.name + "</p>" +
                "<p class='mb-1'><strong>Latitude:</strong> " + lat + "</p>" +
                "<p class='mb-0'><strong>Longitude:</strong> " + lon + "</p>" +
                "<p class='mb-0'>Fetching current weather…</p>"
            );

            const weatherUrl =
                "https://api.open-meteo.com/v1/forecast" +
                "?latitude=" + lat +
                "&longitude=" + lon +
                "&current_weather=true";

            $.getJSON(weatherUrl, function (w) {
                if (!w.current_weather) {
                    $("#weatherResult").append("<p class='text-danger mb-0'>Weather data unavailable.</p>");
                    return;
                }

                const temp = w.current_weather.temperature;
                const wind = w.current_weather.windspeed;
                const code = w.current_weather.weathercode;
                const keyword = keywordFromWeatherCode(code);
                $("#keywordResult").text(keyword);
                fetchMetArt(keyword);


                $("#weatherResult").html(
                    "<p class='mb-1'><strong>City:</strong> " + place.name + "</p>" +
                    "<p class='mb-1'><strong>Temperature:</strong> " + temp + " °C</p>" +
                    "<p class='mb-1'><strong>Wind speed:</strong> " + wind + " km/h</p>" +
                    "<p class='mb-0'><strong>Weather code:</strong> " + code + "</p>"
                );

            }).fail(function () {
                $("#weatherResult").append("<p class='text-danger mb-0'>Weather API error.</p>");
            });


        }).fail(function () {
            $("#weatherResult").html("<p class='text-danger mb-0'>Geocoding API error.</p>");
        });
    });

    $("#btnClear").on("click", function () {
        $("#cityInput").val("");
        $("#weatherResult").html("<p class='text-muted mb-0'>No weather loaded yet</p>");
        $("#artResult").html("<p class='text-muted mb-0'>No artwork loaded yet</p>");
        $("#keywordResult").text("None yet");
    });

});

