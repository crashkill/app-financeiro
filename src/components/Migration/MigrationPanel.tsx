import React, { useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Alert,
  AlertTitle,
  Chip,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import {
  CloudUpload,
  Storage,
  CheckCircle,
  Error,
  Warning,
  Info,
  Refresh,
  Delete,
  Close
} from '@mui/icons-material';
import { useMigration } from '../../hooks/useMigration';
import { useAuth } from '../../contexts/AuthContext';

interface MigrationPanelProps {
  open: boolean;
  onClose: () => void;
}

const MigrationPanel: React.FC<MigrationPanelProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const {
    isLoading,
    progress,
    result,
    migrationStatus,
    error,
    startMigration,
    checkStatus,
    clearIndexedDB,
    reset
  } = useMigration();

  useEffect(() => {
    if (open && user) {
      checkStatus();
    }
  }, [open, user, checkStatus]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleStartMigration = async () => {
    await startMigration();
    // Atualizar status após migração
    setTimeout(() => {
      checkStatus();
    }, 1000);
  };

  const handleClearIndexedDB = async () => {
    if (window.confirm('Tem certeza que deseja limpar todos os dados do IndexedDB? Esta ação não pode ser desfeita.')) {
      await clearIndexedDB();
    }
  };

  const getStatusColor = (hasData: boolean) => {
    return hasData ? 'success' : 'default';
  };

  const getStatusIcon = (hasData: boolean) => {
    return hasData ? <CheckCircle color="success" /> : <Storage color="disabled" />;
  };

  const renderMigrationStatus = () => {
    if (!migrationStatus) {
      return (
        <Alert severity="info">
          <AlertTitle>Verificando Status</AlertTitle>
          Carregando informações sobre os dados...
        </Alert>
      );
    }

    const { hasIndexedDBData, hasSupabaseData, indexedDBCount, supabaseCount } = migrationStatus;

    return (
      <Stack spacing={2}>
        <Typography variant="h6" gutterBottom>
          Status dos Dados
        </Typography>

        <Box display="flex" gap={2}>
          <Card variant="outlined" sx={{ flex: 1 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                {getStatusIcon(hasIndexedDBData)}
                <Typography variant="subtitle1">IndexedDB (Local)</Typography>
                <Chip 
                  label={hasIndexedDBData ? 'Com Dados' : 'Vazio'} 
                  color={getStatusColor(hasIndexedDBData)}
                  size="small"
                />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Transações: {indexedDBCount.transacoes}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Profissionais: {indexedDBCount.profissionais}
              </Typography>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ flex: 1 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                {getStatusIcon(hasSupabaseData)}
                <Typography variant="subtitle1">Supabase (Nuvem)</Typography>
                <Chip 
                  label={hasSupabaseData ? 'Com Dados' : 'Vazio'} 
                  color={getStatusColor(hasSupabaseData)}
                  size="small"
                />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Transações: {supabaseCount.transacoes}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Colaboradores: {supabaseCount.colaboradores}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {hasIndexedDBData && (
          <Alert severity="info">
            <AlertTitle>Migração Disponível</AlertTitle>
            Foram encontrados dados no IndexedDB que podem ser migrados para o Supabase.
          </Alert>
        )}

        {!hasIndexedDBData && hasSupabaseData && (
          <Alert severity="success">
            <AlertTitle>Dados na Nuvem</AlertTitle>
            Seus dados já estão no Supabase. Não há necessidade de migração.
          </Alert>
        )}

        {!hasIndexedDBData && !hasSupabaseData && (
          <Alert severity="warning">
            <AlertTitle>Nenhum Dado Encontrado</AlertTitle>
            Não foram encontrados dados nem no IndexedDB nem no Supabase.
          </Alert>
        )}
      </Stack>
    );
  };

  const renderProgress = () => {
    if (!progress) return null;

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Progresso da Migração
        </Typography>
        <Box mb={2}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {progress.message}
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={progress.percentage} 
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Typography variant="caption" color="text.secondary" mt={1}>
            {progress.current}/{progress.total} ({progress.percentage}%)
          </Typography>
        </Box>
      </Box>
    );
  };

  const renderResult = () => {
    if (!result) return null;

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Resultado da Migração
        </Typography>
        
        <Alert severity={result.success ? 'success' : 'error'} sx={{ mb: 2 }}>
          <AlertTitle>
            {result.success ? 'Migração Concluída' : 'Erro na Migração'}
          </AlertTitle>
          {result.success ? (
            <Typography>
              Dados migrados com sucesso para o Supabase!
            </Typography>
          ) : (
            <Typography>
              Ocorreram erros durante a migração.
            </Typography>
          )}
        </Alert>

        <Stack spacing={1}>
          <Typography variant="body2">
            <strong>Transações migradas:</strong> {result.transacoesMigradas}
          </Typography>
          <Typography variant="body2">
            <strong>Profissionais migrados:</strong> {result.profissionaisMigrados}
          </Typography>
        </Stack>

        {result.warnings.length > 0 && (
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>
              Avisos:
            </Typography>
            <List dense>
              {result.warnings.map((warning, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <Warning color="warning" />
                  </ListItemIcon>
                  <ListItemText primary={warning} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {result.errors.length > 0 && (
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>
              Erros:
            </Typography>
            <List dense>
              {result.errors.map((error, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <Error color="error" />
                  </ListItemIcon>
                  <ListItemText primary={error} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <CloudUpload />
            <Typography variant="h6">Migração de Dados</Typography>
          </Stack>
          <IconButton onClick={handleClose}>
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {error && (
            <Alert severity="error">
              <AlertTitle>Erro</AlertTitle>
              {error}
            </Alert>
          )}

          {renderMigrationStatus()}
          
          {progress && (
            <>
              <Divider />
              {renderProgress()}
            </>
          )}

          {result && (
            <>
              <Divider />
              {renderResult()}
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Stack direction="row" spacing={1} width="100%" justifyContent="space-between">
          <Button
            startIcon={<Refresh />}
            onClick={checkStatus}
            disabled={isLoading}
          >
            Atualizar Status
          </Button>

          <Stack direction="row" spacing={1}>
            {migrationStatus?.hasIndexedDBData && (
              <Button
                startIcon={<Delete />}
                onClick={handleClearIndexedDB}
                disabled={isLoading}
                color="warning"
                variant="outlined"
              >
                Limpar IndexedDB
              </Button>
            )}

            {migrationStatus?.hasIndexedDBData && (
              <Button
                startIcon={<CloudUpload />}
                onClick={handleStartMigration}
                disabled={isLoading}
                variant="contained"
              >
                {isLoading ? 'Migrando...' : 'Iniciar Migração'}
              </Button>
            )}

            <Button onClick={handleClose} disabled={isLoading}>
              Fechar
            </Button>
          </Stack>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default MigrationPanel;