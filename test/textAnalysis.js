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
const piglet = $hamlet.piglet
const hamlet = $hamlet.hamlet
const $beowulf = require('../beowulf')
const wiglaf = $beowulf.wiglaf

const $aggregate = require('../aggregate')
const u = require('../utility')

// process.on('unhandledRejection', r => console.log(r))

describe("textAnalysis", function () {
    beforeEach(() => {
        provider.resetDatabase()
    })

    it("get tokenized data (no indices set)", function (done) {
        const scope = idgen.generate(this.test.title)
        let promises = []
        promises.push(provider.insert(scope, 'item1', { title: 'n n z c c c d d d dddd' }))
        promises.push(provider.insert(scope, 'item2', { title: 'n n m c c d dddd doodle' }))
        promises.push(provider.insert(scope, 'item3', { title: 'n n z m m c d d d donkey' }))
        Promise.all(promises)
            .then(v => provider.textAnalysis(scope)
                .then(analysis => {
                    expect(analysis).to.be.undefined
                    done()
                })
            )
    })

    it("get tokenized data (no data)", function (done) {
        const scope = idgen.generate(this.test.title)
        let promises = []
        provider.textIndex(scope, { title: true })
        Promise.all(promises)
            .then(v => provider.textAnalysis(scope)
                .then(analysis => {
                    expect(analysis).to.be.undefined
                    done()
                })
            )
    })

    it("get tokenized data (textAnalysis|error: no scope)", function (done) {
        try {
            provider.textAnalysis()
                .then(analysis => {
                    expect(1).to.eq(0)
                })
            expect(1).to.eq(0)
        }
        catch (ex) {
            expect(ex.message).to.eq('missing partition_key')
            done()
        }
    })

    it("get tokenized data (textIndex|error: no scope)", function (done) {
        try {
            provider.textIndex()
        }
        catch (ex) {
            expect(ex.message).to.eq('missing partition_key')
            done()
        }
    })

    it("get tokenized data (textIndex|error: index desc)", function (done) {
        try {
            const scope = idgen.generate(this.test.title)
            provider.textIndex(scope)
        }
        catch (ex) {
            expect(ex.message).to.eq('missing desc')
            done()
        }
    })

    it("get tokenized data", function (done) {
        const scope = idgen.generate(this.test.title)
        let promises = []
        provider.textIndex(scope, { title: true })
        promises.push(provider.insert(scope, 'item1', { title: 'n n z c c c d d d dddd' }))
        promises.push(provider.insert(scope, 'item2', { title: 'n n m c c d dddd doodle' }))
        promises.push(provider.insert(scope, 'item3', { title: 'n n z m m c d d d donkey' }))
        Promise.all(promises)
            .then(v => provider.textAnalysis(scope)
                .then(analysis => {
                    const dump = analysis.dump()

                    let sample_key = analysis.terms()[0]
                    expect(sample_key).not.to.be.undefined
                    expect(sample_key.length).to.be.greaterThan(0)

                    const dump_single = analysis.dump()[sample_key]
                    expect(dump_single).not.to.be.undefined
                    expect(dump_single.sum).to.be.greaterThan(0)
                    expect(Object.keys(dump_single.spread).length).to.be.greaterThan(0)

                    expect(dump['c'].spread['1'].value).to.eq('item3')
                    expect(dump['c'].spread['2'].value).to.eq('item2')
                    expect(dump['c'].spread['3'].value).to.eq('item1')

                    expect(dump['m'].spread['1'].value).to.eq('item2')
                    expect(dump['m'].spread['2'].value).to.eq('item3')

                    expect(dump['z'].spread['1'].value).to.eq('item1')
                    expect(dump['z'].spread['1'].next.value).to.eq('item3')

                    expect(dump['d'].spread['1'].value).to.eq('item2')
                    expect(dump['d'].spread['3'].value).to.eq('item1')
                    expect(dump['d'].spread['3'].next.value).to.eq('item3')

                    expect(dump['n'].spread['2'].value).to.eq('item1')
                    expect(dump['n'].spread['2'].next.value).to.eq('item2')
                    expect(dump['n'].spread['2'].next.next.value).to.eq('item3')

                    done()
                })
            )
    })

    it("get tokenized data (two fields, all fields)", function (done) {
        const scope = idgen.generate(this.test.title)
        let promises = []
        provider.textIndex(scope, {
            title: { weight: 2 },
            text: { weight: 1 }
        })
        promises.push(provider.insert(scope, 'item1', {
            title: 'c d d',
            text: 'n n z c c c d d d d d dddd'
        }))
        promises.push(provider.insert(scope, 'item2', {
            title: 'm m z',
            text: 'n n m c c d dddd doodle'
        }))
        promises.push(provider.insert(scope, 'item3', {
            title: 'd d d',
            text: 'n n z m m c d d d donkey'
        }))
        Promise.all(promises)
            .then(v => provider.textAnalysis(scope)
                .then(analysis => {
                    const dump = analysis.dump()

                    let sample_key = analysis.terms()[0]
                    expect(sample_key).not.to.be.undefined
                    expect(sample_key.length).to.be.greaterThan(0)

                    const dump_single = analysis.dump()[sample_key]
                    expect(dump_single).not.to.be.undefined
                    expect(dump_single.sum).to.be.greaterThan(0)
                    expect(Object.keys(dump_single.spread).length).to.be.greaterThan(0)

                    expect(dump['c'].spread['1'].value).to.eq('item3')
                    expect(dump['c'].spread['2'].value).to.eq('item2')
                    expect(dump['c'].spread['5'].value).to.eq('item1')

                    expect(dump['m'].spread['5'].value).to.eq('item2')
                    expect(dump['m'].spread['2'].value).to.eq('item3')

                    expect(dump['z'].spread['1'].value).to.eq('item1')
                    expect(dump['z'].spread['2'].value).to.eq('item2')
                    expect(dump['z'].spread['1'].next.value).to.eq('item3')

                    expect(dump['d'].spread['9'].value).to.eq('item1')
                    expect(dump['d'].spread['1'].value).to.eq('item2')
                    expect(dump['d'].spread['9'].next.value).to.eq('item3')

                    expect(dump['n'].spread['2'].value).to.eq('item1')
                    expect(dump['n'].spread['2'].next.value).to.eq('item2')
                    expect(dump['n'].spread['2'].next.next.value).to.eq('item3')

                    done()
                })
            )
    })

    it("get tokenized data (two fields, one field)", function (done) {
        const scope = idgen.generate(this.test.title)
        let promises = []
        provider.textIndex(scope, {
            title: { weight: 2 },
            text: { weight: 1 }
        })
        promises.push(provider.insert(scope, 'item1', {
            title: 'c d d h',
            text: 'n n z c c c d d d d d dddd'
        }))
        promises.push(provider.insert(scope, 'item2', {
            title: 'm m z h',
            text: 'n n m c c d dddd doodle'
        }))
        promises.push(provider.insert(scope, 'item3', {
            title: 'd d d h',
            text: 'n n z m m c d d d donkey'
        }))
        Promise.all(promises)
            .then(v => provider.textAnalysis(scope, "title")
                .then(analysis => {
                    const dump = analysis.dump()

                    let sample_key = analysis.terms()[0]
                    expect(sample_key).not.to.be.undefined
                    expect(sample_key.length).to.be.greaterThan(0)

                    const dump_single = analysis.dump()[sample_key]
                    expect(dump_single).not.to.be.undefined
                    expect(dump_single.sum).to.be.greaterThan(0)
                    expect(Object.keys(dump_single.spread).length).to.be.greaterThan(0)

                    expect(dump['c'].spread['1'].value).to.eq('item1')

                    expect(dump['m'].spread['2'].value).to.eq('item2')

                    expect(dump['z'].spread['1'].value).to.eq('item2')

                    expect(dump['d'].spread['2'].value).to.eq('item1')
                    expect(dump['d'].spread['3'].value).to.eq('item3')

                    expect(dump['h'].spread['1'].value).to.eq('item1')
                    expect(dump['h'].spread['1'].next.value).to.eq('item2')
                    expect(dump['h'].spread['1'].next.next.value).to.eq('item3')

                    done()
                })
            )
    })

    it("trie search", function (done) {
        const scope = idgen.generate(this.test.title)
        let promises = []
        provider.textIndex(scope, { title: { analyzer: 'trie' } })
        promises.push(provider.insert(scope, 'item1', { title: 'n n z c c c d d d dddd' }))
        promises.push(provider.insert(scope, 'item2', { title: 'n n m c c d dddd doodle' }))
        promises.push(provider.insert(scope, 'item3', { title: 'n n z m m c d d d donkey' }))
        Promise.all(promises)
            .then(v => {
                provider.search(scope, 'title', 'ddd')
                    .then(search_results => {
                        expect(search_results.length).to.eq(2)
                        done()
                    })
            })
    })

    it("trie search (whole)", function (done) {
        const scope = idgen.generate(this.test.title)
        let promises = []
        provider.textIndex(scope, { title: { analyzer: 'trie' } })
        promises.push(provider.insert(scope, 'item1', { title: 'n n z c c c d d d dddd' }))
        promises.push(provider.insert(scope, 'item2', { title: 'n n m c c d dddd doodle' }))
        promises.push(provider.insert(scope, 'item3', { title: 'n n z m m c d d d donkey' }))
        Promise.all(promises)
            .then(v => {
                provider.search(scope, 'title', 'donkey', true)
                    .then(search_results => {
                        expect(search_results[0].row_key).to.eq('item3')
                        done()
                    })
            })
    })

    it("trie search (whole, no results)", function (done) {
        const scope = idgen.generate(this.test.title)
        let promises = []
        provider.textIndex(scope, { title: { analyzer: 'trie' } })
        promises.push(provider.insert(scope, 'item1', { title: 'n n z c c c d d d dddd' }))
        promises.push(provider.insert(scope, 'item2', { title: 'n n m c c d dddd doodle' }))
        promises.push(provider.insert(scope, 'item3', { title: 'n n z m m c d d d donkey' }))
        Promise.all(promises)
            .then(v => {
                provider.search(scope, 'title', 'ddd', true)
                    .then(search_results => {
                        expect(search_results.length).to.eq(0)
                        done()
                    })
            })
    })

    it("trie search (no trie, but search attempted)", function (done) {
        const scope = idgen.generate(this.test.title)
        let promises = []
        provider.textIndex(scope, { title: { analyzer: 'word' } })
        promises.push(provider.insert(scope, 'item1', { title: 'n n z c c c d d d dddd' }))
        promises.push(provider.insert(scope, 'item2', { title: 'n n m c c d dddd doodle' }))
        promises.push(provider.insert(scope, 'item3', { title: 'n n z m m c d d d donkey' }))
        Promise.all(promises)
            .then(v => provider.textAnalysis(scope)
                .then(analysis => {
                    const terms = analysis.terms()
                    expect(terms).not.to.be.undefined
                    expect(terms.length).to.be.greaterThan(0)
                    provider.search(scope, 'title', 'donkey', true)
                        .then(search_results => {
                            expect(1).to.eq(0)
                        })
                        .catch(err => {
                            expect(err).to.eq('Trie not found')
                            done()
                        })
                })
            )
    })

    it("trie search (trie-only, but analysis attempted)", function (done) {
        const scope = idgen.generate(this.test.title)
        let promises = []
        provider.textIndex(scope, { title: { analyzer: 'trie' } })
        promises.push(provider.insert(scope, 'item1', { title: 'n n z c c c d d d dddd' }))
        promises.push(provider.insert(scope, 'item2', { title: 'n n m c c d dddd doodle' }))
        promises.push(provider.insert(scope, 'item3', { title: 'n n z m m c d d d donkey' }))
        Promise.all(promises)
            .then(v => provider.search(scope, 'title', 'donkey', true)
                .then(search_results =>
                    provider.textAnalysis(scope)
                        .then(analysis => {
                            expect(analysis).to.be.undefined
                            done()
                        })
                )
            )
    })

    it("trie search (combined)", function (done) {
        const scope = idgen.generate(this.test.title)
        let promises = []
        provider.textIndex(scope, { title: { analyzer: 'combined' } })
        promises.push(provider.insert(scope, 'item1', { title: 'n n z c c c d d d dddd' }))
        promises.push(provider.insert(scope, 'item2', { title: 'n n m c c d dddd doodle' }))
        promises.push(provider.insert(scope, 'item3', { title: 'n n z m m c d d d donkey' }))
        Promise.all(promises)
            .then(v => provider.textAnalysis(scope)
                .then(analysis => {
                    const terms = analysis.terms()
                    expect(terms).not.to.be.undefined
                    expect(terms.length).to.be.greaterThan(0)
                    provider.search(scope, 'title', 'donkey', true)
                        .then(search_results => {
                            expect(search_results[0].row_key).to.eq('item3')
                            done()
                        })
                })
            )
    })

    it("trie big", function (done) {
        const scope = idgen.generate(this.test.title)
        let promises = []
        provider.textIndex(scope, { title: { analyzer: 'trie' } })
        for (let n = 0; n < 20; n++) {
            promises.push(provider.insert(scope, idgen.generate(this.test.title), { "title": hamlet(400), order: n }))
        }
        Promise.all(promises)
            .then(v => provider.sample(scope, 1)
                .then(sample => {
                    const sample_word = sample[0].title.split(' ')[0]
                    let results = []
                    provider.search(scope, 'title', sample_word, true)
                        .then(search_results => {
                            expect(search_results.length).to.be.greaterThan(0)
                            done()
                        })
                })
            )
    })

    // it.only("trie big (benchmark)", function (done) {
    //     const scope = idgen.generate(this.test.title)
    //     let promises = []
    //     provider.textIndex(scope, { title: { analyzer: 'trie' } })
    //     let begin = +new Date()
    //     for (let n = 0; n < 2000; n++) {
    //         promises.push(provider.insert(scope, idgen.generate(this.test.title), { "title": hamlet(400), order: n }))
    //     }
    //     let end = +new Date()
    //     console.log(`create: ${end - begin}`)
    //     Promise.all(promises)
    //         .then(v => provider.sample(scope, 1)
    //             .then(sample => provider.dumpdb()
    //                 .then(all => {
    //                     const sample_word = sample[0].title.split(' ')[0]
    //                     console.log(`looking for "${sample_word}"`)
    //                     let results = []
    //                     provider.getAll(scope)
    //                         .then(items => {
    //                             begin = +new Date()
    //                             // console.log(items)
    //                             const taco = items.filter(item =>
    //                                 item.title.split(' ')
    //                                     .includes(sample_word) === true
    //                             )
    //                             end = +new Date()
    //                             console.log(`manual: ${end - begin}`)
    //                             begin = +new Date()
    //                             provider.search(scope, 'title', sample_word, true)
    //                                 .then(search_results => {
    //                                     end = +new Date()
    //                                     console.log(`search: ${end - begin}`)
    //                                     done()
    //                                 })
    //                         })
    //                 })
    //             )
    //         )
    // }).timeout(10000)

    it("get tokenized data (terms)", function (done) {
        const scope = idgen.generate(this.test.title)
        let promises = []
        provider.textIndex(scope, { title: true })
        promises.push(provider.insert(scope, 'item1', { title: 'n n z c c c d d d dddd' }))
        promises.push(provider.insert(scope, 'item2', { title: 'n n m c c d dddd doodle' }))
        promises.push(provider.insert(scope, 'item3', { title: 'n n z m m c d d d donkey' }))
        Promise.all(promises)
            .then(v => provider.textAnalysis(scope)
                .then(analysis => {
                    const terms = analysis.terms()
                    expect(terms).not.to.be.undefined
                    expect(terms.length).to.be.greaterThan(0)
                    done()
                })
            )
    })

    it("get tokenized data (scores)", function (done) {
        const scope = idgen.generate(this.test.title)
        let promises = []
        provider.textIndex(scope, { title: true })
        promises.push(provider.insert(scope, 'item1', { title: 'n n z c c c d d d dddd' }))
        promises.push(provider.insert(scope, 'item2', { title: 'n n m c c d dddd doodle' }))
        promises.push(provider.insert(scope, 'item3', { title: 'n n z m m c d d d donkey' }))
        Promise.all(promises)
            .then(v => provider.textAnalysis(scope)
                .then(analysis => {
                    let sample_key = 'd'
                    const scores = analysis.scores(sample_key)
                    expect(scores[0]).to.eq(3)
                    expect(scores[1]).to.eq(1)
                    done()
                })
            )
    })

    it("get tokenized data (scores, with analyzer)", function (done) {
        const scope = idgen.generate(this.test.title)
        let promises = []
        provider.textIndex(scope, { title: { analyzer: 'word' } })
        promises.push(provider.insert(scope, 'item1', { title: 'n n z c c c d d d dddd' }))
        promises.push(provider.insert(scope, 'item2', { title: 'n n m c c d dddd doodle' }))
        promises.push(provider.insert(scope, 'item3', { title: 'n n z m m c d d d donkey' }))
        Promise.all(promises)
            .then(v => provider.textAnalysis(scope)
                .then(analysis => {
                    let sample_key = 'd'
                    const scores = analysis.scores(sample_key)
                    expect(scores[0]).to.eq(3)
                    expect(scores[1]).to.eq(1)
                    done()
                })
            )
    })

    it("get tokenized data (top)", function (done) {
        const scope = idgen.generate(this.test.title)
        let promises = []
        provider.textIndex(scope, { title: true })
        promises.push(provider.insert(scope, 'item1', { title: 'n n z c c c d d d dddd' }))
        promises.push(provider.insert(scope, 'item2', { title: 'n n m c c d dddd doodle' }))
        promises.push(provider.insert(scope, 'item3', { title: 'n n z m m c d d d donkey' }))
        Promise.all(promises)
            .then(v => provider.textAnalysis(scope)
                .then(analysis => {
                    let sample_key = 'd'
                    const top = analysis.top(sample_key)
                    expect(top).to.eq('item1')
                    done()
                })
            )
    })

    it("get tokenized data (all)", function (done) {
        const scope = idgen.generate(this.test.title)
        let promises = []
        provider.textIndex(scope, { title: true })
        promises.push(provider.insert(scope, 'item1', { title: 'n n z c c c d d d dddd' }))
        promises.push(provider.insert(scope, 'item2', { title: 'n n m c c d dddd doodle' }))
        promises.push(provider.insert(scope, 'item3', { title: 'n n z m m c d d d donkey' }))
        Promise.all(promises)
            .then(v => provider.textAnalysis(scope)
                .then(analysis => {
                    let sample_key = 'm'
                    const all = analysis.all(sample_key)
                    expect(all[0]).to.eq('item2')
                    expect(all[1]).to.eq('item3')
                    done()
                })
            )
    })

    it("get tokenized data (all, chained)", function (done) {
        const scope = idgen.generate(this.test.title)
        let promises = []
        provider.textIndex(scope, { title: true })
        promises.push(provider.insert(scope, 'item1', { title: 'n n z c c c d d d dddd' }))
        promises.push(provider.insert(scope, 'item2', { title: 'n n m c c d dddd doodle' }))
        promises.push(provider.insert(scope, 'item3', { title: 'n n z m m c d d d donkey' }))
        Promise.all(promises)
            .then(v => provider.textAnalysis(scope)
                .then(analysis => {
                    let sample_key = 'd'
                    const all = analysis.all(sample_key)
                    expect(all[0]).to.eq('item2')
                    expect(all[1]).to.eq('item1')
                    expect(all[2]).to.eq('item3')
                    done()
                })
            )
    })

    it("get tokenized data (filter)", function (done) {
        const scope = idgen.generate(this.test.title)
        let promises = []
        provider.textIndex(scope, { title: true })
        promises.push(provider.insert(scope, 'item1', { title: 'n n z c c c d d d dddd' }))
        promises.push(provider.insert(scope, 'item2', { title: 'n n m c c d dddd doodle' }))
        promises.push(provider.insert(scope, 'item3', { title: 'n n z m m c d d d donkey' }))
        Promise.all(promises)
            .then(v => provider.textAnalysis(scope)
                .then(analysis => {
                    let sample_key = 'd'
                    const top = analysis.top(sample_key)
                    const filtered = analysis.filter(p => p.startsWith(sample_key))
                    const filtered_keys = Object.keys(filtered)
                    expect(filtered['d'].sum).to.eq(7)
                    expect(filtered['dddd'].sum).to.eq(2)
                    expect(sample_key.length).to.be.greaterThan(0)
                    done()
                })
            )
    })

    it("get tokenized data (top/filter more data)", function (done) {
        const scope = idgen.generate(this.test.title)
        let promises = []
        provider.textIndex(scope, { title: true })
        for (let n = 0; n < 20; n++) {
            promises.push(provider.insert(scope, idgen.generate(this.test.title), { "title": piglet(400), order: n }))
        }
        Promise.all(promises)
            .then(v => provider.textAnalysis(scope)
                .then(analysis => {
                    const terms = analysis.terms()
                    let sample_key = terms[0]
                    const scores = analysis.scores(sample_key)
                    const top = analysis.top(sample_key)
                    const filtered = analysis.filter(p => p.startsWith(sample_key[0]))
                    const filtered_keys = Object.keys(filtered)
                    filtered_keys.forEach(p => {
                        expect(p[0]).to.eq(sample_key[0])
                        expect(terms).to.include(p)
                    })
                    done()
                })
            )
    })

    it("get tokenized data (two indices)", function (done) {
        const scope = idgen.generate(this.test.title)
        let promises = []
        provider.textIndex(scope, { title: true })
        provider.textIndex(scope, { text: true })
        for (let n = 0; n < 20; n++) {
            promises.push(provider.insert(scope, idgen.generate(this.test.title), { "title": piglet(400), "text": wiglaf(400), order: n }))
        }
        Promise.all(promises)
            .then(v => provider.textAnalysis(scope)
                .then(analysis => {
                    const terms = analysis.terms()
                    let sample_key = terms[0]
                    const scores = analysis.scores(sample_key)
                    const top = analysis.top(sample_key)
                    const filtered = analysis.filter(p => p.startsWith(sample_key[0]))
                    const filtered_keys = Object.keys(filtered)
                    filtered_keys.forEach(p => {
                        expect(p[0]).to.eq(sample_key[0])
                        expect(terms).to.include(p)
                    })
                    done()
                }))
    })

    it("get tokenized data (serialize)", function (done) {
        const scope = idgen.generate(this.test.title)
        let promises = []
        provider.textIndex(scope, { title: true })
        promises.push(provider.insert(scope, 'item1', { title: 'n n z c c c d d d dddd' }))
        promises.push(provider.insert(scope, 'item2', { title: 'n n m c c d dddd doodle' }))
        promises.push(provider.insert(scope, 'item3', { title: 'n n z m m c d d d donkey' }))
        Promise.all(promises)
            .then(v => provider.textAnalysis(scope)
                .then(analysis => {
                    let sample_key = 'd'
                    const top = analysis.top(sample_key)
                    const filtered = analysis.filter(p => p.startsWith(sample_key))
                    const serialized = analysis.serialize(filtered)
                    const filtered_keys = Object.keys(filtered)
                    expect(filtered_keys.length).to.be.greaterThan(serialized.length)
                    provider.get(scope, serialized).then(items => {
                        expect(items[0].row_key).to.be.eq('item1')
                        expect(items[1].row_key).to.be.eq('item3')
                        expect(items[2].row_key).to.be.eq('item2')
                        done()
                    })
                })
            )
    })

    it("get tokenized data (highlight)", function (done) {
        const scope = idgen.generate(this.test.title)
        let promises = []
        provider.textIndex(scope, { title: true })
        promises.push(provider.insert(scope, 'item1', { title: 'n n z c c c d d d dddd' }))
        promises.push(provider.insert(scope, 'item2', { title: 'n n m c c d dddd doodle' }))
        promises.push(provider.insert(scope, 'item3', { title: 'n n z m m c d d d donkey' }))
        Promise.all(promises)
            .then(v => provider.textAnalysis(scope)
                .then(analysis => {
                    let sample_key = 'd'
                    const top = analysis.top(sample_key)
                    provider.get(scope, top)
                        .then(p => {
                            const highlighted = analysis.highlight(sample_key, p.title, '<{{_}}>')
                            expect(highlighted).to.eq('n n z c c c <d> <d> <d> dddd')
                            done()
                        })
                })
            )
    })

    it("dumpindices for all", function () {
        const scope1 = idgen.generate(this.test.title)
        const scope2 = idgen.generate(this.test.title)

        const scope1_index = {
            title: { weight: 2 },
            text: { weight: 1 }
        }
        const scope2_index = {
            headings: { weight: 2 }
        }
        provider.textIndex(scope1, scope1_index)
        provider.textIndex(scope2, scope2_index)

        const all = provider.dumpindices()
        expect(all[scope1]).to.eql(scope1_index)
        expect(all[scope2]).to.eql(scope2_index)
    })

    it("dumpindices for single scope", function () {
        const scope1 = idgen.generate(this.test.title)
        const scope2 = idgen.generate(this.test.title)

        const scope1_index = {
            title: { weight: 2 },
            text: { weight: 1 }
        }
        provider.textIndex(scope1, scope1_index)
        provider.textIndex(scope2, {
            headings: { weight: 2 }
        })

        expect(provider.dumpindices(scope1)).to.eql(scope1_index)
    })

    it("dumpindices for wrong scope", function () {
        expect(provider.dumpindices('asdfasdf')).to.be.undefined
    })

    //+ edge cases

    it("get tokenized data (filter w/bad expression)", function (done) {
        const scope = idgen.generate(this.test.title)
        let promises = []
        provider.textIndex(scope, { title: true })
        promises.push(provider.insert(scope, 'item1', { title: 'n n z c c c d d d dddd' }))
        Promise.all(promises)
            .then(v => provider.textAnalysis(scope)
                .then(analysis => {
                    let sample_key = 'd'
                    const top = analysis.top(sample_key)
                    const filtered = analysis.filter('asdf')
                    expect(filtered.length).to.be.eq(0)
                    done()
                })
            )
    })

    it("get tokenized data (top w/ bad key)", function (done) {
        const scope = idgen.generate(this.test.title)
        let promises = []
        provider.textIndex(scope, { title: true })
        promises.push(provider.insert(scope, 'item1', { title: 'n n z c c c d d d dddd' }))
        promises.push(provider.insert(scope, 'item2', { title: 'n n m c c d dddd doodle' }))
        promises.push(provider.insert(scope, 'item3', { title: 'n n z m m c d d d donkey' }))
        Promise.all(promises)
            .then(v => provider.textAnalysis(scope)
                .then(analysis => {
                    const top = analysis.top('asdfasddfasdf')
                    expect(top).to.be.undefined
                    done()
                })
            )
    })
})