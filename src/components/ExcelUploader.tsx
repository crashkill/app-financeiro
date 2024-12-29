import { ChangeEvent } from 'react'
import { Button } from 'react-bootstrap'
import * as XLSX from 'xlsx'

interface ExcelUploaderProps {
  onDataLoaded: (data: any[]) => void
  className?: string
}

const ExcelUploader = ({ onDataLoaded, className = '' }: ExcelUploaderProps) => {
  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      onDataLoaded(jsonData)
    } catch (error) {
      console.error('Erro ao ler arquivo Excel:', error)
    }
  }

  return (
    <div className={`excel-uploader ${className}`}>
      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
        id="excel-upload"
      />
      <label htmlFor="excel-upload">
        <Button
          as="span"
          variant="outline-primary"
          style={{ cursor: 'pointer' }}
        >
          Selecionar Arquivo Excel
        </Button>
      </label>
    </div>
  )
}

export default ExcelUploader
