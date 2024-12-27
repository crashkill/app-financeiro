import { useState, useEffect } from 'react'
import { db, Transacao } from '../db/database'
import { useLiveQuery } from 'dexie-react-hooks'

export const useTransacoes = (tipo: 'receita' | 'despesa') => {
  const transacoes = useLiveQuery(
    () => db.transacoes.where('tipo').equals(tipo).reverse().toArray(),
    [tipo]
  )

  const total = useLiveQuery(
    () => db.transacoes
      .where('tipo')
      .equals(tipo)
      .toArray()
      .then(items => items.reduce((sum, item) => sum + item.valor, 0)),
    [tipo]
  )

  const adicionarTransacao = async (transacao: Omit<Transacao, 'id'>) => {
    await db.transacoes.add(transacao)
  }

  const editarTransacao = async (id: number, transacao: Partial<Transacao>) => {
    await db.transacoes.update(id, transacao)
  }

  const excluirTransacao = async (id: number) => {
    await db.transacoes.delete(id)
  }

  return {
    transacoes: transacoes || [],
    total: total || 0,
    adicionarTransacao,
    editarTransacao,
    excluirTransacao,
    isLoading: transacoes === undefined
  }
}
