import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Button } from 'react-bootstrap'
import * as XLSX from 'xlsx'
import '../styles/Forecast.css'

interface ForecastData {
  mercado: string
  receita: number
  custoTotal: number
  margemBruta: number
  margemPercentual: number
  hrRealizado: number
  mes: string
}

const Forecast = () => {
  const [data, setData] = useState<ForecastData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadForecastData = async () => {
      try {
        const filePath = 'modelos/forecast.xlsx'
        const response = await fetch(filePath)
        const arrayBuffer = await response.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer)
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)
        setData(jsonData as ForecastData[])
        setLoading(false)
      } catch (error) {
        console.error('Erro ao carregar dados do forecast:', error)
        setError('Erro ao carregar os dados. Por favor, verifique se o arquivo está no formato correto.')
        setLoading(false)
      }
    }

    loadForecastData()
  }, [])

  const handleCellChange = (rowIndex: number, field: keyof ForecastData, value: string) => {
    const newData = [...data]
    const numericValue = field === 'mercado' || field === 'mes' ? value : Number(value)
    newData[rowIndex] = { ...newData[rowIndex], [field]: numericValue }
    setData(newData)
  }

  const handleSave = () => {
    // Criar novo workbook
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(data)
    XLSX.utils.book_append_sheet(wb, ws, 'Forecast')
    XLSX.writeFile(wb, 'forecast_atualizado.xlsx')
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

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h1 className="mb-2">Forecast</h1>
          <p className="text-muted">Previsão de receitas e custos</p>
        </Col>
        <Col xs="auto">
          <Button 
            variant="primary" 
            onClick={handleSave}
            style={{ backgroundColor: '#4CAF50', border: 'none' }}
          >
            Salvar Alterações
          </Button>
        </Col>
      </Row>
      <Row>
        <Col>
          <div className="forecast-table-wrapper">
            <table className="forecast-table">
              <thead>
                <tr>
                  <th>Mercado</th>
                  <th>Mês</th>
                  <th>Receita</th>
                  <th>Custo Total</th>
                  <th>Margem Bruta</th>
                  <th>Margem %</th>
                  <th>HR Realizado</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td>
                      <input
                        type="text"
                        value={row.mercado || ''}
                        onChange={(e) => handleCellChange(rowIndex, 'mercado', e.target.value)}
                        className="cell-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={row.mes || ''}
                        onChange={(e) => handleCellChange(rowIndex, 'mes', e.target.value)}
                        className="cell-input"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={row.receita || ''}
                        onChange={(e) => handleCellChange(rowIndex, 'receita', e.target.value)}
                        className="cell-input number-input"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={row.custoTotal || ''}
                        onChange={(e) => handleCellChange(rowIndex, 'custoTotal', e.target.value)}
                        className="cell-input number-input"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={row.margemBruta || ''}
                        onChange={(e) => handleCellChange(rowIndex, 'margemBruta', e.target.value)}
                        className="cell-input number-input"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={row.margemPercentual || ''}
                        onChange={(e) => handleCellChange(rowIndex, 'margemPercentual', e.target.value)}
                        className="cell-input number-input"
                        step="0.01"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={row.hrRealizado || ''}
                        onChange={(e) => handleCellChange(rowIndex, 'hrRealizado', e.target.value)}
                        className="cell-input number-input"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Col>
      </Row>
    </Container>
  )
}

export default Forecast
