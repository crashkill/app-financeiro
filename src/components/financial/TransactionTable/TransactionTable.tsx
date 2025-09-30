import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import {
  Search,
  Filter,
  Download,
  Plus,
  Edit,
  Trash2,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  DollarSign,
  Tag,
  Building,
  User,
  FileText,
  MoreHorizontal
} from 'lucide-react';
import { Button, Input, Modal, Table, Loading } from '../../common';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  category: string;
  subcategory?: string;
  account: string;
  project?: string;
  professional?: string;
  status: 'pending' | 'completed' | 'cancelled';
  tags?: string[];
  attachments?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionTableProps {
  transactions: Transaction[];
  loading?: boolean;
  error?: string;
  onAdd?: () => void;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transactionId: string) => void;
  onView?: (transaction: Transaction) => void;
  onExport?: () => void;
  onBulkAction?: (action: string, transactionIds: string[]) => void;
  className?: string;
  showActions?: boolean;
  showFilters?: boolean;
  showSearch?: boolean;
  showPagination?: boolean;
  pageSize?: number;
  currency?: string;
  dateFormat?: string;
  emptyMessage?: string;
  selectable?: boolean;
}

type SortField = keyof Transaction;
type SortDirection = 'asc' | 'desc';

interface FilterState {
  search: string;
  type: string;
  category: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
}

const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  loading = false,
  error,
  onAdd,
  onEdit,
  onDelete,
  onView,
  onExport,
  onBulkAction,
  className,
  showActions = true,
  showFilters = true,
  showSearch = true,
  showPagination = true,
  pageSize = 10,
  currency = 'BRL',
  dateFormat = 'dd/MM/yyyy',
  emptyMessage = 'Nenhuma transação encontrada',
  selectable = false
}) => {
  const [sortField, setSortField] = React.useState<SortField>('date');
  const [sortDirection, setSortDirection] = React.useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [showFiltersModal, setShowFiltersModal] = React.useState(false);
  const [filters, setFilters] = React.useState<FilterState>({
    search: '',
    type: '',
    category: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: ''
  });
  
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
  
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };
  
  const getTypeColor = (type: Transaction['type']): string => {
    switch (type) {
      case 'income':
        return 'text-green-600 bg-green-100';
      case 'expense':
        return 'text-red-600 bg-red-100';
      case 'transfer':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };
  
  const getStatusColor = (status: Transaction['status']): string => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };
  
  const getTypeLabel = (type: Transaction['type']): string => {
    switch (type) {
      case 'income':
        return 'Receita';
      case 'expense':
        return 'Despesa';
      case 'transfer':
        return 'Transferência';
      default:
        return type;
    }
  };
  
  const getStatusLabel = (status: Transaction['status']): string => {
    switch (status) {
      case 'completed':
        return 'Concluída';
      case 'pending':
        return 'Pendente';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };
  
  // Filter transactions
  const filteredTransactions = React.useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch = !filters.search || 
        transaction.description.toLowerCase().includes(filters.search.toLowerCase()) ||
        transaction.category.toLowerCase().includes(filters.search.toLowerCase()) ||
        transaction.account.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesType = !filters.type || transaction.type === filters.type;
      const matchesCategory = !filters.category || transaction.category === filters.category;
      const matchesStatus = !filters.status || transaction.status === filters.status;
      
      const matchesDateFrom = !filters.dateFrom || new Date(transaction.date) >= new Date(filters.dateFrom);
      const matchesDateTo = !filters.dateTo || new Date(transaction.date) <= new Date(filters.dateTo);
      
      const matchesAmountMin = !filters.amountMin || transaction.amount >= parseFloat(filters.amountMin);
      const matchesAmountMax = !filters.amountMax || transaction.amount <= parseFloat(filters.amountMax);
      
      return matchesSearch && matchesType && matchesCategory && matchesStatus &&
             matchesDateFrom && matchesDateTo && matchesAmountMin && matchesAmountMax;
    });
  }, [transactions, filters]);
  
  // Sort transactions
  const sortedTransactions = React.useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredTransactions, sortField, sortDirection]);
  
  // Paginate transactions
  const paginatedTransactions = React.useMemo(() => {
    if (!showPagination) return sortedTransactions;
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedTransactions.slice(startIndex, endIndex);
  }, [sortedTransactions, currentPage, pageSize, showPagination]);
  
  const totalPages = Math.ceil(sortedTransactions.length / pageSize);
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const handleSelectAll = () => {
    if (selectedIds.length === paginatedTransactions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedTransactions.map(t => t.id));
    }
  };
  
  const handleSelectTransaction = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  };
  
  const handleBulkAction = (action: string) => {
    if (onBulkAction && selectedIds.length > 0) {
      onBulkAction(action, selectedIds);
      setSelectedIds([]);
    }
  };
  
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown size={16} className="opacity-50" />;
    return sortDirection === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />;
  };
  
  const columns = [
    ...(selectable ? [{
      key: 'select',
      title: '',
      render: (value: any, transaction: Transaction) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(transaction.id)}
          onChange={() => handleSelectTransaction(transaction.id)}
          className="rounded border-gray-300"
        />
      ),
      sortable: false
    }] : []),
    {
      key: 'date',
      title: 'Data',
      render: (value: any, transaction: Transaction) => (
        <div className="flex items-center space-x-2">
          <Calendar size={16} className="text-gray-400" />
          <span>{formatDate(transaction.date)}</span>
        </div>
      ),
      sortable: true
    },
    {
      key: 'description',
      title: 'Descrição',
      render: (value: any, transaction: Transaction) => (
        <div>
          <div className="font-medium text-gray-900">{transaction.description}</div>
          {transaction.notes && (
            <div className="text-sm text-gray-500 truncate max-w-xs">
              {transaction.notes}
            </div>
          )}
        </div>
      ),
      sortable: true
    },
    {
      key: 'amount',
      title: 'Valor',
      render: (value: any, transaction: Transaction) => (
        <div className="flex items-center space-x-2">
          <DollarSign size={16} className="text-gray-400" />
          <span className={clsx(
            'font-medium',
            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
          )}>
            {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(Math.abs(transaction.amount))}
          </span>
        </div>
      ),
      sortable: true
    },
    {
      key: 'type',
      title: 'Tipo',
      render: (value: any, transaction: Transaction) => (
        <span className={clsx(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
          getTypeColor(transaction.type)
        )}>
          {getTypeLabel(transaction.type)}
        </span>
      ),
      sortable: true
    },
    {
      key: 'category',
      title: 'Categoria',
      render: (value: any, transaction: Transaction) => (
        <div className="flex items-center space-x-2">
          <Tag size={16} className="text-gray-400" />
          <div>
            <div className="text-sm font-medium">{transaction.category}</div>
            {transaction.subcategory && (
              <div className="text-xs text-gray-500">{transaction.subcategory}</div>
            )}
          </div>
        </div>
      ),
      sortable: true
    },
    {
      key: 'account',
      title: 'Conta',
      render: (value: any, transaction: Transaction) => (
        <div className="flex items-center space-x-2">
          <Building size={16} className="text-gray-400" />
          <span className="text-sm">{transaction.account}</span>
        </div>
      ),
      sortable: true
    },
    {
      key: 'status',
      title: 'Status',
      render: (value: any, transaction: Transaction) => (
        <span className={clsx(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
          getStatusColor(transaction.status)
        )}>
          {getStatusLabel(transaction.status)}
        </span>
      ),
      sortable: true
    },
    ...(showActions ? [{
      key: 'actions',
      title: 'Ações',
      render: (value: any, transaction: Transaction) => (
        <div className="flex items-center space-x-1">
          {onView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(transaction)}
              className="p-1"
            >
              <Eye size={16} />
            </Button>
          )}
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(transaction)}
              className="p-1"
            >
              <Edit size={16} />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(transaction.id)}
              className="p-1 text-red-600 hover:text-red-700"
            >
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      ),
      sortable: false
    }] : [])
  ];
  
  if (loading) {
    return (
      <div className={clsx('bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700', className)}>
        <div className="p-6">
          <Loading size="lg" text="Carregando transações..." />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={clsx('bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6', className)}>
        <div className="text-center text-red-500">
          <p className="text-lg font-medium mb-2">Erro ao carregar transações</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={clsx('bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700', className)}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Transações Financeiras
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {sortedTransactions.length} transação(ões) encontrada(s)
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {selectedIds.length > 0 && onBulkAction && (
              <div className="flex items-center space-x-2 mr-4">
                <span className="text-sm text-gray-600">
                  {selectedIds.length} selecionada(s)
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                  className="text-red-600"
                >
                  <Trash2 size={16} className="mr-1" />
                  Excluir
                </Button>
              </div>
            )}
            
            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download size={16} className="mr-2" />
                Exportar
              </Button>
            )}
            
            {onAdd && (
              <Button onClick={onAdd}>
                <Plus size={16} className="mr-2" />
                Nova Transação
              </Button>
            )}
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          {showSearch && (
            <div className="flex-1">
              <Input
                placeholder="Buscar transações..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                leftIcon={<Search size={16} />}
              />
            </div>
          )}
          
          {showFilters && (
            <Button
              variant="outline"
              onClick={() => setShowFiltersModal(true)}
            >
              <Filter size={16} className="mr-2" />
              Filtros
            </Button>
          )}
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <Table
          data={paginatedTransactions}
          columns={columns}
          onSort={(key, direction) => {
            setSortField(key as keyof Transaction);
            setSortDirection(direction || 'asc');
          }}
          sortable={true}
          emptyText={emptyMessage}
          loading={loading}
        />
      </div>
      
      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, sortedTransactions.length)} de {sortedTransactions.length} transações
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => 
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  )
                  .map((page, index, array) => (
                    <React.Fragment key={page}>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <Button
                        variant={currentPage === page ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    </React.Fragment>
                  ))
                }
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Próximo
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Filters Modal */}
      <Modal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        title="Filtros Avançados"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Todos</option>
                <option value="income">Receita</option>
                <option value="expense">Despesa</option>
                <option value="transfer">Transferência</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Todos</option>
                <option value="pending">Pendente</option>
                <option value="completed">Concluída</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Data Inicial"
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
            />
            
            <Input
              label="Data Final"
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Valor Mínimo"
              type="number"
              value={filters.amountMin}
              onChange={(e) => setFilters(prev => ({ ...prev, amountMin: e.target.value }))}
              placeholder="0,00"
            />
            
            <Input
              label="Valor Máximo"
              type="number"
              value={filters.amountMax}
              onChange={(e) => setFilters(prev => ({ ...prev, amountMax: e.target.value }))}
              placeholder="0,00"
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 mt-6">
          <Button
            variant="outline"
            onClick={() => {
              setFilters({
                search: '',
                type: '',
                category: '',
                status: '',
                dateFrom: '',
                dateTo: '',
                amountMin: '',
                amountMax: ''
              });
            }}
          >
            Limpar
          </Button>
          <Button onClick={() => setShowFiltersModal(false)}>
            Aplicar Filtros
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default TransactionTable;