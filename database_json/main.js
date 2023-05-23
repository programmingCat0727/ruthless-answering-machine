class DB_json {
    constructor(dataWhere, modules) {
        this.datas = dataWhere
        this.module = modules
    }

    #selectFunction = {
        dataSort : (data, setting = null) => {
            if (setting === null) {
                return data
            }
            if (Object.keys(setting).indexOf("join") != -1) {
                data = this.#selectFunction.join(setting.join, data)
            }
            if (Object.keys(setting).indexOf("where") != -1) {
                data = this.#selectFunction.where(setting.where, data)
            }
            if (Object.keys(setting).indexOf("order") != -1) {
                data = this.#selectFunction.order(setting.order, data)
            }
            data = this.#selectFunction.title(setting.title, data)
            return data
        },
        title: (titles, data) => {
            if (titles.length === 0 || titles[0] === "*") {
                return data
            }
            let title_index = [],  a
            titles.forEach(e => {
                a = data.title.indexOf(e)
                if (a != -1) {
                    title_index.push(a)
                } else {
                    titles = titles.filter(n => { return n != e })
                }
            })
            let re_data = {
                "title": [],
                "type": [],
                "content": []
            }
            re_data.title = titles
            title_index.forEach(i => {
                re_data.type.push(data.type[i])
            })
            data.content.forEach(d => {
                a = []
                title_index.forEach(i => {
                    a.push(d[i])
                })
                re_data.content.push(a)
            })
            return re_data
        },
        where: (condition, data, reverse = false) => {
            // 先處理and條件再處理or條件
            if (Object.keys(condition).length === 0) {
                return data
            }
    
            if (("and" in condition && !reverse) || ("or" in condition && reverse)) {
                let conTitle, w_data = [], s
                condition[("and" in condition && !reverse) ? "and" : "or"].forEach(c => {
                    conTitle = data.title.indexOf(c[0])
                    let typeIs = (["date", "datetime"].indexOf(data.type[conTitle]) != -1) ? "isTime" : ((data.type[conTitle] === "json") ? "isJson" : false);
                    data.content.forEach(d => {
                        s = this.#selectFunction.where_switch(d, c, conTitle, typeIs)
                        if (reverse) {
                            if (s.length === 0) {
                                w_data.push(d)
                            }
                        } else {
                            if (s.length != 0) {
                                w_data.push(s[0])
                            }
                        }
                    })
                    data.content = w_data
                    w_data = []
                })
            }
            
            if (("or" in condition && !reverse) || ("and" in condition && reverse)) {
                let conTitle, w_data = [], s
                condition[("or" in condition && !reverse) ? "or" : "and"].forEach(c => {
                    conTitle = data.title.indexOf(c[0])
                    let typeIs = (["date", "datetime"].indexOf(data.type[conTitle]) != -1) ? "isTime" : ((data.type[conTitle] === "json") ? "isJson" : false);
                    data.content.forEach(d => {
                        s = this.#selectFunction.where_switch(d, c, conTitle, typeIs)
                        if (reverse) {
                            if (s.length === 0) {
                                w_data.push(d)
                            }
                        } else {
                            if (s.length != 0) {
                                w_data.push(s[0])
                            }
                        }
                    })
                })
                w_data = [...new Set(w_data)]
                data.content = w_data
            }
    
            return data
        },
        where_switch: (d, c, conTitle, typeIsTime) => {
            let re_data = []
            let comparingData = d[conTitle]
            if (typeIsTime) {
                switch (typeIsTime) {
                    case "isTime":
                        comparingData = new Date(d[conTitle]).getTime()
                        c[2] = new Date(c[2]).getTime()
                        break;
                    case "isJson":
                        comparingData = JSON.stringify(d[conTitle])
                        c[2] = JSON.stringify(c[2])
                        break;
                }
            }
            switch (c[1]) {
                case "=":
                    if (comparingData === c[2]) {
                        re_data.push(d)
                    }
                    break;
                case "!=":
                    if (comparingData != c[2]) {
                        re_data.push(d)
                    }
                    break;
                case ">":
                    if (comparingData > c[2]) {
                        re_data.push(d)
                    }
                    break;
                case "<":
                    if (comparingData < c[2]) {
                        re_data.push(d)
                    }
                    break;
                case ">=":
                    if (comparingData >= c[2]) {
                        re_data.push(d)
                    }
                    break;
                case "<=":
                    if (comparingData <= c[2]) {
                        re_data.push(d)
                    }
                    break;
                default:
                    break;
            }
            return re_data
        },
        order: (order, data) => {
            if (order.length === 0 || data.content.length === 0 || (order[0][1] != 1 && order[0][1] != -1)) return data
            let titleIndex = data.title.indexOf(order[0][0])
            if (titleIndex === -1) return data
            let mainOrderDataType = (data.type[titleIndex][0] != "N") ? data.type[titleIndex] : data.type[titleIndex].substr(1),
                sortData = data.content
            data = JSON.stringify(data)
            sortData.map(d => {
                return d.push(sortData.indexOf(d))
            })
            if (mainOrderDataType === "date" || mainOrderDataType === "datetime") {
                sortData.map(i => {
                    return i[titleIndex] = new Date(i[titleIndex]).getTime()
                })
            }
            let newData = []
            data = JSON.parse(data)
            sortData.sort((a, b) => {
                return (a[titleIndex] - b[titleIndex]) * order[0][1]
            }).forEach(d => {
                newData.push(data.content[d[d.length-1]])
            })
            data.content = newData
            return data
        },
        join: (join, data) => {
            if (join.length === 0) return data
            for (let joinIndex = 0; joinIndex < join.length; joinIndex++) {
                let title = join[joinIndex][1]
                let tableMainIndex = data.title.indexOf(title)
                if (tableMainIndex === -1) continue
                let willJoinTable = this.select(join[joinIndex][0])
                let tableWillJoinIndex = willJoinTable.title.indexOf(title)
                if (tableWillJoinIndex === -1) continue
                for (let n = 0; n < data.content.length; n++) {
                    for (let i = 0; willJoinTable.content.length; i++) {
                        if (data.content[n][tableMainIndex] != willJoinTable.content[i][tableWillJoinIndex]) continue;
                        data.content[n] = data.content[n].concat(willJoinTable.content[i].filter(e => e != willJoinTable.content[i][tableWillJoinIndex]))
                        break;
                    }
                }
                data.title = data.title.concat(willJoinTable.title.filter(e => e != willJoinTable.title[tableWillJoinIndex]))
                data.type = data.type.concat(willJoinTable.type.filter(e => e != willJoinTable.type[tableWillJoinIndex]))
            }
            return data
        }
    }

    dataTypeCheck = (data, type) => {
        let typeCheck
        switch (type) {
            case "int":
                typeCheck = /^((-{0,1}\d+)|(0+))$/
                break;
            case "Nint":
                typeCheck = /^((-{0,1}\d+)|(0+))$/
                break;
            case "int++":
                typeCheck = /^((-{0,1}\d+)|(0+))$/
                break;
            case "float":
                typeCheck = /^(-?\d+)(\.\d+)?$/
                break;
            case "Nfloat":
                typeCheck = /^(-?\d+)(\.\d+)?$/
                break;
            case "string":
                return (typeof data === "string") ? true : false;
            case "Nstring":
                return (typeof data === "string" || data === null) ? true : false;
            case "date":
                typeCheck = /^\d{4}-(0[1-9]|1[0-2])-(([0-2][0-9])|(3[0-1]))$/
                break;
            case "Ndate":
                typeCheck = /^\d{4}-(0[1-9]|1[0-2])-(([0-2][0-9])|(3[0-1]))$/
                break;
            case "datetime":
                typeCheck = /^\d{4}-(0[1-9]|1[0-2])-(([0-2][0-9])|(3[0-1])) ([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/
                break;
            case "Ndatetime":
                typeCheck = /^\d{4}-(0[1-9]|1[0-2])-(([0-2][0-9])|(3[0-1])) ([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/
                break;
            case "json":
                return (typeof data === "object") ? true : false;
            case "Njson":
                return (typeof data === "object" || data === null) ? true : false;
            default:
                break;
        }
        if (type.indexOf("N") === 0) {
            return (typeCheck.test(data) || data === null) ? true : false;
        } else {
            return typeCheck.test(data);
        }
    }

    select(table, setting = null) {
        // setting = {
        //     title: ["*"],
        //     where: {
        //         and: [[],...],
        //         or: [[],...]
        //     },
        //     order: [["欄位", "1>升序:-1>降序":num],...],
        //     join:[["table", "欄位"],...]
        // }
        // let data = JSON.stringify(require(`${this.datas}/${table}.json`))
        let data = this.module.fs.readFileSync(`${this.datas}/${table}.json`, 'utf8')
        data = this.#selectFunction.dataSort(JSON.parse(data), setting)
        return data
    }

    insertInto(table, insertData) {
        // insertData = {
        //     content:[
        //         [...datas]
        //     ]
        // }
        let setting = {
            title: ["*"],
        }
        let table_data = this.select(table, setting)
        let testType = true, ifHaveIntIncreaseType = null
        if (table_data.type.indexOf("int++") != -1) {
            table_data = this.#selectFunction.order([[table_data.title[table_data.type.indexOf("int++")], 1]], table_data)
            ifHaveIntIncreaseType = table_data.content[table_data.content.length-1][table_data.type.indexOf("int++")]
        }
        for (let i = 0; i < insertData.content.length; i++) {
            if (insertData.content[i].length != table_data.type.length) {
                testType = false
                break;
            }
            for (let n = 0; n < insertData.content[i].length; n++) {
                if (table_data.type[n] === "int++") {
                    if (ifHaveIntIncreaseType === null) {
                        testType = false
                        break;
                    }
                    if (insertData.content[i][n] != null) {
                        testType = false
                        break;
                    }
                    ifHaveIntIncreaseType++
                    insertData.content[i][n] = ifHaveIntIncreaseType
                }
                testType = this.dataTypeCheck(insertData.content[i][n], table_data.type[n])
                if (!(testType)) break;
            }
        }
        if (!(testType)) {
            return "typeError"
        }
        insertData.content.forEach(data => {
            table_data.content.push(data)
        })
        let wData = JSON.stringify(table_data, null, 4), checkwrite = true
        this.module.fs.writeFileSync(`${this.datas}/${table}.json`, wData, error => {
            checkwrite = false
        })
        if (!(checkwrite)) {
            return "資料更新錯誤"
        }
        return "success"
    }

    updata(table, upData) {
        // upData = [
        //     {
        //         where: {
        //             and: [...[...]],
        //             or: [...[...]]
        //         },
        //         updata: {
        //             title: content,
        //             title: content,...
        //         }
        //     },...
        // ]
        let errorReturn = ""
        let WtableData = this.select(table)
        for (let index = 0; index < upData.length; index++) {
            let uD = upData[index]
            let setting = {
                title: ["*"],
                where: uD.where
            }
            let table_data = this.select(table, setting)
            if (table_data.content.length != 1) {
                errorReturn += `第${index +1}項條件所對應的值不為一\n`
                continue;
            }
            let testType = true, a
            let updataKeys = Object.keys(uD.updata)
            for (let k = 0; k < updataKeys.length; k++) {
                if ((a = table_data.title.indexOf(updataKeys[k])) != -1) {
                    testType = this.dataTypeCheck(uD.updata[updataKeys[k]], table_data.type[a])
                    if (!(testType)) break;
                } else {
                    delete uD.updata[updataKeys[k]]
                }
            }
            if (!(testType)) {
                errorReturn += `第${index +1}項資料格式有錯誤\n`
                continue;
            }
            // 更新第index筆資料
            for (let o = 0; o < WtableData.content.length; o++) {
                if (WtableData.content[o].toString() === table_data.content[0].toString()) {
                    updataKeys.forEach(k => {
                        a = table_data.title.indexOf(k)
                        WtableData.content[o][a] = uD.updata[k]
                    })
                    break;
                }
            }
        }

        let checkwrite = true
        WtableData = JSON.stringify(WtableData, null, 4)
        this.module.fs.writeFileSync(`${this.datas}/${table}.json`, WtableData, error => {
            checkwrite = false
        })
        if (!(checkwrite)) {
            return "資料更新錯誤"
        }
        if (errorReturn === "") {
            return "success"
        } else {
            return errorReturn+"其餘成功"
        }
    }

    delete(table, whereData) {
        // whereData = {
        //     and: [[],...],
        //     or: [[],...]
        // }
        let setting = {
            title: ["*"],
        }
        let table_data = this.select(table, setting)
        table_data = this.#selectFunction.where(whereData, table_data, true)
        let wData = JSON.stringify(table_data, null, 4), checkwrite = true
        this.module.fs.writeFileSync(`${this.datas}/${table}.json`, wData, error => {
            checkwrite = false
        })
        if (!(checkwrite)) {
            return "資料刪除錯誤"
        }
        return "success"
    }
}
module.exports = DB_json
