import React, { useState } from 'react';
import { Modal, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { FaExclamationTriangle, FaTrash } from 'react-icons/fa';
import { Profissional } from '../../services/profissionaisService';

interface ConfirmDeleteModalProps {
  show: boolean;
  onHide: () => void;
  onConfirm: (profissional: Profissional) => Promise<void>;
  profissional: Profissional | null;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  show,
  onHide,
  onConfirm,
  profissional
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!profissional) return;

    try {
      setIsDeleting(true);
      setError(null);
      await onConfirm(profissional);
      onHide();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir profissional');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setError(null);
      onHide();
    }
  };

  if (!profissional) return null;

  const getBadgeVariant = (regime: string) => {
    return regime === 'CLT' ? 'primary' : 'success';
  };

  return (
    <Modal 
      show={show} 
      onHide={handleClose} 
      backdrop={isDeleting ? 'static' : true}
      centered
    >
      <Modal.Header closeButton={!isDeleting}>
        <Modal.Title className="text-danger">
          <FaExclamationTriangle className="me-2" />
          Confirmar Exclusão
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        <div className="text-center mb-3">
          <FaTrash size={48} className="text-danger mb-3" />
          <h5>Tem certeza que deseja excluir este profissional?</h5>
        </div>

        <div className="bg-light p-3 rounded mb-3">
          <div className="row">
            <div className="col-12 mb-2">
              <strong>Nome:</strong> {profissional.nome}
            </div>
            <div className="col-12 mb-2">
              <strong>Email:</strong> {profissional.email}
            </div>
            <div className="col-6 mb-2">
              <strong>Regime:</strong>{' '}
              <Badge bg={getBadgeVariant(profissional.regime || '')}>
                {profissional.regime}
              </Badge>
            </div>
            <div className="col-6 mb-2">
              <strong>Origem:</strong>{' '}
              <Badge bg={profissional.origem === 'colaboradores' ? 'info' : 'secondary'}>
                {profissional.origem === 'colaboradores' ? 'DRE' : 'Cadastro'}
              </Badge>
            </div>
            {profissional.local_alocacao && (
              <div className="col-12 mb-2">
                <strong>Local:</strong> {profissional.local_alocacao}
              </div>
            )}
            {profissional.proficiencia && (
              <div className="col-12 mb-2">
                <strong>Proficiência:</strong> {profissional.proficiencia}
              </div>
            )}
          </div>
        </div>

        <Alert variant="warning" className="mb-0">
          <small>
            <strong>Atenção:</strong> O profissional será removido apenas do sistema local, mas permanecerá no DRE original.
          </small>
        </Alert>
      </Modal.Body>

      <Modal.Footer>
        <Button 
          variant="secondary" 
          onClick={handleClose}
          disabled={isDeleting}
        >
          Cancelar
        </Button>
        <Button 
          variant="danger" 
          onClick={handleConfirm}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Excluindo...
            </>
          ) : (
            <>
              <FaTrash className="me-2" />
              Confirmar Exclusão
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmDeleteModal;