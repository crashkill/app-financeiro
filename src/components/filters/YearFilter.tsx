import React, { useMemo, useState, useEffect } from 'react';
import { Form, Spinner } from 'react-bootstrap';
import { useTransacoes } from '../../hooks/useTransacoes';

/**
 * Opções de configuração para o componente YearFilter
 */
export interface YearFilterOptions {
  /** Ano inicial do range (fallback quando não há dados) */
  startYear?: number;
  /** Ano final do range (fallback quando não há dados) */
  endYear?: number;
  /** Texto do placeholder */
  placeholder?: string;
  /** Texto de ajuda */
  helpText?: string;
  /** Se o componente está desabilitado */
  disabled?: boolean;
}

/**
 * Props do componente YearFilter
 */
export interface YearFilterProps {
  /** Ano atualmente selecionado */
  selectedYear: string;
  /** Callback chamado quando o ano é alterado */
  onChange: (year: string) => void;
  /** Lista customizada de anos (opcional) */
  customYears?: number[];
  /** Opções de configuração */
  options?: YearFilterOptions;
  /** Label do campo */
  label?: string;
  /** Se o campo está desabilitado */
  disabled?: boolean;
  /** Classes CSS adicionais */
  className?: string;
  /** ID do elemento */
  id?: string;
  /** Callback para tratamento de erros */
  onError?: (error: Error) => void;
}

/**
 * Componente de filtro de anos reutilizável e acessível
 * 
 * @example
 * ```tsx
 * // Uso básico
 * <YearFilter 
 *   selectedYear={2024} 
 *   onChange={(year) => setSelectedYear(year)} 
 * />
 * 
 * // Com opções avançadas
 * <YearFilter
 *   selectedYear={selectedYear}
 *   onChange={handleYearChange}
 *   options={{
 *     minYear: 2020,
 *     maxYear: 2025,
 *     includeAllOption: true,
 *     allOptionText: "Todos os anos"
 *   }}
 *   label="Filtrar por Ano"
 * />
 * ```
 */
const YearFilter: React.FC<YearFilterProps> = ({
  selectedYear,
  onChange,
  customYears,
  options = {},
  label = 'Ano',
  disabled = false,
  className = '',
  id,
  onError
}) => {
  const {
    startYear = 2020,
    endYear = new Date().getFullYear(),
    placeholder = 'Selecione o ano...',
    helpText,
    disabled: optionsDisabled = false
  } = options;

  const { transacoes, loading, error } = useTransacoes({});
  const [internalError, setInternalError] = useState<string | null>(null);

  // Gerar lista de anos disponíveis apenas da carga de dados
  const availableYears = useMemo(() => {
    if (customYears) {
      return customYears.sort((a, b) => b - a);
    }

    if (transacoes.length > 0) {
      const yearsFromTransactions = new Set<number>();
      transacoes.forEach(transacao => {
        // Extrair ano do campo periodo (formato MM/YYYY)
        if (transacao.periodo) {
          const [, anoStr] = transacao.periodo.split('/');
          const year = parseInt(anoStr, 10);
          if (!isNaN(year)) {
            yearsFromTransactions.add(year);
          }
        }
        // Fallback: tentar extrair do campo data se existir
        else if (transacao.data) {
          const year = new Date(transacao.data).getFullYear();
          if (!isNaN(year)) {
            yearsFromTransactions.add(year);
          }
        }
      });
      return Array.from(yearsFromTransactions).sort((a, b) => b - a);
    }

    // Fallback: gerar range de anos apenas se não houver dados
    const yearRange = [];
    for (let year = endYear; year >= startYear; year--) {
      yearRange.push(year);
    }
    return yearRange;
  }, [customYears, transacoes, startYear, endYear]);

  // Definir ano atual automaticamente se não estiver selecionado
  useEffect(() => {
    if (!selectedYear || selectedYear === '' || selectedYear === 'all') {
      const currentYear = new Date().getFullYear().toString();
      // Verificar se o ano atual está disponível nos dados
      if (availableYears.includes(parseInt(currentYear))) {
        onChange(currentYear);
      } else if (availableYears.length > 0) {
        // Se o ano atual não estiver disponível, selecionar o mais recente
        onChange(availableYears[0].toString());
      }
    }
  }, [availableYears, selectedYear, onChange]);

  // Tratar erros
  useEffect(() => {
    if (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar dados';
      setInternalError(errorMessage);
      onError?.(new Error(errorMessage));
    } else {
      setInternalError(null);
    }
  }, [error, onError]);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    onChange(value);
  };

  const selectId = id || `year-filter-${Math.random().toString(36).substr(2, 9)}`;
  const isLoading = loading;
  const hasError = !!internalError;
  const hasYears = availableYears.length > 0;
  const isDisabled = disabled || optionsDisabled;

  return (
    <div className={`year-filter ${className}`}>
      {label && (
        <Form.Label htmlFor={selectId} className="fw-medium">
          {label}
        </Form.Label>
      )}
      
      <div className="position-relative">
        <Form.Select
          id={selectId}
          value={selectedYear.toString()}
          onChange={handleChange}
          disabled={isDisabled || isLoading}
          className={`${hasError ? 'is-invalid' : ''}`}
          aria-label={label || 'Filtro de ano'}
          aria-describedby={hasError ? `${selectId}-error` : helpText ? `${selectId}-help` : undefined}
        >
          {isLoading && (
            <option disabled>Carregando anos...</option>
          )}
          
          {hasError && (
            <option disabled>Erro ao carregar anos</option>
          )}
          
          {!isLoading && !hasError && !hasYears && (
            <option disabled>Nenhum ano encontrado</option>
          )}
          
          {!isLoading && !hasError && hasYears && availableYears.map(year => (
            <option key={year} value={year.toString()}>
              {year}
            </option>
          ))}
        </Form.Select>
        
        {isLoading && (
          <div 
            className="position-absolute top-50 end-0 translate-middle-y me-3"
            style={{ pointerEvents: 'none' }}
          >
            <Spinner animation="border" size="sm" />
          </div>
        )}
      </div>
      
      {helpText && !hasError && (
        <Form.Text id={`${selectId}-help`} className="text-muted">
          {helpText}
        </Form.Text>
      )}
      
      {hasError && (
        <div id={`${selectId}-error`} className="invalid-feedback d-block">
          {internalError}
        </div>
      )}
    </div>
  );
};

YearFilter.displayName = 'YearFilter';

export default YearFilter;
