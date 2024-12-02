import MapService from "./mapService.js"

onmessage = async ({ data }) => {
    const service = new MapService()
    const { currentValue } = data
    const response = await service.getApi(currentValue)

    postMessage({ eventType: 'ready', response })
}
