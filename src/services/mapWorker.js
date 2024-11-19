import MapController from "../controllers/mapController.js"
import MapService from "./mapService.js"

onmessage = async ({ data }) => {
    const service = new MapService()
    const { currentValue } = data
    const response = await service.getApi(currentValue)

    postMessage({ eventType: 'ready', response })
    // const mapController = new MapController()
    // const { url, eventType } = data
    // postMessage({ eventType })
    // if (url) {
    //     mapController.workerGeoJson({
    //         url,
    //         ocurrency: (geojson) => {
    //             postMessage({
    //                 eventType: 'ready', ...geojson
    //             })
    //         }
    //     })
    // }
}
