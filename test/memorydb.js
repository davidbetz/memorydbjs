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

const provider = require('../memorydb')
const idgen = require('../idgen')
const $hamlet = require('../hamlet')
const hamlet = $hamlet.hamlet

const $aggregate = require('../aggregate')

const u = require('../utility')

describe("memorydb", function () {
    beforeEach(() => {
        provider.resetDatabase()
    })

    it("simple add and dumpdb", function (done) {
        const scope = idgen.generate(this.test.title)
        const row_key = idgen.generate(this.test.title)
        const item = { "title": "hello1" }
        provider.insert(scope, row_key, item)
            .then(v => provider.dumpdb()
                .then(v => {
                    expect(v[0].title).to.equal(item.title)
                    done()
                }))
    })

    it("simple add and get", function (done) {
        const scope = idgen.generate(this.test.title)
        const row_key = idgen.generate(this.test.title)
        const item = { "title": "hello1" }
        provider.insert(scope, row_key, item)
            .then(v => provider.get(scope, row_key)
                .then(v => {
                    expect(v.title).to.equal(item.title)
                    done()
                }))
    })

    it("simple add, change id, and get", function (done) {
        const scope = idgen.generate(this.test.title)
        const row_key = idgen.generate(this.test.title)
        const new_row_key = idgen.generate(this.test.title)

        const item = { "title": "hello1" }
        provider.insert(scope, row_key, item)
            .then(v => provider.get(scope, row_key)
                .then(p => provider.changeId(p, new_row_key)
                    .then(v => provider.get(scope, new_row_key)
                        .then(q => {
                            expect(q.title).to.equal(item.title)
                            done()
                        })
                    )
                )
            )
    })

    it("2 adds and getAll", function (done) {
        const scope = idgen.generate(this.test.title)
        const item1 = { "title": "hello1" }
        const item2 = { "title": "hello2" }
        Promise.all([
            provider.insert(scope, idgen.generate(this.test.title), item1),
            provider.insert(scope, idgen.generate(this.test.title), item2)
        ])
            .then(v => provider.getAll(scope)
                .then(items => {
                    expect(items[0].title).to.equal(item1.title)
                    expect(items[1].title).to.equal(item2.title)
                    done()
                })
            )
    })

    it("add, get, and update", function (done) {
        const scope = idgen.generate(this.test.title)
        const row_key = idgen.generate(this.test.title)
        const item = { "title": "hello1" }
        provider.insert(scope, row_key, item)
            .then(v => provider.get(scope, row_key)
                .then(v => {
                    v.title = 'was updated'
                    provider.update(v)
                        .then(() => provider.get(scope, row_key)
                            .then(v => {
                                expect(v.title).to.not.equal(item.title)
                                expect(v.title).to.equal('was updated')
                                done()
                            }))
                }))
    })

    it("3 adds, delete, and getAll", function (done) {
        const scope = idgen.generate(this.test.title)
        const row_key = idgen.generate(this.test.title)
        const item1 = { "title": "hello1" }
        const item2 = { "title": "hello2" }
        const item3 = { "title": "hello3" }
        Promise.all([
            provider.insert(scope, idgen.generate(this.test.title), item1),
            provider.insert(scope, row_key, item2),
            provider.insert(scope, idgen.generate(this.test.title), item3)
        ])
            .then(v => provider.delete(scope, row_key)
                .then(v => provider.getAll(scope)
                    .then(items => {
                        expect(items[0].title).to.equal(item1.title)
                        expect(items[1].title).to.equal(item3.title)
                        done()
                    })
                )
            )
    })

    it("stats (count)", function (done) {
        const scope = idgen.generate(this.test.title)
        const row_key = idgen.generate(this.test.title)
        const item1 = { "title": "hello1" }
        const item2 = { "title": "frogs" }
        const item3 = { "title": "hello3" }
        Promise.all([
            provider.insert(scope, idgen.generate(this.test.title), item1),
            provider.insert(scope, row_key, item2),
            provider.insert(scope, idgen.generate(this.test.title), item3)
        ])
            .then(v => provider.stats(scope, new $aggregate.Count(_ => _.title[0]))
                .then(stats => {
                    const keys = Object.keys(stats)
                    expect(keys.length).to.gt(0)
                    expect(stats[keys[0]]).to.gt(0)
                    done()
                })
            )
    })

    it("stats (avg)", function (done) {
        const scope = idgen.generate(this.test.title)
        const row_key = idgen.generate(this.test.title)
        const item1 = { "title": "hello1", "value": 10 }
        const item2 = { "title": "frogs", "value": 20 }
        const item3 = { "title": "hello3", "value": 30 }
        Promise.all([
            provider.insert(scope, idgen.generate(this.test.title), item1),
            provider.insert(scope, row_key, item2),
            provider.insert(scope, idgen.generate(this.test.title), item3)
        ])
            .then(v => provider.stats(scope, new $aggregate.Average(_ => _.value))
                .then(stats => {
                    expect(stats).to.eq(20)
                    done()
                })
            )
    })

    it("stats (sum)", function (done) {
        const scope = idgen.generate(this.test.title)
        const row_key = idgen.generate(this.test.title)
        const item1 = { "title": "hello1", "value": 10 }
        const item2 = { "title": "frogs", "value": 20 }
        const item3 = { "title": "hello3", "value": 30 }
        Promise.all([
            provider.insert(scope, idgen.generate(this.test.title), item1),
            provider.insert(scope, row_key, item2),
            provider.insert(scope, idgen.generate(this.test.title), item3)
        ])
            .then(v => provider.stats(scope, new $aggregate.Sum(_ => _.value))
                .then(stats => {
                    expect(stats).to.eq(60)
                    done()
                })
            )
    })

    it("3 adds and query", function (done) {
        const scope = idgen.generate(this.test.title)
        const row_key = idgen.generate(this.test.title)
        const item1 = { "title": "hello1" }
        const item2 = { "title": "frogs" }
        const item3 = { "title": "hello3" }
        Promise.all([
            provider.insert(scope, idgen.generate(this.test.title), item1),
            provider.insert(scope, row_key, item2),
            provider.insert(scope, idgen.generate(this.test.title), item3)
        ])
            .then(v => {
                const expression = _ => _.title.startsWith('h')
                provider.query(scope, expression)
                    .then(items => {
                        expect(items.length).to.equal(2)
                        done()
                    })
            })
    })

    it("sample w/o data", function (done) {
        const scope = idgen.generate(this.test.title)
        const row_key = idgen.generate(this.test.title)
        provider.sample(scope, 10)
            .then(sample => {
                expect(sample.length).to.equal(0)
                done()
            })
    })

    it("20 adds and sample", function (done) {
        const scope = idgen.generate(this.test.title)
        const row_key = idgen.generate(this.test.title)
        let promises = []
        for (let n = 0; n < 20; n++) {
            promises.push(provider.insert(scope, idgen.generate(this.test.title), { "title": hamlet(2), order: n }))
        }
        Promise.all(promises)
            .then(v =>
                provider.sample(scope, 10)
                    .then(sample => {
                        expect(sample.length).to.equal(10)
                        done()
                    })
            )
    })

    it("20 adds and sample (using default size)", function (done) {
        const scope = idgen.generate(this.test.title)
        const row_key = idgen.generate(this.test.title)
        let promises = []
        for (let n = 0; n < 20; n++) {
            promises.push(provider.insert(scope, idgen.generate(this.test.title), { "title": hamlet(2), order: n }))
        }
        Promise.all(promises)
            .then(v =>
                provider.sample(scope)
                    .then(sample => {
                        expect(sample.length).to.equal(10)
                        done()
                    })
            )
    })

    it("add, updateall, get", function (done) {
        const scope = idgen.generate(this.test.title)

        const row_key1 = idgen.generate(this.test.title)
        const row_key2 = idgen.generate(this.test.title)
        const row_key3 = idgen.generate(this.test.title)

        const item1 = { "title": "hello1" }
        const item2 = { "title": "frogs" }
        const item3 = { "title": "hello3" }

        Promise.all([
            provider.insert(scope, row_key1, item1),
            provider.insert(scope, row_key2, item2),
            provider.insert(scope, row_key3, item3)
        ]).then(v => {
            Promise.all([
                provider.get(scope, row_key1),
                provider.get(scope, row_key2),
                provider.get(scope, row_key3),
            ]).then(all => {
                const [item1Copy, item2Copy, item3Copy] = all
                item1Copy.text = 'updateda'
                item2Copy.text = 'updatedb'
                item3Copy.text = 'updatedc'
                provider.updateAll([item1Copy, item2Copy, item3Copy])
                    .then(() => {
                        provider.getAll(scope)
                            .then(all => {
                                expect(all[2].text).to.equal(item3Copy.text)
                                expect(all[1].text).to.equal(item2Copy.text)
                                expect(all[0].text).to.equal(item1Copy.text)
                                done()
                            })
                    })
            })
        })
    })

    it("updateall (no data, no error either)", function (done) {
        provider.updateAll()
            .then(() => {
                done()
            })
    })

    it("stats (error: invalid aggregate)", function (done) {
        const scope = idgen.generate(this.test.title)
        const row_key = idgen.generate(this.test.title)
        const item1 = { "title": "hello1" }
        const item2 = { "title": "frogs" }
        const item3 = { "title": "hello3" }
        Promise.all([
            provider.insert(scope, idgen.generate(this.test.title), item1),
            provider.insert(scope, row_key, item2),
            provider.insert(scope, idgen.generate(this.test.title), item3)
        ])
            .then(v => provider.stats(scope, '')
                .then(stats => {
                    expect(1).to.eq(0)
                })
                .catch(err => {
                    expect(err.message).to.eq('aggregate must be of type Aggregate')
                    done()
                })
            )
    })

    it("simple add and get (error: bad row_key format)", function (done) {
        const scope = idgen.generate(this.test.title)
        const row_key = idgen.generate(this.test.title)
        const item = { "title": "hello1" }
        provider.insert(scope, row_key, item)
            .then(v => provider.get(scope, {})
                .then(v => {
                    expect(1).to.eq(0)
                })
                .catch(err => {
                    expect(err.message).to.eq('parameter after partition_key must be a row_key or an array of row keys')
                    done()
                })
            )
    })

    it("get (error: 404)", function (done) {
        provider.get('scope', 'row_key')
            .then(() => {
                expect(1).to.eq(0)
            })
            .catch(err => {
                expect(err).to.eq(404)
                done()
            })
    })

    it("3 adds and query (error: no expression)", function (done) {
        const scope = idgen.generate(this.test.title)
        const row_key = idgen.generate(this.test.title)
        const item1 = { "title": "hello1" }
        const item2 = { "title": "frogs" }
        const item3 = { "title": "hello3" }
        Promise.all([
            provider.insert(scope, idgen.generate(this.test.title), item1),
            provider.insert(scope, row_key, item2),
            provider.insert(scope, idgen.generate(this.test.title), item3)
        ])
            .then(v => {
                provider.query(scope)
                    .then(items => {
                        expect(1).to.equal(0)
                    })
                    .catch(err => {
                        expect(err.message).to.eq('expression function is required for query')
                        done()
                    })
            })
    })

    it("3 adds and query (error: bad expression)", function (done) {
        const scope = idgen.generate(this.test.title)
        const row_key = idgen.generate(this.test.title)
        const item1 = { "title": "hello1" }
        const item2 = { "title": "frogs" }
        const item3 = { "title": "hello3" }
        Promise.all([
            provider.insert(scope, idgen.generate(this.test.title), item1),
            provider.insert(scope, row_key, item2),
            provider.insert(scope, idgen.generate(this.test.title), item3)
        ])
            .then(v => {
                provider.query(scope, 'asfdasdf')
                    .then(items => {
                        expect(1).to.equal(0)
                    })
                    .catch(err => {
                        expect(err.message).to.eq('expression function is required for query')
                        done()
                    })
            })
    })

    it("update (error: item.partition_key missing)", function (done) {
        provider.update({})
            .then(() => {
                expect(1).to.eq(0)
            })
            .catch(err => {
                expect(err.message).to.eq('missing update|item.partition_key')
                done()
            })
    })

    it("update (error: item.row_key missing)", function (done) {
        provider.update({ partition_key: 1 })
            .then(() => {
                expect(1).to.eq(0)
            })
            .catch(err => {
                expect(err.message).to.eq('missing update|item.row_key')
                done()
            })
    })

    it("update (error: 404)", function (done) {
        provider.update({ partition_key: 1, row_key: 1 })
            .then(() => {
                expect(1).to.eq(0)
            })
            .catch(err => {
                expect(err).to.eq(404)
                done()
            })
    })

    it("changeId (error: item.partition_key missing)", function (done) {
        provider.changeId({})
            .then(() => {
                expect(1).to.eq(0)
            })
            .catch(err => {
                expect(err.message).to.eq('missing changeId|item.partition_key')
                done()
            })
    })

    it("changeId (error: item.row_key missing)", function (done) {
        provider.changeId({ partition_key: 1 })
            .then(() => {
                expect(1).to.eq(0)
            })
            .catch(err => {
                expect(err.message).to.eq('missing changeId|item.row_key')
                done()
            })
    })

    it("changeId (error: 404)", function (done) {
        provider.changeId({ partition_key: 1, row_key: 1 })
            .then(() => {
                expect(1).to.eq(0)
            })
            .catch(err => {
                expect(err).to.eq(404)
                done()
            })
    })

    it("getAll (error: no scope)", function (done) {
        try {
            provider.getAll()
                .then(sample => {
                    expect(1).to.eq(0)
                })
            expect(1).to.eq(0)
        }
        catch (ex) {
            expect(ex.message).to.eq('missing partition_key')
            done()
        }
    })


    it("stats (error: no scope)", function (done) {
        try {
            provider.stats()
                .then(sample => {
                    expect(1).to.eq(0)
                })
            expect(1).to.eq(0)
        }
        catch (ex) {
            expect(ex.message).to.eq('missing partition_key')
            done()
        }
    })

    it("stats (error: no aggregate)", function (done) {
        try {
            provider.stats('adsf')
                .then(sample => {
                    expect(1).to.eq(0)
                })
            expect(1).to.eq(0)
        }
        catch (ex) {
            expect(ex.message).to.eq('missing aggregate')
            done()
        }
    })

    it("query (error: no scope)", function (done) {
        try {
            provider.query()
                .then(sample => {
                    expect(1).to.eq(0)
                })
            expect(1).to.eq(0)
        }
        catch (ex) {
            expect(ex.message).to.eq('missing partition_key')
            done()
        }
    })

    it("sample (error: no scope)", function (done) {
        try {
            provider.sample()
                .then(sample => {
                    expect(1).to.eq(0)
                })
            expect(1).to.eq(0)
        }
        catch (ex) {
            expect(ex.message).to.eq('missing partition_key')
            done()
        }
    })

    it("get (error: no scope)", function (done) {
        try {
            provider.get()
                .then(sample => {
                    expect(1).to.eq(0)
                })
            expect(1).to.eq(0)
        }
        catch (ex) {
            expect(ex.message).to.eq('missing partition_key')
            done()
        }
    })

    it("get (error: no row_key)", function (done) {
        try {
            provider.get('asdf')
                .then(sample => {
                    expect(1).to.eq(0)
                })
            expect(1).to.eq(0)
        }
        catch (ex) {
            expect(ex.message).to.eq('missing row_key')
            done()
        }
    })

    it("insert (error: no scope)", function (done) {
        try {
            provider.insert()
                .then(sample => {
                    expect(1).to.eq(0)
                })
            expect(1).to.eq(0)
        }
        catch (ex) {
            expect(ex.message).to.eq('missing partition_key')
            done()
        }
    })

    it("insert (error: no row_key)", function (done) {
        try {
            provider.insert('asdf')
                .then(sample => {
                    expect(1).to.eq(0)
                })
            expect(1).to.eq(0)
        }
        catch (ex) {
            expect(ex.message).to.eq('missing row_key')
            done()
        }
    })

    it("insert (error: no item)", function (done) {
        try {
            provider.insert('asdf', 'ergert')
                .then(sample => {
                    expect(1).to.eq(0)
                })
            expect(1).to.eq(0)
        }
        catch (ex) {
            expect(ex.message).to.eq('missing item')
            done()
        }
    })
})