import MapController from "../controllers/mapController.js"

onmessage = ({ data }) => {
    const mapController = new MapController()
    const { url, eventType } = data
    postMessage({ eventType })
    if (url) {
        mapController.workerGeoJson({
            url,
            ocurrency: (geojson) => {
                postMessage({
                    eventType: 'ready', ...geojson
                })
            }
        })
    }
}