import AbstractView from "./abstractView.js"

export default class MapView extends AbstractView {
    #search = document.querySelector('#search')

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
        if (document.querySelector('.auto-results-wrapper')
            && document.querySelector('.auto-is-active')) {
                document.querySelector('.auto-is-active')
                    .classList.remove('auto-is-active')
            // document.querySelectorAll('.auto-results-wrapper li').forEach((elem) => {
            //     elem.remove()
            // })
        }

        if (!locate && document.querySelector('.locate-active')) {
            document.querySelector('.locate-active')
                .classList.remove('locate-active')
        }
        document.querySelector('#search').focus()
    }

    autoCompleteClear({ cleanData }) {
        document.querySelector('#search').addEventListener('mouseover', () => {
            if (document.querySelector('.auto-results-wrapper')) {
                document.querySelector('.auto-results-wrapper')
                    .classList.add('auto-is-active')
            }
        })
        document.querySelector('.auto-results-wrapper')
            .addEventListener('mouseleave', () => {
                document.querySelector('.auto-results-wrapper')
                    .classList.remove('auto-is-active')
        })
        document.querySelector('.auto-clear').onclick = () => {
            const locate = (
                document.querySelector('.locate-active') ? true : false
            )
            this.cleanData({ locate, cleanData })
        }
    }

    async #createListResults({ features, distance }) {
        const _features = await features
        const div = document.createElement('div')
        div.setAttribute('class', 'auto-results-wrapper auto-is-active')
        let ul = '<ul>'

        if (_features.length > 0) {
            _features.forEach((e, i) => {
                const value = JSON.stringify(e)
                ul += '<li class="loupe" role="option" data=\''
                    + value + '\'><b>' + (i+1) + '</b> - '
                    + e.properties.display_name + (
                        distance(e) ? '<p><b>(' + distance(e) + ' - from where I am to here in a straight line approximately)</b></p>' : ''
                    ) + '</li>'
            })
        }
        else {
            ul += `<li class="loupe" role="option" data="" >No found results</li>`
        }
        ul += '</ul>'

        this.view.onOffLoading(false)
        div.innerHTML = ul
        return div
    }

    async search({ features, distance, fn }) {
        const that = this
        document.querySelector('.auto-results-wrapper')
            ? document.querySelector('.auto-results-wrapper').remove() : null
        this.view.onOffLoading(true)

        const div = await this.#createListResults({ features, distance })
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
                let results = e.target.offsetParent
                    && e.target.offsetParent.tagName === 'LI'
                        ? e.target.offsetParent.attributes['data'].value
                        : e.target.attributes['data'] ? e.target.attributes['data'].value : that.view.onOffLoading(false)

                if (!results) return
                that.view.onOffLoading(true)
                fn({ results, checkLocate: this.checkLocate})
        })
    }

    // actionSearch({ getFeatures, reverse, greatCircle, map, validateJson, distance }) {
    //     const that = this
    //     document.querySelector('button[value=search]').addEventListener('click',
    //         async (e) => {
    //             const currentValue = document.querySelector('#search').value
    //             that.search({ currentValue, getFeatures, distance, validateJson, reverse, map, greatCircle })
    //         })
    //     document.querySelector('#search').addEventListener('keypress',
    //         async (e) => {
    //             const currentValue = e.target.value
    //             if (e.keyCode && e.keyCode !== 13) return
    //             that.search({ currentValue, getFeatures, distance, validateJson, reverse, map, greatCircle })
    //         })
    // }

    setEventSearch(fn) {
        document.querySelector('button[value=search]').addEventListener('click',
            (e) => {
                const currentValue = document.querySelector('#search').value
                fn(currentValue)
            })
        document.querySelector('#search').addEventListener('keypress',
            (e) => {
                const currentValue = e.target.value
                if (e.keyCode && e.keyCode !== 13) return
                fn(currentValue)
            })
    }
}
