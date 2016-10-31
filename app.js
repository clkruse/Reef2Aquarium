window.onload = function() {
    var milestones;
    var mapSettings = {
        shareable: true,
        title: false,
        description: true,
        search: false,
        tiles_loader: true,
        center_lat: 18,
        center_lon: 180,
        zoom: 3,
        layer_selector:true,
        cartodb_logo: false,
        legends: false,
        mobile_layout: true
    };

    cartodb.createVis('map', 'http://clkruse.carto.com/api/v2/viz/f4537124-51f2-11e6-8b6c-0ee66e2c9693/viz.json',mapSettings)
    .done(function(vis, layers) {

        // Returns the native map object being used (e.g. a L.Map object for Leaflet)
        var map = vis.getNativeMap

        var seq = O.Sequential();
        O.Keys().left().then(seq.prev, seq);
        O.Keys().right().then(seq.next, seq);
        $('a.next').click(function() { seq.next(); })
        $('a.prev').click(function() { seq.prev(); })

        var story = O.Story();

        var updateUI = function(txt,date,marker) {
            return O.Action(function() {
                $('#milestone > p').text(txt)
                $('#milestone > span').text(date)
                $('#footer > #buttons > span').text(story.state()+1 + '/' + milestones.length)
              });
        }
        var sql = new cartodb.SQL({ user: 'clkruse' });
        sql.execute("SELECT * FROM r2a_data ORDER BY cartodb_id")
        .done(function(data) {
            console.log(data.rows);

                milestones = data.rows;

                for (var i = 0; i < milestones.length; ++i) {
                    var stop = data.rows[i];
                    var pos = [stop.lat, stop.lon];
                    var txt = stop.description;
                    var date = stop.cartodb_id;
                    var zoom = stop.zoom;
                    var marker = L.icon({
                        iconUrl: 'img/markers/' + stop.marker + '.png',
                        iconSize: [49,59],
                        iconAnchor: [24,56]
                    });

                    var action = O.Step(
                      map.actions.setView(pos, stop.zoom),
                      O.Debug().log("state " + i),
                      L.marker(pos, { icon: marker }).actions.addRemove(map),
                      updateUI(txt,date,stop.marker),
                      O.Location.changeHash('#' + i)
                    )
                    story.addState(seq.step(i), action);
                    console.log(zoom);
                }
                if (location.hash) {
                  seq.current(+location.hash.slice(1));
                } else {
                  story.go(0);
                }

            })
            .error(function(errors) {
                // errors contains a list of errors
                console.log("errors:" + errors);
            });

    });
}
