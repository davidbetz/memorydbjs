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

class Aggregate {
    constructor() { }

    _prepare(items) {
        if (typeof this.expression === 'function') {
            return items.map(this.expression)
        }
        return items
    }
}

class Count extends Aggregate {
    constructor(expression) {
        super()
        this.expression = expression
    }

    run(items) {
        if (typeof items === 'undefined') {
            return {}
        }
        if (typeof this.expression !== 'function') {
            throw new Error('expression function is required for count aggregate')
        }
        let results = this._prepare(items).reduce((groups, n) => {
            groups[n] = groups[n] || 0
            groups[n]++
            return groups
        }, {})
        const keys = Object.keys(results)
        results = keys
            .reduce(function (result, key) {
                result[key] = results[key]
                return result
            }, {})
        return results
    }
}

class Average extends Aggregate {
    constructor(expression) {
        super()
        this.expression = expression
    }

    run(items) {
        if (typeof items === 'undefined') {
            return 0
        }
        const count = items.length
        return this._prepare(items).reduce((a, b) => a + b) / count
    }
}

class Sum extends Aggregate {
    constructor(expression) {
        super()
        this.expression = expression
    }

    run(items) {
        if (typeof items === 'undefined') {
            return 0
        }
        return this._prepare(items).reduce((a, b) => a + b)
    }
}

module.exports = { Aggregate, Count, Average, Sum }