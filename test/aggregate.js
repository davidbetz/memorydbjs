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

"use strict"

const expect = require('chai').expect
const assert = require('chai').assert

const $aggregate = require('../aggregate')

describe("aggregate", function () {
    it("aggregate (count)", function () {
        const aggregate = new $aggregate.Count(_ => _.title[0])
        const stats = aggregate.run([{ "title": "hello1" }, { "title": "frogs" }, { "title": "hello3" }])
        const keys = Object.keys(stats)
        expect(stats['h']).to.eq(2)
        expect(stats['f']).to.eq(1)
        expect(keys.length).to.gt(0)
        expect(stats[keys[0]]).to.gt(0)
    })

    it("aggregate (count w/ no input)", function () {
        const aggregate = new $aggregate.Count(_ => _.title[0])
        const stats = aggregate.run()
        expect(stats).to.eql({})
    })

    it("aggregate (count, error: w/o aggregate)", function () {
        const aggregate = new $aggregate.Count()
        try {
            const stats = aggregate.run([{ "title": "hello1" }, { "title": "frogs" }, { "title": "hello3" }])
            expect(1).to.eq(0)
        }
        catch (ex) {
            expect(ex.message).to.eq('expression function is required for count aggregate')
        }
    })

    it("aggregate (avg)", function () {
        const aggregate = new $aggregate.Average(_ => _.value)
        const stats = aggregate.run([{ "title": "hello1", "value": 10 }, { "title": "frogs", "value": 20 }, { "title": "hello3", "value": 30 }])
        expect(stats).to.eq(20)
    })

    it("aggregate (avg w/ no input)", function () {
        const aggregate = new $aggregate.Average(_ => _.value)
        const stats = aggregate.run()
        expect(stats).to.eq(0)
    })

    it("aggregate (sum)", function () {
        const aggregate = new $aggregate.Sum(_ => _.value)
        const stats = aggregate.run([{ "title": "hello1", "value": 10 }, { "title": "frogs", "value": 20 }, { "title": "hello3", "value": 30 }])
        expect(stats).to.eq(60)
    })

    it("aggregate (sum w/ no input)", function () {
        const aggregate = new $aggregate.Sum(_ => _.value)
        const stats = aggregate.run()
        expect(stats).to.eq(0)
    })

    it("aggregate (sum w/o expression)", function () {
        const aggregate = new $aggregate.Sum()
        const stats = aggregate.run([1, 2, 3])
        expect(stats).to.eq(6)
    })
})