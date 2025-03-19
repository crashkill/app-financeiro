@echo off
echo Compilando SAPBridge.dll...

REM Verifica se o .NET Framework está instalado
where csc >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Erro: Compilador C# (csc) não encontrado.
    echo Por favor, instale o .NET Framework SDK.
    exit /b 1
)

REM Compila a DLL
csc /target:library /out:SAPBridge.dll SAPBridge.cs

if %ERRORLEVEL% NEQ 0 (
    echo Erro ao compilar SAPBridge.dll
    exit /b 1
)

echo SAPBridge.dll compilado com sucesso!
echo.
echo Para usar esta DLL, certifique-se de que:
echo 1. O SAP GUI para Windows está instalado
echo 2. O SAP GUI Scripting está habilitado
echo 3. O servidor de ponte SAP está em execução
echo.
echo Para habilitar o SAP GUI Scripting:
echo 1. Abra o SAP GUI
echo 2. Vá para Customizing of Local Layout
echo 3. Na aba "Scripting", marque "Enable Scripting"
echo 4. Reinicie o SAP GUI

exit /b 0 