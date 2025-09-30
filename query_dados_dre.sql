SELECT id, codigo_conta, nome_conta, valor, ano, mes, situacao, agrupamento, usuario_id, criado_em, atualizado_em 
FROM dados_dre 
ORDER BY criado_em DESC 
LIMIT 50;