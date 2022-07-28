import readline from 'readline'
import cheerio from 'cheerio'
import {Cluster} from 'puppeteer-cluster'
import UserAgent from 'user-agents';

import writeExcel from 'write-excel-file/node'
import readExcel from 'read-excel-file/node'


const userAgent = new UserAgent()

const LAUNCH_PUPPETEER_OPTS = {
    args: [
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu'
    ]
  }

const PAGE_PUPPETEER_OPTS = {
    networkIdle2Timeout: 5000,
    waitUntil: 'networkidle2',
    timeout: 3000000
}


const line = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
})

line.question(`Напишите ссылки на premint'ы через пробел(без запятых):`, async (name) => {
    const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        maxConcurrency: 3,
        puppeteerOptions: LAUNCH_PUPPETEER_OPTS
    })

    const arrPremints = name.split(' ')
    let newArrHtml = []

    // Error handler
    cluster.on('taskerror', (err, data) => {
        console.log(`У вас ошибка: (${data}): ${err}`)
    })

    // Task handler
    await cluster.task(async ({ page, data: url }) => {

        await page.setUserAgent(userAgent.toString())

        await page.goto(url, PAGE_PUPPETEER_OPTS)
        
        const contentPage = await page.content()

        newArrHtml.push(pagesHandler(contentPage, url))
    })

    
    for(const url of arrPremints) {
        cluster.queue(url)
    }
    
    await cluster.idle()
    await cluster.close()


    // Write excel file 
    line.question('Скопируйте и вставьтe директорию папки, куда вы хотите сохранить файл: ', async (dirc) => {

        let colArr
        try {
            let row = await readExcel(dirc + '/current_premints.xlsx')
            row = row.splice(1, row.length).map(i => {
                return i.map(elem => {
                    if (elem == null) {
                        return ''
                    } else {
                        return {type: String, value: elem}
                    }
                })
            })
            colArr = [...row, ...newArrHtml]
        } catch (error) {
            colArr = [...newArrHtml]
        }

        
        const dataExcel = [
            HEADER_ROW,
            ...colArr
        ]
    
        try {
            writeExcel(dataExcel, {
                columns,
                filePath: `${dirc}/current_premints.xlsx`
            })
        } catch (error) {
            console.error(`Ошибка: скорее всего у вас открыт тот файл, в который в добавляете изменения`)
        }
    
        line.close()
    })

})


// Html handler
function pagesHandler(contentPage, url) {
    const $ = cheerio.load(contentPage)
    const objInfPage = ['', '', '', '', '', '', '', '', '']

    const rowInf = $('.row.mt-4.text-md')
    rowInf.find('.col-6.col-lg-4.mb-4').each((i, elem) => {
        const name = $(elem).find('.text-uppercase').text().replace(/\B\s+|\s+\B/g, "")
        const value = $(elem).find('span').text().replace(/(\r\n|\n|\r)/gm, "").replace(/\B\s+|\B/g, "")
        const indexArr = HEADER_ROW.findIndex(i => i.value == objOfValues[name])

        objInfPage[indexArr] = {type: String, value}
    })

    // const descr = $('.mr-lg-5.d-none.d-lg-block').text().replace(/(\r\n|\n|\r)/gm, "").replace(/\B\s+|\B/g, "")

    objInfPage[1] = {type: String, value: url}
    objInfPage[0] = {type: String, value: $('h1.heading.heading-1').text().replace(/(\r\n|\n|\r)/gm, "").replace(/\B\s+|\B/g, "")}

    if (objInfPage[6]) {
        const changesDisc = objInfPage[6].value.split(' ')
        objInfPage[6].value = 'https://' + changesDisc.splice(0, 1)[0]
    } 
    if (objInfPage[7]) {
        const changesTwitter = objInfPage[7].value.split(' ')
        objInfPage[7].value = 'https://twitter.com/' + changesTwitter.splice(0, 1)[0]
    }
    if (objInfPage[9]) {
        objInfPage[9].value = 'https://' + objInfPage[9].value
    }

    return objInfPage
}


// Template of row in table
const HEADER_ROW = [
    {
        value: 'Название',
        fontWeight: 'bold',
        wrap: true,
        height: 30,
        align: 'center',
        alignVertical: 'center'
    },
    {
        value: 'Cсылка на сайт с рафлом',
        fontWeight: 'bold',
        wrap: true,
        height: 30,
        align: 'center',
        alignVertical: 'center'
    },
    {
        value: 'Дата рафла',
        fontWeight: 'bold',
        wrap: true,
        height: 30,
        align: 'center',
        alignVertical: 'center'
    },
    {
        value: 'Конец регистрации на рафл',
        fontWeight: 'bold',
        wrap: true,
        height: 30,
        align: 'center',
        alignVertical: 'center'
    },
    {
        value: 'Цена',
        fontWeight: 'bold',
        wrap: true,
        height: 30,
        align: 'center',
        alignVertical: 'center'
    },
    {
        value: 'Кол-во победителей',
        fontWeight: 'bold',
        wrap: true,
        height: 30,
        align: 'center',
        alignVertical: 'center'
    },
    {
        value: 'Дискорд',
        fontWeight: 'bold',
        wrap: true,
        height: 30,
        align: 'center',
        alignVertical: 'center'
    },
    {
        value: 'Твиттер',
        fontWeight: 'bold',
        wrap: true,
        height: 30,
        align: 'center',
        alignVertical: 'center'
    },
    {
        value: 'Дата минта',
        fontWeight: 'bold',
        wrap: true,
        height: 30,
        align: 'center',
        alignVertical: 'center'
    },
    {
        value: 'Cсылка на сайт',
        fontWeight: 'bold',
        wrap: true,
        height: 30,
        align: 'center',
        alignVertical: 'center'
    }
]


const columns = [
    { width: 35 },
    { width: 53 },
    { width: 35 },
    { width: 35 },
    { width: 10 },
    { width: 20 },
    { width: 45 },
    { width: 40 },
    { width: 25 },
    { width: 30 },
  ]


const objOfValues = {
    'Official Link': 'Cсылка на сайт',
    'Mint Date': 'Дата минта',
    'Mint Price': 'Цена',
    'Number of Winners': 'Кол-во победителей',
    'Verified Discord': 'Дискорд',
    'Verified Twitter': 'Твиттер',
    'Raffle Time': 'Дата рафла',
    'Registration Closes': 'Конец регистрации на рафл'
}
