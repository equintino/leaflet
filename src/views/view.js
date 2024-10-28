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

    found({ data, legendControl, fn }) {
        let selection = `<h4>${data.length} Occurrences:</h4>`
        data.forEach((e) => {
            selection += `<input title="${e.properties.display_name}" type="radio" name="geolocation" value='${JSON.stringify(e.geometry)}' /><label>${e.properties.display_name.slice(0, 20)}...</label><br>`
        })

        legendControl(selection, () => {
            document.querySelectorAll('[type=radio]').forEach((e) => {
                e.addEventListener('change', (_e) => {
                    fn(JSON.parse(_e.target.value))
                })
            })
        })
    }
}