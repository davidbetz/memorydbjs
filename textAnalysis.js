// MIT License

// Copyright (c) 2016-2017 David Betz

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

const u = require('./utility')

class FullTextAnalysis {
    constructor(data) {
        this.data = data
    }

    dump() {
        return this.data
    }

    terms() {
        return Object.keys(this.data)
    }

    scores(text) {
        const segment = this.data[text]
        if (typeof segment === 'undefined') {
            return
        }
        let k = Object.keys(segment.spread).map(_ => parseInt(_))
        k.sort((a, b) => {
            /* istanbul ignore next */
            if (a < b) return 1
            /* istanbul ignore next */
            if (a > b) return -1
            /* istanbul ignore next */
            return 0
        })
        return k
    }

    top(text) {
        const scores = this.scores(text)
        if (typeof scores === 'undefined') {
            return undefined
        }
        const item = this.data[text].spread[scores[0]]
        return item.value
    }

    all(text) {
        const scanned = this.scores(text)
        const keys = this.data[text].spread
        let results = []
        for (let n in keys) {
            let i = 0
            let value
            let v = parseInt(keys[n])
            value = keys[n]
            results.push(value.value)
            let next = value.next
            while (typeof next !== 'undefined') {
                value = next
                next = value.next
                results.push(value.value)
            }
            value.next = next
        }
        return results
    }

    filter(expression) {
        if (typeof expression !== 'function') {
            return []
        }
        const filtered = this.terms()
            .filter(expression)
            .sort((a, b) => {
                if (this.data[a].sum < this.data[b].sum) return 1
                if (this.data[a].sum > this.data[b].sum) return -1
                return 0
            })
            .reduce((result, key) => {
                result[key] = this.data[key]
                return result
            }, {})
        return filtered
    }

    serialize(filtered) {
        const transformed = Object.keys(filtered)
            .map(p => {
                const v = filtered[p]
                return {
                    p,
                    score: v.sum,
                    items: v.spread
                }
            })
        let ids = []
        for (const a of transformed) {
            const keys = Object.keys(a.items)
                .map(p => parseInt(p))
                .sort((a, b) => {
                    /* istanbul ignore next */
                    if (a < b) return 1
                    /* istanbul ignore next */
                    if (a > b) return -1
                    /* istanbul ignore next */
                    return 0
                })
            for (const key of keys) {
                let value = a.items[key]
                do {
                    if (ids.includes(value.value) === false) {
                        ids.push(value.value)
                    }
                    value = value.next
                }
                while (typeof value !== 'undefined')
            }
        }
        return ids
    }

    highlight(term, text, render) {
        const re = new RegExp("\\b" + term + "\\b", 'gi')
        const replacement = render.replace('{{_}}', term)
        return text.replace(re, replacement)
    }
}

module.exports = { FullTextAnalysis }