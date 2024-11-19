export default class View {
    loading
    #country
    #search
    #found

    constructor() {
        this.#country = document.querySelector('#country')
        this.#search  = document.querySelector('#search button')
        this.#found   = document.querySelector('span#found')
        this.loading  = document.querySelector('div#loading').style
    }

    setEvents(fn) {
        // this.#country.addEventListener('change', (e) => {
        //     fn({
        //         country: e.target.value
        //     })
        // })
        // this.#search.addEventListener('click', (e) => {
        //     fn({
        //         country: e.target.offsetParent.querySelector('#country').value
        //     })
        // })
    }

    onOffLoading(onOff) {
        const display = onOff ? 'block' : 'none'
        this.loading.display = display
    }

    found({ data, legendControl, fn }) {
        let selection = `<p>${data.length} Occurrences:</p>`
        selection += '<select name="geolocation"><option></option>'
        data.forEach((e) => {
            selection += `<option title="${e.properties.display_name}" value='${JSON.stringify(e)}' />${e.properties.display_name.slice(0, 20)}...</option><br>`
        })

        legendControl(selection, () => {
            document.querySelector('select[name=geolocation]').addEventListener('change', (e) => {
                if (e.target.value) fn(JSON.parse(e.target.value))
            })
        })
    }
}
