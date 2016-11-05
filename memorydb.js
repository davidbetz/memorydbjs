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

const assert = require('assert')

const u = require('./utility')

const $aggregate = require('./aggregate')

const $fullTextAnalysis = require('./textAnalysis')
const $analyzer = require('./analyzer')
const AnalyzerFactory = $analyzer.AnalyzerFactory

let table = []
let all_indices = {}

const $resetDatabase = function () {
    return new Promise((resolve, reject) => {
        table = []
        resolve()
    })
}

const $dumpdb = (transform = (function (item) { return item })) => {
    return new Promise((resolve, reject) => {
        resolve(transform(table))
    })
}

const $dumpindices = (scope) => {
    if (typeof scope === 'undefined') {
        return Object.assign({}, all_indices)
    }

    const index_data = all_indices[scope]
    if (typeof index_data !== 'undefined') {
        return Object.assign({}, index_data)
    }
}

const $delete = function (partition_key, row_key) {
    return new Promise((resolve, reject) => {
        const item = table.find(v => v.partition_key === partition_key && v.row_key === row_key)
        if (!item) {
            reject(404)
        }
        else {
            const new_table = []
            for (let v of table) {
                if (v.partition_key !== partition_key || v.row_key !== row_key) {
                    new_table.push(v)
                }
            }
            table = new_table
            resolve()
        }
    })
}

const $insert = function (partition_key = u.m('partition_key'), row_key = u.m('row_key'), item = u.m('item')) {
    return new Promise((resolve, reject) => {
        let store = Object.assign({}, item)
        store.partition_key = partition_key
        store.row_key = row_key
        // store.index_data =
        $indexItem(store)
        table.push(store)

        resolve(row_key)
    })
}

const $get = function (partition_key = u.m('partition_key'), param = u.m('row_key')) {
    return new Promise((resolve, reject) => {
        if (typeof param === 'string') {
            const row_key = param
            const item = table.find(v => v.partition_key === partition_key && v.row_key === row_key)
            if (item) {
                resolve($clean(item))
            }
            else {
                reject(404)
            }
        }
        else if (Array.isArray(param) === true) {
            const ids = param.slice(0)
            const items = table.filter(v => v.partition_key === partition_key)
            let results = []
            for (let id of ids) {
                results.push(items.find(v => v.row_key === id))
            }
            resolve(results.map(v => $clean(v)))
        }
        else {
            throw new Error('parameter after partition_key must be a row_key or an array of row keys')
        }
    })
}

const $getAll = function (partition_key = u.m('partition_key')) {
    return new Promise((resolve, reject) => {
        const items = table.filter(v => v.partition_key === partition_key)
        // items.sort((a, b) => {
        //     if (a.ts < b.ts) return 1
        //     if (a.ts > b.ts) return -1
        //     return 0
        // })
        resolve(items.map(v => $clean(v)))
    })
}

const $stats = function (partition_key = u.m('partition_key'), aggregate = u.m('aggregate')) {
    return new Promise((resolve, reject) => {
        if ((aggregate instanceof $aggregate.Aggregate) === false || typeof aggregate.run !== 'function') {
            throw new Error('aggregate must be of type Aggregate')
        }
        const items = table.filter(v => v.partition_key === partition_key)
        let results = []
        results = aggregate.run(items)
        resolve(results)
    })
}

const $sample = function (partition_key = u.m('partition_key'), count) {
    return new Promise((resolve, reject) => {
        count = count || 10
        const items = table.filter(v => v.partition_key === partition_key)
        if (items.length === 0) {
            return resolve([])
        }

        const _sample = count => {
            if (count == 0) {
                return []
            }
            else {
                return _sample(count - 1).concat(items[Math.floor(Math.random() * items.length)])
            }
        }

        resolve(_sample(count))
    })
}

const $query = function (partition_key = u.m('partition_key'), expression) {
    return new Promise((resolve, reject) => {
        if (typeof expression !== 'function') {
            throw new Error('expression function is required for query')
        }
        const items = table.filter(v => v.partition_key === partition_key)
            .map(p => Object.assign({}, p))
        // items.sort((a, b) => {
        //     /* istanbul ignore next */
        //     if (a.ts < b.ts) return 1
        //     /* istanbul ignore next */
        //     if (a.ts > b.ts) return -1
        //     /* istanbul ignore next */
        //     return 0
        // })
        let results = items.filter(expression)
        resolve(results.map(v => $clean(v)))
    })
}

const $changeId = function (item, new_id) {
    return new Promise((resolve, reject) => {
        if (typeof item.partition_key == 'undefined') {
            u.m('changeId|item.partition_key')
        }
        if (typeof item.row_key == 'undefined') {
            u.m('changeId|item.row_key')
        }
        $delete(item.partition_key, item.row_key)
            .then(() => {
                item.row_key = new_id
                table.push(Object.assign({}, item))
                resolve()
            })
            .catch(err => reject(err))
    })
}

const $update = function (item) {
    return new Promise((resolve, reject) => {
        if (typeof item.partition_key == 'undefined') {
            u.m('update|item.partition_key')
        }
        if (typeof item.row_key == 'undefined') {
            u.m('update|item.row_key')
        }
        $delete(item.partition_key, item.row_key)
            .then(() => {
                table.push(Object.assign({}, item))
                resolve()
            })
            .catch(err => reject(err))
    })
}

const $updateAll = function (items) {
    return new Promise((resolve, reject) => {
        if (typeof items === 'undefined') {
            resolve()
        }
        let promises = []
        promises.concat(items.map(item => this.delete(item.partition_key, item.row_key)))
        promises.concat(items.map(item => this.insert(item.partition_key, item.row_key, item)))
        Promise.all(promises)
            .then(p => resolve())
    })
}

const $indexItem = function (item) {
    let indices = all_indices[item.partition_key]
    let index_data = item.index_data || {}
    if (typeof indices !== 'undefined') {
        const fields = Object.keys(item).filter(_ => _ !== 'partition_key' && _ !== 'row_key')
        let running = {}
        for (const field of fields) {
            const index = indices[field]
            if (typeof index !== 'undefined') {
                const analyzer = AnalyzerFactory.create(index.analyzer)
                index_data[field] = analyzer.run(item, field, index)
                // for (const n in reduced) {
                //     if (typeof running[n] === 'undefined') {
                //         running[n] = running[n] || 0
                //     }
                //     running[n] += reduced[n]
                // }
            }
        }
        item.index_data = index_data
        // const keys = Object.keys(running)
        // let results = keys
        //     .sort((a, b) => {
        //         if (running[a] < running[b]) return 1
        //         if (running[a] > running[b]) return -1
        //         return 0
        //     })
        //     .reduce(function (result, key) {
        //         result[key] = running[key]
        //         return result
        //     }, {})
        // return results
    }
}

const $textAnalysis = function (partition_key = u.m('partition_key'), field) {
    return new Promise((resolve, reject) => {
        const items = table.filter(v => v.partition_key === partition_key)
            .map(p => Object.assign({}, p))
        let indices = all_indices[partition_key]
        if (typeof indices === 'undefined') {
            return resolve()
        }

        let fields = []
        let valueType
        if (typeof field === 'undefined') {
            fields = Object.keys(indices)
            valueType = 'weighted'
        }
        else {
            fields.push(field)
            valueType = 'value'
        }
        let combined_all = {}
        for (const item of items) {
            let combined = {}
            combined_all[item.row_key] = combined
            const index_data = item.index_data
            for (const $field of fields) {
                const b = index_data[$field]
                for (let n in b[valueType]) {
                    let v = parseInt(b[valueType][n])
                    combined[n] = combined[n] || 0
                    combined[n] += v
                }
            }
        }
        let counter = 0
        let tokenized_data = {}
        for (const row_key of Object.keys(combined_all)) {
            const b = combined_all[row_key]
            counter = 0
            for (let n in b) {
                let i = 0
                let value
                let v = parseInt(b[n])
                tokenized_data[n] = tokenized_data[n] || {}
                value = tokenized_data[n][v]
                if (typeof value === 'undefined') {
                    tokenized_data[n][v] = { value: row_key }
                }
                else {
                    let next = value.next
                    while (typeof next !== 'undefined') {
                        value = next
                        next = value.next
                        ++counter
                        // if (counter > 20) {
                        //     console.log('BREAK!')
                        //     break
                        // }
                    }
                    next = { value: row_key }
                    value.next = next
                }
            }
        }
        const tokenized_data_keys = Object.keys(tokenized_data)
        if (tokenized_data_keys.length === 0) {
            return resolve(undefined)
        }
        tokenized_data = tokenized_data_keys
            .reduce((result, key) => {
                const key_data = tokenized_data[key]
                result[key] = result[key] || {}
                let parent = Object.assign({}, key_data)
                let sum = 0
                const numeric_keys = Object.keys(parent)
                for (let n = 0; n < numeric_keys.length; n++) {
                    let value = parent[numeric_keys[n]]
                    const base = parseInt(numeric_keys[n])
                    let i = 0
                    do {
                        const before = sum
                        sum += base
                        i++
                    } while (typeof (value = value.next) !== 'undefined')
                }
                result[key].sum = sum
                result[key].spread = key_data
                return result
            }, {})
        resolve(new $fullTextAnalysis.FullTextAnalysis(tokenized_data))
    })
}

const $textIndex = function (partition_key = u.m('partition_key'), desc = u.m('desc')) {
    let indices = all_indices[partition_key]
    if (typeof indices === 'undefined') {
        indices = {}
        all_indices[partition_key] = indices
    }
    const keys = Object.keys(desc)
    for (const key of keys) {
        indices[key] = desc[key]
    }
}

const $clean = function (item) {
    const clone = Object.assign({}, item)
    delete clone.index_data
    return clone
}

const $search = function (partition_key, field, term, whole) {
    return new Promise((resolve, reject) => {
        const items = table.filter(v => v.partition_key === partition_key)
        const subset = items
            .filter(p => typeof p.index_data !== 'undefined' && typeof p.index_data[field] !== 'undefined')
        const hasTrie = subset.filter(p => typeof p.index_data[field].trie !== 'undefined')
        // u.dump('hasTrie', hasTrie)
        if (subset.length > hasTrie.length) {
            return reject('Trie not found')
        }
        let result
        if (whole === true) {
            result = subset.filter(p => p.index_data[field].trie.whole(term))
        }
        else {
            result = subset.filter(p => p.index_data[field].trie.find(term))
        }
        resolve(result.map(p => $clean(p)))
    })
}

module.exports = function () {
    return {
        resetDatabase: $resetDatabase,
        dumpdb: $dumpdb,
        dumpindices: $dumpindices,
        'delete': $delete,
        update: $update,
        changeId: $changeId,
        getAll: $getAll,
        sample: $sample,
        stats: $stats,
        query: $query,
        get: $get,
        textAnalysis: $textAnalysis,
        insert: $insert,
        search: $search,
        updateAll: $updateAll,
        textIndex: $textIndex,
        idgen: require('./idgen'),
        aggregate: require('./aggregate')
    }
}()