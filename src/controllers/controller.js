import MapController from "./mapController.js"

export default class Controller {
    view
    service
    worker
    loading
    events = {
        reading: 'waiting',
        ready  : 'ready'
    }

    constructor({ view, service, worker }) {
        this.view    = view
        this.service = service
        this.worker  = worker
    }

    static initializer(deps) {
        const controller = new Controller(deps)
        this.loading = controller.view.onOffLoading
        controller.initMap()
    }

    initMap() {
        const mapController = new MapController()
        mapController.init([0, 0], 2)

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
    }
}
