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

    found(data, fn) {
        let select = '<select name="type"><option></option>'
        data.forEach((e) => {
            select += `<option title="${e.properties.display_name}" value=${JSON.stringify(e.geometry)}>${e.properties.display_name.slice(0, 20)}...</option>`
        })
        select += '</select>'
        this.#found.innerHTML = `${data.length} occurrences ${select}`
        document.querySelector('select[name=type]').addEventListener('change', (e) => {
            fn(JSON.parse(e.target.value))
        })
    }
}