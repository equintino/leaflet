import AbstractController from "./abstractController.js";
import { captalize } from "../../lib/utils.js";
import MapView from "../views/mapView.js";
import MapService from "../services/mapService.js";

export default class MapController extends AbstractController {
    #map
    #locate
    service
    view
    worker

    constructor() {
        super()
        this.service = new MapService()
        this.view    = new MapView()
        this.worker  = new Worker('src/services/mapWorker.js', {
            type: 'module'
        })
    }

    init(coord, zoom) {
        this.view.initializer({
            cleanData: () => this.service.cleanData()
        })
        this.service.initializer({ coord, zoom })
        this.pane()
        this.myLocalization()
        this.search()
    }

    pane() {
        const name = 'labels',
            zIndex = 200, //650
            basemaps = 'https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png',
            options = {
                attribution : '©OpenStreetMap, ©CartoDB',
                pane        : 'labels'
            }
        this.service.setPane({ name, zIndex, basemaps, options })
    }

    myLocalization() {
        this.service.myLocalization({
            locate: locate => {
                this.#locate = locate
            },
            fn: ({ locate }) => {
                this.view.cleanData({ locate })
            },
            loading: (onOff) =>  this.view.onOffLoading(onOff)
        })
    }

    async search() {
        const that = this
        this.view.actionSearch({
            getFeatures: that.service.getApi,
            reverse: that.#reverse,
            greatCircle: feature => this.greatCircle(feature),
            map: this.service.getMap(),
            validateJson: this.validateJson
        })


        return
        this.view.setEvents(({ country }) => {
            mapController.mapReload()
            this.worker.postMessage({ eventType: this.events.reading })
            this.worker.postMessage({
                url: `https://nominatim.openstreetmap.org/search?q=${country}&format=geojson&polygon_geojson=1&addressdetails=1`
            })
        })
        this.worker.onmessage = ({ data }) => {
            const geojson   = data.features
            const eventType = data.eventType
            mapController.geoJson({ geojson })
            if (eventType === 'waiting') this.view.onOffLoading(true)
            if (eventType === 'ready') {
                this.view.onOffLoading(false)
                this.view.found({
                    data: geojson,
                    legendControl: (element, fn) => {
                        mapController.legendControl({ element })
                        fn()
                    },
                    fn:(feature) => {
                        mapController.flyTo(feature)
                    }
                })
            }
        }


        return
        /** geocoding addresses search engine outside the map */
        new Autocomplete('search', {
            delay: 1000,
            selectFirst: true,
            howManyCharacters: 2,
            onSearch: ({ currentValue }) => {
                /** Promise */
                this.view.onOffLoading(true)
                return this.service.getApi(currentValue)
            },
            // nominatim
            onResults: ({ currentValue, matches, template }) => {
                const regex = new RegExp(currentValue, "i");
                // checking if we have results if we don't
                // take data from the noResults method
                this.view.onOffLoading(false)
                return ( matches === 0 ? template : matches )
                    .map((element) => {
                        return `
                            <li class="loupe" role="option">
                            ${element.properties.display_name.replace(
                                regex, (str) => `<b>${str}</b>`
                            )} </li>
                        `
                    })
                    .join("");
            },
            onSubmit: ({ object }) => {
                that.view.onOffLoading(true)
                const { display_name } = object.properties
                const { type } = object.geometry
                // custom id for marker
                const customId = Math.random();
                const cord = (
                    !object.geometry.reverse
                    ? that.#reverse(object.geometry).coordinates
                    : object.geometry.coordinates
                )
                const marker = (
                    type === 'MultiPolygon' || type === 'Polygon' || type === 'LineString' ? L.polygon(cord)
                    : L.marker(cord, {
                        title: display_name,
                        id: customId
                    })
                )

                marker.addTo(map).bindPopup(display_name);

                if (that.view.checkLocate()) {
                    that.view.cleanData({ locate: true })
                    that.service.cleanData()
                    // turf
                    that.greatCircle(object)
                }
                else {
                    if (type === 'Polygon' || type === 'MultiPolygon' || type === 'LineString') map.fitBounds(cord)

                    if (type === 'Point') map.setView(cord, 8);
                }

                map.eachLayer(function (layer) {
                    if (layer.options && layer.options.pane === "markerPane") {
                        if (layer.options.id !== customId) map.removeLayer(layer)
                    }
                });
                that.view.onOffLoading(false)
            },
            // get index and data from li element after
            // hovering over li with the mouse or using
            // arrow keys ↓ | ↑
            onSelectedItem: ({ index, element, object }) => {
                console.log("onSelectedItem:", index, element, object);
            },
            // the method presents no results
            noResults: ({ currentValue, template }) => {
                return template(`<li>No results found: "${currentValue}"</li>`)
            }
        })
    }

    validateJson(data) {
        try {
            return JSON.parse(data)
        }
        catch(err) {
            console.log(err)
            return false
        }
    }

    greatCircle(feature) {
        if (!feature) return
        const map = this.service.getMap()
        /* eslint-disable no-undef */
        /** great-circle */

        // config map
        let config = {
            minZoom: 2,
            maxZomm: 18,
        };
        // magnification with which the map will start
        const zoom = 10;

        map.on("click", (e) => {
            console.log(e.latlng);
        });

        const cityCoords = [ turf.center(feature).geometry.coordinates.reverse() ]

        const icon = L.icon({
            iconUrl: "http://grzegorztomicki.pl/serwisy/pin.png",
            iconSize: [50, 58], // size of the icon
            iconAnchor: [20, 58], // changed marker icon position
            popupAnchor: [0, -60], // changed popup position
            className: 'greatCircle'
        });

        navigator.geolocation.getCurrentPosition(function(posicao) {
            const [lng, lat] = [ posicao.coords.longitude, posicao.coords.latitude]

            const turfId   = Math.random()
            const locateId = Math.random()

            // start point
            const start = turf.point([lng, lat]);

            const locate = L.marker({ lng, lat }, {
                icon : icon,
                locateId
            })
            .bindPopup(`I\'m here<br>${[ lat, lng ].toString()}`)
            .addTo(map);

            let featureGroups = [locate];

            function formatNumber(num) {
                const formatter = new Intl.NumberFormat("en-US", { // Make users locale dynamic
                    style: 'unit',
                    unit: 'kilometer',
                    unitDisplay: 'short',
                    maximumFractionDigits: 0
                });

                return formatter.format(num) // km
            }

            cityCoords.map((city) => {
                // all markers to map
                const marker   = L.marker(city, {
                    id: turfId
                })
                const distance = parseInt(locate.getLatLng().distanceTo(marker.getLatLng()))
                const popup    = `${feature.properties.display_name}<strong><p>Distance Straight: ${formatNumber(distance)} approximately</p></strong>` //city.toString()

                marker.bindPopup(popup).addTo(map);

                // add marker to array
                featureGroups.push(marker);

                // end point
                const end = turf.point(city.reverse());


                map.eachLayer((layer) => {
                    if (layer.options.id
                        && layer.options.pane === "markerPane"
                        && layer.options.id !== turfId) {
                        map.removeLayer(layer);
                    }
                    if (layer.options.turfId) {
                        /** remove line */
                        map.removeLayer(layer)
                    }
                    if (layer.options.locateId
                        && layer.options.locateId !== locateId) {
                        /** remove locate */
                        map.removeLayer(layer)
                    }
                })

                // distance between two points
                let greatCircle = turf.greatCircle(start, end);


                // set geoJSON to map
                L.geoJSON(greatCircle, {
                    turfId
                }).addTo(map);
            });

            // ------------------------------
            // add array to featureGroup
            let group = new L.featureGroup(featureGroups);

            // set map view to featureGroup
            map.fitBounds(group.getBounds(), {
                padding: [50, 50], // adding padding to map
            });
        })
    }

    #distance() {
        const map = this.#map
        /* eslint-disable no-undef */
        /**
         * Distance between cities on map
         */

        // config map
        let config = {
            minZoom: 2,
            maxZoom: 18,
        };
        // magnification with which the map will start
        const zoom = 7;
        // co-ordinates
        const lat = 52.22977;
        const lng = 21.01178;

        // calling map
        // const map = L.map("map", config).setView([lat, lng], zoom);

        // Used to load and display tile layers on the map
        // Most tile servers require attribution, which you can set under `Layer`
        // L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        //     attribution:
        //     '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        // }).addTo(map);

        const length = document.querySelector(".length");
        const cityA = document.querySelector("#cityA");
        const cityB = document.querySelector("#cityB");
        const clearButton = document.querySelector(".clear-distance");

        let markers = [];
        let featureGroups = [];

        function results({ currentValue, matches, template }) {
            const regex = new RegExp(currentValue, "i");
            // checking if we have results if we don't
            // take data from the noResults method
            return matches === 0 ? template
                : matches
                    .map((element) => {
                        return `<li class="autocomplete-item" role="option" aria-selected="false">
                        <p>${element.properties.display_name.replace(
                            regex,
                            (str) => `<b>${str}</b>`
                        )}</p>
                        </li> `;
                    })
                    .join("");
        }

        function nominatim(currentValue) {
            const api = `https://nominatim.openstreetmap.org/search?format=geojson&limit=5&q=${encodeURI(currentValue)}`;

            return new Promise((resolve) => {
                fetch(api)
                    .then((response) => response.json())
                    .then((data) => {
                        resolve(data.features);
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            });
        }

        function addMarkerToMap(object) {
            const { display_name } = object.properties;
            const arr = object.geometry.coordinates.reverse();

            const customId = Math.random();

            const marker = L.marker(arr, {
                title: display_name,
                id: customId,
            });

            // add marker to map
            marker.addTo(map).bindPopup(display_name);

            map.setView(arr, 8);

            // add marker to array markers
            markers.push(arr);

            // add marker to array featureGroup
            featureGroups.push(marker);

            if (markers.length == 2) {
                // add polyline between cities
                L.polyline(markers, {
                    color: "red",
                }).addTo(map);

                // matching all markers to the map view
                let group = new L.featureGroup(featureGroups);
                map.fitBounds(group.getBounds(), {
                    padding: [10, 10], // adding padding to map
                });

                // add text 'Length (in kilometers):'
                distanceBetweenMarkers();
            }

            if (markers.length > 2) {
                clearData();
            }
        }

        function clearData() {
            // clear array
            markers = [];

            // back to default coordinate
            map.panTo([lat, lng]);

            // set info ;)
            length.textContent = "Markers and plines have been removed";

            // remove polyline
            for (i in map._layers) {
                if (map._layers[i]._path != undefined) {
                    try {
                        map.removeLayer(map._layers[i]);
                    } catch (e) {
                        console.log("problem with " + e + map._layers[i]);
                    }
                }
            }

            // remove markers
            map.eachLayer((layer) => {
                if (layer.options && layer.options.pane === "markerPane") {
                    map.removeLayer(layer);
                }
            });
        }

        function distanceBetweenMarkers() {
            const from = L.marker(markers[0]).getLatLng();
            const to = L.marker(markers[1]).getLatLng();

            // in km
            const distance = from.distanceTo(to) / 1000;

            length.textContent = `Length (in kilometers): ${distance.toFixed(5)}`;
        }

        window.addEventListener("DOMContentLoaded", () => {
            if (!document.querySelector('#cityA')) return

            ["cityA", "cityB"].forEach((city) => {
                const auto = new Autocomplete(city, {
                    clearButton: false,
                    howManyCharacters: 2,

                    onSearch: ({ currentValue }) => nominatim(currentValue),

                    onResults: (object) => results(object),

                    onSubmit: ({ object }) => addMarkerToMap(object),

                    // the method presents no results
                    noResults: ({ currentValue, template }) =>
                        template(`<li>No results found: "${currentValue}"</li>`),
                });

                clearButton.addEventListener("click", () => {
                    clearData();

                    // destroy method
                    auto.destroy();

                    // focus on first input
                    document.querySelector("#cityA").focus();
                });
            });
        });
    }

    // #getCoordinates(features) {
    //     let coordinates = []
    //     let geometry
    //     if (typeof(features) === 'array') {
    //         features.forEach((feature) => {
    //             geometry = feature.geometry
    //             if (geometry.type === 'Point') {
    //                 coordinates.push(this.#reverse(geometry.coordinates))
    //             }
    //             if (geometry.type === 'Polygon') {
    //                 coordinates.push(this.#reverse(geometry.coordinates[0][0]))
    //             }
    //             if (geometry.type === 'MultiPolygon') {
    //                 console.log(
    //                     feature
    //                 )
    //             }
    //         })
    //     }
    //     else {
    //         geometry = features.geometry
    //         if (geometry.type === 'Polygon') {
    //             coordinates.push(this.#reverse(geometry.coordinates[0][0]))
    //         }
    //         if (geometry.type === 'Point') {
    //             coordinates.push(this.#reverse(geometry.coordinates))
    //         }
    //         if (geometry.type === 'MultiPolygon') {
    //             coordinates.push(this.#reverse(geometry.coordinates[0][0][0]))
    //         }
    //     }

    //     return coordinates
    // }

    #reverse(feature) {
        if (feature.type === 'Point') {
            feature.coordinates = [
                feature.coordinates[1],
                feature.coordinates[0]
            ]
        }

        let coord = []
        feature.coordinates.forEach((e) => {
            if (feature.type === 'Polygon') {
                feature.coordinates = e.map((_e) => [_e[1], _e[0]])
            }
            if (feature.type === 'MultiPolygon') {
                coord.push([
                    e[0].map((_e) => [ _e[1], _e[0] ])
                ])
            }
            if (feature.type === 'LineString') coord.push([e[1], e[0]])
        })
        if (feature.type === 'MultiPolygon' || feature.type === 'LineString') feature.coordinates = coord
        feature.reverse = true
        return feature
    }

    mapReload() {
        this.#map.remove()
        this.initializer()
    }

    marker({ coordinates, popup }) {
        const marker = L.marker(coordinates).addTo(this.#map)
            // .bindPopup(popup)
            .openPopup();
        popup ? marker.bindPopup(popup) : null
    }

    circle({ coordinates, color, fillcolor, fillOpacity, radius }) {
        L.circle( coordinates, {
            color, fillcolor, fillOpacity, radius
        }).addTo(this.#map)
    }

    polygon({ coordinates }) {
        L.polygon( coordinates ).addTo(this.#map)
    }

    async workerGeoJson({ url, ocurrency }) {
        const geojson = await this.#getGeoJson({ url })
        ocurrency(geojson)
    }

    async geoJson({ geojson }) {
        const map = this.#map
        let that = this
        this.geojson = L.geoJSON(geojson, {
            onEachFeature: onEachFeature
        }).addTo(this.#map)

        function onEachFeature(feature, layer) {
            layer.on({
                mouseover: highlightFeature,
                mouseout: resetHighlight,
                click: zoomToFeature
            })
            if (layer.getBounds) {
                map.fitBounds(layer.getBounds())
            }
        }
        function zoomToFeature(e) {
            if (e.target.getBounds) {
                map.fitBounds(e.target.getBounds())
            }
        }
        function highlightFeature(e) {
            const layer = e.target

            if (layer.setStyle) {
                layer.setStyle({
                    weight: 2,
                    color: '#666',
                    dashArray: '',
                    fillOpacity: 0.7
                })
                layer.bringToFront()
            }
            that.info(layer.feature.properties)
        }

        function resetHighlight(e) {
            that.geojson.resetStyle(e.target)
            that.info({ type: 'update' })
        }
        return map.getBounds()
    }

    async #getGeoJson({ url }) {
        const geojson = await (await fetch(url)).json()
        return geojson
    }

    info(props) {
        const info = L.control()
        const that = this
        info.onAdd = (map) => {
            this._div = !this._div ? L.DomUtil.create('div', 'info') : this._div
            that.infoUpdate(props)
            return this._div
        }
        info.addTo(this.#map)
    }

    infoUpdate(props) {
        this._div.innerHTML = props.address ? `<h4>Details</h4> <p>Country: ${props.address.country}</p>` + ( props.addresstype !== 'country' ? `<p>${captalize(props.addresstype)}: ${props.address[props.addresstype]}</p>` : '' ) + ( props.address.municipality && props.addresstype !== 'municipality' ? `<p>Municipality: ${props.address.municipality}</p>` : '' ) : null
    }

    flyTo(feature) {
        const coordinates  = feature.geometry.coordinates
        const locateActive = document.querySelector('.locate-button').classList.contains('locate-active')
        let _coordinates

        // distance
        if (locateActive) this.greatCircle({ features: feature })
        if (feature.geometry.type === 'Point') {
            _coordinates = {
                lat: coordinates[1],
                lng: coordinates[0]
            }
            if (!locateActive) this.#map.flyTo(_coordinates)
        }
        if (feature.geometry.type === 'Polygon') {
            _coordinates = coordinates[0].map((e) => {
                return ({
                    lat: e[1],
                    lng: e[0]
                })
            })
            if (!locateActive) this.#map.flyToBounds(_coordinates)
        }
        if (feature.geometry.type === 'MultiPolygon') {
            _coordinates = feature.geometry.coordinates.map((e) => {
                return e[0].map((_e) => {
                    return {
                        lat: _e[1],
                        lng: _e[0]
                    }
                })
            })
            if (!locateActive) this.#map.flyToBounds(_coordinates)
        }
        if (feature.geometry.type === 'LineString') {
            _coordinates = coordinates.map((e) => {
                return { lat: e[1], lng: e[0] }
            })
            if (!locateActive) this.#map.flyToBounds(_coordinates)
        }
    }

    legendControl({ element }) {
        var legend = L.control({position: 'bottomright'});

        // function getColor(d) {
        //     return d > 1000 ? '#800026' :
        //            d > 500  ? '#BD0026' :
        //            d > 200  ? '#E31A1C' :
        //            d > 100  ? '#FC4E2A' :
        //            d > 50   ? '#FD8D3C' :
        //            d > 20   ? '#FEB24C' :
        //            d > 10   ? '#FED976' :
        //                       '#FFEDA0';
        // }

        legend.onAdd = function (map) {

            var div = L.DomUtil.create('div', 'legend')
            // var div = L.DomUtil.create('div', 'info legend'),
            //     grades = [0, 10, 20, 50, 100, 200, 500, 1000],
            //     labels = [];

            // // loop through our density intervals and generate a label with a colored square for each interval
            // for (var i = 0; i < grades.length; i++) {
            //     div.innerHTML +=
            //         '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
            //         grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
            // }

            div.innerHTML = element
            return div;
        };
        legend.addTo(this.#map);
    }

    style(feature) {
        return {
            fillColor: getColor(feature.properties.density),
            weight: 2,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.7
        };
    }
}
