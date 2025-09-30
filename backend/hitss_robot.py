#!/usr/bin/env python3
"""
Robô HITSS - Download e processamento automático de Excel
Executa download do arquivo Excel da API HITSS e processa os dados
"""

import os
import sys
import json
import uuid
import requests
import pandas as pd
from datetime import datetime
from typing import List, Dict, Any
from supabase import create_client, Client
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

class HITSSRobot:
    def __init__(self):
        """Inicializa o robô HITSS"""
        self.supabase_url = os.getenv('VITE_SUPABASE_URL')
        self.supabase_key = os.getenv('VITE_SUPABASE_SERVICE_ROLE_KEY')
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("Variáveis de ambiente do Supabase não configuradas")
        
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        self.execution_id = str(uuid.uuid4())
        self.batch_id = f"HITSS_AUTO_{int(datetime.now().timestamp())}"
        
        print(f"🤖 Robô HITSS iniciado - Execução: {self.execution_id}")

    def create_execution_record(self) -> bool:
        """Cria registro de execução no Supabase"""
        try:
            result = self.supabase.table('automation_executions').insert({
                'id': self.execution_id,
                'status': 'running',
                'started_at': datetime.now().isoformat(),
                'phase': 'downloading',
                'batch_id': self.batch_id
            }).execute()
            
            print(f"✅ Registro de execução criado: {self.execution_id}")
            return True
        except Exception as e:
            print(f"❌ Erro ao criar execução: {e}")
            return False

    def update_execution_phase(self, phase: str, **kwargs) -> bool:
        """Atualiza fase da execução"""
        try:
            update_data = {'phase': phase}
            update_data.update(kwargs)
            
            self.supabase.table('automation_executions').update(
                update_data
            ).eq('id', self.execution_id).execute()
            
            print(f"📝 Fase atualizada: {phase}")
            return True
        except Exception as e:
            print(f"❌ Erro ao atualizar fase: {e}")
            return False

    def download_excel_file(self) -> bytes:
        """Baixa arquivo Excel da API HITSS"""
        print("📥 Baixando arquivo Excel da API HITSS...")
        
        url = "https://hitsscontrol.globalhitss.com.br/api/api/export/xls"
        params = {
            'clienteFiltro': '',
            'servicoFiltro': '-1',
            'tipoFiltro': '-1',
            'projetoFiltro': '',
            'projetoAtivoFiltro': 'true',
            'projetoParalisadoFiltro': 'true',
            'projetoEncerradoFiltro': 'true',
            'projetoCanceladoFiltro': 'true',
            'responsavelareaFiltro': '',
            'idResponsavelareaFiltro': '',
            'responsavelprojetoFiltro': 'FABRICIO CARDOSO DE LIMA',
            'idresponsavelprojetoFiltro': '78',
            'filtroDeFiltro': '09-2016',
            'filtroAteFiltro': '08-2025',
            'visaoFiltro': 'PROJ',
            'usuarioFiltro': 'fabricio.lima',
            'idusuarioFiltro': '78',
            'perfilFiltro': 'RESPONSAVEL_DELIVERY|RESPONSAVEL_LANCAMENTO|VISITANTE',
            'telaFiltro': 'painel_projetos'
        }
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,*/*'
        }
        
        try:
            response = requests.get(url, params=params, headers=headers, timeout=30)
            response.raise_for_status()
            
            print(f"✅ Arquivo baixado: {len(response.content)} bytes")
            return response.content
            
        except requests.RequestException as e:
            raise Exception(f"Erro ao baixar arquivo: {e}")

    def process_excel_data(self, excel_data: bytes) -> List[Dict[str, Any]]:
        """Processa dados do Excel conforme regras DRE"""
        print("📊 Processando arquivo Excel...")
        
        try:
            # Ler Excel com pandas
            df = pd.read_excel(excel_data, engine='openpyxl')
            
            print(f"📋 Dados carregados: {len(df)} linhas, {len(df.columns)} colunas")
            
            # Encontrar linha de cabeçalho com meses
            month_names = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
                          'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
            
            header_row = -1
            month_columns = []
            
            for idx, row in df.iterrows():
                if idx > 10:  # Limitar busca nas primeiras 10 linhas
                    break
                    
                row_str = ' '.join([str(cell) for cell in row if pd.notna(cell)])
                months_found = [month for month in month_names if month.lower() in row_str.lower()]
                
                if len(months_found) >= 3:
                    header_row = idx
                    month_columns = months_found
                    break
            
            if header_row == -1:
                raise Exception("Não foi possível encontrar cabeçalho com meses")
            
            print(f"📍 Cabeçalho encontrado na linha {header_row + 1}")
            print(f"📅 Meses encontrados: {', '.join(month_columns)}")
            
            # Processar dados
            dre_records = []
            current_year = datetime.now().year
            processed_count = 0
            failed_count = 0
            
            # Processar linhas de dados
            for idx in range(header_row + 1, len(df)):
                row = df.iloc[idx]
                
                if pd.isna(row.iloc[2]) or pd.isna(row.iloc[3]):  # Código e nome da conta
                    continue
                
                try:
                    account_situation = str(row.iloc[0]) if pd.notna(row.iloc[0]) else None
                    account_grouping = str(row.iloc[1]) if pd.notna(row.iloc[1]) else None
                    account_code = str(row.iloc[2])
                    account_name = str(row.iloc[3])
                    
                    # Processar cada mês
                    for month_idx, month_name in enumerate(month_names):
                        if month_idx + 4 < len(row):  # Verificar se coluna existe
                            value = row.iloc[month_idx + 4]
                            
                            if pd.notna(value) and value != '' and value != 0:
                                try:
                                    # Converter valor para float
                                    if isinstance(value, str):
                                        amount = float(value.replace('.', '').replace(',', '.'))
                                    else:
                                        amount = float(value)
                                    
                                    if amount != 0:
                                        raw_data = {
                                            'accountSituation': account_situation,
                                            'accountGrouping': account_grouping,
                                            'accountCode': account_code,
                                            'accountName': account_name,
                                            'monthName': month_name,
                                            'originalAmount': str(value),
                                            'projectReference': 'HITSS_AUTO',
                                            'year': current_year,
                                            'rowIndex': idx,
                                            'colIndex': month_idx + 4
                                        }
                                        
                                        dre_record = {
                                            'upload_batch_id': self.batch_id,
                                            'file_name': f'hitss_auto_{datetime.now().strftime("%Y-%m-%d")}.xlsx',
                                            'tipo': 'receita' if amount >= 0 else 'despesa',
                                            'natureza': 'RECEITA' if amount >= 0 else 'CUSTO',
                                            'descricao': f'HITSS_AUTO - {account_name}',
                                            'valor': str(amount),
                                            'data': f'{month_idx + 1}/{current_year}',
                                            'categoria': account_grouping or 'Não especificado',
                                            'observacao': None,
                                            'lancamento': str(amount),
                                            'projeto': f'HITSS_AUTO - {account_name}',
                                            'periodo': f'{month_idx + 1}/{current_year}',
                                            'denominacao_conta': account_name,
                                            'conta_resumo': account_code,
                                            'linha_negocio': account_grouping or 'Não especificado',
                                            'relatorio': 'Realizado',
                                            'raw_data': raw_data
                                        }
                                        
                                        dre_records.append(dre_record)
                                        processed_count += 1
                                        
                                except (ValueError, TypeError) as e:
                                    failed_count += 1
                                    continue
                
                except Exception as e:
                    print(f"⚠️ Erro ao processar linha {idx}: {e}")
                    failed_count += 1
                    continue
            
            print(f"✅ Processamento concluído: {processed_count} registros, {failed_count} falhas")
            
            return dre_records
            
        except Exception as e:
            raise Exception(f"Erro ao processar Excel: {e}")

    def send_data_to_supabase(self, dre_records: List[Dict[str, Any]]) -> bool:
        """Envia dados processados para o Supabase"""
        print("💾 Enviando dados para o Supabase...")
        
        try:
            if not dre_records:
                print("⚠️ Nenhum registro para enviar")
                return True
            
            # Limpar dados existentes do mesmo batch
            try:
                self.supabase.table('dre_hitss').delete().like(
                    'upload_batch_id', 'HITSS_AUTO_%'
                ).execute()
                print("🧹 Dados anteriores removidos")
            except Exception as e:
                print(f"⚠️ Aviso ao limpar dados: {e}")
            
            # Inserir em lotes
            batch_size = 100
            inserted_count = 0
            
            for i in range(0, len(dre_records), batch_size):
                batch = dre_records[i:i + batch_size]
                
                try:
                    result = self.supabase.table('dre_hitss').insert(batch).execute()
                    inserted_count += len(batch)
                    print(f"📦 Lote {i // batch_size + 1} inserido: {len(batch)} registros")
                    
                except Exception as e:
                    print(f"❌ Erro no lote {i // batch_size + 1}: {e}")
                    raise e
            
            print(f"✅ Total inserido: {inserted_count} registros")
            return True
            
        except Exception as e:
            print(f"❌ Erro ao enviar dados: {e}")
            return False

    def finalize_execution(self, success: bool, processed_count: int = 0, failed_count: int = 0):
        """Finaliza execução"""
        try:
            status = 'completed' if success else 'failed'
            
            self.supabase.table('automation_executions').update({
                'status': status,
                'completed_at': datetime.now().isoformat(),
                'phase': 'completed' if success else 'failed',
                'records_processed': processed_count,
                'records_failed': failed_count
            }).eq('id', self.execution_id).execute()
            
            print(f"🏁 Execução finalizada: {status}")
            
        except Exception as e:
            print(f"❌ Erro ao finalizar execução: {e}")

    def run(self) -> Dict[str, Any]:
        """Executa o robô completo"""
        try:
            # 1. Criar registro de execução
            if not self.create_execution_record():
                raise Exception("Falha ao criar registro de execução")
            
            # 2. Baixar arquivo Excel
            self.update_execution_phase('downloading')
            excel_data = self.download_excel_file()
            
            # 3. Processar dados
            self.update_execution_phase('processing')
            dre_records = self.process_excel_data(excel_data)
            
            # 4. Enviar para Supabase
            self.update_execution_phase('inserting')
            success = self.send_data_to_supabase(dre_records)
            
            if not success:
                raise Exception("Falha ao inserir dados no Supabase")
            
            # 5. Finalizar
            processed_count = len(dre_records)
            self.finalize_execution(True, processed_count, 0)
            
            result = {
                'success': True,
                'execution_id': self.execution_id,
                'batch_id': self.batch_id,
                'records_processed': processed_count,
                'records_failed': 0,
                'message': 'Robô HITSS executado com sucesso'
            }
            
            print(f"🎉 Robô concluído com sucesso: {processed_count} registros processados")
            return result
            
        except Exception as e:
            print(f"💥 Erro no robô: {e}")
            self.finalize_execution(False)
            
            return {
                'success': False,
                'execution_id': self.execution_id,
                'error': str(e),
                'message': 'Erro na execução do robô HITSS'
            }

def main():
    """Função principal"""
    try:
        robot = HITSSRobot()
        result = robot.run()
        
        # Imprimir resultado final
        print("\n" + "="*50)
        print("RESULTADO FINAL:")
        print(json.dumps(result, indent=2, ensure_ascii=False))
        print("="*50)
        
        # Retornar código de saída
        sys.exit(0 if result['success'] else 1)
        
    except Exception as e:
        print(f"💥 Erro fatal: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()