export default class MapController {
    #map

    initializer() {
        this.#map = L.map('map').setView([0, 0], 2)
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);
    }

    mapReload() {
        this.#map.remove()
        this.initializer()
    }

    marker({ coordinates, popup }) {
        L.marker(coordinates).addTo(this.#map)
            .bindPopup(popup)
            .openPopup();
    }

    circle({ coordinates, color, fillcolor, fillOpacity, radius }) {
        L.circle( coordinates, {
            color, fillcolor, fillOpacity, radius
        }).addTo(this.#map)
    }

    polygon({ coordinates }) {
        L.polygon( coordinates ).addTo(this.#map)
    }

    async workerGeoJson({ url, ocurrency, found }) {
        const geojson = await this.#getGeoJson({ url })
        ocurrency(geojson)
        found(geojson.features)
    }

    async geoJson({ geojson }) {
        const map = this.#map
        let that = this
        const _geojspn = L.geoJSON(geojson, {
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
            _geojspn.resetStyle(e.target)
            that.info({ type: 'update' })
        }
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
        this._div.innerHTML = props.address ? `<h4>Details</h4> <p>Country: ${props.address.country}</p>` + ( props.addresstype !== 'country' ? `<p>${this.captalize(props.addresstype)}: ${props.address[props.addresstype]}</p>` : '' ) + ( props.address.municipality && props.addresstype !== 'municipality' ? `<p>Municipality: ${props.address.municipality}</p>` : '' ) : null
    }

    flyTo(geometry) {
        const coordinates = geometry.coordinates
        let _coordinates
        if (geometry.type === 'Point') {
            _coordinates = {
                lat: coordinates[1],
                lng: coordinates[0]
            }
            this.#map.flyTo(_coordinates)
        }
        if (geometry.type === 'Polygon') {
            _coordinates = coordinates[0].map((e) => {
                return (
                    {
                        lat: e[1],
                        lng: e[0]
                    }
                )
            })
            this.#map.flyToBounds(_coordinates)
        }
        if (geometry.type === 'MultiPolygon') {
            _coordinates = geometry.coordinates.map((e) => {
                return e[0].map((_e) => {
                    return {
                        lat: _e[1],
                        lng: _e[0]
                    }
                })
            })
            this.#map.flyToBounds(_coordinates)
        }
        if (geometry.type === 'LineString') {
            _coordinates = coordinates.map((e) => {
                return { lat: e[1], lng: e[0] }
            })
            this.#map.flyToBounds(_coordinates)
        }
    }

    legendControl() {
        var legend = L.control({position: 'bottomright'});

        function getColor(d) {
            return d > 1000 ? '#800026' :
                   d > 500  ? '#BD0026' :
                   d > 200  ? '#E31A1C' :
                   d > 100  ? '#FC4E2A' :
                   d > 50   ? '#FD8D3C' :
                   d > 20   ? '#FEB24C' :
                   d > 10   ? '#FED976' :
                              '#FFEDA0';
        }

        legend.onAdd = function (map) {

            var div = L.DomUtil.create('div', 'info legend'),
                grades = [0, 10, 20, 50, 100, 200, 500, 1000],
                labels = [];

            // loop through our density intervals and generate a label with a colored square for each interval
            for (var i = 0; i < grades.length; i++) {
                div.innerHTML +=
                    '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
                    grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
            }

            return div;
        };

        legend.addTo(map);

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

    captalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1)
    }
}