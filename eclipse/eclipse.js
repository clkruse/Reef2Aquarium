mapboxgl.accessToken = 'pk.eyJ1IjoiZGFzdWxpdCIsImEiOiJjaXQzYmFjYmkwdWQ5MnBwZzEzZnNub2hhIn0.EDJ-lIfX2FnKhPw3nqHcqg';

var course

// Check window width

var isMobile = window.innerWidth < 640 ? true : false;

// Initialize camera variables

var zoomOut = isMobile ? 2 : 2;
var zoom = zoomIn = isMobile ? 2 : 2.4;
var offset = isMobile ? [0, 50] : [0, 20];
var center = centerDefault = [-104.98627	,	42.34486];
var pitch = angled = 40;
var birdsEye = 0;

// Initialize empty data for setData updating

var empty = {
    'type': 'FeatureCollection',
    'features': []
};

// Extrusion properties based on elevation property

var extrudedProperties = {
    'fill-extrusion-height': {
        'property': 'e',
        'type': 'identity'
    },
    'fill-extrusion-color': 'yellow',
    'fill-extrusion-opacity': 0.7
};

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/satellite-v9',
    center: center,
    minZoom: 11,
    zoom: zoom,
    pitch: pitch
});

// Load in geoJSON

d3.json('https://raw.githubusercontent.com/clkruse/clkruse.github.io/master/eclipse/balloon.geojson', function(err, resp) {
    if (err) throw err;
    map.on('load', function() {

        // Set controls and interaction based on context

        if (isMobile) { map.addControl(new mapboxgl.NavigationControl(), 'bottom-left') } else { map.addControl(new mapboxgl.NavigationControl(), 'top-right') };
        if (window.location.search.indexOf('embed') !== -1) { map.scrollZoom.disable() };

        // Set light source to make extrusions appear more illuminated, less shadowy

        map.setLight({ intensity: 0.6, position: [1, 180, 60] });

        // Add sources and layers for each part of the course

        map.addSource('course', {
            'type': 'geojson',
            'data': resp
        });
        map.addSource('firstThird', {
            'type': 'geojson',
            'data': empty
        });
        map.addSource('secondThird', {
            'type': 'geojson',
            'data': empty
        });
        map.addSource('thirdThird', {
            'type': 'geojson',
            'data': empty
        });

        map.addLayer({
            'id': 'course',
            'source': 'course',
            'type': 'fill',
            'paint': {
                'fill-color': 'rgba(255,255,255,0.4)',
            }
        });
        map.addLayer({
            'id': 'firstThird',
            'source': 'firstThird',
            'type': 'fill-extrusion',
            'paint': extrudedProperties
        });
        map.addLayer({
            'id': 'secondThird',
            'source': 'secondThird',
            'type': 'fill-extrusion',
            'paint': extrudedProperties
        });
        map.addLayer({
            'id': 'thirdThird',
            'source': 'thirdThird',
            'type': 'fill-extrusion',
            'paint': extrudedProperties
        });

        // show elevation along the route as a popup on hover

        var popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            anchor: 'top',
            offset: 5
        });

        map.on('mousemove', function(e) {

            var hover = map.queryRenderedFeatures([
                [e.point.x, e.point.y + 200],
                [e.point.x, e.point.y]
            ], { layers: ['firstThird', 'secondThird', 'thirdThird'] });

            map.getCanvas().style.cursor = (hover.length) ? 'pointer' : '';

            if (!hover.length) {
                popup.remove();
                return;
            }

            var feature = hover[0];

            popup.setLngLat(feature.geometry.coordinates[0][0])
                .setHTML(Math.floor(feature.properties.e) + ' ft')
                .addTo(map);
        });

    });

    // Reset race metrics to reflect the start of the race

    var elevationTxt = document.getElementById('elevation');
    var distanceTxt = document.getElementById('distance');
    var timeTxt = document.getElementById('time');
    var paceTxt = document.getElementById('pace');

    var pace = paceTxt.textContent = 8;

    function resetMetrics() {
        elevationTxt.textContent = Math.floor(resp.features[0].properties.e) + ' ft';
        distanceTxt.textContent = '0 miles';
        timeTxt.textContent = '00:00';
    };

    resetMetrics();

    // Mouseover the 2D elevation profile to update progress

    var graph = document.getElementById('graph');
    var playhead = document.getElementById('playhead');

    var cursorDown = false;
    var progress = 0;
    var dashWidth = isMobile ? window.innerWidth : 300

    function updateOnGraphEvent() {
        if (animateInterval != null) {
            stopAnimate();
            updateProgress();
            animateInterval = setInterval(animate, animatePace);
        } else {
            updateProgress();
        };
    };

    graph.addEventListener('mousemove', function(e) {
        var mouseX = isMobile ? e.pageX : e.pageX - 10;
        progress = Math.floor(mouseX / dashWidth * resp.features.length);
        updateOnGraphEvent();
    });

    // On mobile, touch the 2D elevation profile to update progress

    graph.addEventListener('touchend', function() { cursorDown = false; });
    graph.addEventListener('touchstart', function(e) { cursorDown = true; });
    graph.addEventListener('touchmove', function(e) {
        if (cursorDown) {
            progress = Math.floor(e.changedTouches[0].pageX / dashWidth * resp.features.length);
            updateOnGraphEvent();
        };
    });

    // Set the bearing based on progress along the route

    var bearing = bearingPrev = turf.bearing(resp.features[0].geometry.coordinates[0][0], resp.features[2].geometry.coordinates[0][0]);

    function getBearing() {

        var featureNow = resp.features[progress];
        var featureNext = resp.features[progress + 2];
        var bearingNow = (featureNext === undefined) ? bearingPrev : turf.bearing(featureNow.geometry.coordinates[0][0], featureNext.geometry.coordinates[0][0]);

        bearing = Math.abs(bearingNow - bearingPrev) > 90 ? bearingPrev : bearingNow;
        bearingPrev = bearingNow;

    };

    // Filter geoJSON within thirds

    var firstThirdLimit = resp.features.length / 3;
    var secondThirdLimit = (resp.features.length / 3) * 2;
    var thirdThirdLimit = resp.features.length;

    function returnFirstThird(value) { return resp.features.indexOf(value) <= firstThirdLimit; };
    function returnSecondThird(value) { return resp.features.indexOf(value) > firstThirdLimit && resp.features.indexOf(value) <= secondThirdLimit; };
    function returnThirdThird(value) { return resp.features.indexOf(value) > secondThirdLimit && resp.features.indexOf(value) <= thirdThirdLimit; };

    var firstThird = {
        'type': 'FeatureCollection',
        'features': resp.features.filter(returnFirstThird)
    };

    var secondThird = {
        'type': 'FeatureCollection',
        'features': resp.features.filter(returnSecondThird)
    };

    var thirdThird = {
        'type': 'FeatureCollection',
        'features': resp.features.filter(returnThirdThird)
    };

    // Filter geoJSON within thirds based on progress

    function returnFirstThirdProgress(value) { return resp.features.indexOf(value) <= progress; };
    function returnSecondThirdProgress(value) { return resp.features.indexOf(value) <= progress && resp.features.indexOf(value) > firstThirdLimit; };
    function returnThirdThirdProgress(value) { return resp.features.indexOf(value) <= progress && resp.features.indexOf(value) > secondThirdLimit; };

    // Update progress along the marathon route

    var isInFirstThird = isInSecondThird = isInThirdThird = false;

    function updateProgress() {

        if (progress < thirdThirdLimit) {

            // Update dashboard metrics

            var totalTime = Math.floor((progress * .01) * pace);
            var hrs = (Math.floor(totalTime / 60));
            var minutes = totalTime - (60 * hrs);

            elevationTxt.textContent = Math.floor(resp.features[progress].properties.e) + ' ft';
            distanceTxt.textContent = Math.floor(progress * .01) + ' miles';
            timeTxt.textContent = (minutes < 10) ? '0' + hrs + ':0' + minutes : '0' + hrs + ':' + minutes;

            playhead.style.left = progress / thirdThirdLimit * 100 + '%';

            /*
            setData for each third based on progress, as defined either by the animation sequence or interaction with the 2D profile
            setData ON EVERY FRAME for the third you're in.
            setData ONCE for the other thirds, until you leave the third you're in
            */

            if (progress <= firstThirdLimit) {
                map.getSource('firstThird').setData({
                    'type': 'FeatureCollection',
                    'features': resp.features.filter(returnFirstThirdProgress)
                });
                if (!isInFirstThird) {
                    isInSecondThird = isInThirdThird = false;
                    map.getSource('secondThird').setData(empty);
                    map.getSource('thirdThird').setData(empty);
                    isInFirstThird = true;
                };
            } else if (progress > firstThirdLimit && progress <= secondThirdLimit) {
                map.getSource('secondThird').setData({
                    'type': 'FeatureCollection',
                    'features': resp.features.filter(returnSecondThirdProgress)
                });
                if (!isInSecondThird) {
                    isInFirstThird = isInThirdThird = false;
                    map.getSource('firstThird').setData(firstThird);
                    map.getSource('thirdThird').setData(empty);
                    isInSecondThird = true;
                };
            } else if (progress > secondThirdLimit && progress <= thirdThirdLimit) {
                map.getSource('thirdThird').setData({
                    'type': 'FeatureCollection',
                    'features': resp.features.filter(returnThirdThirdProgress)
                });
                if (!isInThirdThird) {
                    isInFirstThird = isInSecondThird = false;
                    map.getSource('firstThird').setData(firstThird);
                    map.getSource('secondThird').setData(secondThird);
                    isInThirdThird = true;
                };
            };

            // Update camera based on progress

            center = resp.features[progress].geometry.coordinates[0][0];
            getBearing();

            map.easeTo({
                center: center,
                bearing: bearing + 90,
                duration: 500,
                offset: offset,
                easing: function(t) { return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t }
            });

        };

    };

    // Set pace in the dashboard

    document.getElementById('less').addEventListener('click', function() {
        if (pace > 1) {
            pace--;
            paceTxt.textContent = pace;
        };
    });
    document.getElementById('more').addEventListener('click', function() {
        if (pace < 20) {
            pace++;
            paceTxt.textContent = pace;
        };
    });

    // Use pace to set animation speed; converted from min to millisec, accounting for polygon width, at 50x speed

    var animatePace = (pace * 6000 / 10) / 50;

    // Toggle between angled and bird's eye view

    function setPitch() {
        if (animateInterval != null) {
            stopAnimate();
            map.flyTo({
                center: center,
                pitch: pitch,
                zoom: zoom,
                duration: 100
            });
            animateInterval = setInterval(animate, animatePace);
        } else {
            map.flyTo({
                center: center,
                pitch: pitch,
                zoom: zoom,
                duration: 100
            });
        };
    };

    document.getElementById('two').addEventListener('click', function() {
        pitch = birdsEye;
        zoom = zoomOut;
        setPitch();
    });

    document.getElementById('three').addEventListener('click', function() {
        pitch = angled;
        zoom = zoomIn;
        setPitch();
    });

    // Control animation sequence

    var play = document.getElementById('play');
    var pause = document.getElementById('pause');
    var reset = document.getElementById('reset');
    var setPace = document.getElementById('setpace');

    var animateInterval = null;

    function animate() {
        updateProgress();
        progress++;
    };

    function stopAnimate() {
        clearInterval(animateInterval);
        animateInterval = null;
    };

    // Play button

    play.addEventListener('click', function() {

        setPace.style.display = 'none';
        play.classList.add('hidden');
        pause.classList.remove('hidden');
        reset.classList.remove('hidden');

        animateInterval = setInterval(animate, animatePace);

    });

    // Pause button

    pause.addEventListener('click', function() {
        if (animateInterval != null) {
            stopAnimate();
            pause.textContent = 'Play';
        } else {
            animateInterval = setInterval(animate, animatePace);
            pause.textContent = 'Pause';
        };
    });

    // Reset button

    reset.addEventListener('click', function() {

        stopAnimate();

        map.getSource('firstThird').setData(empty);
        map.getSource('secondThird').setData(empty);
        map.getSource('thirdThird').setData(empty);

        playhead.style.left = progress = 0;

        center = centerDefault;
        pitch = angled;
        zoom = zoomIn;

        map.easeTo({
            center: center,
            bearing: 0,
            pitch: pitch,
            zoom: zoom
        });

        setPace.style.display = 'block';
        play.classList.remove('hidden');
        pause.classList.add('hidden');
        reset.classList.add('hidden');
        pause.textContent = 'Pause';

        resetMetrics();

    });


});
