import { useState, useEffect } from 'react'
import { Container, Row, Col, Card } from 'react-bootstrap'
import * as XLSX from 'xlsx'
import { db } from '../db/database'

interface ForecastData {
  projeto: string
  mes: string
  receita: number
  custo: number
  margem: number
}

const Forecast = () => {
  const [forecastData, setForecastData] = useState<ForecastData[]>([])

  useEffect(() => {
    const loadForecastData = async () => {
      try {
        // Carregar arquivo forecast.xlsx
        const response = await fetch('/modelos/forecast.xlsx')
        const arrayBuffer = await response.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer)
        
        // Pegar primeira planilha
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json(worksheet)

        // Processar dados
        const processedData: ForecastData[] = data.map((row: any) => ({
          projeto: row.Projeto,
          mes: row.Mes,
          receita: Number(row.Receita) || 0,
          custo: Number(row.Custo) || 0,
          margem: Number(row.Margem) || 0
        }))

        setForecastData(processedData)
      } catch (error) {
        console.error('Erro ao carregar dados do forecast:', error)
      }
    }

    loadForecastData()
  }, [])

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h1 className="mb-2">Forecast</h1>
          <p className="text-muted">Previsão de receitas e custos</p>
        </Col>
      </Row>
      <Row>
        <Col>
          <Card>
            <Card.Body>
              {/* Aqui vamos adicionar a tabela e os gráficos */}
              <p>Em desenvolvimento...</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default Forecast
