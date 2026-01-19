"""
HOST GlobalHitss Site Explorer
================================
Script para documentar todas as telas e funcionalidades do site HOST GlobalHitss
usando Browser Use para automação.

Credenciais:
- Login: cardosode
- Senha: Fsw@2025

URL Base: https://host.globalhitss.com/
"""

import asyncio
import json
import os
from datetime import datetime
from pathlib import Path
from browser_use import Agent

# Configurações
HOST_URL = "https://host.globalhitss.com/"
LOGIN_USER = "cardosode"
LOGIN_PASS = "Fsw@2025"

# Diretório para salvar documentação
DOCS_DIR = Path(__file__).parent / "host_docs"
DOCS_DIR.mkdir(exist_ok=True)

def get_llm():
    """
    Tenta obter um LLM compatível com browser-use.
    Prioridade: OpenAI > Google > Anthropic
    """
    # Tenta OpenAI primeiro
    if os.environ.get("OPENAI_API_KEY"):
        try:
            from langchain_openai import ChatOpenAI
            print("✅ Usando OpenAI GPT-4")
            return ChatOpenAI(model="gpt-4o", temperature=0)
        except Exception as e:
            print(f"⚠️ OpenAI falhou: {e}")
    
    # Tenta Google Gemini
    if os.environ.get("GOOGLE_API_KEY"):
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            print("✅ Usando Google Gemini")
            return ChatGoogleGenerativeAI(model="gemini-2.0-flash-exp", temperature=0)
        except Exception as e:
            print(f"⚠️ Google Gemini falhou: {e}")
    
    # Tenta com Azure OpenAI
    if os.environ.get("AZURE_OPENAI_API_KEY"):
        try:
            from langchain_openai import AzureChatOpenAI
            print("✅ Usando Azure OpenAI")
            return AzureChatOpenAI(temperature=0)
        except Exception as e:
            print(f"⚠️ Azure OpenAI falhou: {e}")
    
    raise RuntimeError(
        "Nenhuma API key encontrada! Configure uma das seguintes:\n"
        "  - OPENAI_API_KEY\n"
        "  - GOOGLE_API_KEY\n"
        "  - AZURE_OPENAI_API_KEY"
    )


async def explore_reportes_module():
    """
    Foca especificamente no módulo de Reportes para extração de dados de profissionais.
    """
    
    llm = get_llm()
    
    agent = Agent(
        task=f"""
        Sua missão é documentar COMPLETAMENTE o módulo de Reportes do HOST GlobalHitss.
        
        PASSO 1 - LOGIN:
        1. Acesse {HOST_URL}
        2. Faça login: Usuário={LOGIN_USER}, Senha={LOGIN_PASS}
        
        PASSO 2 - NAVEGUE PARA REPORTES:
        1. Vá para https://host.globalhitss.com/Reportes/Reportes
        
        PASSO 3 - DOCUMENTE TODOS OS ELEMENTOS:
        1. Liste TODOS os campos/filtros visíveis:
           - Nome do campo
           - Tipo (select, input, date, etc.)
           - Opções disponíveis (se for select)
        
        2. Identifique os tipos de relatórios disponíveis
        
        3. Documente os botões de ação:
           - Gerar relatório
           - Exportar
           - Download
        
        4. Se houver uma tabela de dados, documente as colunas
        
        PASSO 4 - TESTE UM RELATÓRIO:
        1. Selecione filtros para gerar um relatório de profissionais/recursos
        2. Gere o relatório
        3. Documente o formato dos dados retornados
        4. Verifique se há opção de exportar para Excel/CSV
        
        PASSO 5 - NAVEGUE OUTROS MENUS:
        Visite todas as outras seções do site para documentar telas e funcionalidades disponíveis.
        
        Retorne um relatório DETALHADO com todas as informações coletadas.
        """,
        llm=llm,
    )
    
    try:
        print("🔍 Explorando módulo de Reportes...")
        result = await agent.run(max_steps=50)
        
        # Salvar resultado
        output_file = DOCS_DIR / f"reportes_module_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
        with open(output_file, "w", encoding="utf-8") as f:
            f.write("# Módulo de Reportes - HOST GlobalHitss\n\n")
            f.write(f"**Data:** {datetime.now().isoformat()}\n\n")
            f.write("## Resultado da Análise\n\n")
            f.write(str(result))
        
        print(f"✅ Documentação do módulo Reportes salva em: {output_file}")
        return result
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        raise


async def explore_and_document_site():
    """
    Navega pelo site HOST GlobalHitss, documenta todas as telas e funcionalidades.
    """
    
    llm = get_llm()
    
    # Documento de saída
    documentation = {
        "site": HOST_URL,
        "exploration_date": datetime.now().isoformat(),
        "pages": [],
        "menu_structure": [],
        "reportes_module": {},
    }
    
    # Agente para exploração
    agent = Agent(
        task=f"""
        Você é um documentador de sistemas. Sua missão é explorar o site {HOST_URL} e documentar
        TODAS as telas, menus, funcionalidades e campos disponíveis.
        
        PASSO 1 - LOGIN:
        1. Acesse {HOST_URL}
        2. Faça login com:
           - Usuário: {LOGIN_USER}
           - Senha: {LOGIN_PASS}
        3. Após login, documente a página inicial
        
        PASSO 2 - EXPLORAÇÃO DO MENU:
        1. Identifique TODOS os menus e submenus disponíveis
        2. Para cada menu, documente:
           - Nome do menu
           - URL
           - Submenus disponíveis
        
        PASSO 3 - MÓDULO DE REPORTES (PRIORIDADE):
        1. Navegue até https://host.globalhitss.com/Reportes/Reportes
        2. Documente detalhadamente:
           - Todos os filtros disponíveis
           - Tipos de relatórios
           - Campos do formulário
           - Botões de ação
           - Como gerar/baixar relatórios
        
        PASSO 4 - DOCUMENTAÇÃO DE CADA TELA:
        Para cada tela visitada, registre:
        - Título da página
        - URL completa
        - Campos de formulário (nome, tipo, opções)
        - Botões de ação
        - Tabelas e dados exibidos
        - Filtros disponíveis
        - Funcionalidades específicas
        
        PASSO 5 - DADOS DE PROFISSIONAIS:
        Procure especificamente por:
        - Listagens de colaboradores/profissionais
        - Relatórios de recursos
        - Dados de alocação
        - Informações de horas trabalhadas
        
        Ao final, produza um resumo estruturado de TODAS as telas visitadas.
        """,
        llm=llm,
    )
    
    try:
        print("🚀 Iniciando exploração do HOST GlobalHitss...")
        print(f"📁 Documentação será salva em: {DOCS_DIR}")
        
        # Executar agente
        result = await agent.run(max_steps=50)
        
        # Salvar resultado
        documentation["agent_result"] = str(result)
        
        # Salvar documentação em JSON
        output_file = DOCS_DIR / f"host_documentation_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(documentation, f, ensure_ascii=False, indent=2)
        
        print(f"\n✅ Documentação salva em: {output_file}")
        
        # Gerar markdown resumido
        md_file = DOCS_DIR / "HOST_DOCUMENTATION.md"
        with open(md_file, "w", encoding="utf-8") as f:
            f.write("# Documentação HOST GlobalHitss\n\n")
            f.write(f"**Data de Exploração:** {documentation['exploration_date']}\n\n")
            f.write(f"**URL Base:** {HOST_URL}\n\n")
            f.write("## Resultado da Exploração\n\n")
            f.write(str(result))
        
        print(f"📝 Markdown gerado em: {md_file}")
        
        return result
        
    except Exception as e:
        print(f"❌ Erro durante exploração: {e}")
        raise


if __name__ == "__main__":
    print("=" * 60)
    print("HOST GlobalHitss Site Explorer")
    print("=" * 60)
    print("\nEscolha uma opção:")
    print("1 - Explorar site completo")
    print("2 - Focar no módulo de Reportes")
    print("3 - Ambos")
    
    choice = input("\nOpção: ").strip()
    
    if choice == "1":
        asyncio.run(explore_and_document_site())
    elif choice == "2":
        asyncio.run(explore_reportes_module())
    elif choice == "3":
        asyncio.run(explore_and_document_site())
        asyncio.run(explore_reportes_module())
    else:
        print("Opção inválida. Executando exploração do módulo Reportes...")
        asyncio.run(explore_reportes_module())
