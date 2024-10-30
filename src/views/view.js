export default class View {
    #country
    #search
    #loading
    #found

    constructor() {
        this.#country = document.querySelector('#country')
        this.#search = document.querySelector('#search button')
        this.#loading = document.querySelector('div#loading').style
        this.#found = document.querySelector('span#found')
    }

    setEvents(fn) {
        this.#country.addEventListener('change', (e) => {
            fn({
                country: e.target.value
            })
        })
        this.#search.addEventListener('click', (e) => {
            fn({
                country: e.target.offsetParent.querySelector('#country').value
            })
        })
    }

    onOffLoading(onOff) {
        const display = onOff ? 'block' : 'none'
        this.#loading.display = display
    }

    found({ data, legendControl, fn, bounds }) {
        let selection = `<p>${data.length} Occurrences:</p>`
        selection += '<select name="geolocation"><option></option>'
        data.forEach((e) => {
            console.log(
                typeof(e.geometry.coordinates[0])
            )
            if (typeof(e.geometry.coordinates[0]) === 'object') {
                console.log(
                    bounds._southWest.lat.toFixed(1),
                    bounds._southWest.lng.toFixed(1),
                    e.geometry.coordinates[1],
                    e.geometry.coordinates[0]
                )
            }
            // selection += `<input title="${e.properties.display_name}" type="radio" name="geolocation" value='${JSON.stringify(e.geometry)}' /><label>${e.properties.display_name.slice(0, 20)}...</label><br>`
            selection += `<option title="${e.properties.display_name}" value='${JSON.stringify(e.geometry)}' />${e.properties.display_name.slice(0, 20)}...</option><br>`
        })

        legendControl(selection, () => {
            document.querySelector('select[name=geolocation]').addEventListener('change', (e) => {
                fn(JSON.parse(e.target.value))
            })
        })
    }
}