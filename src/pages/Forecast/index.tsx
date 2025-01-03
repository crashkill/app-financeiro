import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Tab,
  Tabs,
  CircularProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ProjecaoReceitas from './components/ProjecaoReceitas';
import ProjecaoCustos from './components/ProjecaoCustos';
import TendenciasChart from './components/TendenciasChart';
import FiltrosForecast from './components/FiltrosForecast';
import { useDadosFinanceiros } from '../../hooks/useDadosFinanceiros';
import { calcularProjecoes } from '../../utils/calculadores/projecoes';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`forecast-tabpanel-${index}`}
      aria-labelledby={`forecast-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Forecast = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [filtros, setFiltros] = useState({
    projeto: '',
    periodoInicio: new Date(),
    periodoFim: new Date(),
    tipoProjecao: 'linear'
  });
  const [loading, setLoading] = useState(false);
  const { dados, carregarDados } = useDadosFinanceiros();
  const [projecoes, setProjecoes] = useState<any>(null);

  useEffect(() => {
    const calcularDados = async () => {
      if (!dados || !filtros.projeto) return;
      
      setLoading(true);
      try {
        const resultado = await calcularProjecoes({
          dadosHistoricos: dados,
          filtros: filtros,
        });
        setProjecoes(resultado);
      } catch (error) {
        console.error('Erro ao calcular projeções:', error);
      } finally {
        setLoading(false);
      }
    };

    calcularDados();
  }, [dados, filtros]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleFiltroChange = (novosFiltros: any) => {
    setFiltros({ ...filtros, ...novosFiltros });
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Forecast Financeiro
        </Typography>

        <Paper sx={{ p: 2, mb: 3 }}>
          <FiltrosForecast
            filtros={filtros}
            onFiltroChange={handleFiltroChange}
          />
        </Paper>

        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Paper sx={{ width: '100%', mb: 3 }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                  aria-label="forecast tabs"
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  <Tab label="Visão Geral" />
                  <Tab label="Projeção de Receitas" />
                  <Tab label="Projeção de Custos" />
                  <Tab label="Análise de Tendências" />
                </Tabs>
              </Box>

              <TabPanel value={tabValue} index={0}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                      <ProjecaoReceitas
                        dados={projecoes?.receitas}
                        loading={loading}
                      />
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                      <ProjecaoCustos
                        dados={projecoes?.custos}
                        loading={loading}
                      />
                    </Paper>
                  </Grid>
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                      <TendenciasChart
                        dados={projecoes?.tendencias}
                        loading={loading}
                      />
                    </Paper>
                  </Grid>
                </Grid>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <ProjecaoReceitas
                  dados={projecoes?.receitas}
                  loading={loading}
                  detalhado
                />
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                <ProjecaoCustos
                  dados={projecoes?.custos}
                  loading={loading}
                  detalhado
                />
              </TabPanel>

              <TabPanel value={tabValue} index={3}>
                <TendenciasChart
                  dados={projecoes?.tendencias}
                  loading={loading}
                  detalhado
                />
              </TabPanel>
            </Paper>
          </>
        )}
      </Box>
    </Container>
  );
};

export default Forecast;
