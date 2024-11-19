import AbstractView from "./abstractView.js"

export default class MapView extends AbstractView {

    initializer({ cleanData }) {
        document.querySelector('.clear').addEventListener('click', () => {
            this.cleanData({
                locate:  document.querySelector('.locate-active'),
                cleanData
            })
        })
    }

    onOffLoading(onOff) {this.view.onOffLoading(onOff) }

    checkLocate() { return document.querySelector('.locate-active') }

    cleanData({ locate, cleanData }) {
        if (typeof(cleanData) === 'function') cleanData()
        document.querySelector('#search').value = ''
        document.querySelector('.auto-results-wrapper')
            ? document.querySelector('.auto-results-wrapper').remove()
            : null
        if (!locate && document.querySelector('.locate-active')) {
            document.querySelector('.locate-active').classList.remove('locate-active')
        }
        document.querySelector('#search').focus()
    }

    actionSearch({ getFeatures, reverse, greatCircle, map, validateJson }) {
        const that = this
        async function search() {
            document.querySelector('.auto-results-wrapper')
                ? document.querySelector('.auto-results-wrapper').remove() : null
            that.view.onOffLoading(true)
            const currentValue = document.querySelector('#search').value
            const div = document.createElement('div')
            div.setAttribute('class', 'auto-results-wrapper auto-is-active')
            let ul = '<ul>'

            const features = await getFeatures(currentValue)
            features.forEach((e, i) => {
                that.view.onOffLoading(false)
                const value = JSON.stringify(e)
                ul += '<li class="loupe" role="option" data=\''
                    + value + '\'><b>' + (i+1) + '</b> - '
                    + e.properties.display_name + '</li>'
            })
            ul += '</ul>'

            div.innerHTML = ul
            document.querySelector('.auto-search-wrapper').append(div)
            document.querySelector('.auto-is-active').addEventListener('mouseleave',
                e => {
                    e.target.classList
                        .remove('auto-is-active')
                })

            document.querySelector('.auto-is-active').addEventListener('click',
                e => {
                    e.target.parentElement.parentElement
                        .classList
                        .remove('auto-is-active')
                })
            document.querySelector('#search').addEventListener('mouseover', _ => {
                if (document.querySelector('.auto-results-wrapper')) {
                    document.querySelector('.auto-results-wrapper')
                        .classList.add('auto-is-active')
                }
            })

            document.querySelector('.auto-results-wrapper').addEventListener('click',
                e => {
                    that.view.onOffLoading(true)
                    if (!validateJson(e.target.attributes['data'].value)) return
                    const results = validateJson(e.target.attributes['data'].value)
                    const { type } = results.geometry
                    const coordinates = reverse(results.geometry).coordinates
                    const { display_name } = results.properties
                    const customId = Math.random()
                    const marker = (
                        type === 'MultiPolygon' || type === 'Polygon' || type === 'LineString' ? L.polygon(coordinates, {
                            id: customId
                        })
                        : L.marker(coordinates, {
                            title: display_name,
                            id: customId
                        })
                    )
                    map.eachLayer((layer) => {
                        if (layer.options.id && layer.options.id !== customId) {
                            map.removeLayer(layer)
                        }
                    })

                    marker.addTo(map).bindPopup(display_name);

                    if (that.checkLocate()) {
                        // turf
                        greatCircle(results)
                    }
                    else {
                        if (type === 'Polygon' || type === 'MultiPolygon' || type === 'LineString') map.fitBounds(coordinates)

                        if (type === 'Point') map.setView(coordinates, 8);
                    }
                    that.view.onOffLoading(false)
            })
        }

        document.querySelector('button[value=search]').addEventListener('click',
            async (e) => search({ e }))
        document.querySelector('#search').addEventListener('keypress',
            async (e) => {
                if (e.keyCode && e.keyCode !== 13) return
                search({ e })
            })
    }
}
