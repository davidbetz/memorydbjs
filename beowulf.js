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

const small = "hwæt we gardena in geardagum þeodcyninga þrym gefrunon hu ða æþelingas ellen fremedon oft scyld scefing sceaþena þreatum monegum mægþum meodosetla ofteah egsode eorlas syððan ærest wearð feasceaft funden he þæs frofre gebad weox under wolcnum weorðmyndum þah oðþæt him æghwylc þara ymbsittendra ofer hronrade hyran scolde gomban gyldan þæt wæs god cyning ðæm eafera æfter cenned geong geardum þone sende folce to fyrenðearfe ongeat þe hie ær drugon aldorlease lange hwile liffrea wuldres wealdend woroldare forgeaf beowulf breme blæd wide sprang scyldes scedelandum swa sceal guma gode gewyrcean fromum feohgiftum on fæder bearme hine ylde eft gewunigen wilgesiþas þonne wig cume leode gelæsten lofdædum mægþa gehwære man geþeon gewat gescæphwile"

const small_data = small.split(" ")

const $wiglaf = count => {
    return small_data[parseInt(Math.random() * small_data.length)] + (count == 1 ? "" : " " + $wiglaf(count - 1))
}

module.exports = {
    wiglaf: $wiglaf
}