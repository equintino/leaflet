import MapController from "./mapController.js"

export default class Controller {
    #view
    #worker
    #events = {
        reading: 'waiting',
        ready: 'ready'
    }

    constructor({ view, worker }) {
        this.#view = view
        this.#worker = worker
    }

    static initializer(deps) {
        const controller = new Controller(deps)
        controller.init()
    }

    async init() {
        const mapController = new MapController()
        mapController.initializer()

        // mapController.marker({
        //     coordinates: {
        //         lng: -43.27503,
        //         lat: -22.84414
        //     },
        //     popup: 'A pretty CSS popup.<br> Easily customizable.'
        // })
        // mapController.circle({
        //     coordinates:  {
        //         lng: -43.27503,
        //         lat: -22.84414
        //     },
        //     color: 'red',
        //     fillcolor: '#f03',
        //     fillOpacity: 0.5,
        //     radius: 50
        // })
        // mapController.polygon({
        //     coordinates:  [
        //         {
        //             lng: -43.27503,
        //             lat: -22.84414
        //         },
        //         {
        //             lng: -43.27503,
        //             lat: -22.84440
        //         }
        //     ]
        // })

        // this.#worker.postMessage({
        //     mapController: new MapController()
        // })

        // async function getGeojson(country) {
        //     const geojson = await (await fetch(`https://nominatim.openstreetmap.org/search?q=${country}&format=geojson&polygon_geojson=1&addressdetails=1`)).json()

        //     mapController.geoJson({
        //         geojson
        //     })
        // }

        this.#view.setEvents(({ country }) => {
            mapController.mapReload()
            this.#worker.postMessage({ eventType: this.#events.reading })
            this.#worker.postMessage({
                url: `https://nominatim.openstreetmap.org/search?q=${country}&format=geojson&polygon_geojson=1&addressdetails=1`
            })
        })
        this.#worker.onmessage = ({ data }) => {
            const geojson = data.features
            const eventType = data.eventType
            mapController.geoJson({ geojson })
            if (eventType === 'waiting') this.#view.onOffLoading(true)
            if (eventType === 'ready') this.#view.onOffLoading(false)
            if (eventType === 'found') this.#view.found(
                data.data, (geometry) => mapController.flyTo(geometry)
            )
        }
    }
}
