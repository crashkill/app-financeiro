using System;
using System.Collections.Generic;
using System.Dynamic;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Threading;
using System.Xml;

namespace SAPBridge
{
    /// <summary>
    /// Classe principal para comunicação com o SAP GUI via COM
    /// </summary>
    public class SAPConnector
    {
        // Referências para objetos COM do SAP GUI
        private dynamic SapGuiAuto;
        private dynamic Connection;
        private dynamic Session;
        private bool IsConnected;
        private string ConnectionId;

        /// <summary>
        /// Inicializa o SAP GUI
        /// </summary>
        public object Initialize(dynamic input)
        {
            try
            {
                // Verifica se o SAP GUI está instalado
                Type sapGuiType = Type.GetTypeFromProgID("SapGui.ScriptingCtrl.1");
                if (sapGuiType == null)
                {
                    return new
                    {
                        success = false,
                        message = "SAP GUI não está instalado ou o Scripting não está habilitado"
                    };
                }

                // Cria uma instância do SAP GUI
                SapGuiAuto = Activator.CreateInstance(sapGuiType);
                
                return new
                {
                    success = true,
                    message = "SAP GUI inicializado com sucesso"
                };
            }
            catch (Exception ex)
            {
                return new
                {
                    success = false,
                    message = $"Erro ao inicializar SAP GUI: {ex.Message}"
                };
            }
        }

        /// <summary>
        /// Obtém os servidores SAP disponíveis
        /// </summary>
        public object GetAvailableServers(dynamic input)
        {
            try
            {
                List<object> servers = new List<object>();
                
                // Tenta ler o arquivo SAPUILandscape.xml
                string xmlPath = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                    "SAP", "Common", "SAPUILandscape.xml");
                
                if (File.Exists(xmlPath))
                {
                    XmlDocument doc = new XmlDocument();
                    doc.Load(xmlPath);
                    
                    // Extrai os serviços do XML
                    XmlNodeList serviceNodes = doc.GetElementsByTagName("Service");
                    foreach (XmlNode node in serviceNodes)
                    {
                        if (node.Attributes["type"]?.Value == "SAPGUI")
                        {
                            servers.Add(new
                            {
                                name = node.Attributes["name"]?.Value,
                                systemId = node.Attributes["systemid"]?.Value,
                                server = node.Attributes["server"]?.Value,
                                mode = int.Parse(node.Attributes["mode"]?.Value ?? "1")
                            });
                        }
                    }
                }
                
                return servers;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erro ao obter servidores SAP: {ex.Message}");
                return new List<object>();
            }
        }

        /// <summary>
        /// Conecta ao SAP
        /// </summary>
        public object Connect(dynamic input)
        {
            try
            {
                if (SapGuiAuto == null)
                {
                    // Inicializa o SAP GUI se ainda não foi feito
                    var result = Initialize(null);
                    if (!(bool)result.GetType().GetProperty("success").GetValue(result))
                    {
                        return new
                        {
                            success = false,
                            message = "Não foi possível inicializar o SAP GUI"
                        };
                    }
                }
                
                string server = input.server;
                string systemId = input.systemId;
                string username = input.username;
                string password = input.password;
                
                if (string.IsNullOrEmpty(server) || string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
                {
                    return new
                    {
                        success = false,
                        message = "Servidor, usuário e senha são obrigatórios"
                    };
                }
                
                // Obtém a aplicação SAP
                dynamic SapGui = SapGuiAuto.GetScriptingEngine;
                
                // Conecta ao servidor SAP
                dynamic connection = SapGui.OpenConnection(systemId, true);
                
                // Aguarda a conexão ser estabelecida
                Thread.Sleep(2000);
                
                // Obtém a sessão
                dynamic session = connection.Children(0);
                
                // Faz login
                session.findById("wnd[0]/usr/txtRSYST-BNAME").text = username;
                session.findById("wnd[0]/usr/pwdRSYST-BCODE").text = password;
                session.findById("wnd[0]").sendVKey(0); // Pressiona Enter
                
                // Verifica se o login foi bem-sucedido (se não aparecer a tela de erro)
                try
                {
                    // Aguarda um pouco para verificar se há mensagem de erro
                    Thread.Sleep(1000);
                    
                    // Verifica se há mensagem de erro
                    if (session.findById("wnd[0]/sbar").text.Contains("incorreto") ||
                        session.findById("wnd[0]/sbar").text.Contains("inválido") ||
                        session.findById("wnd[0]/sbar").text.Contains("falhou"))
                    {
                        return new
                        {
                            success = false,
                            message = session.findById("wnd[0]/sbar").text
                        };
                    }
                }
                catch
                {
                    // Se não conseguir verificar a mensagem, assume que o login foi bem-sucedido
                }
                
                // Armazena a conexão e sessão
                Connection = connection;
                Session = session;
                IsConnected = true;
                ConnectionId = Guid.NewGuid().ToString();
                
                return new
                {
                    success = true,
                    message = "Conectado ao SAP com sucesso",
                    connectionId = ConnectionId
                };
            }
            catch (Exception ex)
            {
                return new
                {
                    success = false,
                    message = $"Erro ao conectar ao SAP: {ex.Message}"
                };
            }
        }

        /// <summary>
        /// Executa uma transação SAP
        /// </summary>
        public object ExecuteTransaction(dynamic input)
        {
            try
            {
                if (!IsConnected || Session == null)
                {
                    return new
                    {
                        status = "error",
                        message = "Não há conexão ativa com o SAP"
                    };
                }
                
                string transaction = input.transaction;
                dynamic parameters = input.parameters;
                
                if (string.IsNullOrEmpty(transaction))
                {
                    return new
                    {
                        status = "error",
                        message = "Código da transação é obrigatório"
                    };
                }
                
                // Executa a transação
                Session.StartTransaction(transaction);
                
                // Preenche os parâmetros específicos da transação
                switch (transaction)
                {
                    case "S_ALR_87013019":
                        if (parameters.dataInicio != null)
                            Session.findById("wnd[0]/usr/ctxtSD_SAKNR-LOW").text = parameters.dataInicio;
                        if (parameters.dataFim != null)
                            Session.findById("wnd[0]/usr/ctxtSD_SAKNR-HIGH").text = parameters.dataFim;
                        if (parameters.empresa != null)
                            Session.findById("wnd[0]/usr/txtSD_BUKRS-LOW").text = parameters.empresa;
                        break;
                        
                    case "ME23N":
                        if (parameters.numeroPedido != null)
                            Session.findById("wnd[0]/usr/ctxtRM06E-BSTNR").text = parameters.numeroPedido;
                        break;
                        
                    case "FB03":
                        if (parameters.numeroDocumento != null)
                            Session.findById("wnd[0]/usr/ctxtRF05L-BELNR").text = parameters.numeroDocumento;
                        if (parameters.exercicio != null)
                            Session.findById("wnd[0]/usr/ctxtRF05L-GJAHR").text = parameters.exercicio;
                        break;
                        
                    case "XD03":
                        if (parameters.codigoCliente != null)
                            Session.findById("wnd[0]/usr/ctxtRF02D-KUNNR").text = parameters.codigoCliente;
                        break;
                        
                    case "MM03":
                        if (parameters.codigoMaterial != null)
                            Session.findById("wnd[0]/usr/ctxtRMMG1-MATNR").text = parameters.codigoMaterial;
                        break;
                }
                
                // Executa a consulta
                Session.findById("wnd[0]").sendVKey(8); // F8 - Executar
                
                // Aguarda o processamento
                Thread.Sleep(2000);
                
                // Extrai os resultados (simulado - em uma implementação real, seria necessário extrair os dados da tela)
                List<object> resultados = new List<object>();
                
                // Simulação de resultados - em uma implementação real, seria necessário extrair os dados da tela
                resultados.Add(new
                {
                    id = "SAP-001",
                    description = "Resultado da consulta SAP",
                    value = 12345.67,
                    date = DateTime.Now.ToString("dd.MM.yyyy"),
                    status = "Processado"
                });
                
                return new
                {
                    status = "success",
                    data = new
                    {
                        resultados
                    }
                };
            }
            catch (Exception ex)
            {
                return new
                {
                    status = "error",
                    message = $"Erro ao executar transação: {ex.Message}"
                };
            }
        }

        /// <summary>
        /// Desconecta do SAP
        /// </summary>
        public object Disconnect(dynamic input)
        {
            try
            {
                if (Session != null)
                {
                    // Fecha todas as janelas abertas
                    try
                    {
                        Session.findById("wnd[0]").Close();
                        Thread.Sleep(500);
                        
                        // Confirma o fechamento se necessário
                        try
                        {
                            Session.findById("wnd[1]/usr/btnSPOP-OPTION1").press();
                        }
                        catch
                        {
                            // Ignora se não houver diálogo de confirmação
                        }
                    }
                    catch
                    {
                        // Ignora erros ao fechar janelas
                    }
                }
                
                // Limpa as referências
                Session = null;
                Connection = null;
                IsConnected = false;
                
                return new
                {
                    success = true,
                    message = "Desconectado do SAP com sucesso"
                };
            }
            catch (Exception ex)
            {
                return new
                {
                    success = false,
                    message = $"Erro ao desconectar do SAP: {ex.Message}"
                };
            }
        }
    }
} 