@echo off
echo Iniciando o ambiente de consulta SAP...

echo.
echo === Verificando dependencias ===
call npm install

echo.
echo === Compilando a DLL do SAPBridge ===
cd sap-bridge
call build-dll.bat
cd ..

echo.
echo === Iniciando o servidor de ponte SAP ===
start cmd /k "cd sap-bridge && npm install && npm start"

echo.
echo === Aguardando o servidor de ponte iniciar ===
timeout /t 5 /nobreak

echo.
echo === Iniciando a aplicacao web ===
call npm run dev

echo.
echo === Ambiente iniciado com sucesso === 