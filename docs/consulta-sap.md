# Consulta SAP - Documentação

## Visão Geral

O módulo de Consulta SAP permite a integração com o SAP GUI para Windows, possibilitando a execução de transações SAP diretamente da aplicação web. A integração é feita através de um servidor de ponte local que se comunica com o SAP GUI via COM (Component Object Model).

## Pré-requisitos

1. **SAP GUI para Windows** instalado (versão 7.40 ou superior)
2. **Node.js** (versão 14.x ou superior)
3. **Windows** (a integração com SAP GUI é específica para Windows)

## Configuração

### Arquivo de Configuração SAP

O sistema utiliza o arquivo `SAPUILandscape.xml` para obter as configurações de conexão SAP. Este arquivo é gerado automaticamente pelo SAP GUI e contém informações sobre os servidores SAP disponíveis.

O arquivo está localizado em:
```
src/services/SAPUILandscape.xml
```

Se necessário, você pode atualizar este arquivo copiando o arquivo original do SAP GUI, geralmente localizado em:
```
C:\Users\[seu-usuario]\AppData\Roaming\SAP\Common\SAPUILandscape.xml
```

### Servidor de Ponte SAP

O servidor de ponte SAP é um aplicativo Node.js que atua como intermediário entre a aplicação web e o SAP GUI. Ele expõe uma API REST que permite:

1. Listar servidores SAP disponíveis
2. Conectar a um servidor SAP
3. Executar transações SAP
4. Desconectar do SAP

O servidor está localizado na pasta `sap-bridge` e pode ser iniciado separadamente com:

```
cd sap-bridge
npm install
npm start
```

## Modo de Uso

### Inicialização Rápida

Para iniciar todo o ambiente (servidor de ponte e aplicação web) de uma vez, execute:

```
start-sap-app.bat
```

### Login no SAP

1. Acesse a página "Consulta SAP" no menu principal
2. Selecione o servidor SAP desejado
3. Informe seu usuário e senha SAP
4. Clique em "Conectar ao SAP"

### Execução de Transações

1. Após o login, selecione a transação desejada
2. Preencha os parâmetros específicos da transação
3. Clique em "Executar Consulta"
4. Os resultados serão exibidos em uma tabela

## Transações Suportadas

O sistema suporta as seguintes transações SAP:

| Código | Nome | Descrição |
|--------|------|-----------|
| S_ALR_87013019 | Relatório de Finanças | Relatório financeiro com filtros por data e empresa |
| ME23N | Exibir Pedido de Compra | Visualização de pedidos de compra por número |
| FB03 | Exibir Documento Contábil | Visualização de documentos contábeis por número e exercício |
| XD03 | Exibir Cliente | Visualização de dados de cliente por código |
| MM03 | Exibir Material | Visualização de dados de material por código |

## Modo de Simulação

Se o servidor de ponte SAP não estiver disponível ou ocorrer algum erro na comunicação com o SAP GUI, o sistema entrará automaticamente em "Modo de Simulação". Neste modo:

1. Os dados exibidos são fictícios (mockados)
2. Um indicador "Modo Simulação" será exibido na interface
3. As operações básicas continuarão funcionando para fins de demonstração

## Solução de Problemas

### Erro de Conexão com SAP GUI

Se ocorrer um erro ao conectar ao SAP GUI:

1. Verifique se o SAP GUI está instalado e funcionando corretamente
2. Certifique-se de que o servidor de ponte SAP está em execução
3. Verifique se as credenciais SAP estão corretas
4. Reinicie o servidor de ponte SAP e tente novamente

### Erro ao Executar Transação

Se ocorrer um erro ao executar uma transação:

1. Verifique se os parâmetros estão preenchidos corretamente
2. Certifique-se de que você tem permissão para executar a transação no SAP
3. Verifique os logs do servidor de ponte SAP para mais detalhes

## Segurança

As credenciais SAP são transmitidas apenas entre o navegador e o servidor de ponte local, e deste para o SAP GUI. Elas não são armazenadas permanentemente em nenhum lugar.

O servidor de ponte SAP só aceita conexões do localhost, o que impede acesso remoto não autorizado. 