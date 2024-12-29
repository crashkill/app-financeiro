import { useState, useEffect, useRef } from 'react'
import { Container, Row, Col, Card, Button } from 'react-bootstrap'
import { HotTable } from '@handsontable/react'
import { registerAllModules } from 'handsontable/registry'
import * as XLSX from 'xlsx'
import 'handsontable/dist/handsontable.full.min.css'

// Registra todos os módulos do Handsontable
registerAllModules()

interface ForecastData {
  [key: string]: any
}

const Forecast = () => {
  const [data, setData] = useState<any[]>([])
  const [columns, setColumns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hotRef = useRef<any>(null)

  useEffect(() => {
    const loadForecastData = async () => {
      try {
        const filePath = 'modelos/forecast.xlsx'
        const response = await fetch(filePath)
        const arrayBuffer = await response.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer)
        
        // Pegar primeira planilha
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        
        // Obter range da planilha
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
        
        // Converter para o formato do Handsontable
        const jsonData: any[] = []
        for (let R = range.s.r; R <= range.e.r; R++) {
          const row: any = {}
          for (let C = range.s.c; C <= range.e.c; C++) {
            const cell = worksheet[XLSX.utils.encode_cell({r: R, c: C})]
            const cellRef = XLSX.utils.encode_col(C)
            row[cellRef] = cell ? cell.v : null
            
            // Se for primeira linha, configura as colunas
            if (R === 0) {
              columns.push({
                data: cellRef,
                type: 'text',
                readOnly: false,
                width: 120
              })
            }
          }
          jsonData.push(row)
        }
        
        setData(jsonData)
        setColumns(columns)
        setLoading(false)
      } catch (error) {
        console.error('Erro ao carregar dados do forecast:', error)
        setError('Erro ao carregar os dados. Por favor, verifique se o arquivo está no formato correto.')
        setLoading(false)
      }
    }

    loadForecastData()
  }, [])

  const handleSave = () => {
    if (hotRef.current) {
      const hot = hotRef.current.hotInstance
      const exportData = hot.getData()
      
      // Criar novo workbook
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet(exportData)
      
      // Adicionar planilha ao workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Forecast')
      
      // Gerar arquivo
      XLSX.writeFile(wb, 'forecast_atualizado.xlsx')
    }
  }

  if (loading) {
    return (
      <Container fluid className="py-4">
        <Card>
          <Card.Body>
            <p>Carregando dados...</p>
          </Card.Body>
        </Card>
      </Container>
    )
  }

  if (error) {
    return (
      <Container fluid className="py-4">
        <Card>
          <Card.Body className="text-danger">
            <p>{error}</p>
          </Card.Body>
        </Card>
      </Container>
    )
  }

  const hotSettings = {
    data,
    columns,
    colHeaders: true,
    rowHeaders: true,
    height: 'auto',
    width: '100%',
    licenseKey: 'non-commercial-and-evaluation',
    contextMenu: true,
    formulas: true,
    comments: true,
    manualColumnResize: true,
    manualRowResize: true,
    fillHandle: true,
    filters: true,
    dropdownMenu: true,
    multiColumnSorting: true,
    columnSorting: true,
    mergeCells: true,
    afterChange: (changes: any) => {
      if (changes) {
        console.log('Células alteradas:', changes)
      }
    }
  }

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h1 className="mb-2">Forecast</h1>
          <p className="text-muted">Previsão de receitas e custos</p>
        </Col>
        <Col xs="auto">
          <Button variant="primary" onClick={handleSave}>
            Salvar Alterações
          </Button>
        </Col>
      </Row>
      <Row>
        <Col>
          <Card>
            <Card.Body>
              <div style={{ width: '100%', height: '600px', overflow: 'hidden' }}>
                <HotTable
                  ref={hotRef}
                  {...hotSettings}
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default Forecast
