import { readFileSync } from 'fs'
import * as XLSX from 'xlsx'
const buf = readFileSync('/Volumes/Data/Boxme/micro_tools/Session_Payment/Thailand_Sessonal_Payment.xlsx')
const wb = XLSX.read(buf, { type: 'buffer', cellDates: true, cellNF: true })
const ws = wb.Sheets['วันที่ 1']
const c = ws['C11']
console.log('cellDates:true →', c)
const wb2 = XLSX.read(buf, { type: 'buffer', cellDates: false })
const c2 = wb2.Sheets['วันที่ 1']['C11']
console.log('cellDates:false →', c2)
console.log('manual conv: serial=', c2.v, 'frac=', (c2.v % 1) * 86400)
