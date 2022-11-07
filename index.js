const fs = require('fs')
const axios = require('axios')
const child_process = require('child_process');

let basePath = 'dlTs/'
let baseSrc = ''
let src = ''
const baseFileName = 'baseUrl.m3u8'
const filename = 'ts.m3u8'
let tsList = []
let tsCount = 0

// 下载文件
const downloadFile = async (src, filename, cb) => {
  const stream = fs.createWriteStream(filename)
  const { data } = await axios({
    url: src,
    method: "GET",
    responseType: 'arraybuffer'
  })
  fs.promises.writeFile(filename, data, 'binary')
  .then(() => {
    cb()
  })
  .catch(() => {
    console.log('下载失败')
  })
}

// 获取m3u8文件
function getM3U8File() {
  if (!fs.existsSync('dlTs')) { // 如果没有就创建
    fs.mkdirSync('dlTs')
  }
  downloadFile(src, basePath + filename, () => {
    console.log('m3u8下载完成')
    getTsSrcList(basePath + filename)
  })
}


// 获取ts的src list
function getTsSrcList(filename) {
  // 读取文件
  const data = fs.readFileSync(filename, 'utf8')
  const list = data.split('\n')

  // 获取文件url
  let isNext = false
  list.map(item => {
    if (isNext) {
      tsList.push(item)
      isNext = false
    } else {
      const index = item.indexOf('#EXTINF')
      if (index !== -1) {
        isNext = true
      }
    }
  })

  // 创建文件夹
  const folderItem = tsList[0] || ''
  if (!folderItem) {
    console.log('没有获取到文件！！！')
    return
  } else {
    // 开始下载文件
    getTsFile()
  }
}

// 获取ts文件
function getTsFile() {
  if (tsCount > tsList.length - 1) {
    console.log('下载完成了')
    mergeVideo()
  } else {
    const filename = tsList[tsCount]
    const url = baseSrc + filename
    downloadFile(url, basePath + filename, () => {
      console.log((tsCount + 1) + '/' + tsList.length + '已下载完成')
      tsCount++
      getTsFile()
    })
  }
}

// 合并文件
function mergeVideo() {
  child_process.exec(`ffmpeg -i ${basePath + filename} -c copy ${basePath + new Date().getTime().toString()}.mp4`, function (err) {
    if (err) {
      console.log('合并失败')
    } else {
      console.log('合并成功')
    }
  })
}

function main() {

  src = process.argv[2] || '';
  if (src) {
    const signIndex = src.lastIndexOf('/')
    baseSrc = src.substring(0, signIndex + 1)
    getM3U8File()
  } else {
    console.log('无效src')
  }
}


main()